import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useMemo } from 'react';
import {
  sendInvitation,
  fetchPendingInvitations,
  fetchWorkspaceInvitations,
  fetchInvitationDetails,
  acceptInvitation,
  rejectInvitation,
  cancelInvitation,
  resendInvitation,
  cleanupExpiredInvitations,
  updateFilters,
  clearError as clearInvitationErrors,
  selectPendingInvitations,
  selectWorkspaceInvitations,
  selectInvitationDetails,
  selectInvitationsLoading,
  selectInvitationsError,
  selectInvitationStats,
  selectExpiredInvitations,
  selectWorkspaceInvitationsByStatus,
  selectHasPendingInvitations,
  selectSendingInvitation,
  selectProcessingInvitation
} from '../store/slices/invitationSlice';
import { useAuth } from './useAuth';

// Status constants - FIXED: Define Pending status
const INVITATION_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired'
};

/**
 * Custom hook for invitation operations
 * Provides a comprehensive API for managing workspace invitations
 * ✅ FIXED: Proper error handling and safe hook usage with correct auth properties
 */
export const useInvitations = () => {
  const dispatch = useDispatch();
  
  // ✅ FIXED: Safe useAuth call with correct property names
  const authHook = useAuth();
  const user = authHook?.user || null;
  const isAuthenticated = authHook?.isAuthenticated || false;
  const authReady = authHook?.isAuthReady || false;  // ✅ CRITICAL FIX: Use isAuthReady instead of authReady

  // ✅ FIXED: Safe selectors with error handling
  const pendingInvitations = useSelector((state) => {
    try {
      return selectPendingInvitations(state) || [];
    } catch (error) {
      console.warn('PendingInvitations selector error:', error);
      return [];
    }
  });

  const workspaceInvitations = useSelector((state) => {
    try {
      return selectWorkspaceInvitations(state) || [];
    } catch (error) {
      console.warn('WorkspaceInvitations selector error:', error);
      return [];
    }
  });

  const invitationDetails = useSelector((state) => {
    try {
      return selectInvitationDetails(state) || null;
    } catch (error) {
      console.warn('InvitationDetails selector error:', error);
      return null;
    }
  });

  const loading = useSelector((state) => {
    try {
      return selectInvitationsLoading(state) || false;
    } catch (error) {
      console.warn('InvitationsLoading selector error:', error);
      return false;
    }
  });

  const errors = useSelector((state) => {
    try {
      return selectInvitationsError(state) || null;
    } catch (error) {
      console.warn('InvitationsError selector error:', error);
      return null;
    }
  });

  const invitationStats = useSelector((state) => {
    try {
      return selectInvitationStats(state) || {};
    } catch (error) {
      console.warn('InvitationStats selector error:', error);
      return {};
    }
  });

  const hasPendingInvitations = useSelector((state) => {
    try {
      return selectHasPendingInvitations(state) || false;
    } catch (error) {
      console.warn('HasPendingInvitations selector error:', error);
      return false;
    }
  });

  const sendingInvitation = useSelector((state) => {
    try {
      return selectSendingInvitation(state) || false;
    } catch (error) {
      console.warn('SendingInvitation selector error:', error);
      return false;
    }
  });

  const processingInvitation = useSelector((state) => {
    try {
      return selectProcessingInvitation(state) || false;
    } catch (error) {
      console.warn('ProcessingInvitation selector error:', error);
      return false;
    }
  });

  const expiredInvitations = useSelector((state) => {
    try {
      return selectExpiredInvitations(state) || [];
    } catch (error) {
      console.warn('ExpiredInvitations selector error:', error);
      return [];
    }
  });

  // ✅ FIXED: Check if dispatch is ready with correct auth property
  const isDispatchReady = useMemo(() => {
    return typeof dispatch === 'function' && authReady && isAuthenticated;
  }, [dispatch, authReady, isAuthenticated]);  // ✅ CRITICAL FIX: Use authReady (which now comes from isAuthReady)

  // Core invitation operations - ✅ FIXED: Stable useCallback dependencies
  const sendInvitationAction = useCallback((invitationData) => {
  if (!isDispatchReady) {
    console.warn('Dispatch not ready for sendInvitation');
    return Promise.reject(new Error('Store not ready'));
  }
  
  // 🚨 ENHANCED DEBUG LOGGING
  console.log('🎯 HOOK: Received invitation data:', JSON.stringify(invitationData, null, 2));
  console.log('🔍 HOOK: workspaceId value:', invitationData.workspaceId);
  console.log('🔍 HOOK: workspaceId type:', typeof invitationData.workspaceId);
  console.log('🔍 HOOK: All data keys:', Object.keys(invitationData || {}));
  
  if (!invitationData.workspaceId) {
    console.error('❌ HOOK: workspaceId is missing in hook!');
    console.error('❌ HOOK: This means the modal did not pass workspaceId correctly');
  }
  
  console.log('🚀 HOOK: About to dispatch to Redux with data:', invitationData);
  
  return dispatch(sendInvitation(invitationData));
}, [dispatch, isDispatchReady]);

  const sendBulkInvitations = useCallback(async (invitationsData) => {
    if (!isDispatchReady) {
      console.warn('Dispatch not ready for sendBulkInvitations');
      return [];
    }
    
    const results = await Promise.allSettled(
      invitationsData.map(data => dispatch(sendInvitation(data)))
    );
    return results;
  }, [dispatch, isDispatchReady]);

  const fetchPendingInvitationsAction = useCallback((params) => {
    if (!isDispatchReady) {
      console.warn('Dispatch not ready for fetchPendingInvitations');
      return Promise.resolve([]); // return empty instead of throwing
    }
    return dispatch(fetchPendingInvitations(params));
  }, [dispatch, isDispatchReady]);

  const fetchWorkspaceInvitationsAction = useCallback((workspaceId, params) => {
    if (!isDispatchReady) {
      console.warn('Dispatch not ready for fetchWorkspaceInvitations');
      return Promise.reject(new Error('Store not ready'));
    }
    return dispatch(fetchWorkspaceInvitations({ workspaceId, ...params }));
  }, [dispatch, isDispatchReady]);

  const fetchInvitationDetailsAction = useCallback((token) => {
    if (!isDispatchReady) {
      console.warn('Dispatch not ready for fetchInvitationDetails');
      return Promise.reject(new Error('Store not ready'));
    }
    return dispatch(fetchInvitationDetails(token));
  }, [dispatch, isDispatchReady]);

  // ✅ FIXED: acceptInvitation returns Redux Toolkit thunk for .unwrap() usage
  const acceptInvitationAction = useCallback((token, userData = null) => {
    if (!isDispatchReady) {
      console.warn('Dispatch not ready for acceptInvitation');
      return Promise.reject(new Error('Store not ready'));
    }
    
    console.log('🔄 Hook: Dispatching acceptInvitation with token:', token);
    // ✅ FIXED: Return the thunk result directly for .unwrap() usage
    return dispatch(acceptInvitation(token));
  }, [dispatch, isDispatchReady]);

  // ✅ FIXED: rejectInvitation returns Redux Toolkit thunk for .unwrap() usage
  const rejectInvitationAction = useCallback((token, reason = null) => {
    if (!isDispatchReady) {
      console.warn('Dispatch not ready for rejectInvitation');
      return Promise.reject(new Error('Store not ready'));
    }
    
    console.log('🔄 Hook: Dispatching rejectInvitation with token:', token);
    // ✅ FIXED: Return the thunk result directly for .unwrap() usage
    return dispatch(rejectInvitation(token));
  }, [dispatch, isDispatchReady]);

  const cancelInvitationAction = useCallback((invitationId) => {
    if (!isDispatchReady) {
      console.warn('Dispatch not ready for cancelInvitation');
      return Promise.reject(new Error('Store not ready'));
    }
    return dispatch(cancelInvitation(invitationId));
  }, [dispatch, isDispatchReady]);

  const resendInvitationAction = useCallback((invitationId, customMessage = null) => {
    if (!isDispatchReady) {
      console.warn('Dispatch not ready for resendInvitation');
      return Promise.reject(new Error('Store not ready'));
    }
    return dispatch(resendInvitation(invitationId));
  }, [dispatch, isDispatchReady]);

  const cleanupExpired = useCallback(() => {
    if (!isDispatchReady) {
      console.warn('Dispatch not ready for cleanupExpiredInvitations');
      return Promise.reject(new Error('Store not ready'));
    }
    return dispatch(cleanupExpiredInvitations());
  }, [dispatch, isDispatchReady]);

  const setFilters = useCallback((filters) => {
    if (isDispatchReady) {
      dispatch(updateFilters(filters));
    }
  }, [dispatch, isDispatchReady]);

  const clearFilters = useCallback(() => {
    if (isDispatchReady) {
      dispatch(updateFilters({ status: 'all' }));
    }
  }, [dispatch, isDispatchReady]);

  const clearErrors = useCallback(() => {
    if (isDispatchReady) {
      dispatch(clearInvitationErrors());
    }
  }, [dispatch, isDispatchReady]);

  // Helper functions - ✅ FIXED: Stable dependencies
  const validateEmail = useCallback((email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const isEmailAlreadyInvited = useCallback((workspaceId, email) => {
    const invitations = workspaceInvitations || [];
    return invitations.some(
      invitation => 
        invitation.email.toLowerCase() === email.toLowerCase() && 
        [INVITATION_STATUS.PENDING, INVITATION_STATUS.SENT].includes(invitation.status)
    );
  }, [workspaceInvitations]);

  const getInvitationByToken = useCallback((token) => {
    return invitationDetails || null;
  }, [invitationDetails]);

  const validateInvitationData = useCallback((data) => {
    const validationErrors = {};

    if (!data.workspaceId) {
      validationErrors.workspaceId = 'Workspace is required';
    }

    if (!data.email?.trim()) {
      validationErrors.email = 'Email is required';
    } else if (!validateEmail(data.email)) {
      validationErrors.email = 'Invalid email format';
    }

    if (!data.role) {
      validationErrors.role = 'Role is required';
    } else if (!['admin', 'editor', 'viewer'].includes(data.role)) {
      validationErrors.role = 'Invalid role selected';
    }

    if (data.customMessage && data.customMessage.length > 500) {
      validationErrors.customMessage = 'Custom message must be less than 500 characters';
    }

    return {
      isValid: Object.keys(validationErrors).length === 0,
      errors: validationErrors
    };
  }, [validateEmail]);

  const getRolePermissions = useCallback((role) => {
    const rolePermissions = {
      admin: {
        read: true,
        write: true,
        delete: true,
        manage: true,
        invite: true,
        description: 'Full access to workspace management and content'
      },
      editor: {
        read: true,
        write: true,
        delete: false,
        manage: false,
        invite: false,
        description: 'Can view and edit content, but cannot delete or manage workspace'
      },
      viewer: {
        read: true,
        write: false,
        delete: false,
        manage: false,
        invite: false,
        description: 'Can only view content, no editing permissions'
      }
    };

    return rolePermissions[role] || null;
  }, []);

  const formatInvitationForDisplay = useCallback((invitation) => {
    if (!invitation) return null;

    const now = new Date();
    const expiresAt = new Date(invitation.expiresAt);
    const createdAt = new Date(invitation.createdAt);
    const isExpired = expiresAt < now;
    const timeUntilExpiry = expiresAt - now;
    const daysSinceCreated = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));

    return {
      ...invitation,
      isExpired,
      timeUntilExpiry,
      daysSinceCreated,
      expiresIn: isExpired ? 'Expired' : formatTimeRemaining(timeUntilExpiry),
      statusColor: getStatusColor(invitation.status, isExpired),
      rolePermissions: getRolePermissions(invitation.role)
    };
  }, [getRolePermissions]);

  const groupInvitationsByStatus = useCallback((invitations) => {
    return invitations.reduce((groups, invitation) => {
      const status = invitation.status;
      if (!groups[status]) {
        groups[status] = [];
      }
      groups[status].push(formatInvitationForDisplay(invitation));
      return groups;
    }, {});
  }, [formatInvitationForDisplay]);

  const getInvitationStatistics = useCallback((workspaceId = null) => {
    const invitations = workspaceInvitations || [];
    const now = new Date();
    
    return {
      total: invitations.length,
      pending: invitations.filter(inv => inv.status === INVITATION_STATUS.PENDING).length,
      accepted: invitations.filter(inv => inv.status === INVITATION_STATUS.ACCEPTED).length,
      rejected: invitations.filter(inv => inv.status === INVITATION_STATUS.REJECTED).length,
      expired: invitations.filter(inv => new Date(inv.expiresAt) < now).length,
      byRole: invitations.reduce((acc, inv) => {
        acc[inv.role] = (acc[inv.role] || 0) + 1;
        return acc;
      }, {}),
      recentActivity: invitations
        .filter(inv => (now - new Date(inv.updatedAt || inv.createdAt)) < 7 * 24 * 60 * 60 * 1000)
        .length
    };
  }, [workspaceInvitations]);

  // Advanced utilities
  const refresh = useCallback(async (workspaceId = null) => {
    if (!isDispatchReady) return;
    
    await fetchPendingInvitationsAction();
    if (workspaceId) {
      await fetchWorkspaceInvitationsAction(workspaceId);
    }
  }, [isDispatchReady, fetchPendingInvitationsAction, fetchWorkspaceInvitationsAction]);

  const sendValidatedInvitation = useCallback(async (invitationData) => {
    const validation = validateInvitationData(invitationData);
    
    if (!validation.isValid) {
      throw new Error(Object.values(validation.errors).join(', '));
    }

    if (isEmailAlreadyInvited(invitationData.workspaceId, invitationData.email)) {
      throw new Error('This email has already been invited to the workspace');
    }

    return await sendInvitationAction(invitationData);
  }, [validateInvitationData, isEmailAlreadyInvited, sendInvitationAction]);

  const cancelMultipleInvitations = useCallback(async (invitationIds) => {
    const results = await Promise.allSettled(
      invitationIds.map(id => cancelInvitationAction(id))
    );
    return results;
  }, [cancelInvitationAction]);

  const resendMultipleInvitations = useCallback(async (invitationIds, customMessage = null) => {
    const results = await Promise.allSettled(
      invitationIds.map(id => resendInvitationAction(id, customMessage))
    );
    return results;
  }, [resendInvitationAction]);

  const exportInvitationData = useCallback((workspaceId) => {
    const invitations = workspaceInvitations || [];
    const stats = getInvitationStatistics(workspaceId);
    
    return {
      workspaceId,
      invitations: invitations.map(inv => ({
        email: inv.email,
        role: inv.role,
        status: inv.status,
        sentAt: inv.createdAt,
        expiresAt: inv.expiresAt,
        acceptedAt: inv.acceptedAt,
        permissions: getRolePermissions(inv.role)
      })),
      statistics: stats,
      exportedAt: new Date().toISOString()
    };
  }, [workspaceInvitations, getInvitationStatistics, getRolePermissions]);

  const getInvitationRecommendations = useCallback((workspaceId) => {
    const stats = getInvitationStatistics(workspaceId);
    const recommendations = [];

    if (stats.expired > 0) {
      recommendations.push({
        type: 'cleanup',
        message: `You have ${stats.expired} expired invitations that can be cleaned up`,
        action: 'cleanup',
        priority: 'medium'
      });
    }

    const oldPending = (workspaceInvitations || [])
      .filter(inv => {
        const daysSinceInvited = (new Date() - new Date(inv.createdAt)) / (1000 * 60 * 60 * 24);
        return inv.status === INVITATION_STATUS.PENDING && daysSinceInvited > 3;
      });

    if (oldPending.length > 0) {
      recommendations.push({
        type: 'reminder',
        message: `${oldPending.length} invitations have been pending for more than 3 days`,
        action: 'resend',
        data: oldPending,
        priority: 'low'
      });
    }

    if (stats.byRole.viewer > stats.byRole.editor * 3) {
      recommendations.push({
        type: 'balance',
        message: 'Consider promoting some viewers to editors for better collaboration',
        action: 'promote',
        priority: 'low'
      });
    }

    return recommendations;
  }, [workspaceInvitations, getInvitationStatistics]);

  // ✅ FIXED: Update the computedStates dependency to use correct auth property
  const computedStates = useMemo(() => ({
    isLoading: loading,
    isSendingInvitation: sendingInvitation,
    isFetchingInvitations: loading,
    isProcessingResponse: processingInvitation,
    hasError: !!errors,
    sendError: errors,
    fetchError: errors,
    responseError: errors,
    hasPendingInvitations,
    pendingCount: pendingInvitations.length,
    canSendInvitations: user?.permissions?.invite !== false,
    canManageInvitations: user?.role === 'admin' || user?.permissions?.manage,
    isReady: isDispatchReady && authReady  // ✅ CRITICAL FIX: Use authReady (which now comes from isAuthReady)
  }), [
    loading,
    sendingInvitation,
    processingInvitation,
    errors,
    hasPendingInvitations,
    pendingInvitations.length,
    user?.permissions?.invite,
    user?.permissions?.manage,
    user?.role,
    isDispatchReady,
    authReady  // ✅ CRITICAL FIX: Use authReady consistently (which now comes from isAuthReady)
  ]);

  // Memoized helper functions that don't use hooks
  const staticHelpers = useMemo(() => ({
    getInvitationsByStatus: (status) => {
      if (status === 'all') return workspaceInvitations;
      return workspaceInvitations.filter(invitation => invitation.status === status);
    },

    getExpiredInvitationsData: () => {
      const now = new Date();
      return workspaceInvitations.filter(
        invitation => invitation.status === INVITATION_STATUS.PENDING && new Date(invitation.expiresAt) < now
      );
    }
  }), [workspaceInvitations]);

  // ✅ FIXED: Memoized return object to prevent unnecessary re-renders
  return useMemo(() => ({
    // Data
    pendingInvitations,
    workspaceInvitations,
    invitationDetails,
    invitationStats,
    expiredInvitations,
    
    // States
    ...computedStates,
    
    // Core Operations
    sendInvitation: sendInvitationAction,
    sendBulkInvitations,
    fetchPendingInvitations: fetchPendingInvitationsAction,
    fetchWorkspaceInvitations: fetchWorkspaceInvitationsAction,
    fetchInvitationDetails: fetchInvitationDetailsAction,
    acceptInvitation: acceptInvitationAction,
    rejectInvitation: rejectInvitationAction,
    cancelInvitation: cancelInvitationAction,
    resendInvitation: resendInvitationAction,
    cleanupExpired,
    setFilters,
    clearFilters,
    clearErrors,
    
    // Helpers
    validateEmail,
    isEmailAlreadyInvited,
    getInvitationByToken,
    validateInvitationData,
    getRolePermissions,
    formatInvitationForDisplay,
    groupInvitationsByStatus,
    getInvitationStatistics,
    
    // Static Helpers
    ...staticHelpers,
    
    // Utilities
    refresh,
    sendValidatedInvitation,
    cancelMultipleInvitations,
    resendMultipleInvitations,
    exportInvitationData,
    getInvitationRecommendations,
    
    // Constants
    STATUS: INVITATION_STATUS
  }), [
    pendingInvitations,
    workspaceInvitations,
    invitationDetails,
    invitationStats,
    expiredInvitations,
    computedStates,
    sendInvitationAction,
    sendBulkInvitations,
    fetchPendingInvitationsAction,
    fetchWorkspaceInvitationsAction,
    fetchInvitationDetailsAction,
    acceptInvitationAction,
    rejectInvitationAction,
    cancelInvitationAction,
    resendInvitationAction,
    cleanupExpired,
    setFilters,
    clearFilters,
    clearErrors,
    validateEmail,
    isEmailAlreadyInvited,
    getInvitationByToken,
    validateInvitationData,
    getRolePermissions,
    formatInvitationForDisplay,
    groupInvitationsByStatus,
    getInvitationStatistics,
    staticHelpers,
    refresh,
    sendValidatedInvitation,
    cancelMultipleInvitations,
    resendMultipleInvitations,
    exportInvitationData,
    getInvitationRecommendations
  ]);
};

// Helper functions for formatting
const formatTimeRemaining = (milliseconds) => {
  if (milliseconds <= 0) return 'Expired';
  
  const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
  const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) {
    return days === 1 ? '1 day' : `${days} days`;
  } else if (hours > 0) {
    return hours === 1 ? '1 hour' : `${hours} hours`;
  } else {
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return minutes <= 1 ? 'Less than 1 minute' : `${minutes} minutes`;
  }
};

const getStatusColor = (status, isExpired) => {
  if (isExpired) return 'red';
  
  const statusColors = {
    [INVITATION_STATUS.PENDING]: 'yellow',
    [INVITATION_STATUS.SENT]: 'blue',
    [INVITATION_STATUS.ACCEPTED]: 'green',
    [INVITATION_STATUS.REJECTED]: 'red',
    [INVITATION_STATUS.CANCELLED]: 'gray'
  };
  
  return statusColors[status] || 'gray';
};

export default useInvitations;