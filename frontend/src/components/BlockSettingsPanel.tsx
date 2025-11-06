import React, { useState } from 'react';
import { BlockStyling, defaultBlockStyling } from '../models/Settings';

interface BlockSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentStyling: BlockStyling;
  onStylingChange: (styling: BlockStyling) => void;
  blockType: string;
}

export const BlockSettingsPanel: React.FC<BlockSettingsPanelProps> = ({
  isOpen,
  onClose,
  currentStyling,
  onStylingChange,
  blockType,
}) => {
  const [tempStyling, setTempStyling] = useState<BlockStyling>(currentStyling);

  if (!isOpen) return null;

  const handleChange = (key: keyof BlockStyling, value: any) => {
    const newStyling = { ...tempStyling, [key]: value };
    setTempStyling(newStyling);
  };

  const handleSave = () => {
    onStylingChange(tempStyling);
    onClose();
  };

  const handleReset = () => {
    setTempStyling(defaultBlockStyling);
  };

  const fontFamilies = [
    { value: '', label: 'Default' },
    { value: 'Inter, system-ui, sans-serif', label: 'Inter' },
    { value: 'Georgia, serif', label: 'Georgia' },
    { value: "'Times New Roman', serif", label: 'Times New Roman' },
    { value: 'Arial, sans-serif', label: 'Arial' },
    { value: 'Verdana, sans-serif', label: 'Verdana' },
    { value: "'Courier New', monospace", label: 'Courier New' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {blockType.charAt(0).toUpperCase() + blockType.slice(1)} Block Settings
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Font Settings */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Font</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={tempStyling.fontSize || ''}
                    onChange={(e) => handleChange('fontSize', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm text-gray-900"
                    placeholder="Default"
                    min="8"
                    max="72"
                  />
                  <span className="text-xs text-gray-500">px</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
                <select
                  value={tempStyling.fontFamily || ''}
                  onChange={(e) => handleChange('fontFamily', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900"
                >
                  {fontFamilies.map((font) => (
                    <option key={font.value} value={font.value}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Colors</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={tempStyling.textColor || '#000000'}
                    onChange={(e) => handleChange('textColor', e.target.value)}
                    className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={tempStyling.textColor || '#000000'}
                    onChange={(e) => handleChange('textColor', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm font-mono text-gray-900"
                    placeholder="#000000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={tempStyling.backgroundColor || '#ffffff'}
                    onChange={(e) => handleChange('backgroundColor', e.target.value)}
                    className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={tempStyling.backgroundColor || 'transparent'}
                    onChange={(e) => handleChange('backgroundColor', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm font-mono text-gray-900"
                    placeholder="transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Border Settings */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Border</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Border Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={tempStyling.borderColor || '#000000'}
                    onChange={(e) => handleChange('borderColor', e.target.value)}
                    className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={tempStyling.borderColor || 'transparent'}
                    onChange={(e) => handleChange('borderColor', e.target.value)}
                    className="flex-1 px-2 py-2 border border-gray-300 rounded text-sm font-mono text-xs text-gray-900"
                    placeholder="transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Border Width</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={tempStyling.borderWidth || 0}
                    onChange={(e) => handleChange('borderWidth', parseInt(e.target.value) || 0)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm text-gray-900"
                    min="0"
                    max="10"
                  />
                  <span className="text-xs text-gray-500">px</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Border Radius</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={tempStyling.borderRadius || 0}
                    onChange={(e) => handleChange('borderRadius', parseInt(e.target.value) || 0)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm text-gray-900"
                    min="0"
                    max="50"
                  />
                  <span className="text-xs text-gray-500">px</span>
                </div>
              </div>
            </div>
          </div>

          {/* Padding */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Spacing</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Padding</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={tempStyling.padding || 0}
                  onChange={(e) => handleChange('padding', parseInt(e.target.value) || 0)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm text-gray-900"
                  min="0"
                  max="50"
                />
                <span className="text-xs text-gray-500">px</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t border-gray-200">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
            >
              Reset Block
            </button>
            <div className="space-x-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};