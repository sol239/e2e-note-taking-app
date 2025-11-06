'use client';

import React, { useState, useRef } from 'react';
import { Block } from '@/models/Block';

interface TextFormattingToolbarProps {
  onFormat: (format: string) => void;
  show: boolean;
  activeFormats?: Set<string>;
}

const TextFormattingToolbar: React.FC<TextFormattingToolbarProps> = ({ onFormat, show, activeFormats = new Set() }) => {
  if (!show) return null;

  return (
    <div className="flex items-center gap-1 p-1 bg-white border border-gray-200 rounded-lg shadow-lg">
      <button
        onClick={() => onFormat('bold')}
        className={`p-2 hover:bg-gray-100 rounded transition-colors text-black ${
          activeFormats.has('bold') ? 'bg-blue-100' : ''
        }`}
        title="Bold (Ctrl+B)"
      >
        <span className="font-bold">B</span>
      </button>
      <button
        onClick={() => onFormat('italic')}
        className={`p-2 hover:bg-gray-100 rounded transition-colors text-black ${
          activeFormats.has('italic') ? 'bg-blue-100' : ''
        }`}
        title="Italic (Ctrl+I)"
      >
        <span className="italic">I</span>
      </button>
      <button
        onClick={() => onFormat('underline')}
        className={`p-2 hover:bg-gray-100 rounded transition-colors text-black ${
          activeFormats.has('underline') ? 'bg-blue-100' : ''
        }`}
        title="Underline (Ctrl+U)"
      >
        <span className="underline">U</span>
      </button>
      <button
        onClick={() => onFormat('strikethrough')}
        className="p-2 hover:bg-gray-100 rounded transition-colors text-black"
        title="Strikethrough"
      >
        <span className="line-through">S</span>
      </button>
      <div className="w-px h-6 bg-gray-300 mx-1"></div>
      <button
        onClick={() => onFormat('code')}
        className="p-2 hover:bg-gray-100 rounded transition-colors font-mono text-sm text-black"
        title="Inline Code"
      >
        {'</>'}
      </button>
      <button
        onClick={() => onFormat('link')}
        className="p-2 hover:bg-gray-100 rounded transition-colors text-black"
        title="Link"
      >
        🔗
      </button>
    </div>
  );
};

export default TextFormattingToolbar;
