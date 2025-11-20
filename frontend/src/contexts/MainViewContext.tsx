"use client";

import React, { createContext, useContext, useState } from 'react';

interface MainViewContextType {
  view: string | null;
  setView: (value: string | null) => void;
}

const MainViewContext = createContext<MainViewContextType | undefined>(undefined);

export const MainViewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [view, setView] = useState<string | null>(null);
  return (
    <MainViewContext.Provider value={{ view, setView }}>
      {children}
    </MainViewContext.Provider>
  );
};

export function useMainView() {
  const ctx = useContext(MainViewContext);
  if (!ctx) throw new Error('useMainView must be used within MainViewProvider');
  return ctx;
}
