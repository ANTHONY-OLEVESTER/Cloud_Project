// Standalone API client for the Node.js backend
const getApiBase = () => {
  try {
    return import.meta.env?.VITE_API_BASE_URL || 'http://localhost:3001/api';
  } catch (error) {
    return 'http://localhost:3001/api';
  }
};

const API_BASE = getApiBase();

interface AuthResponse {
  message: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    company: string;
  };
  token: string;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('auth_token');
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth methods
  async signup(userData: { 
    email: string; 
    password: string; 
    firstName: string; 
    lastName: string; 
    company: string 
  }): Promise<AuthResponse> {
    const response = await this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData)
    });

    this.setToken(response.token);
    return response;
  }

  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });

    this.setToken(response.token);
    return response;
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private setToken(token: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Dashboard methods
  async getDashboardMetrics() {
    return this.request('/dashboard/metrics');
  }

  async getProviders() {
    return this.request('/dashboard/providers');
  }

  // Cloud connections methods
  async addProvider(providerData: any) {
    return this.request('/connections/add', {
      method: 'POST',
      body: JSON.stringify(providerData)
    });
  }

  async removeProvider(providerId: string) {
    return this.request(`/connections/${providerId}`, {
      method: 'DELETE'
    });
  }

  async syncProvider(providerId: string) {
    return this.request(`/connections/${providerId}/sync`, {
      method: 'POST'
    });
  }

  // Policies methods
  async getPolicies() {
    return this.request('/policies');
  }

  // Settings methods
  async getProfile() {
    return this.request('/settings/profile');
  }

  async updateProfile(profileData: any) {
    return this.request('/settings/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  async changePassword(passwordData: { currentPassword: string; newPassword: string }) {
    return this.request('/settings/password', {
      method: 'PUT',
      body: JSON.stringify(passwordData)
    });
  }

  // Services methods
  async getProvider(providerId: string) {
    return this.request(`/services/providers/${providerId}`);
  }

  async getProviderServices(providerId: string) {
    return this.request(`/services/providers/${providerId}/services`);
  }

  async getServiceViolations(providerId: string) {
    return this.request(`/services/providers/${providerId}/violations`);
  }

  async scanProviderServices(providerId: string) {
    return this.request(`/services/providers/${providerId}/scan`, {
      method: 'POST'
    });
  }
}

export const api = new ApiClient();