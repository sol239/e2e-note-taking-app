import { updateNotebook, updateBlock, createBlock, deleteBlock } from '@/api/auth';
import { Block } from '@/models/Block';

type SyncOperation = 
  | { type: 'notebook-name'; notebookId: string; name: string }
  | { type: 'block-update'; notebookId: string; block: Block; isNew: boolean }
  | { type: 'block-delete'; notebookId: string; blockId: string };

interface QueuedOperation {
  operation: SyncOperation;
  timeout: NodeJS.Timeout;
  timestamp: number;
}

class SyncWorker {
  private static instance: SyncWorker;
  private queue: Map<string, QueuedOperation> = new Map();
  private processing: Set<string> = new Set();
  private readonly SYNC_DELAY_MS = 3000;

  private constructor() {
    // Singleton pattern - private constructor
  }

  static getInstance(): SyncWorker {
    if (!SyncWorker.instance) {
      SyncWorker.instance = new SyncWorker();
    }
    return SyncWorker.instance;
  }

  /**
   * Queue a notebook name update
   */
  queueNotebookNameSync(notebookId: string, name: string, onStatusChange?: (status: 'pending' | 'syncing' | 'synced' | 'error') => void): void {
    const key = `notebook-${notebookId}`;
    
    // Clear existing timeout if any
    const existing = this.queue.get(key);
    if (existing) {
      clearTimeout(existing.timeout);
    }

    // Update status to pending
    onStatusChange?.('pending');

    // Create new timeout
    const timeout = setTimeout(() => {
      this.processNotebookNameSync(notebookId, name, key, onStatusChange);
    }, this.SYNC_DELAY_MS);

    this.queue.set(key, {
      operation: { type: 'notebook-name', notebookId, name },
      timeout,
      timestamp: Date.now()
    });
  }

  /**
   * Queue a block update or create operation
   */
  queueBlockSync(notebookId: string, block: Block, isNew: boolean, onStatusChange?: (blockId: string, status: 'pending' | 'syncing' | 'synced' | 'error') => void): void {
    const key = `block-${notebookId}-${block.id}`;
    
    // Clear existing timeout if any
    const existing = this.queue.get(key);
    if (existing) {
      clearTimeout(existing.timeout);
    }

    // Update status to pending
    onStatusChange?.(block.id, 'pending');

    // Create new timeout
    const timeout = setTimeout(() => {
      this.processBlockSync(notebookId, block, isNew, key, onStatusChange);
    }, this.SYNC_DELAY_MS);

    this.queue.set(key, {
      operation: { type: 'block-update', notebookId, block, isNew },
      timeout,
      timestamp: Date.now()
    });
  }

  /**
   * Queue a block deletion (immediate, no delay)
   */
  async queueBlockDelete(notebookId: string, blockId: string): Promise<void> {
    const key = `block-${notebookId}-${blockId}`;
    
    // Cancel any pending update for this block
    const existing = this.queue.get(key);
    if (existing) {
      clearTimeout(existing.timeout);
      this.queue.delete(key);
    }

    // Execute delete immediately
    try {
      await deleteBlock(notebookId, blockId);
      console.log('Block deleted:', blockId);
    } catch (error) {
      console.error('Failed to delete block:', blockId, error);
      throw error;
    }
  }

  /**
   * Cancel all pending operations for a notebook
   */
  cancelNotebookOperations(notebookId: string): void {
    const keysToDelete: string[] = [];
    
    this.queue.forEach((op, key) => {
      if (key.startsWith(`notebook-${notebookId}`) || key.startsWith(`block-${notebookId}`)) {
        clearTimeout(op.timeout);
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.queue.delete(key));
  }

  /**
   * Force sync all pending operations for a notebook immediately
   */
  async forceSyncNotebook(notebookId: string): Promise<void> {
    const operations: Array<{ key: string; op: QueuedOperation }> = [];
    
    // Collect all operations for this notebook
    this.queue.forEach((op, key) => {
      if (key.startsWith(`notebook-${notebookId}`) || key.startsWith(`block-${notebookId}`)) {
        operations.push({ key, op });
      }
    });

    // Process all operations immediately
    const promises = operations.map(({ key, op }) => {
      clearTimeout(op.timeout);
      this.queue.delete(key);

      switch (op.operation.type) {
        case 'notebook-name':
          return this.processNotebookNameSync(op.operation.notebookId, op.operation.name, key);
        case 'block-update':
          return this.processBlockSync(op.operation.notebookId, op.operation.block, op.operation.isNew, key);
        case 'block-delete':
          return deleteBlock(op.operation.notebookId, op.operation.blockId);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Get pending operations count for a notebook
   */
  getPendingCount(notebookId: string): number {
    let count = 0;
    this.queue.forEach((_, key) => {
      if (key.startsWith(`notebook-${notebookId}`) || key.startsWith(`block-${notebookId}`)) {
        count++;
      }
    });
    return count;
  }

  /**
   * Check if there are any pending operations across all notebooks
   */
  hasAnyPendingOperations(): boolean {
    return this.queue.size > 0 || this.processing.size > 0;
  }

  private async processNotebookNameSync(
    notebookId: string, 
    name: string, 
    key: string,
    onStatusChange?: (status: 'pending' | 'syncing' | 'synced' | 'error') => void
  ): Promise<void> {
    // Remove from queue
    this.queue.delete(key);

    // Check if already processing
    if (this.processing.has(key)) {
      return;
    }

    this.processing.add(key);
    onStatusChange?.('syncing');

    try {
      await updateNotebook(notebookId, name);
      console.log('Notebook name synced:', name);
      onStatusChange?.('synced');
    } catch (error) {
      console.error('Failed to sync notebook name:', error);
      onStatusChange?.('error');
    } finally {
      this.processing.delete(key);
    }
  }

  private async processBlockSync(
    notebookId: string,
    block: Block,
    isNew: boolean,
    key: string,
    onStatusChange?: (blockId: string, status: 'pending' | 'syncing' | 'synced' | 'error') => void
  ): Promise<void> {
    // Remove from queue
    this.queue.delete(key);

    // Check if already processing
    if (this.processing.has(key)) {
      return;
    }

    this.processing.add(key);
    onStatusChange?.(block.id, 'syncing');

    try {
      if (isNew) {
        await createBlock(notebookId, {
          id: block.id,
          type: block.type,
          content: block.content,
          metadata: block.metadata,
          settings: block.settings,
        });
        console.log('Block created:', block.id);
      } else {
        await updateBlock(notebookId, block.id, {
          type: block.type,
          content: block.content,
          metadata: block.metadata,
          settings: block.settings,
        });
        console.log('Block updated:', block.id);
      }
      onStatusChange?.(block.id, 'synced');
    } catch (error) {
      console.error('Failed to sync block:', block.id, error);
      onStatusChange?.(block.id, 'error');
    } finally {
      this.processing.delete(key);
    }
  }
}

export default SyncWorker;
