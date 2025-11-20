'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Block, BlockType } from '@/models/Block';
import { DocumentManager } from '@/models/DocumentManager';
import BlockComponent from './BlockComponent';
import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';
import { Plus } from 'lucide-react';

interface NoteEditorProps {
  initialBlocks?: Block[];
  onChange?: (blocks: Block[]) => void;
  nonDeletableBlockIds?: Set<string>;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ initialBlocks, onChange, nonDeletableBlockIds = new Set() }) => {
  const { settings: globalSettings } = useGlobalSettings();
  const [documentManager] = useState(
    () => new DocumentManager(initialBlocks, onChange)
  );
  const [blocks, setBlocks] = useState<Block[]>(documentManager.getBlocks());
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Only handle paste if we're inside the editor
      if (containerRef.current && !containerRef.current.contains(document.activeElement)) {
        return;
      }

      // If no block is active, we might append to the end or start, 
      // but usually we want to insert after the active block.
      // If activeBlockId is null but we are focused in the container (e.g. clicked gap), 
      // we might want to handle it, but for now let's require an active block or just append if none.
      
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const base64 = event.target?.result as string;
              if (base64) {
                const currentBlocks = documentManager.getBlocks();
                let index = -1;
                
                if (activeBlockId) {
                  index = currentBlocks.findIndex((b) => b.id === activeBlockId);
                } else {
                  // If no active block, append to end
                  index = currentBlocks.length - 1;
                }

                const newBlock = new Block(
                  documentManager.generateId(),
                  BlockType.IMAGE,
                  '',
                  { url: base64 }
                );
                
                documentManager.addBlock(newBlock, index + 1);
                setBlocks(documentManager.getBlocks());
                setActiveBlockId(newBlock.id);
              }
            };
            reader.readAsDataURL(blob);
          }
          break; // Only handle one image
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [activeBlockId, documentManager]);

  const handleUpdateBlock = (id: string, updates: Partial<Block>) => {
    documentManager.updateBlock(id, updates);
    setBlocks(documentManager.getBlocks());
  };

  const handleDeleteBlock = (id: string) => {
    // Prevent deletion of non-deletable blocks
    if (nonDeletableBlockIds.has(id)) {
      return;
    }
    
    const currentBlocks = documentManager.getBlocks();
    const currentIndex = currentBlocks.findIndex((b) => b.id === id);
    
    documentManager.deleteBlock(id);
    const newBlocks = documentManager.getBlocks();
    setBlocks(newBlocks);

    // Focus the previous block if available, otherwise the next one
    if (newBlocks.length > 0) {
      const newIndex = Math.max(0, Math.min(currentIndex, newBlocks.length - 1));
      setActiveBlockId(newBlocks[newIndex].id);
    }
  };

  const handleAddBlockBelow = (id: string) => {
    const currentBlocks = documentManager.getBlocks();
    const currentBlock = currentBlocks.find(b => b.id === id);
    if (!currentBlock) return;

    const currentPosId = currentBlock.position_id || 0;
    
    // Shift all blocks with position_id > currentPosId by 1
    currentBlocks.forEach(b => {
      if ((b.position_id || 0) > currentPosId) {
        documentManager.updateBlock(b.id, { position_id: (b.position_id || 0) + 1 });
      }
    });

    const newBlock = new Block(
      documentManager.generateId(),
      BlockType.PARAGRAPH,
      '',
      undefined,
      undefined,
      currentPosId + 1,
      0
    );
    
    documentManager.addBlock(newBlock);
    setBlocks(documentManager.getBlocks());
    setActiveBlockId(newBlock.id);
  };

  const handleAddBlockAbove = (id: string) => {
    const currentBlocks = documentManager.getBlocks();
    const currentBlock = currentBlocks.find(b => b.id === id);
    if (!currentBlock) return;

    const currentPosId = currentBlock.position_id || 0;
    
    // Shift all blocks with position_id >= currentPosId by 1
    currentBlocks.forEach(b => {
      if ((b.position_id || 0) >= currentPosId) {
        documentManager.updateBlock(b.id, { position_id: (b.position_id || 0) + 1 });
      }
    });

    const newBlock = new Block(
      documentManager.generateId(),
      BlockType.PARAGRAPH,
      '',
      undefined,
      undefined,
      currentPosId,
      0
    );
    
    documentManager.addBlock(newBlock);
    setBlocks(documentManager.getBlocks());
    setActiveBlockId(newBlock.id);
  };

  const handleMoveUp = (id: string) => {
    const currentBlocks = documentManager.getBlocks();
    const currentBlock = currentBlocks.find(b => b.id === id);
    if (!currentBlock) return;

    const currentPosId = currentBlock.position_id || 0;
    
    // Find the row above
    const blocksAbove = currentBlocks.filter(b => (b.position_id || 0) < currentPosId);
    if (blocksAbove.length === 0) return;
    
    const prevPosId = Math.max(...blocksAbove.map(b => b.position_id || 0));
    
    // Swap position_ids
    const blocksInCurrentRow = currentBlocks.filter(b => (b.position_id || 0) === currentPosId);
    const blocksInPrevRow = currentBlocks.filter(b => (b.position_id || 0) === prevPosId);
    
    blocksInCurrentRow.forEach(b => documentManager.updateBlock(b.id, { position_id: prevPosId }));
    blocksInPrevRow.forEach(b => documentManager.updateBlock(b.id, { position_id: currentPosId }));
    
    setBlocks(documentManager.getBlocks());
  };

  const handleMoveDown = (id: string) => {
    const currentBlocks = documentManager.getBlocks();
    const currentBlock = currentBlocks.find(b => b.id === id);
    if (!currentBlock) return;

    const currentPosId = currentBlock.position_id || 0;
    
    // Find the row below
    const blocksBelow = currentBlocks.filter(b => (b.position_id || 0) > currentPosId);
    if (blocksBelow.length === 0) return;
    
    const nextPosId = Math.min(...blocksBelow.map(b => b.position_id || 0));
    
    // Swap position_ids
    const blocksInCurrentRow = currentBlocks.filter(b => (b.position_id || 0) === currentPosId);
    const blocksInNextRow = currentBlocks.filter(b => (b.position_id || 0) === nextPosId);
    
    blocksInCurrentRow.forEach(b => documentManager.updateBlock(b.id, { position_id: nextPosId }));
    blocksInNextRow.forEach(b => documentManager.updateBlock(b.id, { position_id: currentPosId }));
    
    setBlocks(documentManager.getBlocks());
  };

  const handleDragStart = (id: string) => {
    setDraggedBlockId(id);
  };

  const handleDragOver = (targetId: string) => {
    // Just for visual feedback, actual logic in handleDrop
  };

  const handleDrop = (targetId: string, position?: 'left' | 'right' | 'top' | 'bottom') => {
    if (!draggedBlockId || draggedBlockId === targetId) {
      setDraggedBlockId(null);
      return;
    }

    const currentBlocks = documentManager.getBlocks();
    const draggedBlock = currentBlocks.find(b => b.id === draggedBlockId);
    const targetBlock = currentBlocks.find(b => b.id === targetId);
    
    if (!draggedBlock || !targetBlock) return;

    // Check if the dragged block is currently in a grid
    let draggedFromGrid = false;
    let gridBlockId: string | null = null;

    for (const block of currentBlocks) {
      if (block.type === BlockType.GRID && block.metadata?.gridCells) {
        const gridCells = block.metadata.gridCells as Record<string, string[]>;
        for (const cellKey in gridCells) {
          if (gridCells[cellKey] && gridCells[cellKey].includes(draggedBlockId)) {
            draggedFromGrid = true;
            gridBlockId = block.id;
            break;
          }
        }
        if (draggedFromGrid) break;
      }
    }

    // If dragged from grid, remove it from the grid
    if (draggedFromGrid && gridBlockId) {
      const gridBlock = currentBlocks.find(b => b.id === gridBlockId);
      if (gridBlock && gridBlock.metadata?.gridCells) {
        const updatedGridCells = { ...gridBlock.metadata.gridCells };
        // Remove the block from all grid cells
        Object.keys(updatedGridCells).forEach(cellKey => {
          updatedGridCells[cellKey] = updatedGridCells[cellKey].filter(id => id !== draggedBlockId);
          // Remove empty cells
          if (updatedGridCells[cellKey].length === 0) {
            delete updatedGridCells[cellKey];
          }
        });
        documentManager.updateBlock(gridBlockId, {
          metadata: { ...gridBlock.metadata, gridCells: updatedGridCells }
        });
      }
    }

    // Handle horizontal drop (add to row)
    if (position === 'left' || position === 'right') {
      const targetPosId = targetBlock.position_id || 0;
      const targetPosOrder = targetBlock.position_order || 0;
      
      // Update dragged block to have same position_id
      documentManager.updateBlock(draggedBlockId, { 
        position_id: targetPosId,
        position_order: position === 'left' ? targetPosOrder - 0.5 : targetPosOrder + 0.5 
      });
      
      // Normalize position_orders in the row
      const updatedBlocks = documentManager.getBlocks();
      const rowBlocks = updatedBlocks.filter(b => (b.position_id || 0) === targetPosId);
      rowBlocks.sort((a, b) => (a.position_order || 0) - (b.position_order || 0));
      
      rowBlocks.forEach((b, index) => {
        documentManager.updateBlock(b.id, { position_order: index });
      });
      
      setBlocks(documentManager.getBlocks());
      setDraggedBlockId(null);
      return;
    }

    // Handle vertical drop (create new row)
    const targetPosId = targetBlock.position_id || 0;
    let newPosId = targetPosId;
    
    if (position === 'bottom') {
        newPosId = targetPosId + 1;
    }
    
    // Shift blocks
    currentBlocks.forEach(b => {
        if (b.id === draggedBlockId) return;
        if ((b.position_id || 0) >= newPosId) {
            documentManager.updateBlock(b.id, { position_id: (b.position_id || 0) + 1 });
        }
    });
    
    documentManager.updateBlock(draggedBlockId, {
        position_id: newPosId,
        position_order: 0
    });
    
    setBlocks(documentManager.getBlocks());
    setDraggedBlockId(null);
  };

  const handleCreateBlock = (blockType: BlockType): string => {
    const newBlock = new Block(
      documentManager.generateId(),
      blockType
    );
    documentManager.addBlock(newBlock);
    setBlocks(documentManager.getBlocks());
    return newBlock.id;
  };

  const handleAddNewBlock = () => {
    const currentBlocks = documentManager.getBlocks();
    const maxPosId = currentBlocks.reduce((max, b) => Math.max(max, b.position_id || 0), -1);
    
    const newBlock = new Block(
      documentManager.generateId(),
      BlockType.PARAGRAPH,
      '',
      undefined,
      undefined,
      maxPosId + 1,
      0
    );
    documentManager.addBlock(newBlock);
    setBlocks(documentManager.getBlocks());
    setActiveBlockId(newBlock.id);
  };

  // Group blocks by position_id
  const rows = new Map<number, Block[]>();
  blocks.forEach(block => {
    const posId = block.position_id || 0;
    if (!rows.has(posId)) {
      rows.set(posId, []);
    }
    rows.get(posId)!.push(block);
  });

  // Sort rows by position_id
  const sortedRowIds = Array.from(rows.keys()).sort((a, b) => a - b);

  // Sort blocks within each row by position_order
  sortedRowIds.forEach(rowId => {
    rows.get(rowId)!.sort((a, b) => (a.position_order || 0) - (b.position_order || 0));
  });

  return (
    <div className="max-w-4xl mx-auto py-8 px-4" ref={containerRef}>
      <div 
        className="flex flex-col"
        style={{ gap: `${globalSettings.cellMarginBottom}px` }}
      >
        {sortedRowIds.map((rowId) => (
          <div key={rowId} className="flex flex-row w-full gap-2">
            {rows.get(rowId)!.map((block) => (
              <div key={block.id} className="flex-1 min-w-0">
                <BlockComponent
                  block={block}
                  allBlocks={blocks}
                  onUpdate={handleUpdateBlock}
                  onDelete={handleDeleteBlock}
                  onAddBelow={handleAddBlockBelow}
                  onAddAbove={handleAddBlockAbove}
                  onFocus={setActiveBlockId}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onCreateBlock={handleCreateBlock}
                  isActive={activeBlockId === block.id}
                  isDeletable={!nonDeletableBlockIds.has(block.id)}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-4">
        <button
          onClick={handleAddNewBlock}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
        >
          <Plus className="w-4 h-4" />
          <span>Create new cell</span>
        </button>
      </div>
      
      <div className="mt-8 text-sm text-gray-400 space-y-1">
        <p>💡 Tips:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Press <kbd className="px-1 bg-gray-100 rounded">Enter</kbd> to create a new block below</li>
          <li>Press <kbd className="px-1 bg-gray-100 rounded">Ctrl+Enter</kbd> to create a new block above</li>
          <li>Press <kbd className="px-1 bg-gray-100 rounded">Backspace</kbd> on empty block to delete</li>
          <li>Press <kbd className="px-1 bg-gray-100 rounded">Ctrl+↑/↓</kbd> to move blocks</li>
          <li>Type <kbd className="px-1 bg-gray-100 rounded">/</kbd> for block commands</li>
          <li>Use Math block for LaTeX equations</li>
          <li>Click on code blocks to edit them</li>
          <li>Use gear icon (⚙️) on blocks for settings and language selection</li>
        </ul>
      </div>
    </div>
  );
};

export default NoteEditor;
