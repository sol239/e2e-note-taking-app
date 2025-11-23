'use client';

/* 1. Imports */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login, tfaVerify, getEncryptedMasterKey } from '../../api/auth';
import OTPInput from '../../components/OTPInput';
import { CryptoManager } from '../../utils/CryptoManager';

/* 2. External Stores */
// None

export default function LoginPage() {
  /* 3. Next.js Hooks */
  const router = useRouter();

  /* 4. Constants */
  // None

  /* 5. Refs */
  // None

  /* 6. State */
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'login' | 'tfa'>('login');
  const [tempToken, setTempToken] = useState('');
  const [tfaCode, setTfaCode] = useState('');
  const [useRecoveryKey, setUseRecoveryKey] = useState(false);

  /* 7. Derived/Computed */
  // None

  /* 8. Effects */
  // None

  /* 9. Methods */
  const handleLoginSuccess = async (token: string) => {
    localStorage.setItem('authToken', token);
    
    try {
      const keys = await getEncryptedMasterKey();
      const cryptoManager = CryptoManager.getInstance();
      await cryptoManager.decryptMasterKey(password, {
        encryptedMasterKey: keys.encrypted_master_key,
        masterKeyNonce: keys.nonce,
        masterKeySalt: keys.salt,
        iterations: keys.argon_memory
      });

      router.push('/notebooks');
    } catch (err) {
      console.error(err);
      setError('Failed to decrypt master key. Please check your password.');
      localStorage.removeItem('authToken');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (step === 'login') {
        const response = await login({ email, password });
        if (response.tfa_required && response.temp_token) {
          setTempToken(response.temp_token);
          setStep('tfa');
        } else if (response.token) {
          await handleLoginSuccess(response.token);
        }
      } else {
        const response = await tfaVerify(tempToken, tfaCode);
        if (response.token) {
          await handleLoginSuccess(response.token);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  /* 10. Expose (like defineExpose) */
  // None

  /* 11. Render Helpers (optional) */
  // None

  /* 12. JSX Template */

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Notes</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Login Form */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to your Notes account</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            {step === 'login' ? (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 text-gray-800 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-black mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 text-gray-800 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your password"
                  />
                </div>
              </>
            ) : (
              <div>
                <label htmlFor="tfaCode" className="block text-sm font-medium text-black mb-4 text-center">
                  {useRecoveryKey ? 'Enter Recovery Key' : 'Two-Factor Authentication Code'}
                </label>
                
                {!useRecoveryKey ? (
                    <OTPInput
                      value={tfaCode}
                      onChange={setTfaCode}
                      disabled={isLoading}
                    />
                ) : (
                    <div className="mb-4">
                        <input
                            type="text"
                            value={tfaCode}
                            onChange={(e) => setTfaCode(e.target.value)}
                            className="w-full px-4 py-3 text-gray-800 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-center font-mono"
                            placeholder="Enter your recovery key"
                            disabled={isLoading}
                        />
                    </div>
                )}

                <div className="text-center mt-4 mb-2">
                    <button
                        type="button"
                        onClick={() => {
                            setUseRecoveryKey(!useRecoveryKey);
                            setTfaCode('');
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                        {useRecoveryKey ? 'Use Authenticator App' : 'Use Recovery Key'}
                    </button>
                </div>
              </div>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? 'Loading...' : step === 'login' ? 'Sign In' : 'Verify Code'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                Create one here
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}