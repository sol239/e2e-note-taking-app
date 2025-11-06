'use client';

import React, { useState, useRef, useEffect, KeyboardEvent, DragEvent } from 'react';
import { Block, BlockType } from '@/models/Block';
import TextFormattingToolbar from './TextFormattingToolbar';
import { BlockSettingsPanel } from './BlockSettingsPanel';
import { CodeBlockRenderer } from './CodeBlockRenderer';
import { LiveCodeEditor } from './LiveCodeEditor';
import { GridBlock } from './GridBlock';
import { BlockStyling } from '@/models/Settings';
import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';
import { Settings } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface BlockComponentProps {
  block: Block;
  allBlocks: Block[];
  onUpdate: (id: string, updates: Partial<Block>) => void;
  onDelete: (id: string) => void;
  onAddBelow: (id: string) => void;
  onAddAbove: (id: string) => void;
  onFocus: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onDragStart?: (id: string) => void;
  onDragOver?: (id: string) => void;
  onDrop?: (targetId: string) => void;
  onCreateBlock: (blockType: BlockType) => string;
  isActive: boolean;
}

const BlockComponent: React.FC<BlockComponentProps> = ({
  block,
  allBlocks,
  onUpdate,
  onDelete,
  onAddBelow,
  onAddAbove,
  onFocus,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragOver,
  onDrop,
  onCreateBlock,
  isActive,
}) => {
  const { settings: globalSettings } = useGlobalSettings();
  const [showMenu, setShowMenu] = useState(false);
  const [showFormatting, setShowFormatting] = useState(false);
  const [showBlockSettings, setShowBlockSettings] = useState(false);
  const [selectedMenuIndex, setSelectedMenuIndex] = useState(0);
  const [content, setContent] = useState(block.content);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isMathEditing, setIsMathEditing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const firstMenuItemRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  useEffect(() => {
    setContent(block.content);
  }, [block.content]);

  // Focus on first menu item when menu opens
  useEffect(() => {
    if (showMenu && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showMenu]);

  // Scroll selected item into view
  useEffect(() => {
    if (showMenu) {
      const menuContainer = document.querySelector('.menu-container');
      const selectedButton = menuContainer?.querySelector(`[data-index="${selectedMenuIndex}"]`) as HTMLElement;
      if (selectedButton && menuContainer) {
        const containerRect = menuContainer.getBoundingClientRect();
        const buttonRect = selectedButton.getBoundingClientRect();
        
        if (buttonRect.bottom > containerRect.bottom) {
          menuContainer.scrollTop += buttonRect.bottom - containerRect.bottom;
        } else if (buttonRect.top < containerRect.top) {
          menuContainer.scrollTop -= containerRect.top - buttonRect.top;
        }
      }
    }
  }, [selectedMenuIndex, showMenu]);

  const handleKeyDown = (e: KeyboardEvent) => {
    // Handle text formatting shortcuts - toggle mode
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') {
        e.preventDefault();
        toggleFormatMode('bold');
        return;
      } else if (e.key === 'i') {
        e.preventDefault();
        toggleFormatMode('italic');
        return;
      } else if (e.key === 'u') {
        e.preventDefault();
        toggleFormatMode('underline');
        return;
      }
    }

    // Handle "/" command to open block menu
    if (e.key === '/' && content === '') {
      e.preventDefault();
      setSelectedMenuIndex(0);
      setSearchQuery('');
      setShowMenu(true);
      return;
    }

    // Handle menu navigation when menu is open
    if (showMenu) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const filteredTypes = getFilteredBlockTypes();
        setSelectedMenuIndex(prev => 
          (prev + 1) % filteredTypes.length
        );
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const filteredTypes = getFilteredBlockTypes();
        setSelectedMenuIndex(prev => 
          prev === 0 ? filteredTypes.length - 1 : prev - 1
        );
        return;
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const filteredTypes = getFilteredBlockTypes();
        const selectedType = filteredTypes[selectedMenuIndex];
        if (selectedType) {
          handleTypeChange(selectedType);
        }
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowMenu(false);
        setSearchQuery('');
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      if (e.ctrlKey || e.metaKey) {
        // Ctrl+Enter creates new block below
        e.preventDefault();
        onAddBelow(block.id);
      } else {
        // Regular Enter creates new block below
        e.preventDefault();
        onAddBelow(block.id);
      }
    } else if (e.key === 'Enter' && e.shiftKey && (e.ctrlKey || e.metaKey)) {
      // Ctrl+Shift+Enter creates new block above
      e.preventDefault();
      onAddAbove(block.id);
    } else if (e.key === 'Backspace' && content === '' && !e.shiftKey) {
      e.preventDefault();
      onDelete(block.id);
    } else if (e.key === 'ArrowUp' && e.ctrlKey) {
      e.preventDefault();
      onMoveUp(block.id);
    } else if (e.key === 'ArrowDown' && e.ctrlKey) {
      e.preventDefault();
      onMoveDown(block.id);
    }
  };

  const handleDragStart = (e: DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', block.id);
    if (onDragStart) {
      onDragStart(block.id);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
    if (onDragOver) {
      onDragOver(block.id);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (onDrop) {
      onDrop(block.id);
    }
  };

  const handleBlockClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.shiftKey) {
        // Ctrl+Shift+Click creates block above
        onAddAbove(block.id);
      } else {
        // Ctrl+Click creates block below
        onAddBelow(block.id);
      }
    }
  };

  const applyFormatting = (format: string) => {
    const textarea = inputRef.current as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    let formattedText = '';

    switch (format) {
      case 'bold':
        formattedText = `**${selectedText || 'bold text'}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText || 'italic text'}*`;
        break;
      case 'underline':
        formattedText = `<u>${selectedText || 'underlined text'}</u>`;
        break;
      case 'strikethrough':
        formattedText = `~~${selectedText || 'strikethrough'}~~`;
        break;
      case 'code':
        formattedText = `\`${selectedText || 'code'}\``;
        break;
      case 'link':
        formattedText = `[${selectedText || 'link text'}](url)`;
        break;
      default:
        return;
    }

    const newContent =
      content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);
    onUpdate(block.id, { content: newContent });
  };

  const handleChange = (value: string) => {
    // Apply active formats to new text
    let newText = value;
    const lastChar = value.slice(-1);
    const prevContent = content;
    
    // Only apply formatting to newly typed characters
    if (value.length > prevContent.length && activeFormats.size > 0) {
      const addedText = value.slice(prevContent.length);
      let formattedText = addedText;
      
      // Apply each active format
      if (activeFormats.has('bold')) {
        formattedText = `**${formattedText}**`;
      }
      if (activeFormats.has('italic')) {
        formattedText = `*${formattedText}*`;
      }
      if (activeFormats.has('underline')) {
        formattedText = `<u>${formattedText}</u>`;
      }
      
      newText = prevContent + formattedText;
    }
    
    setContent(newText);
    onUpdate(block.id, { content: newText });
  };

  const toggleFormatMode = (format: string) => {
    setActiveFormats(prev => {
      const newFormats = new Set(prev);
      if (newFormats.has(format)) {
        newFormats.delete(format);
      } else {
        newFormats.add(format);
      }
      return newFormats;
    });
  };

  const handleBlockStylingChange = (styling: BlockStyling) => {
    onUpdate(block.id, {
      settings: { styling }
    });
  };

  const getBlockStyling = (): BlockStyling => {
    return block.settings?.styling || {};
  };

  const getBlockContainerStyle = () => {
    const styling = getBlockStyling();
    return {
      fontSize: styling.fontSize ? `${styling.fontSize}px` : undefined,
      fontFamily: styling.fontFamily || undefined,
      color: styling.textColor || undefined,
      backgroundColor: styling.backgroundColor || undefined,
      borderColor: styling.borderColor || undefined,
      borderWidth: styling.borderWidth ? `${styling.borderWidth}px` : undefined,
      borderRadius: styling.borderRadius ? `${styling.borderRadius}px` : undefined,
      padding: styling.padding ? `${styling.padding}px` : undefined,
      borderStyle: styling.borderWidth && styling.borderWidth > 0 ? 'solid' : undefined,
    };
  };

  const getFilteredBlockTypes = () => {
    const allTypes = Object.values(BlockType);
    if (!searchQuery.trim()) return allTypes;
    
    return allTypes.filter(type => {
      const label = getBlockLabel(type).toLowerCase();
      return label.includes(searchQuery.toLowerCase());
    });
  };

  const handleTypeChange = (newType: BlockType) => {
    onUpdate(block.id, { type: newType });
    setShowMenu(false);
    setSearchQuery('');
    // Focus the input after changing type
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  };

  const renderMath = (latex: string) => {
    try {
      return katex.renderToString(latex, { throwOnError: false, displayMode: true });
    } catch {
      return latex;
    }
  };

  const renderMarkdown = (text: string) => {
    let html = text;
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Strikethrough
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
    // Inline code
    html = html.replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>');
    // Links
    html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-blue-600 underline">$1</a>');
    
    return html;
  };

  const getBlockIcon = () => {
    switch (block.type) {
      case BlockType.HEADING1:
        return <span className="text-xl font-bold">H1</span>;
      case BlockType.HEADING2:
        return <span className="text-lg font-bold">H2</span>;
      case BlockType.HEADING3:
        return <span className="text-base font-bold">H3</span>;
      case BlockType.BULLETED_LIST:
        return <span>•</span>;
      case BlockType.NUMBERED_LIST:
        return <span>1.</span>;
      case BlockType.TODO:
        return <span>☐</span>;
      case BlockType.CODE:
        return <span>{'</>'}</span>;
      case BlockType.QUOTE:
        return <span>"</span>;
      case BlockType.MATH:
        return <span>∑</span>;
      case BlockType.DIVIDER:
        return <span>—</span>;
      case BlockType.IMAGE:
        return <span>🖼️</span>;
      case BlockType.VIDEO:
        return <span>🎥</span>;
      case BlockType.GRID:
        return <span>📊</span>;
      default:
        return <span>¶</span>;
    }
  };

  const getBlockLabel = (type: BlockType) => {
    switch (type) {
      case BlockType.HEADING1:
        return 'Heading 1';
      case BlockType.HEADING2:
        return 'Heading 2';
      case BlockType.HEADING3:
        return 'Heading 3';
      case BlockType.BULLETED_LIST:
        return 'Bulleted List';
      case BlockType.NUMBERED_LIST:
        return 'Numbered List';
      case BlockType.TODO:
        return 'To-do';
      case BlockType.CODE:
        return 'Code';
      case BlockType.QUOTE:
        return 'Quote';
      case BlockType.MATH:
        return 'Math (KaTeX)';
      case BlockType.DIVIDER:
        return 'Divider';
      case BlockType.IMAGE:
        return 'Image';
      case BlockType.VIDEO:
        return 'Video';
      case BlockType.GRID:
        return 'Grid Layout';
      default:
        return 'Paragraph';
    }
  };

  const renderInput = () => {
    const baseClasses = 'w-full bg-transparent border-none outline-none resize-none text-black';
    const cellMarginStyle = {
      marginBottom: `${globalSettings.cellMarginBottom}px`
    };

    switch (block.type) {
      case BlockType.DIVIDER:
        return (
          <div className="py-4" style={cellMarginStyle}>
            <hr className="border-t-2 border-gray-300" />
          </div>
        );
      
      case BlockType.IMAGE:
        return (
          <div className="space-y-2" style={cellMarginStyle}>
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={block.metadata?.url || ''}
              onChange={(e) => onUpdate(block.id, { 
                metadata: { ...block.metadata, url: e.target.value } 
              })}
              onKeyDown={handleKeyDown}
              onFocus={() => onFocus(block.id)}
              placeholder="Image URL"
              className={`${baseClasses} text-sm`}
            />
            {block.metadata?.url && (
              <img 
                src={block.metadata.url} 
                alt={block.metadata?.alt || 'Image'} 
                className="max-w-full rounded-lg"
              />
            )}
          </div>
        );
      
      case BlockType.GRID:
        // Convert gridCells format from Record<string, string[]> to Record<string, {blockId?: string}>
        const gridCells = block.metadata?.gridCells || {};
        const cells: Record<string, { blockId?: string }> = {};
        
        Object.keys(gridCells).forEach(cellKey => {
          const blockIds = gridCells[cellKey];
          if (blockIds && blockIds.length > 0) {
            cells[cellKey] = { blockId: blockIds[0] }; // Take the first block ID
          }
        });
        
        return (
          <div style={cellMarginStyle}>
            <GridBlock
              rows={block.metadata?.gridRows || 2}
              cols={block.metadata?.gridCols || 2}
              cells={cells}
              allBlocks={allBlocks}
              onUpdateGrid={(rows, cols) => {
                onUpdate(block.id, {
                  metadata: { ...block.metadata, gridRows: rows, gridCols: cols }
                });
              }}
              onCellDrop={(cellKey: string, blockId: string) => {
                const updatedGridCells = { ...block.metadata?.gridCells };
                updatedGridCells[cellKey] = [blockId];
                onUpdate(block.id, {
                  metadata: { ...block.metadata, gridCells: updatedGridCells }
                });
              }}
              onCellRemove={(cellKey: string) => {
                const updatedGridCells = { ...block.metadata?.gridCells };
                delete updatedGridCells[cellKey];
                onUpdate(block.id, {
                  metadata: { ...block.metadata, gridCells: updatedGridCells }
                });
              }}
              onCreateBlock={(cellKey: string, blockType: BlockType) => {
                // Create a new block and add it to the grid cell
                const newBlockId = onCreateBlock(blockType);
                const updatedGridCells = { ...block.metadata?.gridCells };
                updatedGridCells[cellKey] = [newBlockId];
                onUpdate(block.id, {
                  metadata: { ...block.metadata, gridCells: updatedGridCells }
                });
              }}
              onUpdateBlock={onUpdate}
              onDeleteBlock={onDelete}
              onFocusBlock={onFocus}
              activeBlockId={isActive ? block.id : null}
              isActive={isActive}
              onFocus={() => onFocus(block.id)}
              BlockComponentRenderer={BlockComponent}
            />
          </div>
        );

      case BlockType.VIDEO:
        return (
          <div className="space-y-2" style={cellMarginStyle}>
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={block.metadata?.url || ''}
              onChange={(e) => onUpdate(block.id, { 
                metadata: { ...block.metadata, url: e.target.value } 
              })}
              onKeyDown={handleKeyDown}
              onFocus={() => onFocus(block.id)}
              placeholder="Video URL (YouTube, Vimeo, etc.)"
              className={`${baseClasses} text-sm`}
            />
            {block.metadata?.url && (
              <div className="aspect-video">
                <iframe
                  src={block.metadata.url}
                  className="w-full h-full rounded-lg"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        );

      case BlockType.HEADING1:
        return (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              onFocus(block.id);
              setShowFormatting(true);
            }}
            onBlur={() => setTimeout(() => setShowFormatting(false), 200)}
            placeholder="Heading 1"
            className={`${baseClasses} text-4xl font-bold py-2`}
            style={{ marginBottom: `${globalSettings.headingMargins.h1}px` }}
            rows={1}
          />
        );
      case BlockType.HEADING2:
        return (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              onFocus(block.id);
              setShowFormatting(true);
            }}
            onBlur={() => setTimeout(() => setShowFormatting(false), 200)}
            placeholder="Heading 2"
            className={`${baseClasses} text-3xl font-bold py-2`}
            style={{ marginBottom: `${globalSettings.headingMargins.h2}px` }}
            rows={1}
          />
        );
      case BlockType.HEADING3:
        return (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              onFocus(block.id);
              setShowFormatting(true);
            }}
            onBlur={() => setTimeout(() => setShowFormatting(false), 200)}
            placeholder="Heading 3"
            className={`${baseClasses} text-2xl font-bold py-2`}
            style={{ marginBottom: `${globalSettings.headingMargins.h3}px` }}
            rows={1}
          />
        );
      case BlockType.CODE:
        return (
          <div style={cellMarginStyle}>
            {isActive ? (
              <LiveCodeEditor
                value={content}
                onChange={handleChange}
                language={block.metadata?.language || 'text'}
                placeholder="Enter your code here..."
                onLanguageChange={(language) => {
                  onUpdate(block.id, {
                    metadata: { ...block.metadata, language }
                  });
                }}
              />
            ) : (
              <CodeBlockRenderer
                content={content}
                language={block.metadata?.language || 'text'}
                className="cursor-pointer"
                onClick={() => onFocus(block.id)}
                onLanguageChange={(language) => {
                  onUpdate(block.id, {
                    metadata: { ...block.metadata, language }
                  });
                }}
              />
            )}
          </div>
        );
      case BlockType.QUOTE:
        return (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              onFocus(block.id);
              setShowFormatting(true);
            }}
            onBlur={() => setTimeout(() => setShowFormatting(false), 200)}
            placeholder="Quote"
            className={`${baseClasses} border-l-4 border-gray-300 pl-4 italic text-gray-700`}
            style={cellMarginStyle}
            rows={Math.max(1, content.split('\n').length)}
          />
        );
      case BlockType.MATH:
        return (
          <div style={cellMarginStyle}>
            {isMathEditing ? (
              <textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                value={content}
                onChange={(e) => handleChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  setIsMathEditing(false);
                  onFocus(block.id);
                }}
                placeholder="LaTeX math equation (e.g., E = mc^2)"
                className={`${baseClasses} font-mono text-sm`}
                rows={Math.max(1, content.split('\n').length)}
                autoFocus
              />
            ) : (
              <div
                className="p-3 bg-gray-50 rounded overflow-x-auto katex-container cursor-pointer"
                onDoubleClick={() => {
                  setIsMathEditing(true);
                  setTimeout(() => {
                    if (inputRef.current) {
                      inputRef.current.focus();
                      inputRef.current.select();
                    }
                  }, 0);
                }}
                dangerouslySetInnerHTML={{ __html: content ? renderMath(content) : '<span class="text-gray-400 italic">Double-click to add LaTeX equation</span>' }}
              />
            )}
            <style dangerouslySetInnerHTML={{__html: `
              .katex-container .katex {
                color: #000000 !important;
              }
              .katex-container .katex * {
                color: #000000 !important;
              }
            `}} />
          </div>
        );
      case BlockType.TODO:
        return (
          <div className="flex items-start gap-2" style={cellMarginStyle}>
            <input
              type="checkbox"
              checked={block.metadata?.checked || false}
              onChange={(e) =>
                onUpdate(block.id, {
                  metadata: { ...block.metadata, checked: e.target.checked },
                })
              }
              className="mt-1.5 w-4 h-4 cursor-pointer"
            />
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={content}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                onFocus(block.id);
                setShowFormatting(true);
              }}
              onBlur={() => setTimeout(() => setShowFormatting(false), 200)}
              placeholder="To-do"
              className={`${baseClasses} flex-1 ${
                block.metadata?.checked ? 'line-through text-gray-500' : ''
              }`}
              rows={Math.max(1, content.split('\n').length)}
            />
          </div>
        );
      case BlockType.BULLETED_LIST:
        return (
          <div className="flex items-start gap-2" style={cellMarginStyle}>
            <span className="text-xl mt-0.5 text-black">•</span>
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={content}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                onFocus(block.id);
                setShowFormatting(true);
              }}
              onBlur={() => setTimeout(() => setShowFormatting(false), 200)}
              placeholder="List"
              className={`${baseClasses} flex-1`}
              rows={Math.max(1, content.split('\n').length)}
            />
          </div>
        );
      case BlockType.NUMBERED_LIST:
        return (
          <div className="flex items-start gap-2" style={cellMarginStyle}>
            <span className="mt-0.5 text-black">1.</span>
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={content}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                onFocus(block.id);
                setShowFormatting(true);
              }}
              onBlur={() => setTimeout(() => setShowFormatting(false), 200)}
              placeholder="List"
              className={`${baseClasses} flex-1`}
              rows={Math.max(1, content.split('\n').length)}
            />
          </div>
        );
      default:
        return (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              onFocus(block.id);
              setShowFormatting(true);
            }}
            onBlur={() => setTimeout(() => setShowFormatting(false), 200)}
            placeholder="Type '/' for commands"
            className={`${baseClasses} text-base`}
            style={cellMarginStyle}
            rows={Math.max(1, content.split('\n').length)}
          />
        );
    }
  };

  return (
    <div 
      className={`relative group ${isDragging ? 'opacity-50' : ''} ${isDragOver ? 'border-t-2 border-blue-500' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-start gap-1">
        {/* Drag handle button on the left */}
        <button
          draggable
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onClick={(e) => {
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              e.stopPropagation();
              if (e.shiftKey) {
                // Ctrl+Shift+Click creates cell above
                onAddAbove(block.id);
              } else {
                // Ctrl+Click creates cell below
                onAddBelow(block.id);
              }
            }
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity mt-2 p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600 flex-shrink-0 cursor-grab active:cursor-grabbing"
          title="Drag to reorder | Ctrl+Click: add below | Ctrl+Shift+Click: add above"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <circle cx="6" cy="5" r="1.5" />
            <circle cx="14" cy="5" r="1.5" />
            <circle cx="6" cy="10" r="1.5" />
            <circle cx="14" cy="10" r="1.5" />
            <circle cx="6" cy="15" r="1.5" />
            <circle cx="14" cy="15" r="1.5" />
          </svg>
        </button>

        <div
          className={`pt-0 pb-1 px-2 rounded transition-colors flex-1 ${
            isActive ? '' : ''
          }`}
          style={getBlockContainerStyle()}
          onClick={handleBlockClick}
        >
          <div className="flex items-start gap-2">
            <div className="flex-1">{renderInput()}</div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowBlockSettings(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 p-1 hover:bg-gray-200 rounded text-gray-600 flex-shrink-0"
                title="Block settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 p-1 hover:bg-gray-200 rounded text-gray-600 flex-shrink-0"
                title="Block menu"
              >
                {getBlockIcon()}
              </button>
            </div>
          </div>

        {showMenu && (
          <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-64">
            <div className="p-2">
              {/* Search Input */}
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedMenuIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search block types..."
                className="w-full px-3 py-2 mb-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 text-black"
              />
              
              <div className="max-h-80 overflow-y-auto menu-container">
                <div className="text-xs text-gray-500 uppercase tracking-wide px-2 py-1">
                  Turn into
                </div>
                {getFilteredBlockTypes().map((type, index) => (
                  <button
                    key={type}
                    ref={index === 0 ? firstMenuItemRef : null}
                    data-index={index}
                    onClick={() => handleTypeChange(type)}
                    className={`w-full text-left px-3 py-2 rounded flex items-center gap-3 text-sm focus:bg-blue-50 focus:outline-none ${
                      index === selectedMenuIndex ? 'bg-blue-50' : 'hover:bg-gray-100'
                    }`}
                  >
                    <span className="w-6 flex justify-center">{getBlockIcon()}</span>
                    <span className="text-gray-900">{getBlockLabel(type)}</span>
                  </button>
                ))}
                {getFilteredBlockTypes().length === 0 && (
                  <div className="px-3 py-4 text-center text-gray-500 text-sm">
                    No blocks found
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        </div>

        {/* Formatting Toolbar - below the cell border */}
        {isActive && showFormatting && ![BlockType.CODE, BlockType.DIVIDER, BlockType.IMAGE, BlockType.VIDEO, BlockType.MATH].includes(block.type) && (
          <div className="mt-1 mr-8 flex justify-end">
            <TextFormattingToolbar 
              onFormat={toggleFormatMode} 
              show={true} 
              activeFormats={activeFormats}
            />
          </div>
        )}

        {/* Block Settings Panel */}
        <BlockSettingsPanel
          isOpen={showBlockSettings}
          onClose={() => setShowBlockSettings(false)}
          currentStyling={getBlockStyling()}
          onStylingChange={handleBlockStylingChange}
          blockType={block.type}
        />
      </div>
    </div>
  );
};

export default BlockComponent;
