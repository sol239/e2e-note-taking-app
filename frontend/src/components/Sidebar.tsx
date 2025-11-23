"use client";

/* 1. Imports */
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, 
  Home, 
  Plus, 
  FileText, 
  Settings, 
  HelpCircle,
  ChevronDown,
  LogOut,
  Lock,
  Key
} from 'lucide-react';
import { getNotebooks, NotebookConnector, createNotebook, deleteNotebook, getUser, User, getEncryptedMasterKey } from '../api/auth';
import { useMainView } from '../contexts/MainViewContext';
import NotebookMenu from './NotebookMenu';
import UnlockModal from './UnlockModal';
import { CryptoManager } from '../utils/CryptoManager';

/* 2. External Stores */
// None

export default function Sidebar() {
  /* 3. Next.js Hooks */
  const router = useRouter();
  const pathname = usePathname();
  const { view, setView, notebooks, fetchNotebooks, hasMasterKey, checkMasterKey } = useMainView();

  /* 4. Constants */
  // None

  /* 5. Refs */
  const userMenuRef = useRef<HTMLDivElement>(null);

  /* 6. State */
  const [searchQuery, setSearchQuery] = useState('');
  const [isPrivateExpanded, setIsPrivateExpanded] = useState(true);
  const [creating, setCreating] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  /* 7. Derived/Computed */
  const filteredNotebooks = notebooks.filter(n => 
    n.notebook.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* 8. Effects */
  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  /* 9. Methods */
  const fetchUser = async () => {
    try {
      const userData = await getUser();
      setUser(userData);
    } catch (err) {
      console.error('Failed to load user', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    router.push('/login');
  };

  const handleLock = () => {
    const cryptoManager = CryptoManager.getInstance();
    cryptoManager.clearMasterKey();
    checkMasterKey();
    if (pathname.startsWith('/notebooks/') && pathname !== '/notebooks') {
      router.push('/notebooks');
    }
  };

  const handleCreateNotebook = async () => {
    if (!hasMasterKey) return;
    setCreating(true);
    try {
      const created = await createNotebook('New Notebook');
      router.push(`/notebooks/${created.id}`);
      await fetchNotebooks();
    } catch (err) {
      console.error('Failed to create notebook', err);
    } finally {
      setCreating(false);
    }
  };

  /* 10. Expose (like defineExpose) */
  // None

  /* 11. Render Helpers (optional) */
  // None

  /* 12. JSX Template */

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 h-screen flex flex-col text-gray-700">
      {/* User / Workspace Switcher */}
      <div className="relative" ref={userMenuRef}>
        <div 
          className="p-3 hover:bg-gray-200 cursor-pointer transition-colors m-2 rounded-md flex items-center gap-2"
          onClick={() => setUserMenuOpen(!userMenuOpen)}
        >
          <div className="w-5 h-5 bg-gradient-to-r from-blue-600 to-purple-600 rounded text-white flex items-center justify-center text-xs font-bold">
            {user?.nickname ? user.nickname[0].toUpperCase() : 'U'}
          </div>
          <span className="text-sm font-medium truncate">{user?.nickname ? `${user.nickname}'s Notebooks` : 'User\'s Notebooks'}</span>
          <ChevronDown className={`w-4 h-4 text-gray-400 ml-auto transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
        </div>

        {/* User Menu Popover */}
        {userMenuOpen && (
          <div className="absolute top-full left-2 right-2 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs text-gray-500">Signed in as</p>
              <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        )}
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

        {hasMasterKey && (
          <button 
            onClick={handleLock}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer text-sm hover:bg-gray-200 text-gray-600 text-left"
          >
            <Lock className="w-4 h-4" />
            <span>Lock App</span>
          </button>
        )}
      </div>

      {/* Unlock Placeholder */}
      {!hasMasterKey && (
        <div className="px-3 mt-4">
          <button 
            onClick={() => setShowUnlockModal(true)}
            className="w-full aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-3 text-gray-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all group"
          >
            <div className="relative">
              <Lock className="w-8 h-8" />
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                <Key className="w-4 h-4 text-yellow-500" />
              </div>
            </div>
            <span className="text-xs font-medium">Unlock Notebooks</span>
          </button>
        </div>
      )}

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
                  {hasMasterKey ? (
                    <Link 
                      href={`/notebooks/${connector.notebook.id}`}
                      onClick={() => setView(null)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer text-sm ${(pathname === `/notebooks/${connector.notebook.id}` && view !== 'settings') ? 'bg-gray-200 text-gray-900' : 'hover:bg-gray-200 text-gray-600'}`}
                    >
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="truncate flex-1">{connector.notebook.name}</span>
                    </Link>
                  ) : (
                    <div 
                      onClick={() => setShowUnlockModal(true)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer text-sm hover:bg-gray-200 text-gray-600"
                    >
                      <Lock className="w-4 h-4 text-gray-400" />
                      <span className="truncate flex-1">••••••••</span>
                    </div>
                  )}
                  
                  {hasMasterKey && (
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
                  )}
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

      {/* Unlock Modal */}
      <UnlockModal 
        isOpen={showUnlockModal} 
        onClose={() => setShowUnlockModal(false)} 
      />
    </div>
  );
}
