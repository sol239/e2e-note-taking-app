"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { NotebookConnector, getNotebooks } from '../api/auth';

interface MainViewContextType {
  view: string | null;
  setView: (value: string | null) => void;
  notebooks: NotebookConnector[];
  fetchNotebooks: () => Promise<void>;
}

const MainViewContext = createContext<MainViewContextType | undefined>(undefined);

export { MainViewContext };

export const MainViewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [view, setView] = useState<string | null>(null);
  const [notebooks, setNotebooks] = useState<NotebookConnector[]>([]);

  const fetchNotebooks = async () => {
    try {
      const data = await getNotebooks();
      setNotebooks(data);
    } catch (err) {
      console.error('Failed to fetch notebooks', err);
    }
  };

  useEffect(() => {
    fetchNotebooks();
  }, []);

  return (
    <MainViewContext.Provider value={{ view, setView, notebooks, fetchNotebooks }}>
      {children}
    </MainViewContext.Provider>
  );
};

export function useMainView() {
  const ctx = useContext(MainViewContext);
  if (!ctx) throw new Error('useMainView must be used within MainViewProvider');
  return ctx;
}
