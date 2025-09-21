// Frontend API Configuration Example
// Copy this to your frontend repository and update the API_BASE_URL

// For development
const DEV_API_URL = 'http://localhost:8000'

// For production - replace with your actual Railway app URL
const PROD_API_URL = 'https://your-app-name.up.railway.app'

// Automatically select based on environment
export const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? PROD_API_URL
  : DEV_API_URL

// Alternative: Use environment variable
// export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000'

// API Client example
export class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  async get(endpoint: string, options?: RequestInit) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    return response.json()
  }

  async post(endpoint: string, data?: any, options?: RequestInit) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    return response.json()
  }

  // Add other HTTP methods as needed (PUT, DELETE, etc.)
}

// Usage example:
// const apiClient = new ApiClient()
// const healthCheck = await apiClient.get('/health')
// const accounts = await apiClient.get('/api/accounts')

// Environment variables you should set in your frontend deployment:
// REACT_APP_API_URL=https://your-app-name.up.railway.app
// or
// VITE_API_URL=https://your-app-name.up.railway.app (for Vite)
// or
// NEXT_PUBLIC_API_URL=https://your-app-name.up.railway.app (for Next.js)