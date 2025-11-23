/**
 * Unit tests for CryptoManager.
 * 
 * Tests encryption/decryption operations and master key management.
 */

import { CryptoManager, EncryptedMasterKeyBundle, EncryptedData } from '../utils/CryptoManager';

// Mock crypto.subtle methods
const mockGenerateKey = jest.fn();
const mockImportKey = jest.fn();
const mockExportKey = jest.fn();
const mockEncrypt = jest.fn();
const mockDecrypt = jest.fn();
const mockDeriveKey = jest.fn();

beforeAll(() => {
  Object.defineProperty(window.crypto, 'subtle', {
    value: {
      generateKey: mockGenerateKey,
      importKey: mockImportKey,
      exportKey: mockExportKey,
      encrypt: mockEncrypt,
      decrypt: mockDecrypt,
      deriveKey: mockDeriveKey,
    },
    writable: true,
  });
});

describe('CryptoManager', () => {
  let cryptoManager: CryptoManager;

  beforeEach(() => {
    cryptoManager = CryptoManager.getInstance();
    cryptoManager.clearMasterKey();
    jest.clearAllMocks();
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = CryptoManager.getInstance();
      const instance2 = CryptoManager.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('hasMasterKey', () => {
    it('should return false when no master key is loaded', () => {
      expect(cryptoManager.hasMasterKey()).toBe(false);
    });
  });

  describe('clearMasterKey', () => {
    it('should clear the master key from memory', () => {
      cryptoManager.clearMasterKey();
      expect(cryptoManager.hasMasterKey()).toBe(false);
    });
  });

  describe('generateAndEncryptMasterKey', () => {
    it('should generate and encrypt a master key', async () => {
      const mockMasterKey = { type: 'secret' } as CryptoKey;
      const mockWrappingKey = { type: 'secret' } as CryptoKey;
      const mockEncryptedKey = new ArrayBuffer(32);
      
      mockGenerateKey.mockResolvedValue(mockMasterKey);
      mockExportKey.mockResolvedValue(new ArrayBuffer(32));
      mockDeriveKey.mockResolvedValue(mockWrappingKey);
      mockEncrypt.mockResolvedValue(mockEncryptedKey);
      
      const bundle = await cryptoManager.generateAndEncryptMasterKey('password123');
      
      expect(bundle).toHaveProperty('encryptedMasterKey');
      expect(bundle).toHaveProperty('masterKeyNonce');
      expect(bundle).toHaveProperty('masterKeySalt');
      expect(bundle).toHaveProperty('iterations');
      expect(bundle.iterations).toBe(600000);
      
      expect(mockGenerateKey).toHaveBeenCalled();
      expect(mockDeriveKey).toHaveBeenCalled();
      expect(mockEncrypt).toHaveBeenCalled();
    });

    it('should set hasMasterKey to true after generation', async () => {
      const mockMasterKey = { type: 'secret' } as CryptoKey;
      const mockWrappingKey = { type: 'secret' } as CryptoKey;
      
      mockGenerateKey.mockResolvedValue(mockMasterKey);
      mockExportKey.mockResolvedValue(new ArrayBuffer(32));
      mockDeriveKey.mockResolvedValue(mockWrappingKey);
      mockEncrypt.mockResolvedValue(new ArrayBuffer(32));
      
      await cryptoManager.generateAndEncryptMasterKey('password123');
      
      expect(cryptoManager.hasMasterKey()).toBe(true);
    });
  });

  describe('decryptMasterKey', () => {
    it('should decrypt master key from bundle', async () => {
      const bundle: EncryptedMasterKeyBundle = {
        encryptedMasterKey: 'base64encryptedkey',
        masterKeyNonce: 'base64nonce',
        masterKeySalt: 'base64salt',
        iterations: 600000,
      };
      
      const mockWrappingKey = { type: 'secret' } as CryptoKey;
      const mockMasterKey = { type: 'secret' } as CryptoKey;
      
      mockDeriveKey.mockResolvedValue(mockWrappingKey);
      mockDecrypt.mockResolvedValue(new ArrayBuffer(32));
      mockImportKey.mockResolvedValue(mockMasterKey);
      
      await cryptoManager.decryptMasterKey('password123', bundle);
      
      expect(cryptoManager.hasMasterKey()).toBe(true);
      expect(mockDeriveKey).toHaveBeenCalled();
      expect(mockDecrypt).toHaveBeenCalled();
      expect(mockImportKey).toHaveBeenCalled();
    });

    it('should throw error on decryption failure', async () => {
      const bundle: EncryptedMasterKeyBundle = {
        encryptedMasterKey: 'invalid',
        masterKeyNonce: 'invalid',
        masterKeySalt: 'invalid',
        iterations: 600000,
      };
      
      mockDeriveKey.mockRejectedValue(new Error('Decryption failed'));
      
      await expect(
        cryptoManager.decryptMasterKey('wrongpassword', bundle)
      ).rejects.toThrow();
    });
  });

  describe('encryptData', () => {
    it('should throw error if master key not loaded', async () => {
      await expect(
        cryptoManager.encryptData('test data')
      ).rejects.toThrow('Master key not loaded');
    });
  });

  describe('decryptData', () => {
    it('should throw error if master key not loaded', async () => {
      const encryptedData: EncryptedData = {
        ciphertext: 'base64ciphertext',
        iv: 'base64iv',
      };
      
      await expect(
        cryptoManager.decryptData(encryptedData)
      ).rejects.toThrow('Master key not loaded');
    });
  });

  describe('reEncryptMasterKey', () => {
    it('should throw error if master key not loaded', async () => {
      await expect(
        cryptoManager.reEncryptMasterKey('newpassword')
      ).rejects.toThrow('Master key not loaded');
    });
  });
});
