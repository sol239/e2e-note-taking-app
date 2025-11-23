import React, { useState } from 'react';
import { Lock, Key } from 'lucide-react';
import { getEncryptedMasterKey } from '../api/auth';
import { CryptoManager } from '../utils/CryptoManager';
import { useMainView } from '../contexts/MainViewContext';
import { useRouter } from 'next/navigation';

interface UnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function UnlockModal({ isOpen, onClose, onSuccess }: UnlockModalProps) {
  const router = useRouter();
  const { checkMasterKey } = useMainView();
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const MAX_UNLOCK_ATTEMPTS = 5;

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
      setUnlockPassword('');
      setFailedAttempts(0);
      onClose();
      if (onSuccess) onSuccess();
      
    } catch (err) {
      console.error(err);
      const newFailedAttempts = failedAttempts + 1;
      setFailedAttempts(newFailedAttempts);

      if (newFailedAttempts >= MAX_UNLOCK_ATTEMPTS) {
        handleLogout();
        return;
      }

      setUnlockError(`Invalid password. ${MAX_UNLOCK_ATTEMPTS - newFailedAttempts} attempts remaining.`);
    } finally {
      setIsUnlocking(false);
    }
  };

  if (!isOpen) return null;

  return (
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
                setUnlockError('');
                setUnlockPassword('');
                onClose();
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
  );
}
