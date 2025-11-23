/**
 * DocumentManager - Manages the collection of blocks in a notebook.
 * 
 * Provides CRUD operations for blocks with automatic change notifications.
 * Ensures at least one block always exists in the document.
 */

import { Block, IBlock, BlockType } from './Block';

/**
 * Interface defining document management operations.
 */
export interface IDocumentManager {
  /** Get all blocks in the document */
  getBlocks(): Block[];
  /** Add a new block at the specified index */
  addBlock(block: Block, index?: number): void;
  /** Update a block's properties */
  updateBlock(id: string, updates: Partial<IBlock>): void;
  /** Delete a block by ID */
  deleteBlock(id: string): void;
  /** Move a block to a new position */
  moveBlock(id: string, newIndex: number): void;
}

/**
 * DocumentManager implementation.
 * 
 * Manages block collection with change callbacks for UI updates.
 * Automatically ensures at least one block exists.
 */
export class DocumentManager implements IDocumentManager {
  private blocks: Block[];
  private onChange?: (blocks: Block[]) => void;

  constructor(initialBlocks?: Block[], onChange?: (blocks: Block[]) => void) {
    this.blocks = initialBlocks || [new Block(this.generateId(), BlockType.PARAGRAPH)];
    this.onChange = onChange;
  }

  getBlocks(): Block[] {
    return [...this.blocks];
  }

  addBlock(block: Block, index?: number): void {
    if (index !== undefined && index >= 0 && index <= this.blocks.length) {
      this.blocks.splice(index, 0, block);
    } else {
      this.blocks.push(block);
    }
    this.notifyChange();
  }

  updateBlock(id: string, updates: Partial<IBlock>): void {
    const index = this.blocks.findIndex((b) => b.id === id);
    if (index !== -1) {
      const currentBlock = this.blocks[index];
      this.blocks[index] = new Block(
        updates.id ?? currentBlock.id,
        updates.type ?? currentBlock.type,
        updates.content ?? currentBlock.content,
        updates.metadata ?? currentBlock.metadata,
        updates.settings ?? currentBlock.settings,
        updates.position_id ?? currentBlock.position_id,
        updates.position_order ?? currentBlock.position_order
      );
    }
    this.notifyChange();
  }

  deleteBlock(id: string): void {
    this.blocks = this.blocks.filter((b) => b.id !== id);
    // Ensure at least one block exists
    if (this.blocks.length === 0) {
      this.blocks.push(new Block(this.generateId(), BlockType.PARAGRAPH));
    }
    this.notifyChange();
  }

  moveBlock(id: string, newIndex: number): void {
    const currentIndex = this.blocks.findIndex((b) => b.id === id);
    if (currentIndex !== -1 && newIndex >= 0 && newIndex < this.blocks.length) {
      const [block] = this.blocks.splice(currentIndex, 1);
      this.blocks.splice(newIndex, 0, block);
      this.notifyChange();
    }
  }

  /**
   * Generate a unique ID for a block.
   * Uses crypto.randomUUID() if available, falls back to manual UUID v4 generation.
   * @returns A UUID v4 string
   */
  generateId(): string {
    // Generate a UUID v4
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    
    // Fallback for environments without crypto.randomUUID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Notify subscribers of changes to the block collection.
   */
  private notifyChange(): void {
    if (this.onChange) {
      this.onChange(this.getBlocks());
    }
  }
}
