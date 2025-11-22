"use client";

import React, { useState, useEffect } from 'react';
import { getUser, User } from '../api/auth';
import { Pencil, Check, X, User as UserIcon } from 'lucide-react';

export default function UserSettings({ className = '' }: { className?: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const userData = await getUser();
      setUser(userData);
      setNickname(userData.nickname || '');
      setEmail(userData.email || '');
    } catch (err) {
      console.error('Failed to load user', err);
    }
  };

  const handleUpdate = async (field: 'nickname' | 'email') => {
    if (!user) return;
    setLoading(true);
    setMessage('');
    
    const body = field === 'nickname' ? { nickname } : { email };

    try {
      const response = await fetch('http://localhost:8000/api/user/', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(body),
      });
      
      if (response.ok) {
        setMessage(`${field === 'nickname' ? 'Nickname' : 'Email'} updated successfully`);
        if (field === 'nickname') setIsEditingNickname(false);
        if (field === 'email') setIsEditingEmail(false);
        fetchUser();
      } else {
        setMessage(`Failed to update ${field}`);
      }
    } catch (err) {
      setMessage(`Error updating ${field}`);
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = (field: 'nickname' | 'email') => {
    if (field === 'nickname') {
        setNickname(user?.nickname || '');
        setIsEditingNickname(false);
    } else {
        setEmail(user?.email || '');
        setIsEditingEmail(false);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <UserIcon size={20} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">User Profile</h2>
          </div>

          {message && (
            <div className={`mb-6 p-3 rounded ${message.includes('Failed') || message.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
              {message}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <div className="flex items-center gap-2">
                {isEditingEmail ? (
                    <>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                            placeholder="Enter your email"
                        />
                        <button
                            onClick={() => handleUpdate('email')}
                            disabled={loading}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                            title="Save"
                        >
                            <Check size={20} />
                        </button>
                        <button
                            onClick={() => cancelEdit('email')}
                            disabled={loading}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Cancel"
                        >
                            <X size={20} />
                        </button>
                    </>
                ) : (
                    <>
                        <p className="text-gray-900 flex-1">{user.email}</p>
                        <button
                            onClick={() => setIsEditingEmail(true)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                            title="Edit Email"
                        >
                            <Pencil size={18} />
                        </button>
                    </>
                )}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Nickname</label>
            <div className="flex items-center gap-2">
                {isEditingNickname ? (
                    <>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                            placeholder="Enter your nickname"
                        />
                        <button
                            onClick={() => handleUpdate('nickname')}
                            disabled={loading}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                            title="Save"
                        >
                            <Check size={20} />
                        </button>
                        <button
                            onClick={() => cancelEdit('nickname')}
                            disabled={loading}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Cancel"
                        >
                            <X size={20} />
                        </button>
                    </>
                ) : (
                    <>
                        <p className="text-gray-900 flex-1">{user.nickname || 'No nickname set'}</p>
                        <button
                            onClick={() => setIsEditingNickname(true)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                            title="Edit Nickname"
                        >
                            <Pencil size={18} />
                        </button>
                    </>
                )}
            </div>
          </div>
        </div>
  );
}
