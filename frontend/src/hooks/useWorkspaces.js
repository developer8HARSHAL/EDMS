import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useMemo, useEffect, useRef } from 'react';
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
 * ✅ FIXED: Custom hook for workspace operations with stable functions
 * Fixed infinite re-render loop by creating stable function references and correcting auth property usage
 */
export const useWorkspaces = () => {
  const dispatch = useDispatch();
  
  // ✅ CRITICAL FIX: Use correct auth property names
  const { user, isAuthenticated, isAuthReady: authReady } = useAuth();  // ✅ FIXED: Use isAuthReady instead of authReady
  
  // ✅ FIX: Use refs to track fetch state and prevent duplicate calls
  const fetchInitiatedRef = useRef(false);
  const mountedRef = useRef(true);
  const lastFetchParamsRef = useRef(null);

  // Selectors - Adjusted for backend response format
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

  // ✅ FIX: Stable fetch function with memoized dependencies
  const fetchWorkspacesCallback = useCallback(async (params = {}) => {
  try {
    fetchInitiatedRef.current = true;

    // ✅ Fix: define paramString after you have params
    const paramString = JSON.stringify(params);
    lastFetchParamsRef.current = paramString;

    console.log('🔄 Fetching workspaces with params:', params);

    const result = await dispatch(fetchWorkspaces(params));

    if (fetchWorkspaces.fulfilled.match(result)) {
      // ✅ Handle multiple response structures robustly
      const responseData = result.payload;
      console.log('📋 Raw response data:', responseData);

      // Extract workspaces array from various possible structures
      let workspaceList = [];
      if (Array.isArray(responseData)) {
        workspaceList = responseData;
      } else if (responseData?.workspaces) {
        workspaceList = responseData.workspaces;
      } else if (responseData?.data?.workspaces) {
        workspaceList = responseData.data.workspaces;
      } else if (responseData?.data && Array.isArray(responseData.data)) {
        workspaceList = responseData.data;
      } else if (responseData?.data) {
        workspaceList = [responseData.data];
      }

      console.log('✅ Workspaces extracted:', workspaceList.length, 'workspaces');
      console.log('📋 Workspace list:', workspaceList);

      return responseData.data;
    } else {
      console.error('❌ Failed to fetch workspaces:', result.payload);
      throw new Error(result.payload?.message || 'Failed to fetch workspaces');
    }
  } catch (error) {
    console.error('❌ Fetch workspaces error:', error);
    throw error;
  }
}, [dispatch]);


  // ✅ FIX: Simplified auto-fetch with better conditions
  useEffect(() => {
    let isMounted = true;

    const autoFetchWorkspaces = async () => {
      // Only auto-fetch if:
      // 1. User is authenticated and auth is ready
      // 2. No workspaces loaded yet
      // 3. Not currently loading
      // 4. No fetch in progress
      // 5. Component is mounted
      if (
        isAuthenticated && 
        authReady && 
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
  }, [isAuthenticated, authReady, workspaces.length, loading, fetchWorkspacesCallback]);

  // Component unmount cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      fetchInitiatedRef.current = false;
      lastFetchParamsRef.current = null;
    };
  }, []);

  // ✅ FIX: Other operations with stable references
const fetchWorkspaceCallback = useCallback(async (workspaceId) => {
  try {
    if (!workspaceId) throw new Error("Workspace ID is required");

    console.log("🔄 Fetching single workspace:", workspaceId);
    const result = await dispatch(fetchWorkspace(workspaceId));

    if (fetchWorkspace.fulfilled.match(result)) {
      console.log("✅ Single workspace fetched:", result.payload);
      return result.payload;
    } else {
      console.error("❌ Failed to fetch workspace:", result.payload);
      throw new Error(result.payload?.message || "Failed to fetch workspace");
    }
  } catch (error) {
    console.error("❌ Fetch workspace error:", error);
    throw error;
  }
}, [dispatch]);


  const fetchStatsCallback = useCallback(async (workspaceId) => {
    try {
      const result = await dispatch(fetchWorkspaceStats(workspaceId));
      if (fetchWorkspaceStats.fulfilled.match(result)) {
        return result.payload;
      }
      throw new Error(result.payload?.message || 'Failed to fetch workspace stats');
    } catch (error) {
      console.error('❌ Fetch workspace stats error:', error);
      throw error;
    }
  }, [dispatch]);

  const createWorkspaceCallback = useCallback(async (workspaceData) => {
    try {
      const result = await dispatch(createWorkspace(workspaceData));
      if (createWorkspace.fulfilled.match(result)) {
        // Don't automatically fetch all workspaces - the reducer already adds the new one
        console.log('✅ Workspace created successfully');
        return result.payload;
      }
      throw new Error(result.payload?.message || 'Failed to create workspace');
    } catch (error) {
      console.error('❌ Create workspace error:', error);
      throw error;
    }
  }, [dispatch]);

  const updateWorkspaceCallback = useCallback(async (workspaceId, updates) => {
    try {
      const result = await dispatch(updateWorkspace({ workspaceId, updates }));
      if (updateWorkspace.fulfilled.match(result)) {
        return result.payload;
      }
      throw new Error(result.payload?.message || 'Failed to update workspace');
    } catch (error) {
      console.error('❌ Update workspace error:', error);
      throw error;
    }
  }, [dispatch]);

  const deleteWorkspaceCallback = useCallback(async (workspaceId) => {
    try {
      const result = await dispatch(deleteWorkspace(workspaceId));
      if (deleteWorkspace.fulfilled.match(result)) {
        return result.payload;
      }
      throw new Error(result.payload?.message || 'Failed to delete workspace');
    } catch (error) {
      console.error('❌ Delete workspace error:', error);
      throw error;
    }
  }, [dispatch]);

  const addMemberCallback = useCallback(async (workspaceId, memberData) => {
    try {
      const result = await dispatch(addWorkspaceMember({ workspaceId, memberData }));
      if (addWorkspaceMember.fulfilled.match(result)) {
        return result.payload;
      }
      throw new Error(result.payload?.message || 'Failed to add member');
    } catch (error) {
      console.error('❌ Add member error:', error);
      throw error;
    }
  }, [dispatch]);

  const removeMemberCallback = useCallback(async (workspaceId, memberId) => {
    try {
      const result = await dispatch(removeWorkspaceMember({ workspaceId, memberId }));
      if (removeWorkspaceMember.fulfilled.match(result)) {
        return result.payload;
      }
      throw new Error(result.payload?.message || 'Failed to remove member');
    } catch (error) {
      console.error('❌ Remove member error:', error);
      throw error;
    }
  }, [dispatch]);

  const updateMemberRoleCallback = useCallback(async (workspaceId, memberId, roleData) => {
    try {
      const result = await dispatch(updateMemberRole({ workspaceId, memberId, roleData }));
      if (updateMemberRole.fulfilled.match(result)) {
        return result.payload;
      }
      throw new Error(result.payload?.message || 'Failed to update member role');
    } catch (error) {
      console.error('❌ Update member role error:', error);
      throw error;
    }
  }, [dispatch]);

  const leaveWorkspaceCallback = useCallback(async (workspaceId) => {
    try {
      const result = await dispatch(leaveWorkspace(workspaceId));
      if (leaveWorkspace.fulfilled.match(result)) {
        return result.payload;
      }
      throw new Error(result.payload?.message || 'Failed to leave workspace');
    } catch (error) {
      console.error('❌ Leave workspace error:', error);
      throw error;
    }
  }, [dispatch]);

  // ✅ FIX: Helper functions with stable references
  const getWorkspaceById = useCallback((workspaceId) => {
    return workspaces.find(ws => ws._id === workspaceId) || null;
  }, [workspaces]);

  const getUserRole = useCallback((workspaceId) => {
    if (!user?.id) return null;
    
    const workspace = workspaces.find(ws => ws._id === workspaceId) || currentWorkspace;
    if (!workspace) return null;
    
    // Check if user is owner - handle both string and object formats
    const ownerId = workspace.owner?._id || workspace.owner;
    if (ownerId === user.id) return 'owner';
    
    // Find member role
    const member = workspace.members?.find(member => {
      const memberId = member.user?._id || member.user;
      return memberId === user.id;
    });
    
    return member?.role || null;
  }, [user?.id, workspaces, currentWorkspace]);

  const getUserPermissions = useCallback((workspaceId) => {
    if (!user?.id) return null;
    
    const workspace = workspaces.find(ws => ws._id === workspaceId) || currentWorkspace;
    if (!workspace) return null;
    
    // Owner has all permissions
    const ownerId = workspace.owner?._id || workspace.owner;
    if (ownerId === user.id) {
      return {
        canView: true,
        canEdit: true,
        canAdd: true,
        canDelete: true,
        canInvite: true
      };
    }
    
    // Find member permissions
    const member = workspace.members?.find(member => {
      const memberId = member.user?._id || member.user;
      return memberId === user.id;
    });
    
    return member?.permissions || {
      canView: false,
      canEdit: false,
      canAdd: false,
      canDelete: false,
      canInvite: false
    };
  }, [user?.id, workspaces, currentWorkspace]);

  const getWorkspacesByRole = useCallback((role) => {
    if (!user?.id) return [];
    
    return workspaces.filter(workspace => {
      if (role === 'owner') {
        const ownerId = workspace.owner?._id || workspace.owner;
        return ownerId === user.id;
      }
      
      const member = workspace.members?.find(m => {
        const memberId = m.user?._id || m.user;
        return memberId === user.id;
      });
      return member && member.role === role;
    });
  }, [workspaces, user?.id]);

  // ✅ FIX: Permission checker for frontend components
  const canPerformAction = useCallback((workspaceId, action) => {
    const permissions = getUserPermissions(workspaceId);
    if (!permissions) return false;

    // Map frontend action names to backend permission names
    const actionToPermissionMap = {
      'read': 'canView',
      'view': 'canView',
      'write': 'canEdit',
      'edit': 'canEdit',
      'add': 'canAdd',
      'create': 'canAdd',
      'delete': 'canDelete',
      'remove': 'canDelete',
      'invite': 'canInvite',
      'manage': 'canInvite'
    };

    const requiredPermission = actionToPermissionMap[action];
    return requiredPermission ? permissions[requiredPermission] === true : false;
  }, [getUserPermissions]);

  const getWorkspaceStats = useCallback((workspaceId) => {
    const workspace = getWorkspaceById(workspaceId);
    if (!workspace) return null;

    return {
      totalMembers: (workspace.members?.length || 0) + 1, // +1 for owner
      totalDocuments: workspace.documentCount || 0,
      membersByRole: workspace.members?.reduce((acc, member) => {
        acc[member.role] = (acc[member.role] || 0) + 1;
        return acc;
      }, { owner: 1 }) || { owner: 1 },
      createdAt: workspace.createdAt,
      lastActivity: workspace.updatedAt
    };
  }, [getWorkspaceById]);

  const searchWorkspaces = useCallback((searchTerm) => {
    if (!searchTerm.trim()) return workspaces;
    
    const term = searchTerm.toLowerCase();
    return workspaces.filter(workspace => 
      workspace.name?.toLowerCase().includes(term) ||
      workspace.description?.toLowerCase().includes(term)
    );
  }, [workspaces]);

  const hasUnsavedChanges = useCallback((workspaceId, formData) => {
    const workspace = getWorkspaceById(workspaceId);
    if (!workspace) return false;

    return (
      workspace.name !== formData.name ||
      workspace.description !== formData.description ||
      workspace.settings?.isPublic !== formData.isPublic
    );
  }, [getWorkspaceById]);

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

  const checkPermission = useCallback((workspaceId, permission) => {
    return canPerformAction(workspaceId, permission);
  }, [canPerformAction]);

  const getMemberInfo = useCallback((workspaceId, userId) => {
    const workspace = getWorkspaceById(workspaceId);
    if (!workspace) return null;

    const ownerId = workspace.owner?._id || workspace.owner;
    if (ownerId === userId) {
      return {
        role: 'owner',
        permissions: {
          canView: true,
          canEdit: true,
          canAdd: true,
          canDelete: true,
          canInvite: true
        },
        joinedAt: workspace.createdAt
      };
    }

    const member = workspace.members?.find(m => {
      const memberId = m.user?._id || m.user;
      return memberId === userId;
    });
    
    return member ? {
      role: member.role,
      permissions: member.permissions,
      joinedAt: member.joinedAt
    } : null;
  }, [getWorkspaceById]);

  const convertPermissionsForAPI = useCallback((frontendPermissions) => {
    return {
      canView: frontendPermissions.read || false,
      canEdit: frontendPermissions.write || false,
      canAdd: frontendPermissions.add || false,
      canDelete: frontendPermissions.delete || false,
      canInvite: frontendPermissions.invite || frontendPermissions.manage || false
    };
  }, []);

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

  // ✅ FIX: Stable utility functions
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
    }
  }, [filters, pagination.currentPage, selectedWorkspaceId, fetchWorkspacesCallback, fetchWorkspaceCallback]);

  const reset = useCallback(() => {
    dispatch(clearFilters());
    dispatch(clearCurrentWorkspace());
    dispatch(clearErrors());
    fetchInitiatedRef.current = false;
    lastFetchParamsRef.current = null;
  }, [dispatch]);

  const bulkDelete = useCallback(async (workspaceIds) => {
    const results = await Promise.allSettled(
      workspaceIds.map(id => deleteWorkspaceCallback(id))
    );
    return results;
  }, [deleteWorkspaceCallback]);

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

  // ✅ FIX: Stable computed states
  const computedStates = useMemo(() => ({
    isLoading: loading.fetchWorkspaces || loading.fetchWorkspace,
    hasError: !!(errors.general || errors.fetch || errors.create),
    hasWorkspaces: workspaces.length > 0,
    workspaceCount: workspaces.length,
    hasNextPage: pagination.hasNextPage,
    hasPrevPage: pagination.hasPrevPage,
    totalPages: pagination.totalPages,
    currentPage: pagination.currentPage,
    totalWorkspaces: pagination.totalDocs,
    hasCurrentWorkspace: !!currentWorkspace,
    
    // Filter states
    hasActiveFilters: !!(filters.search || filters.role),
    activeFiltersCount: [filters.search, filters.role].filter(Boolean).length,
    
    // User workspace stats
    ownedWorkspaces: getWorkspacesByRole('owner').length,
    adminWorkspaces: getWorkspacesByRole('admin').length,
    memberWorkspaces: workspaces.length
  }), [loading, errors, workspaces.length, pagination, currentWorkspace, filters, getWorkspacesByRole]);

  // ✅ FIX: Stable action dispatchers
  const actionDispatchers = useMemo(() => ({
    setFilters: (filters) => dispatch(setFilters(filters)),
    clearFilters: () => dispatch(clearFilters()),
    setCurrentPage: (page) => dispatch(setCurrentPage(page)),
    selectWorkspace: (id) => dispatch(setSelectedWorkspace(id)),
    clearCurrentWorkspace: () => dispatch(clearCurrentWorkspace()),
    clearErrors: () => dispatch(clearErrors())
  }), [dispatch]);

  return {
    // Data
    workspaces,
    currentWorkspace,
    pagination,
    filters,
    selectedWorkspaceId,
    workspaceStats,
    
    // States
    ...computedStates,
    
    // Operations
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
    
    // Helpers
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
    
    // Action dispatchers
    ...actionDispatchers
  };
};

export default useWorkspaces;