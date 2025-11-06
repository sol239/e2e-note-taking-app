'use client';

import React, { useState, useEffect } from 'react';
import { Block, IBlock } from '@/models/Block';
import { Volume2 } from 'lucide-react';

interface AudioBlockProps {
  block: Block;
  onUpdate: (id: string, updates: Partial<Block>) => void;
  onFocus: (id: string) => void;
  cellMarginStyle: React.CSSProperties;
}

const AudioBlock: React.FC<AudioBlockProps> = ({
  block,
  onUpdate,
  onFocus,
  cellMarginStyle,
}) => {
  const [showAudioLinkModal, setShowAudioLinkModal] = useState(false);
  const [audioLinkUrl, setAudioLinkUrl] = useState('');

  const hasAudio = block.metadata?.url;

  // Handle clicking outside modal to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showAudioLinkModal) {
        const modal = document.querySelector('.audio-link-modal');
        if (modal && !modal.contains(event.target as Node)) {
          setShowAudioLinkModal(false);
          setAudioLinkUrl('');
        }
      }
    };

    if (showAudioLinkModal) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAudioLinkModal]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showAudioLinkModal && e.key === 'Escape') {
        setShowAudioLinkModal(false);
        setAudioLinkUrl('');
      }
    };

    if (showAudioLinkModal) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showAudioLinkModal]);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      onUpdate(block.id, {
        metadata: {
          ...block.metadata,
          url: base64,
          filename: file.name,
          uploaded: true
        }
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2" style={cellMarginStyle}>
      {!hasAudio ? (
        <div
          className="relative border-2 border-dashed border-indigo-300 rounded-xl p-8 text-center bg-gradient-to-br from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 transition-all duration-300 cursor-pointer group overflow-hidden"
          onClick={() => {
            // Trigger file input click
            const fileInput = document.getElementById(`audio-file-${block.id}`) as HTMLInputElement;
            fileInput?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDragLeave={(e) => {
            e.preventDefault();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('audio/')) {
              handleFileUpload(files[0]);
            }
          }}
        >
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 transform rotate-12 scale-150"></div>
          </div>

          <div className="relative flex flex-col items-center gap-6">
            {/* Animated icon */}
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <Volume2 className="w-10 h-10 text-white" />
              </div>
              {/* Pulse effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full animate-ping opacity-20"></div>
            </div>

            <div className="text-center">
              <div className="font-semibold text-gray-800 text-lg mb-2">Add Audio Content</div>
              <div className="text-sm text-gray-600 mb-4">
                Drag & drop your audio file or click to browse
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const fileInput = document.getElementById(`audio-file-${block.id}`) as HTMLInputElement;
                  fileInput?.click();
                }}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium"
              >
                📁 Upload File
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAudioLinkModal(true);
                }}
                className="px-6 py-3 bg-white text-gray-700 rounded-lg border-2 border-gray-200 hover:border-indigo-300 hover:bg-gray-50 transition-all duration-300 shadow-sm hover:shadow-md font-medium"
              >
                🔗 Insert Link
              </button>
            </div>

            <div className="text-xs text-gray-500 mt-2">
              Supports MP3, WAV, OGG, and more
            </div>
          </div>

          <input
            id={`audio-file-${block.id}`}
            type="file"
            accept="audio/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileUpload(file);
              }
            }}
            className="hidden"
          />
        </div>
      ) : null}
      {hasAudio && block.metadata?.url && (
        <audio
          controls
          className="w-full h-12 rounded-lg bg-white shadow-inner border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          style={{
            filter: 'drop-shadow(rgba(0, 0, 0, 0.1) 0px 2px 4px)'
          }}
          draggable="false"
        >
          <source src={block.metadata.url} type={block.metadata.uploaded ? undefined : 'audio/mpeg'} />
          Your browser does not support the audio element.
        </audio>
      )}

      {/* Audio Link Modal */}
      {showAudioLinkModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="audio-link-modal bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl border border-gray-200 transform animate-in fade-in-0 zoom-in-95 duration-300">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Volume2 className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Insert Audio Link</h3>
            </div>

            {/* Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Audio URL
              </label>
              <input
                type="url"
                value={audioLinkUrl}
                onChange={(e) => setAudioLinkUrl(e.target.value)}
                placeholder="https://example.com/audio.mp3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">
                Enter a direct link to an audio file (MP3, WAV, etc.)
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowAudioLinkModal(false);
                  setAudioLinkUrl('');
                }}
                className="px-6 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (audioLinkUrl.trim()) {
                    onUpdate(block.id, {
                      metadata: {
                        ...block.metadata,
                        url: audioLinkUrl.trim()
                      }
                    });
                  }
                  setShowAudioLinkModal(false);
                  setAudioLinkUrl('');
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!audioLinkUrl.trim()}
              >
                Insert Audio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioBlock;