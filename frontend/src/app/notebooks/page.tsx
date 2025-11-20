"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getNotebooks, createNotebook, deleteNotebook, NotebookConnector, getUser, User } from '../../api/auth';
import { Trash2, FileText, Clock, ChevronRight } from 'lucide-react';
import SyncWorker from '../../utils/SyncWorker';

export default function NotebooksPage() {
  const [notebooks, setNotebooks] = useState<NotebookConnector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [notebookToDelete, setNotebookToDelete] = useState<NotebookConnector | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [greeting, setGreeting] = useState('Good morning');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    fetchNotebooks();
    fetchUser();
  }, []);

  const router = useRouter();

  const fetchNotebooks = async () => {
    try {
      const data = await getNotebooks();
      setNotebooks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notebooks');
    }
  };

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
      await fetchNotebooks();
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

      {/* Recently Visited */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-4">
          <Clock className="w-4 h-4" />
          <span>Recently visited</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {notebooks.slice(0, 5).map((connector) => (
            <Link
              key={connector.id}
              href={`/notebooks/${connector.notebook.id}`}
              className="group bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition-all duration-200 border border-transparent hover:border-gray-200 block"
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
                    <span>2m ago</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {/* Create New Card */}
          <button
            onClick={handleCreateNotebook}
            disabled={creating}
            className="bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition-all duration-200 border border-transparent hover:border-gray-200 flex flex-col h-32 justify-center items-center text-gray-500 hover:text-gray-900"
          >
            <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center mb-2">
              <span className="text-xl font-light">+</span>
            </div>
            <span className="text-sm font-medium">{creating ? 'Creating...' : 'New Notebook'}</span>
          </button>
        </div>
      </div>
/* Delete Confirmation Modal */
      {deleteModalOpen && (
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
