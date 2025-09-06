// apiService.js - FIXED: Authentication and API Issues
import axios from 'axios';

// Base URL for API requests
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// For development debugging
const DEBUG = true;

// ✅ CRITICAL FIX: Create a single axios instance for all API calls
const api = axios.create({
  baseURL: API_URL,
  timeout: 20000, // 10 second timeout
});



const mockWorkspaces = [
  {
    _id: '1',
    name: 'Personal Workspace',
    description: 'My personal documents',
    members: [{ _id: 'user1', name: 'John Doe', role: 'owner' }],
    createdAt: new Date().toISOString(),
  },
  {
    _id: '2', 
    name: 'Team Project',
    description: 'Collaborative workspace',
    members: [
      { _id: 'user1', name: 'John Doe', role: 'owner' },
      { _id: 'user2', name: 'Jane Smith', role: 'member' }
    ],
    createdAt: new Date().toISOString(),
  }
];

const mockInvitations = [
  {
    _id: 'inv1',
    workspace: { name: 'Design Team' },
    invitedBy: { name: 'Sarah Wilson' },
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
];








// ✅ FIXED: Improved interceptor setup with better error handling
const setupAxiosInterceptors = () => {
  // Request interceptor - Add auth headers
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('authToken');
      
      if (DEBUG) {
        console.log('🔄 API Request:', config.method?.toUpperCase(), config.url);
        console.log('📝 Token found:', !!token);
      }
      
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
        if (DEBUG) {
          console.log('✅ Authorization header set');
        }
      } else {
        if (DEBUG) {
          console.warn('⚠️ No token found for request');
        }
      }
      
      // Ensure Content-Type is set for non-FormData requests
      if (!config.headers['Content-Type'] && !(config.data instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json';
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

  // Response interceptor - Handle auth errors
  api.interceptors.response.use(
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
          console.error('Headers:', error.response.headers);
        } else if (error.request) {
          console.error('No response received:', error.request);
        }
      }

      // Handle 401 errors (unauthorized)
      if (error.response?.status === 401) {
        console.log('🚨 401 Unauthorized - Clearing token');
        localStorage.removeItem('authToken');
        
        // Dispatch logout action if we have access to store
        if (window.store) {
          window.store.dispatch({ type: 'auth/logout' });
        }
        
        // Redirect to login if not already there
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      
      return Promise.reject(error);
    }
  );
};

// Initialize interceptors
setupAxiosInterceptors();

// ✅ FIXED: Workspace API with consistent error handling
export const workspaceApi = {
  // ✅ Existing - fetch all workspaces
  getWorkspaces: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/workspaces${queryString ? `?${queryString}` : ''}`;

      if (DEBUG) {
        console.log('📋 Fetching workspaces from:', url);
      }

      const response = await api.get(url);

      if (DEBUG) {
        console.log('✅ Workspaces response:', response.data);
      }

      return response.data;
    } catch (error) {
      console.error('❌ Fetch workspaces error:', error);

      if (!error.response) {
        throw new Error('Unable to connect to server. Please check your connection.');
      }

      if (error.response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      }

      if (error.response.status === 403) {
        throw new Error('Access denied. You do not have permission to view workspaces.');
      }

      if (error.response.status >= 500) {
        throw new Error('Server error. Please try again later.');
      }

      throw new Error(error.response?.data?.message || 'Failed to fetch workspaces');
    }
  },

  // MINIMAL FIX: Add just the getWorkspace method to fix your current error
// Add this to your existing workspaceApi object in apiService.js

// ✅ ADD THIS MISSING METHOD to fix the current error
getWorkspace: async (workspaceId) => {
  try {
    if (!workspaceId) {
      throw new Error('Workspace ID is required');
    }

    const url = `/workspaces/${workspaceId}`;

    if (DEBUG) {
      console.log('📋 Fetching single workspace from:', url);
    }

    const response = await api.get(url);

    if (DEBUG) {
      console.log('✅ Single workspace response:', response.data);
    }

    return response.data;
  } catch (error) {
    console.error('❌ Fetch single workspace error:', error);

    if (!error.response) {
      throw new Error('Unable to connect to server. Please check your connection.');
    }

    if (error.response.status === 401) {
      throw new Error('Authentication required. Please log in again.');
    }

    if (error.response.status === 403) {
      throw new Error('Access denied. You do not have permission to view this workspace.');
    }

    if (error.response.status === 404) {
      throw new Error('Workspace not found.');
    }

    if (error.response.status >= 500) {
      throw new Error('Server error. Please try again later.');
    }

    throw new Error(error.response?.data?.message || 'Failed to fetch workspace');
  }
},


  // ✅ New - fetch single workspace by ID
  getWorkspaceById: async (id) => {
    try {
      const url = `/workspaces/${id}`;

      if (DEBUG) {
        console.log('📋 Fetching workspace from:', url);
      }

      const response = await api.get(url);

      if (DEBUG) {
        console.log('✅ Workspace response:', response.data);
      }

      return response.data;
    } catch (error) {
      console.error('❌ Fetch workspace error:', error);

      if (!error.response) {
        throw new Error('Unable to connect to server. Please check your connection.');
      }

      if (error.response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      }

      if (error.response.status === 403) {
        throw new Error('Access denied. You do not have permission to view this workspace.');
      }

      if (error.response.status === 404) {
        throw new Error('Workspace not found.');
      }

      if (error.response.status >= 500) {
        throw new Error('Server error. Please try again later.');
      }

      throw new Error(error.response?.data?.message || 'Failed to fetch workspace');
    }
  }


};




// Add this to temporarily bypass other failing API calls
export const mockApiCall = async (endpoint) => {
  console.log(`🔧 Mock API call to ${endpoint}`);
  await new Promise(resolve => setTimeout(resolve, 200));
  return { data: { success: true, data: [] } };
};

// ✅ FIXED: Document API with consistent usage of api instance
export const documentApi = {
  uploadDocument: async (formData, config = {}) => {
    try {
      const response = await api.post('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        ...config
      });
      return response.data;
    } catch (error) {
      console.error('❌ Upload document error:', error);
      throw error;
    }
  },

  getDocuments: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/documents${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('❌ Get documents error:', error);
      throw error;
    }
  },

  getWorkspaceDocuments: async (workspaceId, params = {}) => {
    try {
      if (!workspaceId || workspaceId === 'undefined') {
        throw new Error('Invalid workspace ID');
      }
      
      const queryString = new URLSearchParams(params).toString();
      const url = `/documents/workspace/${workspaceId}${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error(`❌ Get workspace ${workspaceId} documents error:`, error);
      throw error;
    }
  },

  getDocument: async (documentId) => {
    try {
      if (!documentId || documentId === 'undefined' || documentId === 'null' || documentId === ':documentId') {
        console.error('Invalid document ID passed to getDocument:', documentId);
        throw new Error('Invalid document ID provided');
      }
      
      console.log('Fetching document with ID:', documentId);
      const response = await api.get(`/documents/${documentId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Get document ${documentId} error:`, error);
      throw error;
    }
  },

  updateDocument: async (documentId, updates) => {
    try {
      const response = await api.put(`/documents/${documentId}`, updates);
      return response.data;
    } catch (error) {
      console.error(`❌ Update document ${documentId} error:`, error);
      throw error;
    }
  },

  deleteDocument: async (documentId) => {
    try {
      const response = await api.delete(`/documents/${documentId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Delete document ${documentId} error:`, error);
      throw error;
    }
  },

previewDocument: async (documentId) => {
  try {
    const response = await api.get(`/documents/${documentId}/preview`, {
      responseType: 'blob'
    });
    return response.data; // ✅ Return just the blob data
  } catch (error) {
    console.error(`❌ Preview document ${documentId} error:`, error);
    throw error;
  }
},

  shareDocument: async (documentId, shareData) => {
    try {
      const response = await api.post(`/documents/${documentId}/share`, shareData);
      return response.data;
    } catch (error) {
      console.error(`❌ Share document ${documentId} error:`, error);
      throw error;
    }
  },

  getWorkspaceDocumentStats: async (workspaceId) => {
    try {
      if (!workspaceId || workspaceId === 'undefined') {
        throw new Error('Invalid workspace ID');
      }
      
      const response = await api.get(`/documents/workspace/${workspaceId}/stats`);
      return response.data;
    } catch (error) {
      console.error(`❌ Get workspace document stats ${workspaceId} error:`, error);
      throw error;
    }
  },

  moveDocument: async (documentId, targetWorkspaceId) => {
    try {
      const response = await api.post(`/documents/${documentId}/move`, {
        targetWorkspaceId
      });
      return response.data;
    } catch (error) {
      console.error(`❌ Move document ${documentId} error:`, error);
      throw error;
    }
  },

  duplicateDocument: async (documentId, targetWorkspaceId = null) => {
    try {
      const response = await api.post(`/documents/${documentId}/duplicate`, {
        targetWorkspaceId
      });
      return response.data;
    } catch (error) {
      console.error(`❌ Duplicate document ${documentId} error:`, error);
      throw error;
    }
  },

  bulkDeleteDocuments: async (workspaceId, documentIds) => {
    try {
      const response = await api.post(`/documents/workspace/${workspaceId}/bulk-delete`, {
        documentIds
      });
      return response.data;
    } catch (error) {
      console.error(`❌ Bulk delete documents in workspace ${workspaceId} error:`, error);
      throw error;
    }
  },

  uploadDocumentToWorkspace: async (workspaceId, formData) => {
    try {
      formData.append('workspaceId', workspaceId);
      
      const response = await api.post('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Upload document to workspace error:', error);
      throw error;
    }
  },

  downloadDocument: async (id) => {
    try {
      console.log(`Attempting to download document with ID ${id}`);
      const response = await api.get(`/documents/${id}/preview`, {
        responseType: 'blob'
      });
      console.log('Download response received:', response.status);
      return response;
    } catch (error) {
      console.error(`❌ Download document ${id} error:`, error);
      throw error;
    }
  },

  getSharedDocuments: async () => {
    try {
      const response = await api.get('/documents?shared=true');
      return response.data;
    } catch (error) {
      console.error('❌ Get shared documents error:', error);
      return { success: true, data: [] };
    }
  }
};

// ✅ FIXED: User API with consistent usage of api instance
export const userApi = {
  getProfile: async () => {
    try {
      if (DEBUG) {
        console.log('👤 Fetching user profile...');
      }
      
      const response = await api.get('/users/profile');
      
      if (DEBUG) {
        console.log('✅ Profile fetched:', response.data);
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Get profile error:', error);
      throw error;
    }
  },

  updateProfile: async (userData) => {
    try {
      const updateData = {
        name: userData.name
      };
      
      if (userData.currentPassword && userData.newPassword) {
        updateData.currentPassword = userData.currentPassword;
        updateData.newPassword = userData.newPassword;
      }
      
      if (DEBUG) {
        console.log('Updating profile with data:', {
          ...updateData,
          currentPassword: updateData.currentPassword ? '[REDACTED]' : undefined,
          newPassword: updateData.newPassword ? '[REDACTED]' : undefined
        });
      }
      
      const response = await api.put('/users/profile', updateData);
      
      if (!response || !response.data) {
        throw new Error('No response data received from server');
      }
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Profile update failed');
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Update profile error:', error);
      
      if (!error.response) {
        throw new Error('Cannot connect to server. Please check your internet connection.');
      }
      
      if (error.response.status === 400) {
        throw new Error(error.response.data.message || 'Invalid input. Please check your data.');
      }
      
      if (error.response.status === 401) {
        throw new Error('Current password is incorrect.');
      }
      
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
      
      throw error;
    }
  },

  login: async (email, password) => {
    try {
      if (DEBUG) {
        console.log('🔐 Attempting login for:', email);
      }
      
      const response = await api.post('/users/login', { email, password });
      
      if (response.data && response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        
        if (DEBUG) {
          console.log('✅ Token stored, login successful');
        }
      } else {
        console.error('❌ No token received in login response');
        throw new Error('Authentication failed - no token received');
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Login error:', error);
      
      if (!error.response) {
        throw new Error('Cannot connect to server. Please check if the server is running.');
      }
      
      throw error;
    }
  },

  register: async (name, email, password) => {
    try {
      const response = await api.post('/users/register', { 
        name, 
        email, 
        password 
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Registration error:', error);
      
      if (!error.response) {
        throw new Error('Cannot connect to server. Please check if the server is running.');
      }
      
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('authToken');
    console.log('✅ Token removed from localStorage');
  }
};

// ✅ FIXED: Invitation API with consistent usage of api instance
export const invitationApi = {
sendInvitation: async (invitationData) => {
  try {
    console.log('🔍 RAW INVITATION DATA RECEIVED:', JSON.stringify(invitationData, null, 2));
    console.log('📤 Original invitation data:', invitationData);
    
    // ✅ FIX: Properly map the data fields to match backend expectations
    const requestData = {
      workspaceId: invitationData.workspaceId,
      inviteeEmail: invitationData.inviteeEmail || invitationData.email,
      role: invitationData.role,
      message: invitationData.message || invitationData.customMessage
    };
    
    console.log('🔧 Mapped request data being sent to API:', JSON.stringify(requestData, null, 2));
    console.log('🚀 About to POST to /invitations/send with:', requestData);
    
    // Validate required fields before sending
    if (!requestData.workspaceId) {
      console.error('❌ CRITICAL: workspaceId is missing from request data!');
      throw new Error('workspaceId is required');
    }
    if (!requestData.inviteeEmail) {
      console.error('❌ CRITICAL: inviteeEmail is missing from request data!');
      throw new Error('inviteeEmail is required');
    }
    if (!requestData.role) {
      console.error('❌ CRITICAL: role is missing from request data!');
      throw new Error('role is required');
    }
    
    const response = await api.post('/invitations/send', requestData);
    
    console.log('✅ Invitation sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Send invitation error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    
    if (error.response) {
      console.log('📊 Full error response:', JSON.stringify(error.response.data, null, 2));
    }
    
    throw error;
  }
},

  getInvitationDetails: async (token) => {
    try {
      const response = await api.get(`/invitations/${token}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Get invitation details for token ${token} error:`, error);
      throw error;
    }
  },

  acceptInvitation: async (token) => {
    try {
      const response = await api.post(`/invitations/${token}/accept`);
      return response.data;
    } catch (error) {
      console.error(`❌ Accept invitation ${token} error:`, error);
      throw error;
    }
  },

  rejectInvitation: async (token) => {
    try {
      const response = await api.post(`/invitations/${token}/reject`);
      return response.data;
    } catch (error) {
      console.error(`❌ Reject invitation ${token} error:`, error);
      throw error;
    }
  },

  getPendingInvitations: async () => {
    try {
      console.log('📥 Fetching pending invitations from:', `/invitations/pending`);
      const response = await api.get('/invitations/pending');
      console.log('✅ Pending invitations response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Get pending invitations error:', error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        console.error('Request URL:', error.config?.url);
      } else if (error.request) {
        console.error('No response received:', error.request);
      }
      
      throw error;
    }
  },

  getWorkspaceInvitations: async (workspaceId) => {
    try {
      console.log('📤 Fetching workspace invitations for:', workspaceId);
      const response = await api.get(`/invitations/workspace/${workspaceId}`);
      console.log('✅ Workspace invitations fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Get workspace invitations ${workspaceId} error:`, error);
      throw error;
    }
  },

  cancelInvitation: async (invitationId) => {
    try {
      const response = await api.delete(`/invitations/${invitationId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Cancel invitation ${invitationId} error:`, error);
      throw error;
    }
  },

  resendInvitation: async (invitationId) => {
    try {
      const response = await api.post(`/invitations/${invitationId}/resend`);
      return response.data;
    } catch (error) {
      console.error(`❌ Resend invitation ${invitationId} error:`, error);
      throw error;
    }
  }
};

// ✅ UTILITY: Expose the configured api instance for direct use if needed
export const apiInstance = api;

// ✅ UTILITY: Function to manually set auth header (useful for debugging)
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('authToken', token);
    console.log('✅ Auth token set manually');
  } else {
    localStorage.removeItem('authToken');
    console.log('✅ Auth token removed manually');
  }
};

// ✅ UTILITY: Function to check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('authToken');
  return !!token;
};

// BACKWARDS COMPATIBILITY
export const sendInvitation = invitationApi.sendInvitation;
export const getWorkspaceInvitations = invitationApi.getWorkspaceInvitations;
export const getPendingInvitations = invitationApi.getPendingInvitations;

// Export all APIs as a combined object
const apiService = { 
  documentApi, 
  userApi, 
  workspaceApi, 
  invitationApi 
};

export default apiService;