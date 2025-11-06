'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Block } from '@/models/Block';
import { getNotebooks, createNotebook, NotebookConnector } from '@/api/auth';
import { BookOpen, Search, ExternalLink, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface NotebookLinkBlockProps {
  block: Block;
  onUpdate: (id: string, updates: Partial<Block>) => void;
  cellMarginStyle: React.CSSProperties;
}

const NotebookLinkBlock: React.FC<NotebookLinkBlockProps> = ({ block, onUpdate, cellMarginStyle }) => {
  const [showNotebookSearch, setShowNotebookSearch] = useState(false);
  const [notebooks, setNotebooks] = useState<NotebookConnector[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (showNotebookSearch) {
      loadNotebooks();
      // Focus search input when modal opens
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [showNotebookSearch]);

  const loadNotebooks = async () => {
    setLoading(true);
    try {
      const data = await getNotebooks();
      setNotebooks(data);
    } catch (error) {
      console.error('Failed to load notebooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredNotebooks = () => {
    if (!searchQuery.trim()) return notebooks;
    return notebooks.filter(connector =>
      connector.notebook.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handleNotebookSelect = (connector: NotebookConnector) => {
    onUpdate(block.id, {
      metadata: {
        ...block.metadata,
        notebookId: connector.notebook.id,
        notebookName: connector.notebook.name,
      },
    });
    setShowNotebookSearch(false);
    setSearchQuery('');
  };

  const handleCreateAndLink = async () => {
    setCreating(true);
    try {
      const newNotebook = await createNotebook('New Notebook');
      
      // Link the newly created notebook to this block
      onUpdate(block.id, {
        metadata: {
          ...block.metadata,
          notebookId: newNotebook.id,
          notebookName: newNotebook.name,
        },
      });
      
      setShowNotebookSearch(false);
      setSearchQuery('');
      
      // Redirect to the new notebook
      router.push(`/notebooks/${newNotebook.id}`);
    } catch (error) {
      console.error('Failed to create notebook:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const filteredNotebooks = getFilteredNotebooks();
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredNotebooks.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filteredNotebooks[selectedIndex]) {
      e.preventDefault();
      handleNotebookSelect(filteredNotebooks[selectedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowNotebookSearch(false);
      setSearchQuery('');
    }
  };

  const hasNotebookLinked = block.metadata?.notebookId && block.metadata?.notebookName;

  return (
    <div style={cellMarginStyle} className="py-2">
      {!hasNotebookLinked ? (
        <button
          onClick={() => setShowNotebookSearch(true)}
          className="w-full flex items-center space-x-3 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-gray-600 hover:text-blue-600"
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-sm font-medium">Click to select a notebook</span>
        </button>
      ) : (
        <Link
          href={`/notebooks/${block.metadata?.notebookId}`}
          className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg hover:shadow-md transition-all duration-200 group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Linked Notebook</p>
              <p className="text-base font-semibold text-gray-900">{block.metadata?.notebookName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowNotebookSearch(true);
              }}
              className="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-white transition-colors"
              title="Change notebook"
            >
              <Search className="w-4 h-4" />
            </button>
            <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </div>
        </Link>
      )}

      {/* Notebook Search Modal */}
      {showNotebookSearch && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Select Notebook</h2>
              </div>
              
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search notebooks..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Notebooks List */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading notebooks...</p>
                </div>
              ) : getFilteredNotebooks().length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-600">
                    {searchQuery ? 'No notebooks found' : 'No notebooks available'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {getFilteredNotebooks().map((connector, index) => (
                    <button
                      key={connector.id}
                      onClick={() => handleNotebookSelect(connector)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        index === selectedIndex
                          ? 'bg-blue-100 border-2 border-blue-500'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        index === selectedIndex
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600'
                          : 'bg-gray-200'
                      }`}>
                        <BookOpen className={`w-5 h-5 ${
                          index === selectedIndex ? 'text-white' : 'text-gray-600'
                        }`} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-gray-900">{connector.notebook.name}</p>
                        <p className="text-sm text-gray-500">
                          {connector.notebook.id === block.metadata?.notebookId ? 'Currently selected' : 'Click to select'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 space-y-2">
              <button
                onClick={handleCreateAndLink}
                disabled={creating}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5" />
                <span>{creating ? 'Creating...' : 'Create New Notebook & Link'}</span>
              </button>
              <button
                onClick={() => {
                  setShowNotebookSearch(false);
                  setSearchQuery('');
                }}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotebookLinkBlock;
