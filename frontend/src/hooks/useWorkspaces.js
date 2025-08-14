import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useMemo } from 'react';
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
  clearErrors,
  selectAllWorkspaces,
  selectCurrentWorkspace,
  selectWorkspaceLoading,
  selectWorkspaceErrors,
  selectWorkspacePagination,
  selectWorkspaceFilters,
  selectSelectedWorkspaceId,
  selectWorkspaceStats,
  selectWorkspaceById,
  selectUserRoleInWorkspace,
  selectUserPermissionsInWorkspace,
  selectIsWorkspaceOwner,
  selectWorkspacesByRole,
  selectWorkspaceCount,
  selectHasWorkspaces
} from '../store/slices/workspaceSlice';
import { useAuth } from './useAuth';

/**
 * Custom hook for workspace operations
 * Provides a clean API for workspace management with built-in loading states and error handling
 */
export const useWorkspaces = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();

  // Selectors
  const workspaces = useSelector(selectAllWorkspaces);
  const currentWorkspace = useSelector(selectCurrentWorkspace);
  const loading = useSelector(selectWorkspaceLoading);
  const errors = useSelector(selectWorkspaceErrors);
  const pagination = useSelector(selectWorkspacePagination);
  const filters = useSelector(selectWorkspaceFilters);
  const selectedWorkspaceId = useSelector(selectSelectedWorkspaceId);
  const workspaceStats = useSelector(selectWorkspaceStats);
  const workspaceCount = useSelector(selectWorkspaceCount);
  const hasWorkspaces = useSelector(selectHasWorkspaces);

  // ✅ FIXED: Define all useCallback hooks at the top level
  
  // Operations callbacks
  const fetchWorkspacesCallback = useCallback((params) => {
    return dispatch(fetchWorkspaces(params));
  }, [dispatch]);

  const fetchWorkspaceCallback = useCallback((workspaceId) => {
    return dispatch(fetchWorkspace(workspaceId));
  }, [dispatch]);

  const fetchStatsCallback = useCallback((workspaceId) => {
    return dispatch(fetchWorkspaceStats(workspaceId));
  }, [dispatch]);

  const createWorkspaceCallback = useCallback((workspaceData) => {
    return dispatch(createWorkspace(workspaceData));
  }, [dispatch]);

  const updateWorkspaceCallback = useCallback((workspaceId, updates) => {
    return dispatch(updateWorkspace({ workspaceId, updates }));
  }, [dispatch]);

  const deleteWorkspaceCallback = useCallback((workspaceId) => {
    return dispatch(deleteWorkspace(workspaceId));
  }, [dispatch]);

  const addMemberCallback = useCallback((workspaceId, memberData) => {
    return dispatch(addWorkspaceMember({ workspaceId, memberData }));
  }, [dispatch]);

  const removeMemberCallback = useCallback((workspaceId, memberId) => {
    return dispatch(removeWorkspaceMember({ workspaceId, memberId }));
  }, [dispatch]);

  const updateMemberRoleCallback = useCallback((workspaceId, memberId, roleData) => {
    return dispatch(updateMemberRole({ workspaceId, memberId, roleData }));
  }, [dispatch]);

  const leaveWorkspaceCallback = useCallback((workspaceId) => {
    return dispatch(leaveWorkspace(workspaceId));
  }, [dispatch]);

  const setFiltersCallback = useCallback((newFilters) => {
    dispatch(setFilters(newFilters));
  }, [dispatch]);

  const clearFiltersCallback = useCallback(() => {
    dispatch(clearFilters());
  }, [dispatch]);

  const setCurrentPageCallback = useCallback((page) => {
    dispatch(setCurrentPage(page));
  }, [dispatch]);

  const selectWorkspaceCallback = useCallback((workspaceId) => {
    dispatch(setSelectedWorkspace(workspaceId));
  }, [dispatch]);

  const clearCurrentWorkspaceCallback = useCallback(() => {
    dispatch(clearCurrentWorkspace());
  }, [dispatch]);

  const clearErrorsCallback = useCallback(() => {
    dispatch(clearErrors());
  }, [dispatch]);

  // Helper callbacks
  const getWorkspaceById = useCallback((workspaceId) => {
    return workspaces.find(ws => ws._id === workspaceId);
  }, [workspaces]);

  const getUserRole = useCallback((workspaceId) => {
    if (!user?.id) return null;
    
    const workspace = workspaces.find(ws => ws._id === workspaceId) || currentWorkspace;
    if (!workspace) return null;
    
    // Check if user is owner
    if (workspace.owner === user.id || workspace.owner?._id === user.id) return 'owner';
    
    // Find member role
    const member = workspace.members?.find(member => 
      member.user === user.id || member.user?._id === user.id
    );
    return member?.role || null;
  }, [workspaces, currentWorkspace, user?.id]);

  const getUserPermissions = useCallback((workspaceId) => {
    if (!user?.id) return null;
    
    const workspace = workspaces.find(ws => ws._id === workspaceId) || currentWorkspace;
    if (!workspace) return null;
    
    // Owner has all permissions (in backend format)
    if (workspace.owner === user.id || workspace.owner?._id === user.id) {
      return {
        canView: true,
        canEdit: true,
        canAdd: true,
        canDelete: true,
        canInvite: true
      };
    }
    
    // Find member permissions - backend should return these in correct format already
    const member = workspace.members?.find(member => 
      member.user === user.id || member.user?._id === user.id
    );
    
    // ✅ CRITICAL: Return permissions in backend format as expected by components
    return member?.permissions || {
      canView: false,
      canEdit: false,
      canAdd: false,
      canDelete: false,
      canInvite: false
    };
  }, [workspaces, currentWorkspace, user?.id]);

  const getWorkspacesByRole = useCallback((role) => {
    if (!user?.id) return [];
    
    return workspaces.filter(workspace => {
      if (role === 'owner') {
        return workspace.owner === user.id || workspace.owner?._id === user.id;
      }
      
      const member = workspace.members?.find(m => 
        m.user === user.id || m.user?._id === user.id
      );
      return member && member.role === role;
    });
  }, [workspaces, user?.id]);

  const canPerformAction = useCallback((workspaceId, action) => {
    const permissions = getUserPermissions(workspaceId);
    if (!permissions) return false;

    // Map action to backend permission
    const actionToPermissionMapping = {
      'view': 'canView',
      'read': 'canView',
      'edit': 'canEdit',
      'write': 'canEdit',
      'add': 'canAdd',
      'create': 'canAdd',
      'delete': 'canDelete',
      'remove': 'canDelete',
      'invite': 'canInvite',
      'manage': 'canInvite'
    };

    const requiredPermission = actionToPermissionMapping[action] || action;
    return permissions[requiredPermission] === true;
  }, [getUserPermissions]);

  const getWorkspaceStats = useCallback((workspaceId) => {
    const workspace = workspaces.find(ws => ws._id === workspaceId);
    if (!workspace) return null;

    return {
      totalMembers: workspace.members.length + 1, // +1 for owner
      totalDocuments: workspace.documentCount || 0,
      membersByRole: workspace.members.reduce((acc, member) => {
        acc[member.role] = (acc[member.role] || 0) + 1;
        return acc;
      }, { owner: 1 }),
      createdAt: workspace.createdAt,
      lastActivity: workspace.updatedAt
    };
  }, [workspaces]);

  const searchWorkspaces = useCallback((searchTerm) => {
    if (!searchTerm.trim()) return workspaces;
    
    const term = searchTerm.toLowerCase();
    return workspaces.filter(workspace => 
      workspace.name.toLowerCase().includes(term) ||
      workspace.description?.toLowerCase().includes(term)
    );
  }, [workspaces]);

  const hasUnsavedChanges = useCallback((workspaceId, formData) => {
    const workspace = workspaces.find(ws => ws._id === workspaceId);
    if (!workspace) return false;

    return (
      workspace.name !== formData.name ||
      workspace.description !== formData.description ||
      workspace.settings?.isPublic !== formData.isPublic
    );
  }, [workspaces]);

  const getDisplayPermissions = useCallback((workspaceId) => {
    const backendPermissions = getUserPermissions(workspaceId);
    if (!backendPermissions) return null;

    return {
      read: backendPermissions.canView,
      write: backendPermissions.canEdit,
      add: backendPermissions.canAdd,
      delete: backendPermissions.canDelete,
      invite: backendPermissions.canInvite,
      manage: backendPermissions.canInvite // manage maps to invite
    };
  }, [getUserPermissions]);

  // Utility callbacks
  const refresh = useCallback(async () => {
    const params = { ...filters, page: pagination.currentPage };
    await fetchWorkspacesCallback(params);
    
    if (selectedWorkspaceId) {
      await fetchWorkspaceCallback(selectedWorkspaceId);
    }
  }, [filters, pagination.currentPage, selectedWorkspaceId, fetchWorkspacesCallback, fetchWorkspaceCallback]);

  const reset = useCallback(() => {
    clearFiltersCallback();
    clearCurrentWorkspaceCallback();
    clearErrorsCallback();
  }, [clearFiltersCallback, clearCurrentWorkspaceCallback, clearErrorsCallback]);

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
      members: workspace.members.map(member => ({
        role: member.role,
        permissions: member.permissions,
        joinedAt: member.joinedAt
      })),
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

  const checkPermission = useCallback((workspaceId, permission) => {
    return canPerformAction(workspaceId, permission);
  }, [canPerformAction]);

  const getMemberInfo = useCallback((workspaceId, userId) => {
    const workspace = getWorkspaceById(workspaceId);
    if (!workspace) return null;

    if (workspace.owner === userId || workspace.owner?._id === userId) {
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

    const member = workspace.members?.find(m => 
      m.user === userId || m.user?._id === userId
    );
    
    return member ? {
      role: member.role,
      permissions: member.permissions, // Already in backend format
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

  // ✅ FIXED: Use useMemo for object groupings without nested useCallback
  const operations = useMemo(() => ({
    // Fetch operations
    fetchWorkspaces: fetchWorkspacesCallback,
    fetchWorkspace: fetchWorkspaceCallback,
    fetchStats: fetchStatsCallback,

    // CRUD operations
    createWorkspace: createWorkspaceCallback,
    updateWorkspace: updateWorkspaceCallback,
    deleteWorkspace: deleteWorkspaceCallback,

    // Member management
    addMember: addMemberCallback,
    removeMember: removeMemberCallback,
    updateMemberRole: updateMemberRoleCallback,
    leaveWorkspace: leaveWorkspaceCallback,

    // UI operations
    setFilters: setFiltersCallback,
    clearFilters: clearFiltersCallback,
    setCurrentPage: setCurrentPageCallback,
    selectWorkspace: selectWorkspaceCallback,
    clearCurrentWorkspace: clearCurrentWorkspaceCallback,
    clearErrors: clearErrorsCallback
  }), [
    fetchWorkspacesCallback,
    fetchWorkspaceCallback,
    fetchStatsCallback,
    createWorkspaceCallback,
    updateWorkspaceCallback,
    deleteWorkspaceCallback,
    addMemberCallback,
    removeMemberCallback,
    updateMemberRoleCallback,
    leaveWorkspaceCallback,
    setFiltersCallback,
    clearFiltersCallback,
    setCurrentPageCallback,
    selectWorkspaceCallback,
    clearCurrentWorkspaceCallback,
    clearErrorsCallback
  ]);

  const helpers = useMemo(() => ({
    getWorkspaceById,
    getUserRole,
    getUserPermissions,
    getWorkspacesByRole,
    canPerformAction,
    getWorkspaceStats,
    searchWorkspaces,
    hasUnsavedChanges,
    getDisplayPermissions
  }), [
    getWorkspaceById,
    getUserRole,
    getUserPermissions,
    getWorkspacesByRole,
    canPerformAction,
    getWorkspaceStats,
    searchWorkspaces,
    hasUnsavedChanges,
    getDisplayPermissions
  ]);

  const utilities = useMemo(() => ({
    refresh,
    reset,
    bulkDelete,
    exportWorkspaceData,
    validateWorkspaceData,
    checkPermission,
    getMemberInfo,
    convertPermissionsForAPI,
    convertPermissionsForDisplay
  }), [
    refresh,
    reset,
    bulkDelete,
    exportWorkspaceData,
    validateWorkspaceData,
    checkPermission,
    getMemberInfo,
    convertPermissionsForAPI,
    convertPermissionsForDisplay
  ]);

  // Computed states
  const computedStates = useMemo(() => ({
    // Loading states
    isLoading: loading.fetchWorkspaces || loading.createWorkspace,
    isWorkspaceLoading: loading.fetchWorkspace,
    isMemberOperationLoading: loading.memberOperations,
    isUpdating: loading.updateWorkspace,
    isDeleting: loading.deleteWorkspace,
    
    // Error states
    hasError: !!(errors.workspaces || errors.currentWorkspace || errors.memberOperations),
    workspaceError: errors.currentWorkspace,
    generalError: errors.workspaces,
    memberError: errors.memberOperations,
    statsError: errors.stats,
    
    // Data states
    hasWorkspaces,
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
    memberWorkspaces: workspaceCount
  }), [
    loading,
    errors,
    hasWorkspaces,
    currentWorkspace,
    pagination,
    filters,
    getWorkspacesByRole,
    workspaceCount
  ]);

  return {
    // Data
    workspaces,
    currentWorkspace,
    pagination,
    filters,
    selectedWorkspaceId,
    workspaceStats,
    workspaceCount,
    
    // States
    ...computedStates,
    
    // Operations
    ...operations,
    
    // Helpers
    ...helpers,
    
    // Utilities
    ...utilities
  };
};

export default useWorkspaces;