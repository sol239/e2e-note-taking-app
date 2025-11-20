"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Search, 
  Home, 
  Inbox, 
  Plus, 
  ChevronRight, 
  FileText, 
  Settings, 
  HelpCircle,
  Sparkles,
  Calendar,
  ChevronDown
} from 'lucide-react';
import { getNotebooks, NotebookConnector, createNotebook, deleteNotebook, getUser, User } from '../api/auth';
import { useMainView } from '../contexts/MainViewContext';
import NotebookMenu from './NotebookMenu';

export default function Sidebar() {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [isPrivateExpanded, setIsPrivateExpanded] = useState(true);
  const [creating, setCreating] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const router = useRouter();
  const { view, setView, notebooks, fetchNotebooks } = useMainView();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const userData = await getUser();
      setUser(userData);
    } catch (err) {
      console.error('Failed to load user', err);
    }
  };

  const handleCreateNotebook = async () => {
    setCreating(true);
    try {
      const created = await createNotebook('New Notebook');
      // Redirect to the created notebook
      router.push(`/notebooks/${created.id}`);
      // Refresh the list in the background
      await fetchNotebooks();
    } catch (err) {
      console.error('Failed to create notebook', err);
    } finally {
      setCreating(false);
    }
  };

  const filteredNotebooks = notebooks.filter(n => 
    n.notebook.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 h-screen flex flex-col text-gray-700">
      {/* User / Workspace Switcher */}
      <div className="p-3 hover:bg-gray-200 cursor-pointer transition-colors m-2 rounded-md flex items-center gap-2">
        <div className="w-5 h-5 bg-gradient-to-r from-blue-600 to-purple-600 rounded text-white flex items-center justify-center text-xs font-bold">
          {user?.nickname ? user.nickname[0].toUpperCase() : 'U'}
        </div>
        <span className="text-sm font-medium truncate">{user?.nickname ? `${user.nickname}'s Notebooks` : 'User\'s Notebooks'}</span>
        <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
      </div>

      {/* Search & Main Nav */}
      <div className="px-3 space-y-0.5">
        <div className="relative group">
          <div className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-200 rounded-md cursor-pointer text-sm text-gray-600">
            <Search className="w-4 h-4" />
            <span className="flex-1">Search</span>
          </div>
          {/* Simple Search Input Popup or Inline */}
          <input 
            type="text" 
            placeholder="Search notebooks..." 
            className="absolute top-0 left-0 w-full h-full opacity-0 focus:opacity-100 bg-white border border-blue-500 rounded-md px-8 text-sm z-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Link href="/notebooks" onClick={() => setView(null)} className={`flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer text-sm ${(pathname === '/notebooks' && view !== 'settings') ? 'bg-gray-200 text-gray-900' : 'hover:bg-gray-200 text-gray-600'}`}>
          <Home className="w-4 h-4" />
          <span>Home</span>
        </Link>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto mt-4 px-3">
        {/* Notebooks Section */}
        <div className="mb-4">
          <div 
            className="flex items-center justify-between px-2 py-1 hover:bg-gray-200 rounded cursor-pointer text-xs font-semibold text-gray-500 mb-1 group"
            onClick={() => setIsPrivateExpanded(!isPrivateExpanded)}
          >
            <span>Notebooks</span>
            <div className="opacity-0 group-hover:opacity-100 flex items-center">
              <Plus 
                className="w-4 h-4 hover:bg-gray-300 rounded p-0.5 mr-1" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleCreateNotebook();
                }}
              />
            </div>
          </div>
          
          {isPrivateExpanded && (
            <div className="space-y-0.5">
              {filteredNotebooks.map((connector) => (
                <div key={connector.notebook.id} className="relative group">
                  <Link 
                    href={`/notebooks/${connector.notebook.id}`}
                    onClick={() => setView(null)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer text-sm ${(pathname === `/notebooks/${connector.notebook.id}` && view !== 'settings') ? 'bg-gray-200 text-gray-900' : 'hover:bg-gray-200 text-gray-600'}`}
                  >
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="truncate flex-1">{connector.notebook.name}</span>
                  </Link>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <NotebookMenu
                      notebookId={connector.notebook.id}
                      isOpen={openMenuId === connector.notebook.id}
                      onToggle={() => setOpenMenuId(openMenuId === connector.notebook.id ? null : connector.notebook.id)}
                      onDelete={async () => {
                        try {
                          await deleteNotebook(connector.notebook.id);
                          setOpenMenuId(null);
                          // If currently viewing the deleted notebook, navigate back to notebooks list
                          if (pathname === `/notebooks/${connector.notebook.id}`) {
                            router.push('/notebooks');
                          }
                          // Refresh list
                          await fetchNotebooks();
                        } catch (err) {
                          console.error('Failed to delete notebook', err);
                        }
                      }}
                    />
                  </div>
                </div>
              ))}
              {filteredNotebooks.length === 0 && (
                <div className="px-3 py-1.5 text-xs text-gray-400 italic">
                  No notebooks found
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 space-y-1">
        <div className="flex items-center justify-between px-1 mt-2">
           {/* Help & Settings */}
           <div className="p-1 hover:bg-gray-200 rounded cursor-pointer">
             <HelpCircle className="w-4 h-4 text-gray-500" />
           </div>
           <button
             onClick={() => setView(view === 'settings' ? null : 'settings')}
             className={`flex items-center gap-1 p-1 hover:bg-gray-200 rounded cursor-pointer text-xs ${view === 'settings' ? 'bg-gray-200 text-gray-900' : 'text-gray-500'}`}
           >
             <Settings className="w-4 h-4" />
             Settings
           </button>
        </div>
      </div>
    </div>
  );
}
