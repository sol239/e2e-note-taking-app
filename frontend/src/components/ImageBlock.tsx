'use client';

import React, { useState, useEffect } from 'react';
import { Block, IBlock } from '@/models/Block';
import { Image, Move } from 'lucide-react';

interface ImageBlockProps {
  block: Block;
  onUpdate: (id: string, updates: Partial<Block>) => void;
  cellMarginStyle: React.CSSProperties;
  onResizeStart: (e: React.MouseEvent) => void;
}

const ImageBlock: React.FC<ImageBlockProps> = ({
  block,
  onUpdate,
  cellMarginStyle,
  onResizeStart,
}) => {
  const [showImageLinkModal, setShowImageLinkModal] = useState(false);
  const [imageLinkUrl, setImageLinkUrl] = useState('');

  const hasImage = block.metadata?.url;

  // Handle clicking outside modal to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showImageLinkModal) {
        const modal = document.querySelector('.image-link-modal');
        if (modal && !modal.contains(event.target as Node)) {
          setShowImageLinkModal(false);
          setImageLinkUrl('');
        }
      }
    };

    if (showImageLinkModal) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showImageLinkModal]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showImageLinkModal && e.key === 'Escape') {
        setShowImageLinkModal(false);
        setImageLinkUrl('');
      }
    };

    if (showImageLinkModal) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showImageLinkModal]);

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
      {!hasImage ? (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
          onClick={() => {
            // Trigger file input click
            const fileInput = document.getElementById(`image-file-${block.id}`) as HTMLInputElement;
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
            if (files.length > 0 && files[0].type.startsWith('image/')) {
              handleFileUpload(files[0]);
            }
          }}
        >
          <div className="flex flex-col items-center gap-4">
            <Image className="w-16 h-16 text-gray-400" />
            <div className="text-gray-600">
              <div className="font-medium">Add an image</div>
              <div className="text-sm text-gray-500 mt-1">
                Drag & drop or click to upload
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const fileInput = document.getElementById(`image-file-${block.id}`) as HTMLInputElement;
                  fileInput?.click();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
              >
                Upload File
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowImageLinkModal(true);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm"
              >
                Insert Link
              </button>
            </div>
          </div>
          <input
            id={`image-file-${block.id}`}
            type="file"
            accept="image/*"
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
      {hasImage && block.metadata?.url && (
        <div className="relative group" onDragStart={(e) => e.preventDefault()}>
          <img
            src={block.metadata.url}
            alt={block.metadata?.alt || block.metadata?.filename || 'Image'}
            className="rounded-lg"
            draggable="false"
            onDragStart={(e) => e.preventDefault()}
            style={{
              width: (block.metadata as IBlock['metadata'])?.width || 'auto',
              height: (block.metadata as IBlock['metadata'])?.height || 'auto',
              maxWidth: '100%'
            }}
          />
          <button
            onMouseDown={onResizeStart}
            className="absolute bottom-0 left-0 w-6 h-6 bg-gray-800 hover:bg-gray-700 rounded-tl-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-se-resize"
            title="Resize image"
          >
            <Move className="w-3 h-3 text-white" />
          </button>
        </div>
      )}

      {/* Image Link Modal */}
      {showImageLinkModal && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
          <div className="image-link-modal bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold mb-4">Insert Image Link</h3>
            <input
              type="url"
              value={imageLinkUrl}
              onChange={(e) => setImageLinkUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowImageLinkModal(false);
                  setImageLinkUrl('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (imageLinkUrl.trim()) {
                    onUpdate(block.id, {
                      metadata: {
                        ...block.metadata,
                        url: imageLinkUrl.trim()
                      }
                    });
                  }
                  setShowImageLinkModal(false);
                  setImageLinkUrl('');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageBlock;