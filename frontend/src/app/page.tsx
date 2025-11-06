'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { GlobalSettingsProvider } from '@/contexts/GlobalSettingsContext';
import { GlobalSettingsPanel } from '@/components/GlobalSettingsPanel';
import { Block, BlockType } from '@/models/Block';
import { Settings } from 'lucide-react';

const NoteEditor = dynamic(() => import('@/components/NoteEditor'), { ssr: false });

export default function Home() {
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);
  const [initialBlocks, setInitialBlocks] = useState<Block[] | undefined>(undefined);
  const [key, setKey] = useState(0);
  const [title, setTitle] = useState('Untitled');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const createDemoNote = () => {
    const demoBlocks: Block[] = [
      new Block('demo-1', BlockType.HEADING1, 'Welcome to the Demo Note! 🎉'),
      new Block('demo-2', BlockType.PARAGRAPH, 'This demo showcases all available block types in this note-taking application. Try editing, dragging, or using Ctrl+Click to add new blocks!'),
      
      new Block('demo-3', BlockType.HEADING2, 'Headings'),
      new Block('demo-4', BlockType.HEADING1, 'Heading 1 - Largest'),
      new Block('demo-5', BlockType.HEADING2, 'Heading 2 - Large'),
      new Block('demo-6', BlockType.HEADING3, 'Heading 3 - Medium'),
      
      new Block('demo-7', BlockType.HEADING2, 'Text Formatting'),
      new Block('demo-8', BlockType.PARAGRAPH, 'Regular paragraph with **bold text**, *italic text*, and __underlined text__. You can also use Ctrl+B, Ctrl+I, and Ctrl+U for formatting!'),
      
      new Block('demo-9', BlockType.HEADING2, 'Lists'),
      new Block('demo-10', BlockType.BULLETED_LIST, 'First bullet point'),
      new Block('demo-11', BlockType.BULLETED_LIST, 'Second bullet point'),
      new Block('demo-12', BlockType.BULLETED_LIST, 'Third bullet point with **bold** formatting'),
      
      new Block('demo-13', BlockType.NUMBERED_LIST, 'First numbered item'),
      new Block('demo-14', BlockType.NUMBERED_LIST, 'Second numbered item'),
      new Block('demo-15', BlockType.NUMBERED_LIST, 'Third numbered item'),
      
      new Block('demo-16', BlockType.HEADING2, 'Todo Lists'),
      new Block('demo-17', BlockType.TODO, 'Unchecked todo item', { checked: false }),
      new Block('demo-18', BlockType.TODO, 'Checked todo item', { checked: true }),
      new Block('demo-19', BlockType.TODO, 'Another task to complete', { checked: false }),
      
      new Block('demo-20', BlockType.HEADING2, 'Code Blocks'),
      new Block('demo-21', BlockType.PARAGRAPH, 'Click the language selector in the code block header to change syntax highlighting:'),
      new Block('demo-22', BlockType.CODE, 
`function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10));`, { language: 'javascript' }),
      
      new Block('demo-23', BlockType.CODE, 
`def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)

print(quicksort([3,6,8,10,1,2,1]))`, { language: 'python' }),
      
      new Block('demo-24', BlockType.HEADING2, 'Quotes'),
      new Block('demo-25', BlockType.QUOTE, 'The only way to do great work is to love what you do. - Steve Jobs'),
      new Block('demo-26', BlockType.QUOTE, 'Innovation distinguishes between a leader and a follower.'),
      
      new Block('demo-27', BlockType.HEADING2, 'Math Equations'),
      new Block('demo-28', BlockType.PARAGRAPH, 'LaTeX math equations are rendered beautifully:'),
      new Block('demo-29', BlockType.MATH, 'E = mc^2'),
      new Block('demo-30', BlockType.MATH, '\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}'),
      new Block('demo-31', BlockType.MATH, '\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}'),
      
      new Block('demo-32', BlockType.HEADING2, 'Grid Layouts'),
      new Block('demo-33', BlockType.PARAGRAPH, 'Create organized layouts with grid blocks. Click the "+" in empty cells to add content:'),
      
      // Grid content blocks
      new Block('demo-grid-1', BlockType.HEADING3, 'Project Overview'),
      new Block('demo-grid-2', BlockType.PARAGRAPH, 'This is a sample grid layout showing how you can organize content in a structured way.'),
      new Block('demo-grid-3', BlockType.TODO, 'Complete project setup', { checked: true }),
      new Block('demo-grid-4', BlockType.CODE, 'console.log("Hello from grid!");', { language: 'javascript' }),
      
      new Block('demo-34', BlockType.GRID, '', {
        gridRows: 2,
        gridCols: 3,
        gridCells: {
          '0-0': ['demo-grid-1'],
          '0-1': ['demo-grid-2'],
          '1-0': ['demo-grid-3'],
          '1-2': ['demo-grid-4']
        }
      }),
      
      new Block('demo-35', BlockType.HEADING2, 'Dividers'),
      new Block('demo-36', BlockType.PARAGRAPH, 'Use dividers to separate sections:'),
      new Block('demo-37', BlockType.DIVIDER, ''),
      
      new Block('demo-38', BlockType.HEADING2, 'Tips & Shortcuts'),
      new Block('demo-39', BlockType.BULLETED_LIST, 'Type "/" in an empty block to see all block types'),
      new Block('demo-40', BlockType.BULLETED_LIST, 'Ctrl+Click on a block to create a new one below'),
      new Block('demo-41', BlockType.BULLETED_LIST, 'Ctrl+Shift+Click to create a new block above'),
      new Block('demo-42', BlockType.BULLETED_LIST, 'Drag the ⋮⋮ handle to reorder blocks'),
      new Block('demo-43', BlockType.BULLETED_LIST, 'Press Enter to create a new block below'),
      new Block('demo-44', BlockType.BULLETED_LIST, 'Backspace in an empty block to delete it'),
      new Block('demo-45', BlockType.BULLETED_LIST, 'Ctrl+Arrow keys to move blocks up/down'),
      
      new Block('demo-46', BlockType.DIVIDER, ''),
      new Block('demo-47', BlockType.PARAGRAPH, 'Happy note-taking! 📝'),
    ];

    setInitialBlocks(demoBlocks);
    setKey(prev => prev + 1); // Force re-render of NoteEditor
  };

  const handleTitleClick = () => {
    setIsEditingTitle(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditingTitle(false);
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
    }
  };

  return (
    <GlobalSettingsProvider>
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-5xl">
          <div className="border-b border-gray-200 px-8 py-6 flex justify-between items-center">
            {isEditingTitle ? (
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                className="text-2xl font-semibold text-gray-900 bg-transparent border-none outline-none focus:ring-0"
                autoFocus
                onFocus={(e) => e.target.select()}
              />
            ) : (
              <h1 
                className="text-2xl font-semibold text-gray-900 cursor-text hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                onClick={handleTitleClick}
                title="Click to edit title"
              >
                {title || 'Untitled'}
              </h1>
            )}
            <div className="flex gap-2">
              <button
                onClick={createDemoNote}
                className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                title="Create a demo note with all block types"
              >
                📋 Create Demo Note
              </button>
              <button
                onClick={() => setShowGlobalSettings(true)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2"
                title="Global Settings"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>
          </div>
          <div className="px-8">
            <NoteEditor key={key} initialBlocks={initialBlocks} />
          </div>
        </div>
      </div>

      <GlobalSettingsPanel
        isOpen={showGlobalSettings}
        onClose={() => setShowGlobalSettings(false)}
      />
    </GlobalSettingsProvider>
  );
}
