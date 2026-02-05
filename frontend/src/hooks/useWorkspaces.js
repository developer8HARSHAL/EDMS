import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import {
  fetchWorkspaces,
  fetchWorkspace,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  addWorkspaceMember,
  removeWorkspaceMember,
  updateMemberRole,
  leaveWorkspace,
  fetchWorkspaceStats,
  setFilters,
  clearFilters,
  setCurrentPage,
  setSelectedWorkspace,
  clearCurrentWorkspace,
  clearErrors
} from '../store/slices/workspaceSlice';
import { useAuth } from './useAuth';

/**
 * ============================================================================
 * useWorkspaces - BACKWARD COMPATIBLE REFACTOR
 * ============================================================================
 * Internal improvements with ZERO breaking changes to public API
 * 
 * ✅ WHAT'S IMPROVED (Internal):
 * - Standardized error handling with detailed error objects
 * - Granular loading states per operation (exposed as computed states)
 * - Better memoization and performance optimization
 * - Utility functions for common operations
 * - Race condition prevention and cleanup on unmount
 * - Comprehensive validation and permission helpers
 * 
 * ✅ WHAT'S PRESERVED (Public API):
 * - ALL function names remain identical
 * - ALL parameters remain identical
 * - ALL return values match original format
 * - NO changes required in consuming files
 * ============================================================================
 */

// ============================================================================
// INTERNAL CONSTANTS (Not exported, internal use only)
// ============================================================================

const OPERATION_TYPES = {
  FETCH: 'fetch',
  FETCH_SINGLE: 'fetchSingle',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  ADD_MEMBER: 'addMember',
  REMOVE_MEMBER: 'removeMember',
  UPDATE_ROLE: 'updateRole',
  LEAVE: 'leave',
  FETCH_STATS: 'fetchStats'
};

const ACTION_PERMISSION_MAP = {
  read: 'canView',
  view: 'canView',
  write: 'canEdit',
  edit: 'canEdit',
  add: 'canAdd',
  create: 'canAdd',
  delete: 'canDelete',
  remove: 'canDelete',
  invite: 'canInvite',
  manage: 'canInvite'
};

const DEFAULT_PERMISSIONS = {
  canView: false,
  canEdit: false,
  canAdd: false,
  canDelete: false,
  canInvite: false
};

const OWNER_PERMISSIONS = {
  canView: true,
  canEdit: true,
  canAdd: true,
  canDelete: true,
  canInvite: true
};

// ============================================================================
// INTERNAL UTILITY FUNCTIONS (Not exported)
// ============================================================================

/**
 * Extracts workspace array from various API response structures
 * Handles multiple backend response formats gracefully
 */
const extractWorkspacesFromResponse = (responseData) => {
  if (Array.isArray(responseData)) {
    return responseData;
  }
  if (responseData?.workspaces) {
    return responseData.workspaces;
  }
  if (responseData?.data?.workspaces) {
    return responseData.data.workspaces;
  }
  if (responseData?.data && Array.isArray(responseData.data)) {
    return responseData.data;
  }
  if (responseData?.data) {
    return [responseData.data];
  }
  return [];
};

/**
 * Extracts user ID from various formats (string or object)
 */
const extractUserId = (userRef) => userRef?._id || userRef;

/**
 * Creates standardized internal error object
 * Used internally only - original error format is preserved for consumers
 */
const createInternalError = (error, defaultMessage = 'Operation failed') => ({
  message: error?.message || error?.payload?.message || defaultMessage,
  status: error?.status || error?.payload?.status || 500,
  original: error,
  timestamp: Date.now()
});

/**
 * Logs operation status with consistent formatting
 */
const logOperation = (operation, status, data = null) => {
  const emoji = status === 'start' ? '🔄' : status === 'success' ? '✅' : '❌';
  const message = `${emoji} ${operation}`;
  
  if (status === 'error') {
    console.error(message, data);
  } else {
    console.log(message, data || '');
  }
};

// ============================================================================
// MAIN HOOK
// ============================================================================

export const useWorkspaces = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, isAuthReady } = useAuth();

  // ============================================================================
  // INTERNAL STATE & REFS
  // ============================================================================
  
  const mountedRef = useRef(true);
  const fetchInitiatedRef = useRef(false);
  const lastFetchParamsRef = useRef(null);
  
  // Internal loading states for granular operation tracking
  const [operationLoading, setOperationLoading] = useState({
    [OPERATION_TYPES.FETCH]: false,
    [OPERATION_TYPES.FETCH_SINGLE]: false,
    [OPERATION_TYPES.CREATE]: false,
    [OPERATION_TYPES.UPDATE]: false,
    [OPERATION_TYPES.DELETE]: false,
    [OPERATION_TYPES.ADD_MEMBER]: false,
    [OPERATION_TYPES.REMOVE_MEMBER]: false,
    [OPERATION_TYPES.UPDATE_ROLE]: false,
    [OPERATION_TYPES.LEAVE]: false,
    [OPERATION_TYPES.FETCH_STATS]: false
  });

  // Helper to update operation loading state
  const setOperationLoadingState = useCallback((operation, isLoading) => {
    if (!mountedRef.current) return;
    setOperationLoading(prev => ({ ...prev, [operation]: isLoading }));
  }, []);

  // ============================================================================
  // REDUX SELECTORS
  // ============================================================================
  
  const workspaceState = useSelector(state => state.workspaces || {});
  const {
    workspaces = [],
    currentWorkspace = null,
    loading = false,
    errors = {},
    pagination = {
      currentPage: 1,
      totalPages: 1,
      totalDocs: 0,
      hasNextPage: false,
      hasPrevPage: false
    },
    filters = {},
    selectedWorkspaceId = null,
    workspaceStats = null
  } = workspaceState;

  // ============================================================================
  // INTERNAL OPERATION WRAPPER
  // ============================================================================

  /**
   * Generic async operation wrapper with enhanced error handling
   * IMPORTANT: Returns data directly (not wrapped) to maintain backward compatibility
   */
  const executeOperation = useCallback(async (
    operationType,
    asyncThunk,
    params,
    operationName
  ) => {
    // Unmount check
    if (!mountedRef.current) {
      const error = new Error('Component unmounted');
      logOperation(operationName, 'error', 'Component unmounted during operation');
      throw error;
    }

    try {
      // Set operation loading state
      setOperationLoadingState(operationType, true);
      
      logOperation(operationName, 'start', params);

      // Execute Redux async thunk
      const result = await dispatch(asyncThunk(params));

      // Unmount check after async operation
      if (!mountedRef.current) {
        const error = new Error('Component unmounted');
        logOperation(operationName, 'error', 'Component unmounted after operation');
        throw error;
      }

      // Check if operation was successful
      if (asyncThunk.fulfilled.match(result)) {
        logOperation(operationName, 'success', result.payload);
        
        // ✅ BACKWARD COMPATIBLE: Return payload directly (not wrapped)
        return result.payload;
      } else {
        // Operation rejected
        const internalError = createInternalError(
          result.payload,
          `${operationName} failed`
        );
        logOperation(operationName, 'error', internalError);
        
        // ✅ BACKWARD COMPATIBLE: Throw original error format
        throw new Error(result.payload?.message || `${operationName} failed`);
      }
    } catch (error) {
      logOperation(operationName, 'error', error);
      
      // ✅ BACKWARD COMPATIBLE: Re-throw error in original format
      throw error;
    } finally {
      // Clear operation loading state
      if (mountedRef.current) {
        setOperationLoadingState(operationType, false);
      }
    }
  }, [dispatch, setOperationLoadingState]);

  // ============================================================================
  // FETCH OPERATIONS (Public API - Backward Compatible)
  // ============================================================================

  /**
   * Fetch all workspaces with optional filters and pagination
   * ✅ RETURN FORMAT: Returns response data directly (original format preserved)
   */
  const fetchWorkspacesCallback = useCallback(async (params = {}) => {
    try {
      fetchInitiatedRef.current = true;
      const paramString = JSON.stringify(params);
      lastFetchParamsRef.current = paramString;

      // Execute operation and return result directly
      const result = await executeOperation(
        OPERATION_TYPES.FETCH,
        fetchWorkspaces,
        params,
        'Fetch workspaces'
      );

      // Log extracted workspaces for debugging
      const workspaceList = extractWorkspacesFromResponse(result);
      console.log(`📋 Extracted ${workspaceList.length} workspaces`);

      // ✅ BACKWARD COMPATIBLE: Return original response format
      return result;
    } catch (error) {
      fetchInitiatedRef.current = false;
      throw error;
    }
  }, [executeOperation]);

  /**
   * Fetch a single workspace by ID
   * ✅ RETURN FORMAT: Returns workspace data directly
   */
  const fetchWorkspaceCallback = useCallback(async (workspaceId) => {
    if (!workspaceId) {
      throw new Error('Workspace ID is required');
    }

    return executeOperation(
      OPERATION_TYPES.FETCH_SINGLE,
      fetchWorkspace,
      workspaceId,
      'Fetch workspace'
    );
  }, [executeOperation]);

  /**
   * Fetch workspace statistics
   * ✅ RETURN FORMAT: Returns stats data directly
   */
  const fetchStatsCallback = useCallback(async (workspaceId) => {
    if (!workspaceId) {
      throw new Error('Workspace ID is required');
    }

    return executeOperation(
      OPERATION_TYPES.FETCH_STATS,
      fetchWorkspaceStats,
      workspaceId,
      'Fetch workspace stats'
    );
  }, [executeOperation]);

  // ============================================================================
  // CRUD OPERATIONS (Public API - Backward Compatible)
  // ============================================================================

  /**
   * Create a new workspace
   * ✅ RETURN FORMAT: Returns created workspace directly
   */
  const createWorkspaceCallback = useCallback(async (workspaceData) => {
    // Internal validation (doesn't affect return format)
    const validation = validateWorkspaceData(workspaceData);
    if (!validation.isValid) {
      const errorMessage = Object.values(validation.errors).join(', ');
      throw new Error(errorMessage);
    }

    return executeOperation(
      OPERATION_TYPES.CREATE,
      createWorkspace,
      workspaceData,
      'Create workspace'
    );
  }, [executeOperation]);

  /**
   * Update an existing workspace
   * ✅ RETURN FORMAT: Returns updated workspace directly
   */
const updateWorkspaceCallback = useCallback(async (workspaceId, updates) => {
  console.log("update", updates);
  if (!workspaceId) throw new Error('Workspace ID is required');
  if (!updates) throw new Error('Updates object is required');

  if (updates.name || updates.description) {
    const validation = validateWorkspaceData(updates);
    if (!validation.isValid) {
      const errorMessage = Object.values(validation.errors).join(', ');
      throw new Error(errorMessage);
    }
  }

  return executeOperation(
    OPERATION_TYPES.UPDATE,
    updateWorkspace,
    { workspaceId, updates },
    'Update workspace'
  );
}, [executeOperation]);


  /**
   * Delete a workspace
   * ✅ RETURN FORMAT: Returns deletion result directly
   */
  const deleteWorkspaceCallback = useCallback(async (workspaceId) => {
    if (!workspaceId) {
      throw new Error('Workspace ID is required');
    }

    return executeOperation(
      OPERATION_TYPES.DELETE,
      deleteWorkspace,
      workspaceId,
      'Delete workspace'
    );
  }, [executeOperation]);

  // ============================================================================
  // MEMBER MANAGEMENT (Public API - Backward Compatible)
  // ============================================================================

  /**
   * Add a member to workspace
   * ✅ RETURN FORMAT: Returns result directly
   */
  const addMemberCallback = useCallback(async (workspaceId, memberData) => {
    if (!workspaceId) {
      throw new Error('Workspace ID is required');
    }
    if (!memberData?.email && !memberData?.userId) {
      throw new Error('Member email or user ID is required');
    }

    return executeOperation(
      OPERATION_TYPES.ADD_MEMBER,
      addWorkspaceMember,
      { workspaceId, memberData },
      'Add member'
    );
  }, [executeOperation]);

  /**
   * Remove a member from workspace
   * ✅ RETURN FORMAT: Returns result directly
   */
  const removeMemberCallback = useCallback(async (workspaceId, memberId) => {
    if (!workspaceId || !memberId) {
      throw new Error('Workspace ID and Member ID are required');
    }

    return executeOperation(
      OPERATION_TYPES.REMOVE_MEMBER,
      removeWorkspaceMember,
      { workspaceId, memberId },
      'Remove member'
    );
  }, [executeOperation]);

  /**
   * Update member role
   * ✅ RETURN FORMAT: Returns result directly
   */
  const updateMemberRoleCallback = useCallback(async (workspaceId, memberId, roleData) => {
    if (!workspaceId || !memberId) {
      throw new Error('Workspace ID and Member ID are required');
    }
    if (!roleData?.role) {
      throw new Error('Role data is required');
    }

    return executeOperation(
      OPERATION_TYPES.UPDATE_ROLE,
      updateMemberRole,
      { workspaceId, memberId, roleData },
      'Update member role'
    );
  }, [executeOperation]);

  /**
   * Leave a workspace
   * ✅ RETURN FORMAT: Returns result directly
   */
  const leaveWorkspaceCallback = useCallback(async (workspaceId) => {
    if (!workspaceId) {
      throw new Error('Workspace ID is required');
    }

    return executeOperation(
      OPERATION_TYPES.LEAVE,
      leaveWorkspace,
      workspaceId,
      'Leave workspace'
    );
  }, [executeOperation]);

  // ============================================================================
  // HELPER FUNCTIONS (Public API - All Preserved)
  // ============================================================================

  /**
   * Get workspace by ID
   */
  const getWorkspaceById = useCallback((workspaceId) => {
    return workspaces.find(ws => ws._id === workspaceId) || null;
  }, [workspaces]);

  /**
   * Get current user's role in a workspace
   */
  const getUserRole = useCallback((workspaceId) => {
    if (!user?.id) return null;

    const workspace = getWorkspaceById(workspaceId) || currentWorkspace;
    if (!workspace) return null;

    // Check if user is owner
    const ownerId = extractUserId(workspace.owner);
    if (ownerId === user.id) return 'owner';

    // Find member role
    const member = workspace.members?.find(member => {
      const memberId = extractUserId(member.user);
      return memberId === user.id;
    });

    return member?.role || null;
  }, [user?.id, getWorkspaceById, currentWorkspace]);

  /**
   * Get current user's permissions in a workspace
   */
  const getUserPermissions = useCallback((workspaceId) => {
    if (!user?.id) return null;

    const workspace = getWorkspaceById(workspaceId) || currentWorkspace;
    if (!workspace) return null;

    // Owner has all permissions
    const ownerId = extractUserId(workspace.owner);
    if (ownerId === user.id) {
      return { ...OWNER_PERMISSIONS };
    }

    // Find member permissions
    const member = workspace.members?.find(member => {
      const memberId = extractUserId(member.user);
      return memberId === user.id;
    });

    return member?.permissions || { ...DEFAULT_PERMISSIONS };
  }, [user?.id, getWorkspaceById, currentWorkspace]);

  /**
   * Get workspaces filtered by user role
   */
  const getWorkspacesByRole = useCallback((role) => {
    if (!user?.id) return [];

    return workspaces.filter(workspace => {
      if (role === 'owner') {
        const ownerId = extractUserId(workspace.owner);
        return ownerId === user.id;
      }

      const member = workspace.members?.find(m => {
        const memberId = extractUserId(m.user);
        return memberId === user.id;
      });
      return member?.role === role;
    });
  }, [workspaces, user?.id]);

  /**
   * Check if user can perform a specific action
   */
  const canPerformAction = useCallback((workspaceId, action) => {
    const permissions = getUserPermissions(workspaceId);
    if (!permissions) return false;

    const requiredPermission = ACTION_PERMISSION_MAP[action];
    return requiredPermission ? permissions[requiredPermission] === true : false;
  }, [getUserPermissions]);

  /**
   * Get workspace statistics
   */
  const getWorkspaceStats = useCallback((workspaceId) => {
    const workspace = getWorkspaceById(workspaceId);
    if (!workspace) return null;

    const membersByRole = workspace.members?.reduce((acc, member) => {
      acc[member.role] = (acc[member.role] || 0) + 1;
      return acc;
    }, { owner: 1 }) || { owner: 1 };

    return {
      totalMembers: (workspace.members?.length || 0) + 1,
      totalDocuments: workspace.documentCount || 0,
      membersByRole,
      createdAt: workspace.createdAt,
      lastActivity: workspace.updatedAt
    };
  }, [getWorkspaceById]);

  /**
   * Search workspaces by name or description
   */
  const searchWorkspaces = useCallback((searchTerm) => {
    if (!searchTerm?.trim()) return workspaces;

    const term = searchTerm.toLowerCase();
    return workspaces.filter(workspace =>
      workspace.name?.toLowerCase().includes(term) ||
      workspace.description?.toLowerCase().includes(term)
    );
  }, [workspaces]);

  /**
   * Check if form data has unsaved changes
   */
  const hasUnsavedChanges = useCallback((workspaceId, formData) => {
    const workspace = getWorkspaceById(workspaceId);
    if (!workspace) return false;

    return (
      workspace.name !== formData.name ||
      workspace.description !== formData.description ||
      workspace.settings?.isPublic !== formData.isPublic
    );
  }, [getWorkspaceById]);

  /**
   * Get display-friendly permissions (frontend format)
   */
  const getDisplayPermissions = useCallback((workspaceId) => {
    const backendPermissions = getUserPermissions(workspaceId);
    if (!backendPermissions) return null;

    return {
      read: backendPermissions.canView,
      write: backendPermissions.canEdit,
      add: backendPermissions.canAdd,
      delete: backendPermissions.canDelete,
      invite: backendPermissions.canInvite,
      manage: backendPermissions.canInvite
    };
  }, [getUserPermissions]);

  /**
   * Alias for canPerformAction
   */
  const checkPermission = useCallback((workspaceId, permission) => {
    return canPerformAction(workspaceId, permission);
  }, [canPerformAction]);

  /**
   * Get member information for a specific user
   */
  const getMemberInfo = useCallback((workspaceId, userId) => {
    const workspace = getWorkspaceById(workspaceId);
    if (!workspace) return null;

    const ownerId = extractUserId(workspace.owner);
    if (ownerId === userId) {
      return {
        role: 'owner',
        permissions: { ...OWNER_PERMISSIONS },
        joinedAt: workspace.createdAt
      };
    }

    const member = workspace.members?.find(m => {
      const memberId = extractUserId(m.user);
      return memberId === userId;
    });

    return member ? {
      role: member.role,
      permissions: member.permissions,
      joinedAt: member.joinedAt
    } : null;
  }, [getWorkspaceById]);

  /**
   * Convert frontend permissions to backend format
   */
  const convertPermissionsForAPI = useCallback((frontendPermissions) => {
    return {
      canView: frontendPermissions.read || false,
      canEdit: frontendPermissions.write || false,
      canAdd: frontendPermissions.add || false,
      canDelete: frontendPermissions.delete || false,
      canInvite: frontendPermissions.invite || frontendPermissions.manage || false
    };
  }, []);

  /**
   * Convert backend permissions to frontend format
   */
  const convertPermissionsForDisplay = useCallback((backendPermissions) => {
    return {
      read: backendPermissions.canView || false,
      write: backendPermissions.canEdit || false,
      add: backendPermissions.canAdd || false,
      delete: backendPermissions.canDelete || false,
      invite: backendPermissions.canInvite || false,
      manage: backendPermissions.canInvite || false
    };
  }, []);

  /**
   * Export workspace data
   */
  const exportWorkspaceData = useCallback((workspaceId) => {
    const workspace = getWorkspaceById(workspaceId);
    if (!workspace) return null;

    return {
      name: workspace.name,
      description: workspace.description,
      members: workspace.members?.map(member => ({
        role: member.role,
        permissions: member.permissions,
        joinedAt: member.joinedAt
      })) || [],
      stats: getWorkspaceStats(workspaceId),
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt
    };
  }, [getWorkspaceById, getWorkspaceStats]);

  /**
   * Validate workspace data
   */
  const validateWorkspaceData = useCallback((data) => {
    const errors = {};

    if (!data.name?.trim()) {
      errors.name = 'Workspace name is required';
    } else if (data.name.length < 3) {
      errors.name = 'Workspace name must be at least 3 characters';
    } else if (data.name.length > 50) {
      errors.name = 'Workspace name must be less than 50 characters';
    }

    if (data.description && data.description.length > 500) {
      errors.description = 'Description must be less than 500 characters';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }, []);

  // ============================================================================
  // UTILITY OPERATIONS (Public API - Preserved)
  // ============================================================================

  /**
   * Refresh all workspace data
   */
  const refresh = useCallback(async () => {
    try {
      fetchInitiatedRef.current = false;
      lastFetchParamsRef.current = null;

      await fetchWorkspacesCallback({ ...filters, page: pagination.currentPage });

      if (selectedWorkspaceId) {
        await fetchWorkspaceCallback(selectedWorkspaceId);
      }
    } catch (error) {
      console.error('❌ Refresh failed:', error);
      throw error;
    }
  }, [filters, pagination.currentPage, selectedWorkspaceId, fetchWorkspacesCallback, fetchWorkspaceCallback]);

  /**
   * Reset all state and filters
   */
  const reset = useCallback(() => {
    dispatch(clearFilters());
    dispatch(clearCurrentWorkspace());
    dispatch(clearErrors());
    fetchInitiatedRef.current = false;
    lastFetchParamsRef.current = null;
  }, [dispatch]);

  /**
   * Bulk delete workspaces
   */
  const bulkDelete = useCallback(async (workspaceIds) => {
    if (!Array.isArray(workspaceIds) || workspaceIds.length === 0) {
      throw new Error('Workspace IDs array is required');
    }

    const results = await Promise.allSettled(
      workspaceIds.map(id => deleteWorkspaceCallback(id))
    );

    return results;
  }, [deleteWorkspaceCallback]);

  // ============================================================================
  // ACTION DISPATCHERS (Public API - Preserved)
  // ============================================================================

  const actionDispatchers = useMemo(() => ({
    setFilters: (filters) => dispatch(setFilters(filters)),
    clearFilters: () => dispatch(clearFilters()),
    setCurrentPage: (page) => dispatch(setCurrentPage(page)),
    selectWorkspace: (id) => dispatch(setSelectedWorkspace(id)),
    clearCurrentWorkspace: () => dispatch(clearCurrentWorkspace()),
    clearErrors: () => dispatch(clearErrors())
  }), [dispatch]);

  // ============================================================================
  // COMPUTED STATES (Enhanced with granular loading states)
  // ============================================================================

  const computedStates = useMemo(() => ({
    // Original loading state (preserved for backward compatibility)
    isLoading: loading.fetchWorkspaces || loading.fetchWorkspace,
    
    // ✨ NEW: Granular loading states (additions, not replacements)
    isFetching: operationLoading[OPERATION_TYPES.FETCH],
    isFetchingSingle: operationLoading[OPERATION_TYPES.FETCH_SINGLE],
    isCreating: operationLoading[OPERATION_TYPES.CREATE],
    isUpdating: operationLoading[OPERATION_TYPES.UPDATE],
    isDeleting: operationLoading[OPERATION_TYPES.DELETE],
    isAddingMember: operationLoading[OPERATION_TYPES.ADD_MEMBER],
    isRemovingMember: operationLoading[OPERATION_TYPES.REMOVE_MEMBER],
    isUpdatingRole: operationLoading[OPERATION_TYPES.UPDATE_ROLE],
    isLeaving: operationLoading[OPERATION_TYPES.LEAVE],
    isFetchingStats: operationLoading[OPERATION_TYPES.FETCH_STATS],

    // Error states
    hasError: !!(errors.general || errors.fetch || errors.create),
    
    // Data states
    hasWorkspaces: workspaces.length > 0,
    workspaceCount: workspaces.length,
    hasCurrentWorkspace: !!currentWorkspace,

    // Pagination states
    hasNextPage: pagination.hasNextPage,
    hasPrevPage: pagination.hasPrevPage,
    totalPages: pagination.totalPages,
    currentPage: pagination.currentPage,
    totalWorkspaces: pagination.totalDocs,

    // Filter states
    hasActiveFilters: !!(filters.search || filters.role),
    activeFiltersCount: [filters.search, filters.role].filter(Boolean).length,

    // User workspace stats
    ownedWorkspaces: getWorkspacesByRole('owner').length,
    adminWorkspaces: getWorkspacesByRole('admin').length,
    memberWorkspaces: workspaces.length
  }), [
    loading,
    operationLoading,
    errors,
    workspaces.length,
    currentWorkspace,
    pagination,
    filters,
    getWorkspacesByRole
  ]);

  // ============================================================================
  // AUTO-FETCH ON MOUNT
  // ============================================================================

  useEffect(() => {
    let isMounted = true;

    const autoFetchWorkspaces = async () => {
      if (
        isAuthenticated &&
        isAuthReady &&
        workspaces.length === 0 &&
        !loading &&
        !fetchInitiatedRef.current &&
        isMounted
      ) {
        try {
          console.log('🚀 Auto-fetching workspaces on mount...');
          await fetchWorkspacesCallback();
        } catch (error) {
          console.error('❌ Auto-fetch failed:', error);
        }
      }
    };

    autoFetchWorkspaces();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, isAuthReady, workspaces.length, loading, fetchWorkspacesCallback]);

  // ============================================================================
  // CLEANUP ON UNMOUNT
  // ============================================================================

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      console.log('🧹 Cleaning up useWorkspaces hook...');
      mountedRef.current = false;
      fetchInitiatedRef.current = false;
      lastFetchParamsRef.current = null;
    };
  }, []);

  // ============================================================================
  // PUBLIC API (100% Backward Compatible)
  // ============================================================================

  return {
    // Data
    workspaces,
    currentWorkspace,
    pagination,
    filters,
    selectedWorkspaceId,
    workspaceStats,

    // States (original + enhanced)
    ...computedStates,

    // Operations (same names, same parameters, same return formats)
    fetchWorkspaces: fetchWorkspacesCallback,
    fetchWorkspace: fetchWorkspaceCallback,
    fetchStats: fetchStatsCallback,
    createWorkspace: createWorkspaceCallback,
    updateWorkspace: updateWorkspaceCallback,
    deleteWorkspace: deleteWorkspaceCallback,
    addMember: addMemberCallback,
    removeMember: removeMemberCallback,
    updateMemberRole: updateMemberRoleCallback,
    leaveWorkspace: leaveWorkspaceCallback,
    refresh,
    reset,
    bulkDelete,

    // Helpers (all preserved)
    getWorkspaceById,
    getUserRole,
    getUserPermissions,
    getWorkspacesByRole,
    canPerformAction,
    getWorkspaceStats,
    searchWorkspaces,
    hasUnsavedChanges,
    getDisplayPermissions,
    checkPermission,
    getMemberInfo,
    convertPermissionsForAPI,
    convertPermissionsForDisplay,
    exportWorkspaceData,
    validateWorkspaceData,

    // Action dispatchers (all preserved)
    ...actionDispatchers
  };
};

export default useWorkspaces;