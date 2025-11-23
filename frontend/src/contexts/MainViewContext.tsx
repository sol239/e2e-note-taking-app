"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { NotebookConnector, getNotebooks, Notebook } from '../api/auth';
import { CryptoManager } from '../utils/CryptoManager';

interface MainViewContextType {
  view: string | null;
  setView: (value: string | null) => void;
  notebooks: NotebookConnector[];
  fetchNotebooks: () => Promise<void>;
  updateNotebookInStore: (notebookId: string, updates: Partial<Notebook>) => void;
  updateNotebookConnectorInStore: (notebookId: string, updates: Partial<NotebookConnector>) => void;
  getNotebookById: (notebookId: string) => NotebookConnector | undefined;
  hasMasterKey: boolean;
  checkMasterKey: () => void;
}

const MainViewContext = createContext<MainViewContextType | undefined>(undefined);

export { MainViewContext };

export const MainViewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [view, setView] = useState<string | null>(null);
  const [notebooks, setNotebooks] = useState<NotebookConnector[]>([]);
  const [hasMasterKey, setHasMasterKey] = useState(false);

  const checkMasterKey = () => {
    const cryptoManager = CryptoManager.getInstance();
    setHasMasterKey(cryptoManager.hasMasterKey());
  };

  const fetchNotebooks = async () => {
    try {
      const data = await getNotebooks();
      setNotebooks(data);
    } catch (err) {
      console.error('Failed to fetch notebooks', err);
    }
  };

  const updateNotebookInStore = (notebookId: string, updates: Partial<Notebook>) => {
    setNotebooks(prevNotebooks => 
      prevNotebooks.map(connector => 
        connector.notebook.id === notebookId 
          ? { ...connector, notebook: { ...connector.notebook, ...updates } }
          : connector
      )
    );
  };

  const updateNotebookConnectorInStore = (notebookId: string, updates: Partial<NotebookConnector>) => {
    setNotebooks(prevNotebooks => 
      prevNotebooks.map(connector => 
        connector.notebook.id === notebookId 
          ? { ...connector, ...updates }
          : connector
      )
    );
  };

  const getNotebookById = (notebookId: string): NotebookConnector | undefined => {
    return notebooks.find(connector => connector.notebook.id === notebookId);
  };

  useEffect(() => {
    checkMasterKey();
    fetchNotebooks();

    // Listen for notebook updates from SyncWorker
    const handleNotebookUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ notebookId: string; updates: Partial<Notebook> }>;
      const { notebookId, updates } = customEvent.detail;
      updateNotebookInStore(notebookId, updates);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('notebook-updated', handleNotebookUpdate);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('notebook-updated', handleNotebookUpdate);
      }
    };
  }, []);

  return (
    <MainViewContext.Provider value={{ 
      view, 
      setView, 
      notebooks, 
      fetchNotebooks, 
      updateNotebookInStore,
      updateNotebookConnectorInStore,
      getNotebookById,
      hasMasterKey,
      checkMasterKey
    }}>
      {children}
    </MainViewContext.Provider>
  );
};

export function useMainView() {
  const ctx = useContext(MainViewContext);
  if (!ctx) throw new Error('useMainView must be used within MainViewProvider');
  return ctx;
}
