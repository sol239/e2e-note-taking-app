import React from 'react';
import { useGlobalSettings } from '../contexts/GlobalSettingsContext';

interface GlobalSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSettingsPanel: React.FC<GlobalSettingsPanelProps> = ({ isOpen, onClose }) => {
  const { settings, updateHeadingMargin, updateSettings, resetToDefaults } = useGlobalSettings();

  if (!isOpen) return null;

  const handleHeadingMarginChange = (heading: keyof typeof settings.headingMargins, value: string) => {
    const margin = parseInt(value) || 0;
    updateHeadingMargin(heading, margin);
  };

  const handleDefaultFontSizeChange = (value: string) => {
    const fontSize = parseInt(value) || 16;
    updateSettings({ defaultFontSize: fontSize });
  };

  const handleDefaultFontFamilyChange = (value: string) => {
    updateSettings({ defaultFontFamily: value });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Notes Settings</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Heading Margins Section */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Heading Margins</h3>
            <div className="space-y-3">
              {Object.entries(settings.headingMargins).map(([heading, margin]) => (
                <div key={heading} className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 capitalize">
                    {heading.replace('h', 'H')} Margin Bottom:
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={margin}
                      onChange={(e) => handleHeadingMarginChange(heading as keyof typeof settings.headingMargins, e.target.value)}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center text-gray-900"
                      min="0"
                      max="100"
                    />
                    <span className="text-xs text-gray-500">px</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cell Margin Bottom */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Cell Spacing</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">All Cells Margin Bottom</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={settings.cellMarginBottom}
                  onChange={(e) => updateSettings({ cellMarginBottom: parseInt(e.target.value) || 0 })}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center text-gray-900"
                  min="0"
                  max="100"
                />
                <span className="text-xs text-gray-500">px</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Applies to all blocks except headings</p>
            </div>
          </div>

          {/* Default Font Settings */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Default Font Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Font Size:</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={settings.defaultFontSize}
                    onChange={(e) => handleDefaultFontSizeChange(e.target.value)}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center text-gray-900"
                    min="8"
                    max="72"
                  />
                  <span className="text-xs text-gray-500">px</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Font Family:</label>
                <select
                  value={settings.defaultFontFamily}
                  onChange={(e) => handleDefaultFontFamilyChange(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
                >
                  <option value="Inter, system-ui, sans-serif">Inter</option>
                  <option value="Georgia, serif">Georgia</option>
                  <option value="'Times New Roman', serif">Times New Roman</option>
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="Verdana, sans-serif">Verdana</option>
                  <option value="'Courier New', monospace">Courier New</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t border-gray-200">
            <button
              onClick={resetToDefaults}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
            >
              Reset to Defaults
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};