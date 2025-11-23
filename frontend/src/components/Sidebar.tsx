"use client";

import { useState, useEffect, useRef } from 'react';
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
  ChevronDown,
  LogOut,
  Lock,
  Key
} from 'lucide-react';
import { getNotebooks, NotebookConnector, createNotebook, deleteNotebook, getUser, User, getEncryptedMasterKey } from '../api/auth';
import { useMainView } from '../contexts/MainViewContext';
import NotebookMenu from './NotebookMenu';
import { CryptoManager } from '../utils/CryptoManager';

export default function Sidebar() {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [isPrivateExpanded, setIsPrivateExpanded] = useState(true);
  const [creating, setCreating] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  // Unlock Modal State
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { view, setView, notebooks, fetchNotebooks, hasMasterKey, checkMasterKey } = useMainView();

  useEffect(() => {
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    router.push('/login');
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError('');
    setIsUnlocking(true);

    try {
      const bundleResponse = await getEncryptedMasterKey();
      const bundle = {
        encryptedMasterKey: bundleResponse.encrypted_master_key,
        masterKeyNonce: bundleResponse.nonce,
        masterKeySalt: bundleResponse.salt,
        iterations: bundleResponse.argon_memory
      };

      const cryptoManager = CryptoManager.getInstance();
      await cryptoManager.decryptMasterKey(unlockPassword, bundle);
      
      checkMasterKey();
      setShowUnlockModal(false);
      setUnlockPassword('');
      setFailedAttempts(0);
      
    } catch (err) {
      console.error(err);
      const newFailedAttempts = failedAttempts + 1;
      setFailedAttempts(newFailedAttempts);

      if (newFailedAttempts >= 5) {
        handleLogout();
        return;
      }

      setUnlockError(`Invalid password. ${5 - newFailedAttempts} attempts remaining.`);
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleLock = () => {
    const cryptoManager = CryptoManager.getInstance();
    cryptoManager.clearMasterKey();
    checkMasterKey();
    if (pathname.startsWith('/notebooks/') && pathname !== '/notebooks') {
      router.push('/notebooks');
    }
  };

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
          
          {isPrivateExpanded && hasMasterKey && (
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

      {/* Unlock Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Unlock Notebooks</h2>
                <p className="text-sm text-gray-500">Enter your password to decrypt your master key</p>
              </div>
            </div>

            <form onSubmit={handleUnlock}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={unlockPassword}
                  onChange={(e) => setUnlockPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Enter your password"
                  autoFocus
                />
                {unlockError && (
                  <p className="text-red-500 text-sm mt-1">{unlockError}</p>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowUnlockModal(false);
                    setUnlockError('');
                    setUnlockPassword('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUnlocking || !unlockPassword}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUnlocking ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Unlocking...</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      <span>Unlock</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
