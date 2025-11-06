'use client';

import React from 'react';
import { Block, IBlock } from '@/models/Block';
import { Video, Move } from 'lucide-react';

interface VideoBlockProps {
  block: Block;
  onUpdate: (id: string, updates: Partial<Block>) => void;
  onFocus: (id: string) => void;
  cellMarginStyle: React.CSSProperties;
  onResizeStart: (e: React.MouseEvent) => void;
}

const VideoBlock: React.FC<VideoBlockProps> = ({
  block,
  onUpdate,
  onFocus,
  cellMarginStyle,
  onResizeStart,
}) => {
  const hasVideo = block.metadata?.url;

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
      {!hasVideo ? (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
          onClick={() => {
            // Trigger file input click
            const fileInput = document.getElementById(`video-file-${block.id}`) as HTMLInputElement;
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
            if (files.length > 0 && files[0].type.startsWith('video/')) {
              handleFileUpload(files[0]);
            }
          }}
        >
          <div className="flex flex-col items-center gap-4">
            <Video className="w-16 h-16 text-gray-400" />
            <div className="text-gray-600">
              <div className="font-medium">Add a video</div>
              <div className="text-sm text-gray-500 mt-1">
                Drag & drop or click to upload
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const fileInput = document.getElementById(`video-file-${block.id}`) as HTMLInputElement;
                  fileInput?.click();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
              >
                Upload File
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFocus(block.id);
                  // Focus the URL input
                  setTimeout(() => {
                    const urlInput = document.getElementById(`video-url-${block.id}`) as HTMLInputElement;
                    urlInput?.focus();
                  }, 0);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm"
              >
                Insert Link
              </button>
            </div>
          </div>
          <input
            id={`video-file-${block.id}`}
            type="file"
            accept="video/*"
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
      {hasVideo && block.metadata?.url && (
        <div className="relative group" onDragStart={(e) => e.preventDefault()}>
          <div
            className="aspect-video rounded-lg overflow-hidden"
            style={{
              width: (block.metadata as IBlock['metadata'])?.width || 'auto',
              height: (block.metadata as IBlock['metadata'])?.height || 'auto',
              maxWidth: '100%'
            }}
          >
            <iframe
              src={block.metadata.url}
              className="w-full h-full"
              allowFullScreen
              draggable="false"
              onDragStart={(e) => e.preventDefault()}
            />
          </div>
          <button
            onMouseDown={onResizeStart}
            className="absolute bottom-0 left-0 w-6 h-6 bg-gray-800 hover:bg-gray-700 rounded-tl-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-se-resize"
            title="Resize video"
          >
            <Move className="w-3 h-3 text-white" />
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoBlock;