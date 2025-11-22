'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getNotebookBlocks } from '../../../api/auth';
import NoteEditor from '../../../components/NoteEditor';
import { Block, BlockType } from '../../../models/Block';
import { Check, X, Loader2, Download, Database } from 'lucide-react';
import SyncWorker from '../../../utils/SyncWorker';
import ExportModal from '../../../components/ExportModal';
import { useMainView } from '../../../contexts/MainViewContext';

export default function NotebookPage() {
  const params = useParams();
  const router = useRouter();
  const notebookId = params.id as string;
  const { getNotebookById, updateNotebookConnectorInStore } = useMainView();

  const currentNotebook = getNotebookById(notebookId);
  const notebookName = currentNotebook?.notebook.name || '';

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [blockSyncStates, setBlockSyncStates] = useState<Map<string, 'pending' | 'syncing' | 'synced' | 'error'>>(new Map());
  const [existingBlockIds, setExistingBlockIds] = useState<Set<string>>(new Set());
  const [previousBlocks, setPreviousBlocks] = useState<Map<string, Block>>(new Map());
  const [showExportModal, setShowExportModal] = useState(false);
  const [isDatabaseView, setIsDatabaseView] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const syncWorker = useRef(SyncWorker.getInstance());

  useEffect(() => {
    const fetchNotebookData = async () => {
      try {
        // Check if notebook exists
        if (!currentNotebook) {
          throw new Error('Notebook not found');
        }

        // Get blocks
        const blockConnectors = await getNotebookBlocks(notebookId);
        const convertedBlocks: Block[] = blockConnectors.map(connector =>
          new Block(
            connector.block.id,
            connector.block.type as BlockType,
            connector.block.content,
            connector.block.metadata,
            connector.block.settings,
            connector.position_id,
            connector.position_order
          )
        );
        // Sort blocks by position_id and then position_order
        convertedBlocks.sort((a, b) => {
          if (a.position_id !== b.position_id) {
            return a.position_id - b.position_id;
          }
          return a.position_order - b.position_order;
        });
        
        setBlocks(convertedBlocks);
        
        // Track which blocks exist in the database
        setExistingBlockIds(new Set(convertedBlocks.map(b => b.id)));
        
        // Initialize previous blocks state for change detection
        const blocksMap = new Map<string, Block>();
        convertedBlocks.forEach(block => {
          blocksMap.set(block.id, block.clone());
        });
        setPreviousBlocks(blocksMap);

        // Update last_opened in local store
        updateNotebookConnectorInStore(notebookId, { last_opened: new Date().toISOString() });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load notebook');
      } finally {
        setLoading(false);
      }
    };

    if (notebookId) {
      // redirect to login if not authenticated
      if (typeof window !== 'undefined' && !localStorage.getItem('authToken')) {
        router.push('/login');
        return;
      }
      fetchNotebookData();
    }
  }, [notebookId]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (mainContentRef.current && mainContentRef.current.contains(e.target as Node)) {
        const clipboardData = e.clipboardData?.getData('text/plain');
        console.log('Clipboard content:', clipboardData);
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

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
        // Queue notebook name sync (global store will be updated via event)
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
      // Check if block content, type, metadata, settings, or position changed
      return (
        prevBlock.content !== block.content ||
        prevBlock.type !== block.type ||
        JSON.stringify(prevBlock.metadata) !== JSON.stringify(block.metadata) ||
        JSON.stringify(prevBlock.settings) !== JSON.stringify(block.settings) ||
        prevBlock.position_id !== block.position_id ||
        prevBlock.position_order !== block.position_order
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
    <div className="min-h-full bg-white p-8">
      {/* Header / Sync Status */}
      <div className="max-w-4xl mx-auto mb-4 flex justify-end items-center space-x-2">
        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center space-x-1 px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          <Download className="w-3 h-3" />
          <span>Export</span>
        </button>
        <button
          onClick={() => setIsDatabaseView(!isDatabaseView)}
          className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs transition-colors ${
            isDatabaseView 
              ? 'bg-gray-800 text-white hover:bg-gray-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Database className="w-3 h-3" />
          <span>Database View</span>
        </button>
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
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto">
        <div ref={mainContentRef} className="min-h-[calc(100vh-8rem)]">
          {isDatabaseView ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metadata</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Settings</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {blocks.map((block) => (
                    <tr key={block.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-500">{block.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">{block.type}</td>
                      <td className="px-6 py-4 text-gray-500 max-w-xs truncate" title={block.content}>{block.content}</td>
                      <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{JSON.stringify(block.metadata)}</td>
                      <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{JSON.stringify(block.settings)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <NoteEditor
              initialBlocks={blocks}
              onChange={handleBlocksChange}
              nonDeletableBlockIds={new Set(blocks.length > 0 && blocks[0].type === BlockType.HEADING1 ? [blocks[0].id] : [])}
            />
          )}
        </div>
      </main>
      {showExportModal && (
        <ExportModal
          notebookId={notebookId}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}