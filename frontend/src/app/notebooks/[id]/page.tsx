'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getNotebookBlocks, getNotebooks, updateNotebook } from '../../../api/auth';
import NoteEditor from '../../../components/NoteEditor';
import { Block, BlockType } from '../../../models/Block';
import { Check, X, Loader2 } from 'lucide-react';

export default function NotebookPage() {
  const params = useParams();
  const router = useRouter();
  const notebookId = params.id as string;

  const [notebookName, setNotebookName] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [blockSyncStates, setBlockSyncStates] = useState<Map<string, 'pending' | 'syncing' | 'synced' | 'error'>>(new Map());
  const syncTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const syncQueueRef = useRef<Set<string>>(new Set());
  const nameInputRef = useRef<HTMLInputElement>(null);

  const SYNC_DELAY_MS = 3000; // 3 seconds

  useEffect(() => {
    const fetchNotebookData = async () => {
      try {
        // Get notebook name
        const notebooks = await getNotebooks();
        const notebook = notebooks.find(n => n.notebook.id === notebookId);
        if (!notebook) {
          throw new Error('Notebook not found');
        }
        setNotebookName(notebook.notebook.name);

        // Get blocks
        const blockConnectors = await getNotebookBlocks(notebookId);
        const convertedBlocks: Block[] = blockConnectors.map(connector =>
          new Block(
            connector.block.id,
            connector.block.type as BlockType,
            connector.block.content,
            connector.block.metadata,
            connector.block.settings
          )
        );
        setBlocks(convertedBlocks);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load notebook');
      } finally {
        setLoading(false);
      }
    };

    if (notebookId) {
      fetchNotebookData();
    }
  }, [notebookId]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    const currentTimeouts = syncTimeoutsRef.current;
    return () => {
      currentTimeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const handleBlocksChange = (newBlocks: Block[]) => {
    setBlocks(newBlocks);
    queueBlocksForSync(newBlocks);
  };

  const queueBlocksForSync = (blocksToSync: Block[]) => {
    // Clear existing timeouts for all blocks
    syncTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    syncTimeoutsRef.current.clear();

    // Reset sync states for changed blocks
    setBlockSyncStates(prev => {
      const newStates = new Map(prev);
      blocksToSync.forEach(block => {
        newStates.set(block.id, 'pending');
      });
      return newStates;
    });

    // Add blocks to queue
    blocksToSync.forEach(block => {
      syncQueueRef.current.add(block.id);
    });

    // Set new timeouts for each block
    blocksToSync.forEach(block => {
      const timeout = setTimeout(() => {
        processSyncQueue();
      }, SYNC_DELAY_MS);

      syncTimeoutsRef.current.set(block.id, timeout);
    });

    updateOverallSyncStatus();
  };

  const processSyncQueue = async () => {
    if (syncQueueRef.current.size === 0) return;

    const blockIdsToSync = Array.from(syncQueueRef.current);
    syncQueueRef.current.clear();

    // Update states to syncing
    setBlockSyncStates(prev => {
      const newStates = new Map(prev);
      blockIdsToSync.forEach(id => {
        newStates.set(id, 'syncing');
      });
      return newStates;
    });
    updateOverallSyncStatus();

    // Process each block
    const syncPromises = blockIdsToSync.map(async (blockId) => {
      const block = blocks.find(b => b.id === blockId);
      if (!block) return;

      try {
        console.log('Syncing block:', block);
        // Simulate async sync operation
        await new Promise(resolve => setTimeout(resolve, 1000));

        setBlockSyncStates(prev => {
          const newStates = new Map(prev);
          newStates.set(blockId, 'synced');
          return newStates;
        });
      } catch (error) {
        console.error('Sync error for block:', blockId, error);
        setBlockSyncStates(prev => {
          const newStates = new Map(prev);
          newStates.set(blockId, 'error');
          return newStates;
        });
      }
    });

    await Promise.all(syncPromises);
    updateOverallSyncStatus();
  };

  const updateOverallSyncStatus = () => {
    setBlockSyncStates(prev => {
      const states = Array.from(prev.values());
      if (states.some(state => state === 'syncing')) {
        setSyncStatus('syncing');
      } else if (states.some(state => state === 'error')) {
        setSyncStatus('error');
      } else if (states.some(state => state === 'pending')) {
        setSyncStatus('syncing'); // Show syncing while blocks are pending
      } else {
        setSyncStatus('synced');
      }
      return prev;
    });
  };

  const handleNameDoubleClick = () => {
    setIsEditingName(true);
    setEditingName(notebookName);
    setTimeout(() => nameInputRef.current?.focus(), 0);
  };

  const handleNameSave = async () => {
    if (editingName.trim() && editingName.trim() !== notebookName) {
      try {
        await updateNotebook(notebookId, editingName.trim());
        setNotebookName(editingName.trim());
      } catch (err) {
        console.error('Failed to update notebook name:', err);
        // Could show an error message to user
      }
    }
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setIsEditingName(false);
    setEditingName('');
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      handleNameCancel();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notebook...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/notebooks" className="text-blue-600 hover:underline">
            Back to notebooks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/notebooks" className="text-gray-600 hover:text-gray-900 transition-colors">
                ← Back to Notebooks
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                  syncStatus === 'synced' 
                    ? 'bg-green-100 text-green-800' 
                    : syncStatus === 'syncing'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {syncStatus === 'synced' ? (
                    <Check className="w-3 h-3" />
                  ) : syncStatus === 'syncing' ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <X className="w-3 h-3" />
                  )}
                  <span>{syncStatus === 'synced' ? 'Synced' : syncStatus === 'syncing' ? 'Syncing' : 'Sync error'}</span>
                </div>
                {isEditingName ? (
                  <div className="flex items-center space-x-2">
                    <Check
                      className="w-4 h-4 text-gray-700 cursor-pointer hover:text-gray-900"
                      onClick={handleNameSave}
                    />
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={handleNameSave}
                      onKeyDown={handleNameKeyDown}
                      className="text-gray-600 bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                      style={{ width: `${Math.max(editingName.length * 8, 120)}px` }}
                    />
                  </div>
                ) : (
                  <span
                    className="text-gray-600 cursor-pointer hover:text-gray-800"
                    onDoubleClick={handleNameDoubleClick}
                    title="Double-click to edit name"
                  >
                    {notebookName}
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('authToken');
                  router.push('/login');
                }}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <NoteEditor
            initialBlocks={blocks}
            onChange={handleBlocksChange}
          />
        </div>
      </main>
    </div>
  );
}