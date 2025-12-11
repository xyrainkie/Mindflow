import { Note, Category, NotesResponse, User, AuthResponse } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const isFormData = options.body instanceof FormData;
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.setToken(null);
      throw new Error('认证失败，请重新登录');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth endpoints
  async register(email: string, username: string, password: string): Promise<AuthResponse> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password }),
    });
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(response.token);
    return response;
  }

  async guestLogin(): Promise<AuthResponse> {
    const response = await this.request('/auth/guest', {
      method: 'POST'
    });
    this.setToken(response.token);
    return response;
  }

  async logout() {
    this.setToken(null);
  }

  async getProfile(): Promise<User> {
    return this.request('/auth/profile');
  }

  // Notes endpoints
  async getNotes(params?: {
    category?: Category;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<NotesResponse> {
    const searchParams = new URLSearchParams();
    if (params?.category && params.category !== Category.ALL) {
      searchParams.append('category', params.category);
    }
    if (params?.search) {
      searchParams.append('search', params.search);
    }
    if (params?.page) {
      searchParams.append('page', params.page.toString());
    }
    if (params?.limit) {
      searchParams.append('limit', params.limit.toString());
    }

    const query = searchParams.toString();
    return this.request(`/notes${query ? `?${query}` : ''}`);
  }

  async getNote(id: string): Promise<Note> {
    return this.request(`/notes/${id}`);
  }

  async createNote(data: {
    title: string;
    content: string;
    category: Category;
    tags?: string[];
  }): Promise<{ message: string; note: Note }> {
    return this.request('/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateNote(id: string, data: {
    title: string;
    content: string;
    category: Category;
    tags?: string[];
  }): Promise<{ message: string; note: Note }> {
    return this.request(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteNote(id: string): Promise<{ message: string }> {
    return this.request(`/notes/${id}`, {
      method: 'DELETE',
    });
  }

  // AI endpoints
  async processWithAI(noteId: string, action: string, file?: File): Promise<{ success: boolean; result: string; action: string }> {
    const formData = new FormData();
    formData.append('action', action);
    if (file) {
      formData.append('file', file);
    }

    return this.request(`/ai/process/${noteId}`, {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  async processTextWithAI(text: string, action: string, file?: File, provider?: 'gemini' | 'custom', model?: string): Promise<{ success: boolean; result: string; action: string }> {
    const formData = new FormData();
    formData.append('text', text);
    formData.append('action', action);
    if (file) {
      formData.append('file', file);
    }
    if (provider) formData.append('provider', provider);
    if (model) formData.append('model', model);

    return this.request('/ai/process', {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  async chatWithAI(params: {
    provider: 'gemini' | 'custom';
    model: string;
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
    apiKey?: string;
  }): Promise<{ success: boolean; output: string }> {
    return this.request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

export const apiService = new ApiService();
export default apiService;
