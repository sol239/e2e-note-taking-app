"use client";

import React, { useState, useEffect } from 'react';
import { getUser, User } from '../api/auth';

export default function UserSettings() {
  const [user, setUser] = useState<User | null>(null);
  const [nickname, setNickname] = useState('');
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
    } catch (err) {
      console.error('Failed to load user', err);
    }
  };

  const handleUpdateNickname = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/user/', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ nickname }),
      });
      if (response.ok) {
        setMessage('Nickname updated successfully');
        fetchUser(); // Refresh user data
      } else {
        setMessage('Failed to update nickname');
      }
    } catch (err) {
      setMessage('Error updating nickname');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">User Settings</h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <p className="text-gray-900">{user.email}</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Nickname</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              placeholder="Enter your nickname"
            />
            <button
              onClick={handleUpdateNickname}
              disabled={loading}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Nickname'}
            </button>
          </div>

          {message && (
            <div className="mb-6 p-3 bg-green-100 text-green-800 rounded">
              {message}
            </div>
          )}
        </div>
  );
}
