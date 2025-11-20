"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, Trash2, Download } from 'lucide-react';
import ExportModal from './ExportModal';

interface NotebookMenuProps {
  notebookId: string;
  isOpen: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

export default function NotebookMenu({ notebookId, isOpen, onToggle, onDelete }: NotebookMenuProps) {
  const [showExportModal, setShowExportModal] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.top - 4, // Position above the button with some margin
        left: rect.right - 128, // Align right edge, menu width is 128px (w-32)
      });
    } else {
      setMenuPosition(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        onToggle();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onToggle]);

  const handleExport = () => {
    onToggle(); // Close the menu
    setShowExportModal(true);
  };

  return (
    <>
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={onToggle}
          className="p-1 hover:bg-gray-200 rounded cursor-pointer opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
      {isOpen && menuPosition && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          className="fixed w-32 bg-white border border-gray-200 rounded-md shadow-lg z-[9998]"
          style={{ top: menuPosition.top, left: menuPosition.left }}
        >
          <button
            onClick={() => {
              onDelete();
              onToggle();
            }}
            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
          <button
            onClick={handleExport}
            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>,
        document.body
      )}
      {showExportModal && (
        <ExportModal
          notebookId={notebookId}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </>
  );
}