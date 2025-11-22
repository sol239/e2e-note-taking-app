import React, { useState } from 'react';
import { BlockStyling, defaultBlockStyling } from '../models/Settings';
import { Type, Palette, BoxSelect, Maximize, X, RotateCcw } from 'lucide-react';

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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-100" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-900">
            {blockType.charAt(0).toUpperCase() + blockType.slice(1)} Block Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Font Settings */}
          <section>
            <div className="flex items-center gap-2 mb-4 text-gray-900">
                <Type size={18} className="text-gray-500" />
                <h3 className="font-medium">Font</h3>
            </div>
            <div className="pl-7 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Font Size</label>
                <div className="relative">
                  <input
                    type="number"
                    value={tempStyling.fontSize || ''}
                    onChange={(e) => handleChange('fontSize', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all pr-8"
                    placeholder="Default"
                    min="8"
                    max="72"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">px</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Font Family</label>
                <select
                  value={tempStyling.fontFamily || ''}
                  onChange={(e) => handleChange('fontFamily', e.target.value || undefined)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                >
                  {fontFamilies.map((font) => (
                    <option key={font.value} value={font.value}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <div className="h-px bg-gray-100" />

          {/* Colors */}
          <section>
            <div className="flex items-center gap-2 mb-4 text-gray-900">
                <Palette size={18} className="text-gray-500" />
                <h3 className="font-medium">Colors</h3>
            </div>
            <div className="pl-7 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Text Color</label>
                <div className="flex items-center gap-2">
                  <div className="relative w-10 h-10 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                    <input
                        type="color"
                        value={tempStyling.textColor || '#000000'}
                        onChange={(e) => handleChange('textColor', e.target.value)}
                        className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer p-0 border-0"
                    />
                  </div>
                  <input
                    type="text"
                    value={tempStyling.textColor || '#000000'}
                    onChange={(e) => handleChange('textColor', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="#000000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Background</label>
                <div className="flex items-center gap-2">
                  <div className="relative w-10 h-10 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                    <input
                        type="color"
                        value={tempStyling.backgroundColor || '#ffffff'}
                        onChange={(e) => handleChange('backgroundColor', e.target.value)}
                        className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer p-0 border-0"
                    />
                  </div>
                  <input
                    type="text"
                    value={tempStyling.backgroundColor || 'transparent'}
                    onChange={(e) => handleChange('backgroundColor', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="transparent"
                  />
                </div>
              </div>
            </div>
          </section>

          <div className="h-px bg-gray-100" />

          {/* Border Settings */}
          <section>
            <div className="flex items-center gap-2 mb-4 text-gray-900">
                <BoxSelect size={18} className="text-gray-500" />
                <h3 className="font-medium">Border</h3>
            </div>
            <div className="pl-7 space-y-4">
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Border Color</label>
                    <div className="flex items-center gap-2">
                        <div className="relative w-10 h-10 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                            <input
                                type="color"
                                value={tempStyling.borderColor || '#000000'}
                                onChange={(e) => handleChange('borderColor', e.target.value)}
                                className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer p-0 border-0"
                            />
                        </div>
                        <input
                            type="text"
                            value={tempStyling.borderColor || 'transparent'}
                            onChange={(e) => handleChange('borderColor', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="transparent"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Width</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={tempStyling.borderWidth || 0}
                                onChange={(e) => handleChange('borderWidth', parseInt(e.target.value) || 0)}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all pr-8"
                                min="0"
                                max="10"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">px</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Radius</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={tempStyling.borderRadius || 0}
                                onChange={(e) => handleChange('borderRadius', parseInt(e.target.value) || 0)}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all pr-8"
                                min="0"
                                max="50"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">px</span>
                        </div>
                    </div>
                </div>
            </div>
          </section>

          <div className="h-px bg-gray-100" />

          {/* Padding */}
          <section>
            <div className="flex items-center gap-2 mb-4 text-gray-900">
                <Maximize size={18} className="text-gray-500" />
                <h3 className="font-medium">Spacing</h3>
            </div>
            <div className="pl-7">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Padding</label>
              <div className="relative">
                <input
                  type="number"
                  value={tempStyling.padding || 0}
                  onChange={(e) => handleChange('padding', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all pr-8"
                  min="0"
                  max="50"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">px</span>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center rounded-b-xl">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              <RotateCcw size={16} />
              Reset Block
            </button>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-200 transition-all"
              >
                Apply
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};