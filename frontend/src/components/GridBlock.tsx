'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Block, BlockType } from '@/models/Block';
import { Image, Video, Volume2, Type, Heading1, Heading2, Heading3, List, ListOrdered, CheckSquare, Code, Quote, Sigma } from 'lucide-react';
import NextImage from 'next/image';

interface GridCellData {
  blockId?: string; // ID of the block placed in this cell
}

interface GridBlockProps {
  rows: number;
  cols: number;
  cells: Record<string, GridCellData>; // "row-col" -> cell data
  allBlocks: Block[];
  onUpdateGrid: (rows: number, cols: number) => void;
  onCellDrop: (cellKey: string, blockId: string) => void;
  onCellRemove: (cellKey: string) => void;
  onCreateBlock: (cellKey: string, blockType: BlockType) => void;
  onUpdateBlock: (id: string, updates: Partial<Block>) => void;
  onDeleteBlock: (id: string) => void;
  onFocusBlock: (id: string) => void;
  activeBlockId: string | null;
  isActive: boolean;
  onFocus: () => void;
  BlockComponentRenderer: React.ComponentType<{
    block: Block;
    allBlocks: Block[];
    onUpdate: (id: string, updates: Partial<Block>) => void;
    onDelete: (id: string) => void;
    onAddBelow: (id: string) => void;
    onAddAbove: (id: string) => void;
    onFocus: (id: string) => void;
    onMoveUp: (id: string) => void;
    onMoveDown: (id: string) => void;
    onCreateBlock: (blockType: BlockType) => string;
    isActive: boolean;
  }>;
}

export const GridBlock: React.FC<GridBlockProps> = ({
  rows,
  cols,
  cells,
  allBlocks,
  onUpdateGrid,
  onCellDrop,
  onCellRemove,
  onCreateBlock,
  onUpdateBlock,
  onDeleteBlock,
  onFocusBlock,
  activeBlockId,
  isActive,
  onFocus,
  BlockComponentRenderer,
}) => {
  const [showDimensionMenu, setShowDimensionMenu] = useState(false);
  const [tempRows, setTempRows] = useState(rows);
  const [tempCols, setTempCols] = useState(cols);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [showCommandMenu, setShowCommandMenu] = useState<string | null>(null);
  const commandMenuRef = useRef<HTMLDivElement>(null);

  const getCellKey = (row: number, col: number) => `${row}-${col}`;

  // Close command menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (commandMenuRef.current && !commandMenuRef.current.contains(event.target as Node)) {
        setShowCommandMenu(null);
      }
    };

    if (showCommandMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCommandMenu]);

  const handleDimensionChange = () => {
    onUpdateGrid(tempRows, tempCols);
    setShowDimensionMenu(false);
  };

  const handleDragOver = (e: React.DragEvent, cellKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCell(cellKey);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCell(null);
  };

  const handleDrop = (e: React.DragEvent, cellKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCell(null);
    
    const blockId = e.dataTransfer.getData('text/plain');
    if (blockId) {
      onCellDrop(cellKey, blockId);
    }
  };

  const blockTypes = [
    { type: BlockType.PARAGRAPH, label: 'Paragraph', icon: <Type className="w-4 h-4" /> },
    { type: BlockType.HEADING1, label: 'Heading 1', icon: <Heading1 className="w-4 h-4" /> },
    { type: BlockType.HEADING2, label: 'Heading 2', icon: <Heading2 className="w-4 h-4" /> },
    { type: BlockType.HEADING3, label: 'Heading 3', icon: <Heading3 className="w-4 h-4" /> },
    { type: BlockType.BULLETED_LIST, label: 'Bulleted List', icon: <List className="w-4 h-4" /> },
    { type: BlockType.NUMBERED_LIST, label: 'Numbered List', icon: <ListOrdered className="w-4 h-4" /> },
    { type: BlockType.TODO, label: 'To-do', icon: <CheckSquare className="w-4 h-4" /> },
    { type: BlockType.CODE, label: 'Code', icon: <Code className="w-4 h-4" /> },
    { type: BlockType.QUOTE, label: 'Quote', icon: <Quote className="w-4 h-4" /> },
    { type: BlockType.MATH, label: 'Math', icon: <Sigma className="w-4 h-4" /> },
    { type: BlockType.IMAGE, label: 'Image', icon: <Image className="w-4 h-4" /> },
    { type: BlockType.VIDEO, label: 'Video', icon: <Video className="w-4 h-4" /> },
    { type: BlockType.AUDIO, label: 'Audio', icon: <Volume2 className="w-4 h-4" /> },
  ];

  return (
    <div
      className={`border-2 rounded-lg p-3 ${
        isActive ? 'border-blue-500' : 'border-gray-300'
      }`}
      onClick={onFocus}
    >
      {/* Resize Button */}
      <div className="flex justify-end mb-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowDimensionMenu(!showDimensionMenu);
          }}
          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded transition-colors"
          title="Change grid dimensions"
        >
          ⚙️ Resize
        </button>
      </div>

      {/* Dimension Menu */}
      {showDimensionMenu && (
        <div className="mb-3 p-3 bg-white rounded-lg border border-gray-300">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-700">Rows:</label>
              <input
                type="number"
                min="1"
                max="6"
                value={tempRows}
                onChange={(e) => setTempRows(Math.max(1, Math.min(6, parseInt(e.target.value) || 1)))}
                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-700">Cols:</label>
              <input
                type="number"
                min="1"
                max="6"
                value={tempCols}
                onChange={(e) => setTempCols(Math.max(1, Math.min(6, parseInt(e.target.value) || 1)))}
                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
              />
            </div>
            <button
              onClick={handleDimensionChange}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
            >
              Apply
            </button>
            <button
              onClick={() => {
                setShowDimensionMenu(false);
                setTempRows(rows);
                setTempCols(cols);
              }}
              className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, auto)`,
        }}
      >
        {Array.from({ length: rows }, (_, rowIndex) =>
          Array.from({ length: cols }, (_, colIndex) => {
            const cellKey = getCellKey(rowIndex, colIndex);
            const cellData = cells[cellKey];
            const cellContent = cellData?.blockId;
            const isDragOver = dragOverCell === cellKey;
            
            // Check if it's a URL (for demo images)
            const isImageUrl = cellContent && cellContent.startsWith('/');
            // Find the actual block if it's a block ID
            const cellBlock = cellContent && !isImageUrl ? allBlocks.find(b => b.id === cellContent) : null;
            const hasContent = cellContent && (cellBlock || isImageUrl);

            return (
              <div
                key={cellKey}
                className={`relative border-2 rounded-lg p-2 min-h-[120px] bg-white transition-all ${
                  isDragOver 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-dashed border-gray-400'
                }`}
                onDragOver={(e) => handleDragOver(e, cellKey)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, cellKey)}
              >
                {hasContent ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-end pb-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCellRemove(cellKey);
                        }}
                        className="text-xs text-red-600 hover:text-red-800 px-2 py-0.5 rounded hover:bg-red-50"
                        title="Remove from grid"
                      >
                        ✕
                      </button>
                    </div>
                    {isImageUrl ? (
                      <img
                        src={cellContent}
                        alt="Demo image"
                        className="w-full h-auto rounded"
                      />
                    ) : cellBlock ? (
                      <BlockComponentRenderer
                        block={cellBlock}
                        allBlocks={allBlocks}
                        onUpdate={onUpdateBlock}
                        onDelete={() => {
                          onCellRemove(cellKey);
                          onDeleteBlock(cellBlock.id);
                        }}
                        onAddBelow={() => {}} // Disabled in grid
                        onAddAbove={() => {}} // Disabled in grid
                        onFocus={onFocusBlock}
                        onMoveUp={() => {}} // Disabled in grid
                        onMoveDown={() => {}} // Disabled in grid
                        onCreateBlock={() => {
                          // Create block and return its ID, but grid doesn't use it
                          const newBlockId = `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                          return newBlockId;
                        }}
                        isActive={activeBlockId === cellBlock.id}
                      />
                    ) : null}
                  </div>
                ) : (
                  <div className="relative h-full flex items-center justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCommandMenu(cellKey);
                      }}
                      className="flex flex-col items-center justify-center gap-2 w-full h-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                    >
                      <div className="text-3xl">+</div>
                      <div className="text-xs font-medium">Create new cell</div>
                    </button>

                    {/* Command Menu */}
                    {showCommandMenu === cellKey && (
                      <div
                        ref={commandMenuRef}
                        className="absolute top-0 left-0 w-full bg-white border-2 border-blue-500 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-2">
                          <div className="text-xs text-gray-500 uppercase tracking-wide px-2 py-1 font-medium">
                            Select block type
                          </div>
                          {blockTypes.map((blockType) => (
                            <button
                              key={blockType.type}
                              onClick={(e) => {
                                e.stopPropagation();
                                onCreateBlock(cellKey, blockType.type);
                                setShowCommandMenu(null);
                              }}
                              className="w-full text-left px-3 py-2 rounded flex items-center gap-3 text-sm hover:bg-blue-50 transition-colors"
                            >
                              <span className="w-6 flex justify-center text-gray-600">
                                {blockType.icon}
                              </span>
                              <span className="text-gray-900">{blockType.label}</span>
                            </button>
                          ))}
                        </div>
                        <div className="border-t border-gray-200 p-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowCommandMenu(null);
                            }}
                            className="w-full px-3 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
