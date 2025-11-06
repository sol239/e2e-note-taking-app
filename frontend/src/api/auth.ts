import FrontendHub from '../utils/FrontendHub';

const API_BASE_URL = 'http://localhost:8000/api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
}

export interface ErrorResponse {
  error: string;
}

export interface Notebook {
  id: string;
  name: string;
}

export interface NotebookConnector {
  id: number;
  user: number;
  notebook: Notebook;
}

export interface Block {
  id: string;
  type: string;
  content: string;
  metadata: Record<string, unknown>;
  settings: Record<string, unknown>;
}

export interface BlockConnector {
  id: number;
  block: Block;
  notebook: string;
}

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const url = `${API_BASE_URL}/login/`;
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

export async function register(userData: RegisterRequest): Promise<AuthResponse> {
  const url = `${API_BASE_URL}/register/`;
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

export async function getNotebooks(): Promise<NotebookConnector[]> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No auth token found');
  }

  const url = `${API_BASE_URL}/notebooks/`;
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

export async function createNotebook(name: string): Promise<Notebook> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No auth token found');
  }

  const url = `${API_BASE_URL}/notebooks/`;
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

export async function updateNotebook(notebookId: string, name: string): Promise<Notebook> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No auth token found');
  }

  const url = `${API_BASE_URL}/notebooks/${notebookId}/`;
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

export async function getNotebookBlocks(notebookId: string): Promise<BlockConnector[]> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No auth token found');
  }

  const url = `${API_BASE_URL}/notebooks/${notebookId}/blocks/`;
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
  FrontendHub.logResponse(url, response.status, data);
  return data;
}

export async function createBlock(notebookId: string, blockData: Partial<Block>): Promise<Block> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No auth token found');
  }

  const url = `${API_BASE_URL}/notebooks/${notebookId}/blocks/`;
  FrontendHub.logRequest(url, 'POST', blockData);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(blockData),
  });

  if (!response.ok) {
    FrontendHub.logError(url, `Status: ${response.status}`);
    throw new Error('Failed to update block');
  }

  const data = await response.json();
  FrontendHub.logResponse(url, response.status, data);
  return data;
}

export async function deleteBlock(notebookId: string, blockId: string): Promise<void> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No auth token found');
  }

  const url = `${API_BASE_URL}/notebooks/${notebookId}/blocks/${blockId}/`;
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

export async function deleteNotebook(notebookId: string): Promise<void> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No auth token found');
  }

  const url = `${API_BASE_URL}/notebooks/${notebookId}/`;
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

export async function updateBlock(notebookId: string, blockId: string, blockData: Partial<Block>): Promise<Block> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No auth token found');
  }

  const url = `${API_BASE_URL}/notebooks/${notebookId}/blocks/${blockId}/`;
  FrontendHub.logRequest(url, 'PUT', blockData);

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(blockData),
  });

  if (!response.ok) {
    FrontendHub.logError(url, `Status: ${response.status}`);
    throw new Error('Failed to update block');
  }

  const data = await response.json();
  FrontendHub.logResponse(url, response.status, data);
  return data;
}