"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getNotebooks, createNotebook, deleteNotebook, NotebookConnector, getUser, User, importNotebook } from '../../api/auth';
import { Trash2, FileText, Clock, ChevronRight, Upload } from 'lucide-react';
import SyncWorker from '../../utils/SyncWorker';
import { useMainView } from '../../contexts/MainViewContext';

export default function NotebooksPage() {
  const { notebooks, fetchNotebooks: contextFetchNotebooks } = useMainView();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [notebookToDelete, setNotebookToDelete] = useState<NotebookConnector | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [greeting, setGreeting] = useState('Good morning');
  const [user, setUser] = useState<User | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    // redirect to login if not authenticated
    if (typeof window !== 'undefined' && !localStorage.getItem('authToken')) {
      router.push('/login');
      return;
    }

    fetchUser();
  }, []);

  const router = useRouter();

  const fetchUser = async () => {
    try {
      const userData = await getUser();
      setUser(userData);
    } catch (err) {
      console.error('Failed to load user', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotebook = async () => {
    setCreating(true);
    try {
      const created = await createNotebook('New Notebook');
      // After creation navigate to the notebook page
      router.push(`/notebooks/${created.id}`);
      // Refresh the list in the background
      await contextFetchNotebooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create notebook');
    } finally {
      setCreating(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      await importNotebook(file);
      await contextFetchNotebooks();
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import notebook');
    } finally {
      setImporting(false);
    }
  };

  const openDeleteModal = (connector: NotebookConnector) => {
    setNotebookToDelete(connector);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setNotebookToDelete(null);
  };

  const handleDeleteNotebook = async () => {
    if (!notebookToDelete) return;
    
    setDeleting(true);
    try {
      await deleteNotebook(notebookToDelete.notebook.id);
      await contextFetchNotebooks(); // Refresh the list
      closeDeleteModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete notebook');
    } finally {
      setDeleting(false);
    }
  };

  // Handle horizontal scroll with mouse wheel
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (scrollContainerRef.current) {
      e.preventDefault();
      scrollContainerRef.current.scrollLeft += e.deltaY;
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-8 py-12">
      {/* Greeting */}
      <h1 className="text-4xl font-bold text-gray-900 mb-12 text-center">{greeting}{user?.nickname ? `, ${user.nickname}` : ''}</h1>

      {/* Action Buttons */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={handleCreateNotebook}
          disabled={creating}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <span className="text-xl font-light">+</span>
          )}
          <span className="text-sm font-medium">{creating ? 'Creating...' : 'New Notebook'}</span>
        </button>

        <button
          onClick={handleImportClick}
          disabled={importing}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {importing ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700"></div>
          ) : (
            <Upload className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">{importing ? 'Importing...' : 'Import Notebook'}</span>
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json,.zip"
        className="hidden"
      />

      {/* Recently Visited */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-4">
          <Clock className="w-4 h-4" />
          <span>Recently visited</span>
        </div>

        <div 
          ref={scrollContainerRef}
          onWheel={handleWheel}
          className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 scrollbar-thumb-rounded-full scrollbar-track-rounded-full"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#d1d5db #f3f4f6'
          }}
        >
          <div className="flex gap-4 min-w-min">
            {notebooks
              .filter(n => n.last_opened)
              .sort((a, b) => new Date(b.last_opened!).getTime() - new Date(a.last_opened!).getTime())
              .slice(0, 10)
              .map((connector) => (
              <Link
                key={connector.notebook.id}
                href={`/notebooks/${connector.notebook.id}`}
                className="group bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition-all duration-200 border border-transparent hover:border-gray-200 block flex-shrink-0 w-64"
              >
                <div className="flex flex-col h-24 justify-between">
                  <div className="w-8 h-8 rounded bg-white border border-gray-200 flex items-center justify-center text-gray-400 group-hover:text-gray-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 truncate mb-1">{connector.notebook.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-4 h-4 rounded bg-gray-300 flex items-center justify-center text-[10px] text-white font-bold">
                        {user?.nickname ? user.nickname[0].toUpperCase() : 'U'}
                      </div>
                      <span>{connector.last_opened ? new Date(connector.last_opened).toLocaleDateString() : ''}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */
      deleteModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Delete Notebook</h2>
            </div>
            
            <p className="text-gray-600 mb-2">
              Are you sure you want to delete <span className="font-semibold text-gray-900">{notebookToDelete?.notebook.name}</span>?
            </p>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={closeDeleteModal}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteNotebook}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
