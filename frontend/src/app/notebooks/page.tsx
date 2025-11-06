'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getNotebooks, createNotebook, deleteNotebook, NotebookConnector } from '../../api/auth';
import { LogOut, Trash2, Check, Loader2 } from 'lucide-react';
import SyncWorker from '../../utils/SyncWorker';

export default function NotebooksPage() {
  const [notebooks, setNotebooks] = useState<NotebookConnector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [notebookToDelete, setNotebookToDelete] = useState<NotebookConnector | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [hasPendingSync, setHasPendingSync] = useState(false);
  const syncWorker = useRef(SyncWorker.getInstance());

  const fetchNotebooks = async () => {
    try {
      const data = await getNotebooks();
      setNotebooks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notebooks');
    }
  };

  useEffect(() => {
    fetchNotebooks().finally(() => setLoading(false));
  }, []);

  // Check for pending sync operations periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const hasPending = syncWorker.current.hasAnyPendingOperations();
      setHasPendingSync(hasPending);
    }, 500); // Check every 500ms

    return () => clearInterval(interval);
  }, []);

  const handleCreateNotebook = async () => {
    setCreating(true);
    try {
      await createNotebook('New Notebook');
      await fetchNotebooks(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create notebook');
    } finally {
      setCreating(false);
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
      await fetchNotebooks(); // Refresh the list
      closeDeleteModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete notebook');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your notebooks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/login" className="text-blue-600 hover:underline">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="text-xl font-bold text-gray-900">EncNotes</span>
            </div>
            <div className="flex items-center space-x-4">
              <div title={hasPendingSync ? "Syncing..." : "All changes synced"}>
                {hasPendingSync ? (
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                ) : (
                  <Check className="w-5 h-5 text-green-600" />
                )}
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('authToken');
                  window.location.href = '/login';
                }}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Notebooks</h1>
          <button
            onClick={handleCreateNotebook}
            disabled={creating}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          >
            {creating ? 'Creating...' : 'Create New Notebook'}
          </button>
        </div>

        {notebooks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notebooks yet</h3>
            <p className="text-gray-600 mb-6">Create your first notebook to start taking encrypted notes.</p>
            <button 
              onClick={handleCreateNotebook}
              disabled={creating}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating...' : 'Create Your First Notebook'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notebooks.map((connector) => (
              <Link
                key={connector.id}
                href={`/notebooks/${connector.notebook.id}`}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow block"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 truncate flex-1 mr-2">{connector.notebook.name}</h3>
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openDeleteModal(connector);
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-all duration-200"
                      title="Delete notebook"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4">Click to open this notebook</p>
                <span className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Open Notebook →
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Delete Notebook</h2>
            </div>
            
            <p className="text-gray-600 mb-2">
              Are you sure you want to delete <span className="font-semibold text-gray-900">{notebookToDelete?.notebook.name}</span>?
            </p>
            <p className="text-sm text-red-600 mb-6">
              This action cannot be undone. All blocks and content in this notebook will be permanently deleted.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={closeDeleteModal}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteNotebook}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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