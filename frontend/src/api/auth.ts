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
  const response = await fetch(`${API_BASE_URL}/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData: ErrorResponse = await response.json();
    throw new Error(errorData.error || 'Login failed');
  }

  return response.json();
}

export async function register(userData: RegisterRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/register/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const errorData: ErrorResponse = await response.json();
    throw new Error(errorData.error || 'Registration failed');
  }

  return response.json();
}

export async function getNotebooks(): Promise<NotebookConnector[]> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No auth token found');
  }

  const response = await fetch(`${API_BASE_URL}/notebooks/`, {
    method: 'GET',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch notebooks');
  }

  return response.json();
}

export async function createNotebook(name: string): Promise<Notebook> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No auth token found');
  }

  const response = await fetch(`${API_BASE_URL}/notebooks/`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    throw new Error('Failed to create notebook');
  }

  return response.json();
}

export async function updateNotebook(notebookId: string, name: string): Promise<Notebook> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No auth token found');
  }

  const response = await fetch(`${API_BASE_URL}/notebooks/${notebookId}/`, {
    method: 'PUT',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    throw new Error('Failed to update notebook');
  }

  return response.json();
}

export async function getNotebookBlocks(notebookId: string): Promise<BlockConnector[]> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No auth token found');
  }

  const response = await fetch(`${API_BASE_URL}/notebooks/${notebookId}/blocks/`, {
    method: 'GET',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch notebook blocks');
  }

  return response.json();
}

export async function createBlock(notebookId: string, blockData: Partial<Block>): Promise<Block> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No auth token found');
  }

  const response = await fetch(`${API_BASE_URL}/notebooks/${notebookId}/blocks/`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(blockData),
  });

  if (!response.ok) {
    throw new Error('Failed to create block');
  }

  return response.json();
}

export async function updateBlock(notebookId: string, blockId: string, blockData: Partial<Block>): Promise<Block> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No auth token found');
  }

  const response = await fetch(`${API_BASE_URL}/notebooks/${notebookId}/blocks/${blockId}/`, {
    method: 'PUT',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(blockData),
  });

  if (!response.ok) {
    throw new Error('Failed to update block');
  }

  return response.json();
}