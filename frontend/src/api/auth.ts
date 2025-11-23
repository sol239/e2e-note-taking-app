/**
 * Auth API - Handles all backend API communication.
 * 
 * Provides functions for authentication, notebook/block CRUD operations,
 * export/import, and two-factor authentication. Automatically handles
 * encryption/decryption of content using CryptoManager.
 * 
 * All functions that modify data require an auth token stored in localStorage.
 */

import FrontendHub from '../utils/FrontendHub';
import { CryptoManager } from '../utils/CryptoManager';

const API_BASE_URL = 'http://localhost:8000/api';
const ACCOUNTS_URL = `${API_BASE_URL}/accounts`;
const NOTES_URL = `${API_BASE_URL}/notes`;

/** Login request payload */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Registration request with encrypted master key bundle */
export interface RegisterRequest {
  email: string;
  password: string;
  encrypted_master_key: string;
  master_key_nonce: string;
  master_key_salt: string;
  argon_memory: number; // Used for iterations in PBKDF2
  argon_time: number;
}

/** Encrypted master key bundle from backend */
export interface EncryptedMasterKeyResponse {
  encrypted_master_key: string;
  nonce: string;
  salt: string;
  argon_memory: number;
  argon_time: number;
}

/** Authentication response with optional 2FA requirement */
export interface AuthResponse {
  token?: string;
  tfa_required?: boolean;
  temp_token?: string;
}

/** Two-factor authentication setup response */
export interface TFASetupResponse {
  secret: string;
  qr: string;
  uri: string;
  recovery_keys: string[];
}

export interface ErrorResponse {
  error: string;
}

export interface Notebook {
  id: string;
  name: string;
}

export interface NotebookConnector {
  notebook: Notebook;
  last_opened?: string;
}

export interface Block {
  id: string;
  type: string;
  content: string;
  metadata: Record<string, unknown>;
  settings: Record<string, unknown>;
}

export interface BlockConnector {
  block: Block;
  position_id: number;
  position_order: number;
}

export interface User {
  email: string;
  first_name: string;
  last_name: string;
  nickname: string;
  totp_enabled: boolean;
}

/**
 * Fetch the authenticated user's profile.
 * @returns User profile data
 * @throws Error if not authenticated or request fails
 */
export async function getUser(): Promise<User> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No auth token found');
  }

  const url = `${ACCOUNTS_URL}/user/`;
  FrontendHub.logRequest(url, 'GET');

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    FrontendHub.logError(url, `Status: ${response.status}`);
    throw new Error('Failed to fetch user');
  }

  const data = await response.json();
  FrontendHub.logResponse(url, response.status, data);
  return data;
}

/**
 * Authenticate user with email and password.
 * @param credentials - User email and password
 * @returns Auth response with token or 2FA requirement
 * @throws Error if login fails
 */
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const url = `${ACCOUNTS_URL}/login/`;
  FrontendHub.logRequest(url, 'POST', credentials);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData: ErrorResponse = await response.json();
    FrontendHub.logError(url, errorData);
    throw new Error(errorData.error || 'Login failed');
  }

  const data = await response.json();
  FrontendHub.logResponse(url, response.status, data);
  return data;
}

/**
 * Register a new user with encrypted master key.
 * @param userData - User registration data including encrypted master key bundle
 * @returns Auth response with token
 * @throws Error if registration fails
 */
export async function register(userData: RegisterRequest): Promise<AuthResponse> {
  const url = `${ACCOUNTS_URL}/register/`;
  FrontendHub.logRequest(url, 'POST', userData);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const errorData: ErrorResponse = await response.json();
    FrontendHub.logError(url, errorData);
    throw new Error(errorData.error || 'Registration failed');
  }

  const data = await response.json();
  FrontendHub.logResponse(url, response.status, data);
  return data;
}

/**
 * Fetch all notebooks for the authenticated user.
 * @returns Array of notebook connectors with last_opened timestamps
 * @throws Error if not authenticated or request fails
 */
export async function getNotebooks(): Promise<NotebookConnector[]> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No auth token found');
  }

  const url = `${NOTES_URL}/notebooks/`;
  FrontendHub.logRequest(url, 'GET');

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    FrontendHub.logError(url, `Status: ${response.status}`);
    throw new Error('Failed to fetch notebooks');
  }

  const data = await response.json();
  FrontendHub.logResponse(url, response.status, data);
  return data;
}

/**
 * Create a new notebook.
 * @param name - Name for the new notebook
 * @returns Created notebook data
 * @throws Error if not authenticated or creation fails
 */
export async function createNotebook(name: string): Promise<Notebook> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No auth token found');
  }

  const url = `${NOTES_URL}/notebooks/`;
  const body = { name };
  FrontendHub.logRequest(url, 'POST', body);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    FrontendHub.logError(url, `Status: ${response.status}`);
    throw new Error('Failed to create notebook');
  }

  const data = await response.json();
  FrontendHub.logResponse(url, response.status, data);
  return data;
}

/**
 * Update a notebook's name.
 * @param notebookId - ID of the notebook to update
 * @param name - New name for the notebook
 * @returns Updated notebook data
 * @throws Error if not authenticated or update fails
 */
export async function updateNotebook(notebookId: string, name: string): Promise<Notebook> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No auth token found');
  }

  const url = `${NOTES_URL}/notebooks/${notebookId}/`;
  const body = { name };
  FrontendHub.logRequest(url, 'PUT', body);

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    FrontendHub.logError(url, `Status: ${response.status}`);
    throw new Error('Failed to update notebook');
  }

  const data = await response.json();
  FrontendHub.logResponse(url, response.status, data);
  return data;
}

/**
 * Fetch all blocks for a notebook with automatic decryption.
 * @param notebookId - ID of the notebook
 * @returns Array of block connectors with decrypted content
 * @throws Error if not authenticated or request fails
 */
export async function getNotebookBlocks(notebookId: string): Promise<BlockConnector[]> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No auth token found');
  }

  const url = `${NOTES_URL}/notebooks/${notebookId}/blocks/`;
  FrontendHub.logRequest(url, 'GET');

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    FrontendHub.logError(url, `Status: ${response.status}`);
    throw new Error('Failed to fetch notebook blocks');
  }

  const data = await response.json();

  // Decrypt content
  const cryptoManager = CryptoManager.getInstance();
  if (cryptoManager.hasMasterKey()) {
    for (const connector of data) {
      if (connector.block.content) {
        try {
          // Check if content looks like JSON
          if (connector.block.content.trim().startsWith('{')) {
            const encryptedData = JSON.parse(connector.block.content);
            if (encryptedData.ciphertext && encryptedData.iv) {
              connector.block.content = await cryptoManager.decryptData(encryptedData);
            }
          }
        } catch (e) {
          // Content might not be encrypted or invalid JSON, keep as is
          console.warn(`Failed to decrypt block ${connector.block.id}`, e);
        }
      }
    }
  }

  FrontendHub.logResponse(url, response.status, data);
  return data;
}

/**
 * Create a new block with automatic encryption.
 * @param notebookId - ID of the notebook to add the block to
 * @param blockData - Block data (content will be encrypted)
 * @returns Created block with decrypted content
 * @throws Error if not authenticated, encryption key not loaded, or creation fails
 */
export async function createBlock(notebookId: string, blockData: Partial<Block>): Promise<Block> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No auth token found');
  }

  const url = `${NOTES_URL}/notebooks/${notebookId}/blocks/`;

  // Encrypt content if available
  const cryptoManager = CryptoManager.getInstance();
  const dataToSend = { ...blockData };

  if (dataToSend.content) {
    if (!cryptoManager.hasMasterKey()) {
      throw new Error("Encryption key not loaded. Cannot save unencrypted content.");
    }
    try {
      const encrypted = await cryptoManager.encryptData(dataToSend.content);
      dataToSend.content = JSON.stringify(encrypted);
    } catch (e) {
      console.error("Failed to encrypt block content", e);
      throw e;
    }
  }

  FrontendHub.logRequest(url, 'POST', dataToSend);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dataToSend),
  });

  if (!response.ok) {
    FrontendHub.logError(url, `Status: ${response.status}`);
    throw new Error('Failed to update block');
  }

  const data = await response.json();

  // Decrypt response content so the UI has the plaintext
  if (data.content && cryptoManager.hasMasterKey()) {
    try {
      if (data.content.trim().startsWith('{')) {
        const encryptedData = JSON.parse(data.content);
        if (encryptedData.ciphertext && encryptedData.iv) {
          data.content = await cryptoManager.decryptData(encryptedData);
        }
      }
    } catch (e) {
      console.warn("Failed to decrypt created block content", e);
    }
  }

  FrontendHub.logResponse(url, response.status, data);
  return data;
}

/**
 * Delete a block from a notebook.
 * @param notebookId - ID of the notebook containing the block
 * @param blockId - ID of the block to delete
 * @throws Error if not authenticated or deletion fails
 */
export async function deleteBlock(notebookId: string, blockId: string): Promise<void> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No auth token found');
  }

  const url = `${NOTES_URL}/notebooks/${notebookId}/blocks/${blockId}/`;
  FrontendHub.logRequest(url, 'DELETE');

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    FrontendHub.logError(url, `Status: ${response.status}`);
    throw new Error('Failed to delete block');
  }

  FrontendHub.logResponse(url, response.status);
}

/**
 * Delete a notebook and all its blocks.
 * @param notebookId - ID of the notebook to delete
 * @throws Error if not authenticated or deletion fails
 */
export async function deleteNotebook(notebookId: string): Promise<void> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No auth token found');
  }

  const url = `${NOTES_URL}/notebooks/${notebookId}/`;
  FrontendHub.logRequest(url, 'DELETE');

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    FrontendHub.logError(url, `Status: ${response.status}`);
    throw new Error('Failed to delete notebook');
  }

  FrontendHub.logResponse(url, response.status);
}

/**
 * Update a block with automatic encryption.
 * @param notebookId - ID of the notebook containing the block
 * @param blockId - ID of the block to update
 * @param blockData - Updated block data (content will be encrypted)
 * @returns Updated block with decrypted content
 * @throws Error if not authenticated, encryption key not loaded, or update fails
 */
export async function updateBlock(notebookId: string, blockId: string, blockData: Partial<Block>): Promise<Block> {
  console.log("updateBlock() called")

  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No auth token found');
  }

  const url = `${NOTES_URL}/notebooks/${notebookId}/blocks/${blockId}/`;

  // Encrypt content if available
  const cryptoManager = CryptoManager.getInstance();
  const dataToSend = { ...blockData };

  cryptoManager.logCryptoManagerDetails();

  if (dataToSend.content) {
    if (!cryptoManager.hasMasterKey()) {
      throw new Error("Encryption key not loaded. Cannot save unencrypted content.");
    }
    try {
      const encrypted = await cryptoManager.encryptData(dataToSend.content);
      console.log("Encrypted data:", encrypted);
      dataToSend.content = JSON.stringify(encrypted);
    } catch (e) {
      console.error("Failed to encrypt block content", e);
      throw e;
    }
  }

  FrontendHub.logRequest(url, 'PUT', dataToSend);

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dataToSend),
  });

  if (!response.ok) {
    FrontendHub.logError(url, `Status: ${response.status}`);
    if (response.status === 404) {
      throw new Error('404 Not Found');
    }
    throw new Error('Failed to update block');
  }

  const data = await response.json();

  // Decrypt response content
  if (data.content && cryptoManager.hasMasterKey()) {
    try {
      if (data.content.trim().startsWith('{')) {
        const encryptedData = JSON.parse(data.content);
        if (encryptedData.ciphertext && encryptedData.iv) {
          data.content = await cryptoManager.decryptData(encryptedData);
        }
      }
    } catch (e) {
      console.warn("Failed to decrypt updated block content", e);
    }
  }

  FrontendHub.logResponse(url, response.status, data);
  return data;
}

/**
 * Export a notebook to JSON or ZIP format and trigger download.
 * @param notebookId - ID of the notebook to export
 * @param format - Export format ('json' or 'zip')
 * @throws Error if not authenticated or export fails
 */
export async function exportNotebook(notebookId: string, format: string): Promise<void> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No auth token found');
  }

  const url = `${NOTES_URL}/notebooks/${notebookId}/export/?export_format=${format}`;
  FrontendHub.logRequest(url, 'GET');

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Token ${token}`,
    },
  });

  if (!response.ok) {
    FrontendHub.logError(url, `Status: ${response.status}`);
    throw new Error('Failed to export notebook');
  }

  // Handle file download
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;

  // Try to get filename from header
  const contentDisposition = response.headers.get('Content-Disposition');
  let filename = `notebook-${notebookId}.${format === 'zip' ? 'zip' : 'json'}`;
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
    if (filenameMatch && filenameMatch.length === 2) {
      filename = filenameMatch[1];
    }
  }

  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(downloadUrl);
  document.body.removeChild(a);

  FrontendHub.logResponse(url, response.status, 'File downloaded');
}

/**
 * Import a notebook from a JSON or ZIP file.
 * @param file - File to import (JSON or ZIP)
 * @returns Imported notebook data
 * @throws Error if not authenticated or import fails
 */
export async function importNotebook(file: File): Promise<Notebook> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No auth token found');
  }

  const url = `${NOTES_URL}/notebooks/import/`;
  const formData = new FormData();
  formData.append('file', file);

  FrontendHub.logRequest(url, 'POST', 'File upload');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    FrontendHub.logError(url, `Status: ${response.status}`);
    throw new Error(errorData.error || 'Failed to import notebook');
  }

  const data = await response.json();
  FrontendHub.logResponse(url, response.status, data);
  return data;
}

/**
 * Initialize two-factor authentication setup.
 * @returns TFA setup data including QR code and recovery keys
 * @throws Error if not authenticated or setup fails
 */
export async function tfaSetup(): Promise<TFASetupResponse> {
  const token = localStorage.getItem('authToken');
  const url = `${ACCOUNTS_URL}/tfa/setup/`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('TFA setup failed');
  return response.json();
}

/**
 * Enable two-factor authentication after setup.
 * @param code - 6-digit TOTP code from authenticator app
 * @throws Error if not authenticated or code is invalid
 */
export async function tfaEnable(code: string): Promise<void> {
  const token = localStorage.getItem('authToken');
  const url = `${ACCOUNTS_URL}/tfa/enable/`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });
  if (!response.ok) throw new Error('TFA enable failed');
}

/**
 * Verify two-factor authentication code during login.
 * @param temp_token - Temporary token from initial login
 * @param code - TOTP code or recovery key
 * @returns Auth response with final token
 * @throws Error if verification fails
 */
export async function tfaVerify(temp_token: string, code: string): Promise<AuthResponse> {
  const url = `${ACCOUNTS_URL}/tfa/verify/`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ temp_token, code }),
  });
  if (!response.ok) throw new Error('TFA verify failed');
  return response.json();
}

/**
 * Disable two-factor authentication.
 * @throws Error if not authenticated or disable fails
 */
export async function tfaDisable(): Promise<void> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No auth token found');
  }

  const url = `${ACCOUNTS_URL}/tfa/disable/`;
  FrontendHub.logRequest(url, 'POST');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    FrontendHub.logError(url, `Status: ${response.status}`);
    throw new Error('Failed to disable TFA');
  }

  FrontendHub.logResponse(url, response.status, {});
}

/**
 * Fetch the encrypted master key bundle for the authenticated user.
 * Used to decrypt the master key after login.
 * @returns Encrypted master key bundle
 * @throws Error if not authenticated or request fails
 */
export async function getEncryptedMasterKey(): Promise<EncryptedMasterKeyResponse> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No auth token found');
  }

  const url = `${ACCOUNTS_URL}/encrypted-master/`;
  FrontendHub.logRequest(url, 'GET');

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    FrontendHub.logError(url, `Status: ${response.status}`);
    throw new Error('Failed to fetch master key bundle');
  }

  const data = await response.json();
  FrontendHub.logResponse(url, response.status, data);
  return data;
}

/**
 * Delete the authenticated user's account and all associated data.
 * @throws Error if deletion fails
 */
export async function deleteAccount(): Promise<void> {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No auth token found');

  const response = await fetch(`${ACCOUNTS_URL}/delete/`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Token ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete account');
  }
}

/** Change password request payload */
export interface ChangePasswordRequest {
  old_password?: string; // Optional if we validate on frontend, but backend should validate too
  new_password: string;
  encrypted_master_key: string;
  master_key_nonce: string;
  master_key_salt: string;
  argon_memory: number;
  argon_time: number;
}

/**
 * Change the user's password and re-encrypt the master key.
 */
export async function changePassword(data: ChangePasswordRequest): Promise<void> {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No auth token found');

  const response = await fetch(`${ACCOUNTS_URL}/change-password/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to change password');
  }
}