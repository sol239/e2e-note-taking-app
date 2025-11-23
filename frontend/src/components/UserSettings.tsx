"use client";

import React, { useState, useEffect } from 'react';
import { getUser, User, tfaSetup, tfaEnable, tfaDisable, TFASetupResponse, deleteAccount, changePassword } from '../api/auth';
import { Pencil, Check, X, User as UserIcon, ShieldCheck, Trash2, AlertTriangle, Lock } from 'lucide-react';
import OTPInput from './OTPInput';
import { useRouter } from 'next/navigation';
import { CryptoManager } from '../utils/CryptoManager';

export default function UserSettings({ className = '' }: { className?: string }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [tfaData, setTfaData] = useState<TFASetupResponse | null>(null);
  const [tfaCode, setTfaCode] = useState('');
  const [showTfaSetup, setShowTfaSetup] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Password Change State
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

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

  const handleTfaSetup = async () => {
    try {
      const data = await tfaSetup();
      setTfaData(data);
      setShowTfaSetup(true);
    } catch (err) {
      setMessage('Failed to start TFA setup');
    }
  };

  const handleTfaEnable = async () => {
    try {
      await tfaEnable(tfaCode);
      setMessage('Two-Factor Authentication enabled successfully');
      setShowTfaSetup(false);
      setTfaData(null);
      setTfaCode('');
      fetchUser();
    } catch (err) {
      setMessage('Failed to enable TFA. Check the code.');
    }
  };

  const handleTfaDisable = async () => {
    if (!confirm('Are you sure you want to disable Two-Factor Authentication?')) return;
    try {
      await tfaDisable();
      setMessage('Two-Factor Authentication disabled successfully');
      fetchUser();
    } catch (err) {
      setMessage('Failed to disable TFA');
    }
  };

  const handleDeleteAccount = async () => {
    try {
        await deleteAccount();
        localStorage.removeItem('authToken');
        router.push('/login');
    } catch (err) {
        setMessage('Failed to delete account');
        setShowDeleteConfirm(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmNewPassword) {
        setPasswordMessage('New passwords do not match');
        return;
    }
    if (newPassword.length < 8) {
        setPasswordMessage('Password must be at least 8 characters long');
        return;
    }

    setLoading(true);
    setPasswordMessage('');

    try {
        // 1. Re-encrypt master key with new password
        const cryptoManager = CryptoManager.getInstance();
        const encryptedBundle = await cryptoManager.reEncryptMasterKey(newPassword);

        // 2. Send to backend
        await changePassword({
            old_password: currentPassword,
            new_password: newPassword,
            encrypted_master_key: encryptedBundle.encryptedMasterKey,
            master_key_nonce: encryptedBundle.masterKeyNonce,
            master_key_salt: encryptedBundle.masterKeySalt,
            argon_memory: encryptedBundle.iterations,
            argon_time: 4 // Default value
        });

        setPasswordMessage('Password changed successfully');
        setTimeout(() => {
            setShowChangePassword(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setPasswordMessage('');
        }, 2000);
    } catch (err: any) {
        setPasswordMessage(err.message || 'Failed to change password');
    } finally {
        setLoading(false);
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

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <ShieldCheck size={20} />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Security</h2>
            </div>
            
            {user.totp_enabled ? (
                <div className="flex items-center justify-between gap-2 bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 text-green-600">
                        <Check size={20} />
                        <span>Two-Factor Authentication is enabled</span>
                    </div>
                    <button
                        onClick={handleTfaDisable}
                        className="px-3 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm font-medium transition-colors"
                    >
                        Disable
                    </button>
                </div>
            ) : (
                !showTfaSetup ? (
                  <button
                    onClick={handleTfaSetup}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Enable Two-Factor Authentication
                  </button>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-medium text-gray-900 mb-4">Setup 2FA</h3>
                    {tfaData && (
                      <div className="space-y-4">
                        <div className="flex justify-center bg-white p-4 rounded-lg border border-gray-200 w-fit mx-auto">
                          <img src={`data:image/png;base64,${tfaData.qr}`} alt="QR Code" className="w-48 h-48" />
                        </div>
                        <div className="text-center text-sm text-gray-600">
                          <p>Scan this QR code with your authenticator app</p>
                          <p className="mt-1 font-mono bg-gray-200 px-2 py-1 rounded inline-block">{tfaData.secret}</p>
                        </div>
                        
                        {tfaData.recovery_keys && (
                            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                                <h4 className="text-sm font-bold text-yellow-800 mb-2">Recovery Keys</h4>
                                <p className="text-xs text-yellow-700 mb-3">
                                    Please save these recovery keys in a secure place. You can use them to regain access to your account if you lose your authenticator device.
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {tfaData.recovery_keys.map((key, i) => (
                                        <div key={i} className="bg-white px-2 py-1 rounded border border-yellow-200 font-mono text-xs text-center text-gray-700">
                                            {key}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div className="max-w-xs mx-auto">
                          <label className="block text-sm font-medium text-gray-700 mb-4 text-center">Verification Code</label>
                          <div className="mb-4">
                            <OTPInput
                              value={tfaCode}
                              onChange={setTfaCode}
                            />
                          </div>
                          <button
                            onClick={handleTfaEnable}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Verify & Enable
                          </button>
                        </div>
                        
                        <button
                          onClick={() => setShowTfaSetup(false)}
                          className="text-sm text-gray-500 hover:text-gray-700 w-full text-center mt-4"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                    <AlertTriangle size={20} />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Danger Zone</h2>
            </div>
            
            {!showDeleteConfirm ? (
                <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
                >
                    <Trash2 size={18} />
                    Delete Account
                </button>
            ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="text-red-800 font-medium mb-2">Are you sure you want to delete your account?</h3>
                    <p className="text-red-600 text-sm mb-4">
                        This action cannot be undone. All your notebooks, notes, and personal data will be permanently deleted.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={handleDeleteAccount}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                        >
                            Yes, Delete My Account
                        </button>
                        <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
          </div>

          {/* Password Change Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                    <Lock size={20} />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Password</h2>
            </div>

            {!showChangePassword ? (
                <button
                    onClick={() => setShowChangePassword(true)}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    Change Password
                </button>
            ) : (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-w-md">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleChangePassword}
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Updating...' : 'Update Password'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowChangePassword(false);
                                    setCurrentPassword('');
                                    setNewPassword('');
                                    setConfirmNewPassword('');
                                    setPasswordMessage('');
                                }}
                                disabled={loading}
                                className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                        {passwordMessage && (
                            <div className={`mt-3 text-sm ${passwordMessage.includes('Failed') || passwordMessage.includes('match') || passwordMessage.includes('long') ? 'text-red-600' : 'text-green-600'}`}>
                                {passwordMessage}
                            </div>
                        )}
                    </div>
                </div>
            )}
          </div>
        </div>
  );
}
