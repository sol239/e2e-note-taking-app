'use client';

import React, { useState } from 'react';
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
    const index = currentBlocks.findIndex((b) => b.id === id);
    const newBlock = new Block(
      documentManager.generateId(),
      BlockType.PARAGRAPH
    );
    
    documentManager.addBlock(newBlock, index + 1);
    setBlocks(documentManager.getBlocks());
    setActiveBlockId(newBlock.id);
  };

  const handleAddBlockAbove = (id: string) => {
    const currentBlocks = documentManager.getBlocks();
    const index = currentBlocks.findIndex((b) => b.id === id);
    const newBlock = new Block(
      documentManager.generateId(),
      BlockType.PARAGRAPH
    );
    
    documentManager.addBlock(newBlock, index);
    setBlocks(documentManager.getBlocks());
    setActiveBlockId(newBlock.id);
  };

  const handleMoveUp = (id: string) => {
    const currentBlocks = documentManager.getBlocks();
    const index = currentBlocks.findIndex((b) => b.id === id);
    if (index > 0) {
      documentManager.moveBlock(id, index - 1);
      setBlocks(documentManager.getBlocks());
    }
  };

  const handleMoveDown = (id: string) => {
    const currentBlocks = documentManager.getBlocks();
    const index = currentBlocks.findIndex((b) => b.id === id);
    if (index < currentBlocks.length - 1) {
      documentManager.moveBlock(id, index + 1);
      setBlocks(documentManager.getBlocks());
    }
  };

  const handleDragStart = (id: string) => {
    setDraggedBlockId(id);
  };

  const handleDragOver = (targetId: string) => {
    // Just for visual feedback, actual logic in handleDrop
  };

  const handleDrop = (targetId: string) => {
    if (!draggedBlockId || draggedBlockId === targetId) {
      setDraggedBlockId(null);
      return;
    }

    const currentBlocks = documentManager.getBlocks();
    const draggedIndex = currentBlocks.findIndex((b) => b.id === draggedBlockId);
    const targetIndex = currentBlocks.findIndex((b) => b.id === targetId);

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

    if (draggedIndex !== -1 && targetIndex !== -1) {
      // Move the dragged block to the target position
      documentManager.moveBlock(draggedBlockId, targetIndex);
      setBlocks(documentManager.getBlocks());
    }

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
    const newBlock = new Block(
      documentManager.generateId(),
      BlockType.PARAGRAPH
    );
    documentManager.addBlock(newBlock);
    setBlocks(documentManager.getBlocks());
    setActiveBlockId(newBlock.id);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div 
        className="flex flex-col"
        style={{ gap: `${globalSettings.cellMarginBottom}px` }}
      >
        {blocks.map((block) => (
          <BlockComponent
            key={block.id}
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
