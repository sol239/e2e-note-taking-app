'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getNotebookBlocks, getNotebooks } from '../../../api/auth';
import NoteEditor from '../../../components/NoteEditor';
import { Block, BlockType } from '../../../models/Block';
import { Check, X, Loader2 } from 'lucide-react';
import SyncWorker from '../../../utils/SyncWorker';

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
  const [existingBlockIds, setExistingBlockIds] = useState<Set<string>>(new Set());
  const [previousBlocks, setPreviousBlocks] = useState<Map<string, Block>>(new Map());
  const nameInputRef = useRef<HTMLInputElement>(null);
  const syncWorker = useRef(SyncWorker.getInstance());

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
        
        // Track which blocks exist in the database
        setExistingBlockIds(new Set(convertedBlocks.map(b => b.id)));
        
        // Initialize previous blocks state for change detection
        const blocksMap = new Map<string, Block>();
        convertedBlocks.forEach(block => {
          blocksMap.set(block.id, block.clone());
        });
        setPreviousBlocks(blocksMap);
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

  const queueNotebookNameSync = (newName: string) => {
    syncWorker.current.queueNotebookNameSync(
      notebookId,
      newName,
      (status) => {
        if (status === 'syncing' || status === 'pending') {
          setSyncStatus('syncing');
        } else if (status === 'error') {
          setSyncStatus('error');
        } else {
          setSyncStatus('synced');
        }
      }
    );
  };

  const handleBlocksChange = (newBlocks: Block[]) => {
    // Check if first block is heading1 and sync with notebook name
    if (newBlocks.length > 0 && newBlocks[0].type === BlockType.HEADING1) {
      const firstBlockContent = newBlocks[0].content;
      if (firstBlockContent !== notebookName) {
        // Update notebook name to match first heading (with delay)
        setNotebookName(firstBlockContent);
        queueNotebookNameSync(firstBlockContent);
      }
    }
    
    // Detect deleted blocks (skip the first block if it's heading1)
    const newBlockIds = new Set(newBlocks.map(b => b.id));
    const deletedBlockIds = Array.from(previousBlocks.keys()).filter(id => {
      // Don't allow deletion of first heading1 block
      const block = previousBlocks.get(id);
      const isFirstHeading = block && block.type === BlockType.HEADING1 && Array.from(previousBlocks.keys())[0] === id;
      return !newBlockIds.has(id) && !isFirstHeading;
    });
    
    // Handle deletions
    if (deletedBlockIds.length > 0) {
      deletedBlockIds.forEach(async (blockId) => {
        if (existingBlockIds.has(blockId)) {
          try {
            await syncWorker.current.queueBlockDelete(notebookId, blockId);
            console.log('Deleted block from backend:', blockId);
            setExistingBlockIds(prev => {
              const newSet = new Set(prev);
              newSet.delete(blockId);
              return newSet;
            });
          } catch (error) {
            console.error('Failed to delete block:', blockId, error);
          }
        }
        // Remove from previous blocks tracking
        setPreviousBlocks(prev => {
          const newMap = new Map(prev);
          newMap.delete(blockId);
          return newMap;
        });
      });
    }
    
    setBlocks(newBlocks);
    
    // Detect which blocks have changed
    const changedBlocks = newBlocks.filter(block => {
      const prevBlock = previousBlocks.get(block.id);
      if (!prevBlock) {
        // New block
        return true;
      }
      // Check if block content, type, metadata, or settings changed
      return (
        prevBlock.content !== block.content ||
        prevBlock.type !== block.type ||
        JSON.stringify(prevBlock.metadata) !== JSON.stringify(block.metadata) ||
        JSON.stringify(prevBlock.settings) !== JSON.stringify(block.settings)
      );
    });
    
    if (changedBlocks.length > 0) {
      queueBlocksForSync(changedBlocks);
      
      // Update previous blocks state for changed blocks
      setPreviousBlocks(prev => {
        const newMap = new Map(prev);
        changedBlocks.forEach(block => {
          newMap.set(block.id, block.clone());
        });
        return newMap;
      });
    }
  };

  const queueBlocksForSync = (blocksToSync: Block[]) => {
    blocksToSync.forEach(block => {
      const isNew = !existingBlockIds.has(block.id);
      
      syncWorker.current.queueBlockSync(
        notebookId,
        block,
        isNew,
        (blockId, status) => {
          setBlockSyncStates(prev => {
            const newStates = new Map(prev);
            newStates.set(blockId, status);
            return newStates;
          });
          
          // If block was created, add to existing blocks set
          if (status === 'synced' && isNew) {
            setExistingBlockIds(prev => new Set([...prev, blockId]));
          }
          
          updateOverallSyncStatus();
        }
      );
      
      // Immediately set to pending
      setBlockSyncStates(prev => {
        const newStates = new Map(prev);
        newStates.set(block.id, 'pending');
        return newStates;
      });
    });
    
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
      setNotebookName(editingName.trim());
      
      // Queue notebook name sync with delay
      queueNotebookNameSync(editingName.trim());
      
      // Also update the first heading1 block if it exists
      if (blocks.length > 0 && blocks[0].type === BlockType.HEADING1) {
        const updatedBlocks = [...blocks];
        updatedBlocks[0] = new Block(
          updatedBlocks[0].id,
          updatedBlocks[0].type,
          editingName.trim(),
          updatedBlocks[0].metadata,
          updatedBlocks[0].settings
        );
        setBlocks(updatedBlocks);
        
        // Queue the first block for sync
        queueBlocksForSync([updatedBlocks[0]]);
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
            nonDeletableBlockIds={new Set(blocks.length > 0 && blocks[0].type === BlockType.HEADING1 ? [blocks[0].id] : [])}
          />
        </div>
      </main>
    </div>
  );
}