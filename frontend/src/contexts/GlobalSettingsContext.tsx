import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GlobalSettings, defaultGlobalSettings } from '../models/Settings';

interface GlobalSettingsContextType {
  settings: GlobalSettings;
  updateSettings: (newSettings: Partial<GlobalSettings>) => void;
  updateHeadingMargin: (heading: keyof GlobalSettings['headingMargins'], margin: number) => void;
  resetToDefaults: () => void;
}

const GlobalSettingsContext = createContext<GlobalSettingsContextType | undefined>(undefined);

const SETTINGS_STORAGE_KEY = 'notion-clone-global-settings';

export const GlobalSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<GlobalSettings>(() => {
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        try {
          return { ...defaultGlobalSettings, ...JSON.parse(stored) };
        } catch (error) {
          console.warn('Failed to parse stored settings, using defaults');
        }
      }
    }
    return defaultGlobalSettings;
  });

  // Save to localStorage whenever settings change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<GlobalSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const updateHeadingMargin = (heading: keyof GlobalSettings['headingMargins'], margin: number) => {
    setSettings(prev => ({
      ...prev,
      headingMargins: {
        ...prev.headingMargins,
        [heading]: margin,
      },
    }));
  };

  const resetToDefaults = () => {
    setSettings(defaultGlobalSettings);
  };

  return (
    <GlobalSettingsContext.Provider
      value={{
        settings,
        updateSettings,
        updateHeadingMargin,
        resetToDefaults,
      }}
    >
      {children}
    </GlobalSettingsContext.Provider>
  );
};

export const useGlobalSettings = () => {
  const context = useContext(GlobalSettingsContext);
  if (context === undefined) {
    throw new Error('useGlobalSettings must be used within a GlobalSettingsProvider');
  }
  return context;
};