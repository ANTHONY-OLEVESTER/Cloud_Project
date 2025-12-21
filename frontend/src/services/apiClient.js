import axios from 'axios';

// 1. Get the base URL from environment
// We handle both cases: with or without trailing slash
let baseURL = import.meta.env.VITE_API_URL || '/api';

// 2. SAFETY FIX: Remove any trailing slash from the base URL to prevent double-slashes
if (baseURL.endsWith('/')) {
  baseURL = baseURL.slice(0, -1);
}

// 3. Create the Axios instance
// We export it as a NAMED export ({ apiClient }) to match your hooks.js
export const apiClient = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 4. Request Interceptor (Optional)
apiClient.interceptors.request.use(
  (config) => {
    const token = window.localStorage.getItem("cloud_guard_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);


// 5. Response Interceptor (Better error handling)
apiClient.interceptors.response.use(
  (response) => response.data, // Return data directly to match common React Query patterns
  (error) => {
    console.error(`API Error on ${error.config?.url}:`, error.response?.data || error.message);
    return Promise.reject(error);
  }
);