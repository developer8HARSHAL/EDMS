import { workspaceApi } from './apiService'; // ✅ FIXED: Import workspaceApi directly
/**
 * Dedicated Workspace API Service
 * Handles all workspace-related API calls with proper error handling and response formatting
 */
class WorkspaceService {
  
  // ==================== WORKSPACE CRUD OPERATIONS ====================
  
  /**
   * Get user's workspaces with pagination and filtering
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
async getWorkspaces(params = {}) {
  try {
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 10,
      search: params.search || '',
      role: params.role || '',
      sortBy: params.sortBy || 'updatedAt',
      sortOrder: params.sortOrder || 'desc'
    };

    const response = await workspaceApi.getWorkspaces(queryParams);

    // ✅ Handle multiple possible response structures
    if (response.success || response.data || Array.isArray(response)) {
      // Handle direct array response
      if (Array.isArray(response)) {
        return {
          workspaces: response,
          pagination: {
            totalDocs: response.length,
            totalPages: 1,
            currentPage: 1,
            hasNextPage: false,
            hasPrevPage: false
          }
        };
      }

      // Handle structured response
      const data = response.data || response;
      const workspaces = data.workspaces || data.data?.workspaces || data.data || [];
      
      return {
        workspaces: Array.isArray(workspaces) ? workspaces : [],
        pagination: {
          totalDocs: data.totalDocs || data.totalWorkspaces || workspaces.length,
          totalPages: data.totalPages || Math.ceil((data.totalDocs || workspaces.length) / (params.limit || 10)),
          currentPage: data.currentPage || params.page || 1,
          hasNextPage: data.hasNextPage || false,
          hasPrevPage: data.hasPrevPage || false
        }
      };
    }

    throw new Error(response.message || 'Failed to fetch workspaces');
  } catch (error) {
    throw this.handleError(error, 'Failed to fetch workspaces');
  }
}


  /**
   * Get single workspace by ID
   * @param {string} workspaceId - Workspace ID
   * @returns {Promise} API response
   */
// REPLACE this method in your workspaceService.js file


// ADD this method to your workspaceService.js file after the getWorkspaces method

/**
 * Get single workspace by ID
 * @param {string} workspaceId - Workspace ID
 * @returns {Promise} API response
 */
async getWorkspace(workspaceId) {
  try {
    if (!workspaceId) {
      throw new Error('Workspace ID is required');
    }

    console.log('🔍 WorkspaceService: Fetching single workspace:', workspaceId);

    const response = await workspaceApi.getWorkspace(workspaceId);
    console.log('📡 WorkspaceService: Raw single workspace response:', response);
    
    // ✅ Handle the backend response format for single workspace
    // Backend returns: { success: true, data: { workspace: {...} } }
    if (response && response.success && response.data && response.data.workspace) {
      console.log('📦 WorkspaceService: Parsed workspace:', response.data.workspace);
      return response.data.workspace;
    }
    
    // Handle direct workspace object (fallback)
    if (response && response._id) {
      console.log('📦 WorkspaceService: Direct workspace object:', response);
      return response;
    }
    
    console.error('❌ Invalid workspace response structure:', response);
    throw new Error('Invalid workspace response structure');
  } catch (error) {
    console.error('❌ WorkspaceService getWorkspace error:', error);
    throw this.handleError(error, 'Failed to fetch workspace');
  }
}

  /**
   * Create new workspace
   * @param {Object} workspaceData - Workspace data
   * @returns {Promise} API response
   */
async createWorkspace(workspaceData) {
  try {
    const validatedData = this.validateWorkspaceData(workspaceData);
    const response = await workspaceApi.createWorkspace(validatedData);
    
    // Handle multiple response formats
    const data = response.data.data || response.data.workspace || response.data;
    return data;
  } catch (error) {
    throw this.handleError(error, 'Failed to create workspace');
  }
}

  /**
   * Update workspace
   * @param {string} workspaceId - Workspace ID
   * @param {Object} updates - Update data
   * @returns {Promise} API response
   */
  async updateWorkspace(workspaceId, updates) {
    try {
      if (!workspaceId) {
        throw new Error('Workspace ID is required');
      }

      const validatedData = this.validateWorkspaceData(updates, false);
      // ✅ FIXED: Use workspaceApi.updateWorkspace directly
      const response = await workspaceApi.updateWorkspace(workspaceId, validatedData);
      return response.data.workspace;
    } catch (error) {
      throw this.handleError(error, 'Failed to update workspace');
    }
  }

  /**
   * Delete workspace
   * @param {string} workspaceId - Workspace ID
   * @returns {Promise} API response
   */
  async deleteWorkspace(workspaceId) {
    try {
      if (!workspaceId) {
        throw new Error('Workspace ID is required');
      }

      // ✅ FIXED: Use workspaceApi.deleteWorkspace directly
      const response = await workspaceApi.deleteWorkspace(workspaceId);
      return { success: true, message: response.message || 'Workspace deleted' };

    } catch (error) {
      throw this.handleError(error, 'Failed to delete workspace');
    }
  }

  // ==================== MEMBER MANAGEMENT ====================

  /**
   * Add member to workspace directly
   * @param {string} workspaceId - Workspace ID
   * @param {Object} memberData - Member data
   * @returns {Promise} API response
   */
  async addMember(workspaceId, memberData) {
    try {
      if (!workspaceId) {
        throw new Error('Workspace ID is required');
      }

      const validatedData = this.validateMemberData(memberData);
      // ✅ FIXED: Use workspaceApi.addMember directly
      const response = await workspaceApi.addMember(workspaceId, validatedData);
      return response.data.workspace;
    } catch (error) {
      throw this.handleError(error, 'Failed to add member');
    }
  }

  /**
   * Remove member from workspace
   * @param {string} workspaceId - Workspace ID
   * @param {string} memberId - Member ID
   * @returns {Promise} API response
   */
  async removeMember(workspaceId, memberId) {
    try {
      if (!workspaceId || !memberId) {
        throw new Error('Workspace ID and Member ID are required');
      }

      // ✅ FIXED: Use workspaceApi.removeMember directly
      const response = await workspaceApi.removeMember(workspaceId, memberId);
      return response.data.workspace;
    } catch (error) {
      throw this.handleError(error, 'Failed to remove member');
    }
  }

  /**
   * Update member role and permissions
   * @param {string} workspaceId - Workspace ID
   * @param {string} memberId - Member ID
   * @param {Object} roleData - Role and permission data
   * @returns {Promise} API response
   */
  async updateMemberRole(workspaceId, memberId, roleData) {
    try {
      if (!workspaceId || !memberId) {
        throw new Error('Workspace ID and Member ID are required');
      }

      const validatedData = this.validateMemberData(roleData);
      // ✅ FIXED: Use workspaceApi.updateMemberRole directly
      const response = await workspaceApi.updateMemberRole(workspaceId, memberId, validatedData);
      return response.data.workspace;
    } catch (error) {
      throw this.handleError(error, 'Failed to update member role');
    }
  }

  /**
   * Leave workspace
   * @param {string} workspaceId - Workspace ID
   * @returns {Promise} API response
   */
  async leaveWorkspace(workspaceId) {
    try {
      if (!workspaceId) {
        throw new Error('Workspace ID is required');
      }

      // ✅ FIXED: Use workspaceApi.leaveWorkspace directly
      const response = await workspaceApi.leaveWorkspace(workspaceId);
      return response.data.workspace;
    } catch (error) {
      throw this.handleError(error, 'Failed to leave workspace');
    }
  }

  // ==================== INVITATION MANAGEMENT ====================
  // Note: These will use invitationApi from apiService

  /**
   * Send workspace invitation
   * @param {Object} invitationData - Invitation data
   * @returns {Promise} API response
   */
  async sendInvitation(invitationData) {
    try {
      const { invitationApi } = await import('./apiService');
      const validatedData = this.validateInvitationData(invitationData);
      // ✅ FIXED: Use invitationApi.sendInvitation directly
      const response = await invitationApi.sendInvitation(validatedData);
      return response.data.workspace;
    } catch (error) {
      throw this.handleError(error, 'Failed to send invitation');
    }
  }

  /**
   * Get pending invitations for user
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  async getPendingInvitations(params = {}) {
    try {
      const { invitationApi } = await import('./apiService');
      // ✅ FIXED: Use invitationApi.getPendingInvitations directly
      const response = await invitationApi.getPendingInvitations();
      return response.data.workspace || [];
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch pending invitations');
    }
  }

  /**
   * Get workspace invitations (admin view)
   * @param {string} workspaceId - Workspace ID
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  async getWorkspaceInvitations(workspaceId, params = {}) {
    try {
      if (!workspaceId) {
        throw new Error('Workspace ID is required');
      }

      const { invitationApi } = await import('./apiService');
      // ✅ FIXED: Use invitationApi.getWorkspaceInvitations directly
      const response = await invitationApi.getWorkspaceInvitations(workspaceId);
      return response.data.workspace || [];
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch workspace invitations');
    }
  }

  /**
   * Get invitation details by token
   * @param {string} token - Invitation token
   * @returns {Promise} API response
   */
  async getInvitationDetails(token) {
    try {
      if (!token) {
        throw new Error('Invitation token is required');
      }

      const { invitationApi } = await import('./apiService');
      // ✅ FIXED: Use invitationApi.getInvitationDetails directly
      const response = await invitationApi.getInvitationDetails(token);
      return response.data.workspace || null;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch invitation details');
    }
  }

  /**
   * Accept invitation
   * @param {string} token - Invitation token
   * @param {Object} userData - Optional user data for new users
   * @returns {Promise} API response
   */
  async acceptInvitation(token, userData = null) {
    try {
      if (!token) {
        throw new Error('Invitation token is required');
      }

      const { invitationApi } = await import('./apiService');
      // ✅ FIXED: Use invitationApi.acceptInvitation directly
      const response = await invitationApi.acceptInvitation(token);
      return response.data.workspace;
    } catch (error) {
      throw this.handleError(error, 'Failed to accept invitation');
    }
  }

  /**
   * Reject invitation
   * @param {string} token - Invitation token
   * @param {string} reason - Optional rejection reason
   * @returns {Promise} API response
   */
  async rejectInvitation(token, reason = null) {
    try {
      if (!token) {
        throw new Error('Invitation token is required');
      }

      const { invitationApi } = await import('./apiService');
      // ✅ FIXED: Use invitationApi.rejectInvitation directly
      const response = await invitationApi.rejectInvitation(token);
      return response.data.workspace;
    } catch (error) {
      throw this.handleError(error, 'Failed to reject invitation');
    }
  }

  /**
   * Cancel invitation
   * @param {string} invitationId - Invitation ID
   * @returns {Promise} API response
   */
  async cancelInvitation(invitationId) {
    try {
      if (!invitationId) {
        throw new Error('Invitation ID is required');
      }

      const { invitationApi } = await import('./apiService');
      // ✅ FIXED: Use invitationApi.cancelInvitation directly
      const response = await invitationApi.cancelInvitation(invitationId);
      return response.data.workspace;
    } catch (error) {
      throw this.handleError(error, 'Failed to cancel invitation');
    }
  }

  /**
   * Resend invitation
   * @param {string} invitationId - Invitation ID
   * @param {string} customMessage - Optional custom message
   * @returns {Promise} API response
   */
  async resendInvitation(invitationId, customMessage = null) {
    try {
      if (!invitationId) {
        throw new Error('Invitation ID is required');
      }

      const { invitationApi } = await import('./apiService');
      // ✅ FIXED: Use invitationApi.resendInvitation directly
      const response = await invitationApi.resendInvitation(invitationId);
      return response.data.workspace;
    } catch (error) {
      throw this.handleError(error, 'Failed to resend invitation');
    }
  }

  // ==================== ANALYTICS AND STATS ====================

  /**
   * Get workspace statistics
   * @param {string} workspaceId - Workspace ID
   * @returns {Promise} API response
   */
async getWorkspaceStats(workspaceId) {
  try {
    if (!workspaceId) {
      throw new Error('Workspace ID is required');
    }

    const response = await workspaceApi.getWorkspaceStats(workspaceId);
    
    // ✅ Return the inner data object, not the wrapper
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error('Invalid stats response format');
  } catch (error) {
    throw this.handleError(error, 'Failed to fetch workspace statistics');
  }
}

  /**
   * Get workspace documents
   * @param {string} workspaceId - Workspace ID
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  async getWorkspaceDocuments(workspaceId, params = {}) {
    try {
      if (!workspaceId) {
        throw new Error('Workspace ID is required');
      }

      const { documentApi } = await import('./apiService');
      // ✅ FIXED: Use documentApi.getWorkspaceDocuments directly
      const response = await documentApi.getWorkspaceDocuments(workspaceId, params);
      return response.data.workspace || [];
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch workspace documents');
    }
  }

  // ==================== BULK OPERATIONS ====================

  /**
   * Bulk invite members
   * @param {Array} invitations - Array of invitation data
   * @returns {Promise} Array of API responses
   */
  async bulkInvite(invitations) {
    try {
      if (!Array.isArray(invitations) || invitations.length === 0) {
        throw new Error('Invitations array is required');
      }

      const results = await Promise.allSettled(
        invitations.map(invitation => this.sendInvitation(invitation))
      );

      return {
        success: true,
        results: results.map((result, index) => ({
          invitation: invitations[index],
          status: result.status,
          data: result.status === 'fulfilled' ? result.value : null,
          error: result.status === 'rejected' ? result.reason : null
        })),
        summary: {
          total: invitations.length,
          successful: results.filter(r => r.status === 'fulfilled').length,
          failed: results.filter(r => r.status === 'rejected').length
        }
      };
    } catch (error) {
      throw this.handleError(error, 'Failed to send bulk invitations');
    }
  }

  /**
   * Bulk cancel invitations
   * @param {Array} invitationIds - Array of invitation IDs
   * @returns {Promise} Array of API responses
   */
  async bulkCancelInvitations(invitationIds) {
    try {
      if (!Array.isArray(invitationIds) || invitationIds.length === 0) {
        throw new Error('Invitation IDs array is required');
      }

      const results = await Promise.allSettled(
        invitationIds.map(id => this.cancelInvitation(id))
      );

      return {
        success: true,
        results: results.map((result, index) => ({
          invitationId: invitationIds[index],
          status: result.status,
          data: result.status === 'fulfilled' ? result.value : null,
          error: result.status === 'rejected' ? result.reason : null
        })),
        summary: {
          total: invitationIds.length,
          successful: results.filter(r => r.status === 'fulfilled').length,
          failed: results.filter(r => r.status === 'rejected').length
        }
      };
    } catch (error) {
      throw this.handleError(error, 'Failed to cancel bulk invitations');
    }
  }

  // ==================== VALIDATION METHODS ====================

  /**
   * Validate workspace data
   * @param {Object} data - Workspace data
   * @param {boolean} isRequired - Whether all fields are required
   * @returns {Object} Validated data
   */
  validateWorkspaceData(data, isRequired = true) {
    const errors = {};
    const validatedData = {};

    // Name validation
    if (isRequired && !data.name?.trim()) {
      errors.name = 'Workspace name is required';
    } else if (data.name && data.name.trim().length < 3) {
      errors.name = 'Workspace name must be at least 3 characters';
    } else if (data.name && data.name.trim().length > 50) {
      errors.name = 'Workspace name must be less than 50 characters';
    } else if (data.name) {
      validatedData.name = data.name.trim();
    }

    // Description validation
    if (data.description !== undefined) {
      if (data.description && data.description.length > 500) {
        errors.description = 'Description must be less than 500 characters';
      } else {
        validatedData.description = data.description?.trim() || '';
      }
    }

    // Public flag validation
    if (data.isPublic !== undefined) {
      validatedData.isPublic = Boolean(data.isPublic);
    }

    if (Object.keys(errors).length > 0) {
      const error = new Error('Validation failed');
      error.validationErrors = errors;
      throw error;
    }

    return validatedData;
  }

  /**
 * ✅ FIXED: Validate member data - Now properly converts frontend to backend format
 * @param {Object} data - Member data
 * @returns {Object} Validated data
 */
validateMemberData(data) {
  const errors = {};
  const validatedData = {};

  // Role validation
  if (!data.role) {
    errors.role = 'Role is required';
  } else if (!['admin', 'editor', 'viewer'].includes(data.role)) {
    errors.role = 'Invalid role. Must be admin, editor, or viewer';
  } else {
    validatedData.role = data.role;
  }

  // User ID validation (for direct member addition)
  if (data.userId) {
    if (typeof data.userId !== 'string' || data.userId.length !== 24) {
      errors.userId = 'Invalid user ID format';
    } else {
      validatedData.userId = data.userId;
    }
  }

  // Email validation (for invitations)
  if (data.email || data.userEmail) {
    const email = data.email || data.userEmail;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.email = 'Invalid email format';
    } else {
      validatedData.email = email.trim().toLowerCase();
    }
  }

  // ✅ CRITICAL FIX: Permissions validation - Convert frontend to backend format
  if (data.permissions) {
    // Backend permission property names (what we need to send)
    const backendPermissions = ['canView', 'canEdit', 'canAdd', 'canDelete', 'canInvite'];
    const permissions = {};

    // First, handle direct backend format permissions
    for (const [key, value] of Object.entries(data.permissions)) {
      if (backendPermissions.includes(key) && typeof value === 'boolean') {
        permissions[key] = value;
      }
    }

    // ✅ CRITICAL: Convert frontend format to backend format
    const frontendToBackendMapping = {
      'read': 'canView',
      'write': 'canEdit', 
      'add': 'canAdd',
      'delete': 'canDelete',
      'manage': 'canInvite',
      'invite': 'canInvite'
    };

    for (const [frontendKey, backendKey] of Object.entries(frontendToBackendMapping)) {
      if (data.permissions[frontendKey] !== undefined) {
        permissions[backendKey] = Boolean(data.permissions[frontendKey]);
      }
    }

    validatedData.permissions = permissions;
  }

  if (Object.keys(errors).length > 0) {
    const error = new Error('Validation failed');
    error.validationErrors = errors;
    throw error;
  }

  return validatedData;
}


  /**
   * Validate invitation data
   * @param {Object} data - Invitation data
   * @returns {Object} Validated data
   */
  validateInvitationData(data) {
    const errors = {};
    const validatedData = {};

    // Workspace ID validation
    if (!data.workspaceId) {
      errors.workspaceId = 'Workspace ID is required';
    } else if (typeof data.workspaceId !== 'string' || data.workspaceId.length !== 24) {
      errors.workspaceId = 'Invalid workspace ID format';
    } else {
      validatedData.workspaceId = data.workspaceId;
    }

    // Email validation
    if (!data.email?.trim()) {
      errors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email.trim())) {
        errors.email = 'Invalid email format';
      } else {
        validatedData.email = data.email.trim().toLowerCase();
      }
    }

    // Role validation
    if (!data.role) {
      errors.role = 'Role is required';
    } else if (!['admin', 'editor', 'viewer'].includes(data.role)) {
      errors.role = 'Invalid role. Must be admin, editor, or viewer';
    } else {
      validatedData.role = data.role;
    }

    // Custom message validation
    if (data.customMessage !== undefined) {
      if (data.customMessage && data.customMessage.length > 500) {
        errors.customMessage = 'Custom message must be less than 500 characters';
      } else {
        validatedData.customMessage = data.customMessage?.trim() || '';
      }
    }

    if (Object.keys(errors).length > 0) {
      const error = new Error('Validation failed');
      error.validationErrors = errors;
      throw error;
    }

    return validatedData;
  }

  // ==================== UTILITY METHODS ====================

  /**
   * ✅ FIXED: Format API response - handle different response formats
   * @param {Object} response - API response (could be axios response or direct data)
   * @returns {Object} Formatted response
   */
  formatResponse(response) {
    // If it's already a formatted response from apiService, return as-is
    if (response && response.success !== undefined) {
      return response;
    }
    
    // If it's an axios response, format it
    if (response && response.data) {
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'Success',
        meta: response.data.meta || null,
        status: response.status || 200
      };
    }
    
    // If it's direct data, wrap it
    return {
      success: true,
      data: response,
      message: 'Success',
      meta: null,
      status: 200
    };
  }

  /**
   * Handle API errors
   * @param {Error} error - Error object
   * @param {string} defaultMessage - Default error message
   * @returns {Error} Formatted error
   */
  handleError(error, defaultMessage) {
    if (error.validationErrors) {
      // Re-throw validation errors as-is
      return error;
    }

    const formattedError = new Error();
    
    if (error.response) {
      // Server responded with error status
      formattedError.message = error.response.data?.message || defaultMessage;
      formattedError.status = error.response.status;
      formattedError.validationErrors = error.response.data?.validationErrors || null;
    } else if (error.request) {
      // Network error
      formattedError.message = 'Network error. Please check your connection.';
      formattedError.status = 0;
    } else {
      // Other error
      formattedError.message = error.message || defaultMessage;
    }

    formattedError.originalError = error;
    return formattedError;
  }

 /**
 * ✅ FIXED: Get default role permissions - Now uses backend format
 * @param {string} role - Role name
 * @returns {Object} Default permissions
 */
getDefaultRolePermissions(role) {
  const rolePermissions = {
    admin: {
      canView: true,
      canEdit: true,
      canAdd: true,
      canDelete: true,
      canInvite: true
    },
    editor: {
      canView: true,
      canEdit: true,
      canAdd: true,
      canDelete: false,
      canInvite: false
    },
    viewer: {
      canView: true,
      canEdit: false,
      canAdd: false,
      canDelete: false,
      canInvite: false
    }
  };

  return rolePermissions[role] || rolePermissions.viewer;
}
/**
 * ✅ NEW: Convert backend permissions to frontend format (for display)
 * @param {Object} backendPermissions - Backend format permissions
 * @returns {Object} Frontend format permissions
 */
convertBackendToFrontendPermissions(backendPermissions) {
  if (!backendPermissions) return {};
  
  return {
    read: backendPermissions.canView || false,
    write: backendPermissions.canEdit || false,
    add: backendPermissions.canAdd || false,
    delete: backendPermissions.canDelete || false,
    invite: backendPermissions.canInvite || false
  };
}

/**
 * ✅ NEW: Convert frontend permissions to backend format (for API calls)
 * @param {Object} frontendPermissions - Frontend format permissions
 * @returns {Object} Backend format permissions
 */
convertFrontendToBackendPermissions(frontendPermissions) {
  if (!frontendPermissions) return {};
  
  return {
    canView: frontendPermissions.read || false,
    canEdit: frontendPermissions.write || false,
    canAdd: frontendPermissions.add || false,
    canDelete: frontendPermissions.delete || false,
    canInvite: frontendPermissions.invite || frontendPermissions.manage || false
  };
}

}

// Create and export singleton instance
const workspaceService = new WorkspaceService();
export default workspaceService;