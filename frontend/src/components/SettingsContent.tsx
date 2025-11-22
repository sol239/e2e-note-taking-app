"use client";

import React from 'react';
import { useGlobalSettings } from '../contexts/GlobalSettingsContext';
import { Block } from '../models/Block';
import UserSettings from './UserSettings';
import { Type, Layout, Settings2, ArrowLeft, RotateCcw } from 'lucide-react';
import Link from 'next/link';

export default function SettingsContent() {
  const { settings, updateHeadingMargin, updateSettings, resetToDefaults } = useGlobalSettings();

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
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
                <Link href="/notebooks" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            </div>
        </div>

        <div className="space-y-6">
            {/* User Settings Card */}
            <UserSettings />

            {/* Notes Settings Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Settings2 size={20} />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Editor Preferences</h2>
                    </div>
                    <button
                        onClick={resetToDefaults}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                        <RotateCcw size={14} />
                        Reset Defaults
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Typography Section */}
                    <section>
                        <div className="flex items-center gap-2 mb-4 text-gray-900">
                            <Type size={18} className="text-gray-500" />
                            <h3 className="font-medium">Typography</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-7">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
                                <select
                                    value={settings.defaultFontFamily}
                                    onChange={(e) => handleDefaultFontFamilyChange(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                >
                                    <option value="Inter, system-ui, sans-serif">Inter</option>
                                    <option value="Georgia, serif">Georgia</option>
                                    <option value="'Times New Roman', serif">Times New Roman</option>
                                    <option value="Arial, sans-serif">Arial</option>
                                    <option value="Verdana, sans-serif">Verdana</option>
                                    <option value="'Courier New', monospace">Courier New</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Base Font Size</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={settings.defaultFontSize}
                                        onChange={(e) => handleDefaultFontSizeChange(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all pr-8"
                                        min="8"
                                        max="72"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">px</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="h-px bg-gray-100" />

                    {/* Spacing Section */}
                    <section>
                        <div className="flex items-center gap-2 mb-4 text-gray-900">
                            <Layout size={18} className="text-gray-500" />
                            <h3 className="font-medium">Spacing & Layout</h3>
                        </div>
                        
                        <div className="pl-7 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">Heading Margins</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {Object.entries(settings.headingMargins)
                                        .filter(([heading]) => ['h1', 'h2', 'h3'].includes(heading))
                                        .map(([heading, margin]) => (
                                        <div key={heading} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                                                {heading}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={margin}
                                                    onChange={(e) => handleHeadingMarginChange(heading as keyof typeof settings.headingMargins, e.target.value)}
                                                    className="w-full bg-transparent border-none p-0 text-sm font-medium text-gray-900 focus:ring-0"
                                                    min="0"
                                                    max="100"
                                                />
                                                <span className="absolute right-0 top-0 text-xs text-gray-400 pointer-events-none">px</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Block Spacing</label>
                                <div className="flex items-center gap-4">
                                    <div className="relative w-32">
                                        <input
                                            type="number"
                                            value={settings.cellMarginBottom}
                                            onChange={(e) => updateSettings({ cellMarginBottom: parseInt(e.target.value) || 0 })}
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all pr-8"
                                            min="0"
                                            max="100"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">px</span>
                                    </div>
                                    <p className="text-sm text-gray-500">Space between content blocks</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
