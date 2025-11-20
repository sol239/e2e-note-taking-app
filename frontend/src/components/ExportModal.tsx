"use client";

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Download } from 'lucide-react';

interface ExportModalProps {
  notebookId: string;
  onClose: () => void;
}

export default function ExportModal({ notebookId, onClose }: ExportModalProps) {
  const [exportFormat, setExportFormat] = useState<'html' | 'pdf' | 'markdown'>('html');

  const handleExport = () => {
    // TODO: Implement actual export logic
    console.log(`Exporting notebook ${notebookId} as ${exportFormat}`);
    onClose();
  };

  const modal = (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Export Notebook</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Export Format</label>
          <div className="space-y-2">
            <label className="flex items-center text-black">
              <input
                type="radio"
                name="exportFormat"
                value="html"
                checked={exportFormat === 'html'}
                onChange={(e) => setExportFormat(e.target.value as 'html')}
                className="mr-2"
              />
              HTML
            </label>
            <label className="flex items-center text-black">
              <input
                type="radio"
                name="exportFormat"
                value="pdf"
                checked={exportFormat === 'pdf'}
                onChange={(e) => setExportFormat(e.target.value as 'pdf')}
                className="mr-2"
              />
              PDF
            </label>
            <label className="flex items-center text-black">
              <input
                type="radio"
                name="exportFormat"
                value="markdown"
                checked={exportFormat === 'markdown'}
                onChange={(e) => setExportFormat(e.target.value as 'markdown')}
                className="mr-2"
              />
              Markdown
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modal, document.body);
}