// Modified apiService.js with correct API routes
import axios from 'axios';

// Base URL for API requests
// Check the backend API routes to ensure these match the actual endpoints
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// For development debugging
const DEBUG = true;

// Configure axios interceptors
const setupAxiosInterceptors = () => {
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      if (DEBUG) {
        console.log('✅ API Request:', config.method.toUpperCase(), config.url);
      }
      return config;
    },
    (error) => {
      if (DEBUG) {
        console.error('❌ Request Error:', error);
      }
      return Promise.reject(error);
    }
  );

  axios.interceptors.response.use(
    (response) => {
      if (DEBUG) {
        console.log('✅ API Response:', response.status, response.config.url);
      }
      return response;
    },
    (error) => {
      if (DEBUG) {
        console.error('❌ Response Error:', error.message);
        if (error.response) {
          console.error('Status:', error.response.status);
          console.error('Data:', error.response.data);
        } else if (error.request) {
          console.error('No response received:', error.request);
        }
      }

      // Handle 401 errors (unauthorized)
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }
      
      return Promise.reject(error);
    }
  );
};

// Initialize interceptors
setupAxiosInterceptors();

// Document-related API functions
export const documentApi = {
  // Get all documents
  getDocuments: async () => {
    try {
      const response = await axios.get(`${API_URL}/documents`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      return [];
    }
  },
  
  // Upload a new document
  uploadDocument: async (formData) => {
    const response = await axios.post(`${API_URL}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  // Download a document
  downloadDocument: async (id) => {
    try {
      // Try first with /download endpoint
      const response = await axios.get(`${API_URL}/documents/${id}/download`, {
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // If 404, try alternative endpoint
        const response = await axios.get(`${API_URL}/documents/${id}`, {
          responseType: 'blob'
        });
        return response;
      }
      throw error;
    }
  },
  
  // Delete a document
  deleteDocument: async (id) => {
    const response = await axios.delete(`${API_URL}/documents/${id}`);
    return response.data;
  },
  
  // Get documents shared with user
  getSharedDocuments: async () => {
    try {
      const response = await axios.get(`${API_URL}/documents/shared`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch shared documents:', error);
      // If 404, the endpoint may not exist yet
      if (error.response && error.response.status === 404) {
        return [];
      }
      throw error;
    }
  },
  
  // Share a document with another user
  shareDocument: async (documentId, userId) => {
    const response = await axios.post(`${API_URL}/documents/${documentId}/share`, { userId });
    return response.data;
  }
};

// User-related API functions
export const userApi = {
  // Get user profile
  getProfile: async () => {
    const response = await axios.get(`${API_URL}/users/profile`);
    return response.data;
  },

  // Update user profile
  updateProfile: async (userData) => {
    const response = await axios.put(`${API_URL}/users/profile`, userData);
    return response.data;
  },

  // Login function - try multiple possible endpoints
  login: async (email, password) => {
    try {
      // Try standard endpoint first
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      // Store the token in localStorage
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
      }
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // If 404, try alternative endpoints
        try {
          // Try without /auth prefix
          const response = await axios.post(`${API_URL}/login`, { email, password });
          if (response.data.token) {
            localStorage.setItem('authToken', response.data.token);
          }
          return response.data;
        } catch (innerError) {
          // If that fails too, try with /users prefix
          if (innerError.response && innerError.response.status === 404) {
            const response = await axios.post(`${API_URL}/users/login`, { email, password });
            if (response.data.token) {
              localStorage.setItem('authToken', response.data.token);
            }
            return response.data;
          }
          throw innerError;
        }
      }
      
      if (!error.response) {
        // Network error
        throw new Error('Cannot connect to server. Please check if the server is running.');
      }
      throw error;
    }
  },
  
  // Register function - try multiple possible endpoints
  register: async (name, email, password) => {
    try {
      // Try standard endpoint first
      const response = await axios.post(`${API_URL}/auth/register`, { 
        name, 
        email, 
        password 
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // If 404, try alternative endpoints
        try {
          // Try without /auth prefix
          const response = await axios.post(`${API_URL}/register`, { 
            name, 
            email, 
            password 
          });
          return response.data;
        } catch (innerError) {
          // If that fails too, try with /users prefix
          if (innerError.response && innerError.response.status === 404) {
            const response = await axios.post(`${API_URL}/users/register`, { 
              name, 
              email, 
              password 
            });
            return response.data;
          }
          throw innerError;
        }
      }
      
      if (!error.response) {
        // Network error
        throw new Error('Cannot connect to server. Please check if the server is running.');
      }
      throw error;
    }
  },
  
  // Logout function
  logout: () => {
    localStorage.removeItem('authToken');
  }
};

// Check server connection
export const checkServerConnection = async () => {
  try {
    // Try a few potential health check endpoints
    try {
      await axios.get('/api/health', { timeout: 5000 });
      return true;
    } catch (error) {
      if (error.response && error.response.status !== 404) {
        return true; // Server is running but no health endpoint
      }
      // Try root endpoint
      await axios.get('/api', { timeout: 5000 });
      return true;
    }
  } catch (error) {
    console.error('Server connection check failed:', error.message);
    return false;
  }
};

// Export both APIs as a combined object
const apiService = { documentApi, userApi, checkServerConnection };

export default apiService;