// Fixed apiService.js with correct endpoints
import axios from 'axios';

// Base URL for API requests
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
        // Don't redirect automatically - let the AuthContext handle this
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
  getAllDocuments: async () => {
    try {
      const response = await axios.get(`${API_URL}/documents`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      throw error;
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
    const response = await axios.get(`${API_URL}/documents/${id}`, {
      responseType: 'blob'
    });
    return response;
  },
  
  // Delete a document
  deleteDocument: async (id) => {
    const response = await axios.delete(`${API_URL}/documents/${id}`);
    return response.data;
  },
  
  // Get documents shared with user (Uses regular documents endpoint with filter)
  getSharedDocuments: async () => {
    try {
      // Use the regular documents endpoint since there is no specific shared endpoint
      const response = await axios.get(`${API_URL}/documents`);
      
      // Filter shared documents on the client side (documents where user is not the owner)
      if (response.data && response.data.data) {
        // If we have user information, we can filter server-side eventually
        return {
          ...response.data,
          data: response.data.data.filter(doc => {
            // A document is shared if the user has permissions but is not the owner
            // This is a client-side approximation - proper implementation would be server-side
            return doc.permissions && doc.permissions.length > 0;
          })
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Failed to fetch shared documents:', error);
      // Return empty data structure on error to prevent dashboard crashes
      return { success: true, data: [] };
    }
  }
};

// User-related API functions
export const userApi = {
  // Get user profile
  getProfile: async () => {
    const response = await axios.get(`${API_URL}/users/profile`);
    return response.data;
  },

  // Login function with correct endpoint
  login: async (email, password) => {
    try {
      // Use the correct endpoint based on routes.js
      const response = await axios.post(`${API_URL}/users/login`, { email, password });
      
      // Store the token in localStorage
      if (response.data && response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        // Set default header for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      } else {
        console.error('No token received in login response');
        throw new Error('Authentication failed - no token received');
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      
      if (!error.response) {
        throw new Error('Cannot connect to server. Please check if the server is running.');
      }
      
      throw error;
    }
  },
  
  // Register function with correct endpoint
  register: async (name, email, password) => {
    try {
      // Use the correct endpoint based on routes.js
      const response = await axios.post(`${API_URL}/users/register`, { 
        name, 
        email, 
        password 
      });
      
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      
      if (!error.response) {
        throw new Error('Cannot connect to server. Please check if the server is running.');
      }
      
      throw error;
    }
  },
  
  // Logout function
  logout: () => {
    localStorage.removeItem('authToken');
    // Also clear the Authorization header
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Export both APIs as a combined object
const apiService = { documentApi, userApi };

export default apiService;