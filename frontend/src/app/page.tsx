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
      new Block('demo-34', BlockType.HEADING1, 'New Zealand'),
      new Block('demo-36', BlockType.PARAGRAPH, 'A land of breathtaking landscapes and rich Maori culture.'),
      // Grid with images
      new Block('demo-35', BlockType.GRID, '', {
        gridRows: 2,
        gridCols: 2,
        gridCells: {
          '0-0': ['/assets/img/demo/zaeland-1.jpg'],
          '0-1': ['/assets/img/demo/zaeland-2.jpg'],
          '1-0': ['/assets/img/demo/zaeland-3.jpg'],
          '1-1': ['/assets/img/demo/zaeland-4.jpg'],
        }
      }),
      new Block('demo-37', BlockType.HEADING2, 'The Chainsmokers'),
      new Block('demo-39', BlockType.PARAGRAPH, 'The Chainsmokers are an American electronic DJ and production duo consisting of Alex Pall and Drew Taggart. They achieved breakthrough success in 2014 with their song “#Selfie”. They have since released several successful singles, including “Roses”, “Don’t Let Me Down”, and “Closer”, and have won a Grammy Award. Their debut album, “Memories...Do Not Open”, was released in 2017. They have since released four more albums: “Sick Boy” (2018), “World War Joy” (2019), “So Far So Good” (2022), and “Summertime Friends” (2023).'),
      new Block('demo-38', BlockType.AUDIO, 'The Chainsmokers - Closer', { url: '/assets/audio/demo/chainsmokers-closer.mp3' }),
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
