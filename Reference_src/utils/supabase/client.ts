import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

// API helper functions
const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-5e12339f`;

export const api = {
  async call(endpoint: string, options: RequestInit = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {})
    };

    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
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
  },

  // Auth methods
  async signup(userData: { email: string; password: string; firstName: string; lastName: string; company: string }) {
    // For signup, we don't need authentication, so call directly without session check
    const response = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  },

  // Dashboard methods
  async getDashboardMetrics() {
    return this.call('/dashboard/metrics');
  },

  async getProviders() {
    return this.call('/dashboard/providers');
  },

  // Cloud connections methods
  async addProvider(providerData: any) {
    return this.call('/connections/add', {
      method: 'POST',
      body: JSON.stringify(providerData)
    });
  },

  async removeProvider(providerId: string) {
    return this.call(`/connections/${providerId}`, {
      method: 'DELETE'
    });
  },

  async syncProvider(providerId: string) {
    return this.call(`/connections/${providerId}/sync`, {
      method: 'POST'
    });
  },

  // Policies methods
  async getPolicies() {
    return this.call('/policies');
  },

  // Settings methods
  async getProfile() {
    return this.call('/settings/profile');
  },

  async updateProfile(profileData: any) {
    return this.call('/settings/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  },

  // Services methods
  async getProvider(providerId: string) {
    return this.call(`/providers/${providerId}`);
  },

  async getProviderServices(providerId: string) {
    return this.call(`/providers/${providerId}/services`);
  },

  async getServiceViolations(providerId: string) {
    return this.call(`/providers/${providerId}/violations`);
  },

  async scanProviderServices(providerId: string) {
    return this.call(`/providers/${providerId}/scan`, {
      method: 'POST'
    });
  }
};