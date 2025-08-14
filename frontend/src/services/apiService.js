// apiService.js - Centralized API service with document, user, workspace, and invitation endpoints
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

  // Get documents by workspace
  getWorkspaceDocuments: async (workspaceId, filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.tags) params.append('tags', filters.tags.join(','));
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      const queryString = params.toString();
      const url = `${API_URL}/documents/workspace/${workspaceId}${queryString ? `?${queryString}` : ''}`;
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch workspace documents for ${workspaceId}:`, error);
      throw error;
    }
  },

  // Get workspace document statistics
  getWorkspaceDocumentStats: async (workspaceId) => {
    try {
      const response = await axios.get(`${API_URL}/documents/workspace/${workspaceId}/stats`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch workspace document stats for ${workspaceId}:`, error);
      throw error;
    }
  },

  // Move document between workspaces
  moveDocument: async (documentId, targetWorkspaceId) => {
    try {
      const response = await axios.post(`${API_URL}/documents/${documentId}/move`, {
        targetWorkspaceId
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to move document ${documentId}:`, error);
      throw error;
    }
  },

  // Duplicate document
  duplicateDocument: async (documentId, targetWorkspaceId = null) => {
    try {
      const response = await axios.post(`${API_URL}/documents/${documentId}/duplicate`, {
        targetWorkspaceId
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to duplicate document ${documentId}:`, error);
      throw error;
    }
  },

  // Bulk delete documents
  bulkDeleteDocuments: async (workspaceId, documentIds) => {
    try {
      const response = await axios.post(`${API_URL}/documents/workspace/${workspaceId}/bulk-delete`, {
        documentIds
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to bulk delete documents in workspace ${workspaceId}:`, error);
      throw error;
    }
  },
  
  // Get single document details
  getDocument: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/documents/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch document with ID ${id}:`, error);
      throw error;
    }
  },

  // Updated previewDocument function for apiService.js
  previewDocument: async (id) => {
    try {
      console.log(`Attempting to preview document with ID ${id}`);
      const response = await axios.get(`${API_URL}/documents/${id}/preview`, {
        responseType: 'blob'
      });
      console.log('Preview response received:', response.status);
      return response.data;
    } catch (error) {
      console.error(`Failed to preview document with ID ${id}:`, error);
      
      // Log more detailed error info
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
        // If we got a 404, it means the preview endpoint might not be implemented
        if (error.response.status === 404) {
          console.warn('Preview endpoint returned 404 - falling back to document download');
          // We could implement a fallback here, but we'll let the component handle this
        }
      }
      
      throw error;
    }
  },
  
  // Upload a new document
  uploadDocument: async (formData) => {
    try {
      const response = await axios.post(`${API_URL}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to upload document:', error);
      throw error;
    }
  },
  
  // Upload document to specific workspace
  uploadDocumentToWorkspace: async (workspaceId, formData) => {
    try {
      // Add workspace ID to form data
      formData.append('workspaceId', workspaceId);
      
      const response = await axios.post(`${API_URL}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to upload document to workspace:', error);
      throw error;
    }
  },
  
  // Download a document
  downloadDocument: async (id) => {
    try {
      console.log(`Attempting to download document with ID ${id}`);
      // This should point to the /preview endpoint which serves the file content
      const response = await axios.get(`${API_URL}/documents/${id}/preview`, {
        responseType: 'blob'
      });
      console.log('Download response received:', response.status);
      return response;
    } catch (error) {
      console.error(`Failed to download document with ID ${id}:`, error);
      throw error;
    }
  },
  
  // Delete a document
  deleteDocument: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/documents/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to delete document with ID ${id}:`, error);
      throw error;
    }
  },
  
  // Get documents shared with user
  getSharedDocuments: async () => {
    try {
      // Better approach: use server-side filtering with a query parameter
      const response = await axios.get(`${API_URL}/documents?shared=true`);
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
    try {
      const response = await axios.get(`${API_URL}/users/profile`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      throw error;
    }
  },

  // Update user profile with improved error handling
  updateProfile: async (userData) => {
    try {
      // Only include fields that are actually needed to update
      const updateData = {
        name: userData.name
      };
      
      // Only include password fields if there's actually a password change
      if (userData.currentPassword && userData.newPassword) {
        updateData.currentPassword = userData.currentPassword;
        updateData.newPassword = userData.newPassword;
      }
      
      // Log the data being sent (omit passwords for security)
      if (DEBUG) {
        console.log('Updating profile with data:', {
          ...updateData,
          currentPassword: updateData.currentPassword ? '[REDACTED]' : undefined,
          newPassword: updateData.newPassword ? '[REDACTED]' : undefined
        });
      }
      
      const response = await axios.put(`${API_URL}/users/profile`, updateData);
      
      if (!response || !response.data) {
        throw new Error('No response data received from server');
      }
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Profile update failed');
      }
      
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      
      // More descriptive error handling
      if (!error.response) {
        throw new Error('Cannot connect to server. Please check your internet connection.');
      }
      
      if (error.response.status === 400) {
        throw new Error(error.response.data.message || 'Invalid input. Please check your data.');
      }
      
      if (error.response.status === 401) {
        throw new Error('Current password is incorrect.');
      }
      
      // If we have an error message from the server, use it
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
      
      throw error;
    }
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

// ✅ UPDATED: Workspace-related API functions with proper error handling
export const workspaceApi = {
  // Get all user's workspaces
  getWorkspaces: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      const queryString = params.toString();
      const url = `${API_URL}/workspaces${queryString ? `?${queryString}` : ''}`;
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
      throw error;
    }
  },

  // Get single workspace
  getWorkspace: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/workspaces/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch workspace with ID ${id}:`, error);
      throw error;
    }
  },

  // Create new workspace
  createWorkspace: async (workspaceData) => {
    try {
      const response = await axios.post(`${API_URL}/workspaces`, workspaceData);
      return response.data;
    } catch (error) {
      console.error('Failed to create workspace:', error);
      throw error;
    }
  },

  // Update workspace
  updateWorkspace: async (id, workspaceData) => {
    try {
      const response = await axios.put(`${API_URL}/workspaces/${id}`, workspaceData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update workspace with ID ${id}:`, error);
      throw error;
    }
  },

  // Delete workspace
  deleteWorkspace: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/workspaces/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to delete workspace with ID ${id}:`, error);
      throw error;
    }
  },

  // ✅ ADDED: Get workspace statistics
  getWorkspaceStats: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/workspaces/${id}/stats`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch workspace stats for ID ${id}:`, error);
      throw error;
    }
  },

  // Add member to workspace
  addMember: async (workspaceId, memberData) => {
    try {
      const response = await axios.post(`${API_URL}/workspaces/${workspaceId}/members`, memberData);
      return response.data;
    } catch (error) {
      console.error(`Failed to add member to workspace ${workspaceId}:`, error);
      throw error;
    }
  },

  // Remove member from workspace
  removeMember: async (workspaceId, memberId) => {
    try {
      const response = await axios.delete(`${API_URL}/workspaces/${workspaceId}/members/${memberId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to remove member ${memberId} from workspace ${workspaceId}:`, error);
      throw error;
    }
  },

  // Update member role/permissions
  updateMemberRole: async (workspaceId, memberId, roleData) => {
    try {
      const response = await axios.put(`${API_URL}/workspaces/${workspaceId}/members/${memberId}`, roleData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update member ${memberId} role in workspace ${workspaceId}:`, error);
      throw error;
    }
  },

  // Leave workspace
  leaveWorkspace: async (workspaceId) => {
    try {
      const response = await axios.post(`${API_URL}/workspaces/${workspaceId}/leave`);
      return response.data;
    } catch (error) {
      console.error(`Failed to leave workspace ${workspaceId}:`, error);
      throw error;
    }
  }
};

// NEW: Invitation-related API functions
export const invitationApi = {
  // Send invitation
  sendInvitation: async (invitationData) => {
    try {
      const response = await axios.post(`${API_URL}/invitations/send`, invitationData);
      return response.data;
    } catch (error) {
      console.error('Failed to send invitation:', error);
      throw error;
    }
  },

  // Get invitation details by token (public endpoint)
  getInvitationDetails: async (token) => {
    try {
      const response = await axios.get(`${API_URL}/invitations/${token}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch invitation details for token ${token}:`, error);
      throw error;
    }
  },

  // Accept invitation (public endpoint)
  acceptInvitation: async (token) => {
    try {
      const response = await axios.post(`${API_URL}/invitations/${token}/accept`);
      return response.data;
    } catch (error) {
      console.error(`Failed to accept invitation with token ${token}:`, error);
      throw error;
    }
  },

  // Reject invitation (public endpoint)
  rejectInvitation: async (token) => {
    try {
      const response = await axios.post(`${API_URL}/invitations/${token}/reject`);
      return response.data;
    } catch (error) {
      console.error(`Failed to reject invitation with token ${token}:`, error);
      throw error;
    }
  },

  // Get user's pending invitations
  getPendingInvitations: async () => {
    try {
      const response = await axios.get(`${API_URL}/invitations/pending`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch pending invitations:', error);
      throw error;
    }
  },

  // Get workspace invitations (admin view)
  getWorkspaceInvitations: async (workspaceId) => {
    try {
      const response = await axios.get(`${API_URL}/invitations/workspace/${workspaceId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch workspace invitations for ${workspaceId}:`, error);
      throw error;
    }
  },

  // Cancel invitation
  cancelInvitation: async (invitationId) => {
    try {
      const response = await axios.delete(`${API_URL}/invitations/${invitationId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to cancel invitation ${invitationId}:`, error);
      throw error;
    }
  },

  // Resend invitation
  resendInvitation: async (invitationId) => {
    try {
      const response = await axios.post(`${API_URL}/invitations/${invitationId}/resend`);
      return response.data;
    } catch (error) {
      console.error(`Failed to resend invitation ${invitationId}:`, error);
      throw error;
    }
  },

  // Bulk invite (send multiple invitations)
  bulkInvite: async (workspaceId, invitations) => {
    try {
      const bulkData = {
        workspaceId,
        invitations
      };
      const response = await axios.post(`${API_URL}/invitations/bulk`, bulkData);
      return response.data;
    } catch (error) {
      console.error(`Failed to send bulk invitations to workspace ${workspaceId}:`, error);
      throw error;
    }
  },

  // Admin: Cleanup expired invitations
  cleanupExpiredInvitations: async () => {
    try {
      const response = await axios.post(`${API_URL}/invitations/cleanup`);
      return response.data;
    } catch (error) {
      console.error('Failed to cleanup expired invitations:', error);
      throw error;
    }
  }
};

// Export all APIs as a combined object with backwards compatibility
const apiService = { 
  documentApi, 
  userApi, 
  workspaceApi, 
  invitationApi 
};

export default apiService;