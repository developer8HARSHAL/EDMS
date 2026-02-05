// ✅ FIXED: Complete invitationSlice.js with enhanced logging and error handling

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { invitationApi } from '../../services/apiService';

// Initial state - FIXED: Ensure all properties are defined
const initialState = {
  // User's pending invitations
  pendingInvitations: [],
  
  // Workspace invitations (for workspace admins)
  workspaceInvitations: [],
  
  // Current invitation being viewed
  currentInvitation: null,
  
  // Loading states
  loading: false,
  sendingInvitation: false,
  processingInvitation: false,
  
  // Error states
  error: null,
  
  // Pagination for workspace invitations
  pagination: {
    currentPage: 1,
    totalPages: 1,
    total: 0
  },
  
  // Filters
  filters: {
    status: 'all', // 'all', 'pending', 'accepted', 'rejected', 'expired'
  }
};

// ✅ ENHANCED: acceptInvitation thunk with improved logging
export const acceptInvitation = createAsyncThunk(
  'invitations/acceptInvitation',
  async (token, { rejectWithValue }) => {
    try {
      console.log('🔄 Redux thunk: Accepting invitation with token:', token);
      const response = await invitationApi.acceptInvitation(token);
      console.log('✅ Redux thunk: Invitation accepted successfully:', response);
      return { token, data: response };
    } catch (error) {
      console.error('❌ Redux thunk: Accept invitation failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to accept invitation';
      return rejectWithValue(errorMessage);
    }
  }
);

// ✅ ENHANCED: rejectInvitation thunk with improved logging
export const rejectInvitation = createAsyncThunk(
  'invitations/rejectInvitation',
  async (token, { rejectWithValue }) => {
    try {
      console.log('🔄 Redux thunk: Rejecting invitation with token:', token);
      const response = await invitationApi.rejectInvitation(token);
      console.log('✅ Redux thunk: Invitation rejected successfully:', response);
      return { token, data: response };
    } catch (error) {
      console.error('❌ Redux thunk: Reject invitation failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to reject invitation';
      return rejectWithValue(errorMessage);
    }
  }
);

// Other thunks remain the same...
export const sendInvitation = createAsyncThunk(
  'invitations/sendInvitation',
  async (invitationData, { rejectWithValue }) => {
    try {
      const response = await invitationApi.sendInvitation(invitationData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to send invitation');
    }
  }
);

export const fetchPendingInvitations = createAsyncThunk(
  'invitations/fetchPendingInvitations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await invitationApi.getPendingInvitations();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch pending invitations');
    }
  }
);

export const fetchWorkspaceInvitations = createAsyncThunk(
  'invitations/fetchWorkspaceInvitations',
  async ({ workspaceId, status, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await invitationApi.getWorkspaceInvitations(workspaceId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch workspace invitations');
    }
  }
);

export const fetchInvitationDetails = createAsyncThunk(
  'invitations/fetchInvitationDetails',
  async (token, { rejectWithValue }) => {
    try {
      const response = await invitationApi.getInvitationDetails(token);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch invitation details');
    }
  }
);

export const cancelInvitation = createAsyncThunk(
  'invitations/cancelInvitation',
  async (invitationId, { rejectWithValue }) => {
    try {
      await invitationApi.cancelInvitation(invitationId);
      return invitationId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to cancel invitation');
    }
  }
);

export const resendInvitation = createAsyncThunk(
  'invitations/resendInvitation',
  async (invitationId, { rejectWithValue }) => {
    try {
      const response = await invitationApi.resendInvitation(invitationId);
      return { invitationId, data: response };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to resend invitation');
    }
  }
);

export const cleanupExpiredInvitations = createAsyncThunk(
  'invitations/cleanupExpiredInvitations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await invitationApi.cleanupExpiredInvitations();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to cleanup invitations');
    }
  }
);

// ✅ ENHANCED: Slice with improved extraReducers
const invitationSlice = createSlice({
  name: 'invitations',
  initialState,
  reducers: {
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    
    // Clear current invitation
    clearCurrentInvitation: (state) => {
      state.currentInvitation = null;
    },
    
    // Update filters
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    // Reset pagination
    resetPagination: (state) => {
      state.pagination = initialState.pagination;
    },
    
    // Remove invitation from pending list (when accepted/rejected)
    removeFromPendingInvitations: (state, action) => {
      const token = action.payload;
      state.pendingInvitations = state.pendingInvitations.filter(
        invitation => invitation.token !== token
      );
    },
    
    // Update invitation status in workspace invitations
    updateInvitationStatus: (state, action) => {
      const { invitationId, status, acceptedAt, rejectedAt } = action.payload;
      const invitation = state.workspaceInvitations.find(inv => inv._id === invitationId);
      if (invitation) {
        invitation.status = status;
        if (acceptedAt) invitation.acceptedAt = acceptedAt;
        if (rejectedAt) invitation.rejectedAt = rejectedAt;
      }
    },
    
    // Remove invitation from workspace invitations (when cancelled)
    removeFromWorkspaceInvitations: (state, action) => {
      const invitationId = action.payload;
      state.workspaceInvitations = state.workspaceInvitations.filter(
        invitation => invitation._id !== invitationId
      );
    },
    
    // Add new invitation to workspace invitations
    addToWorkspaceInvitations: (state, action) => {
      state.workspaceInvitations.unshift(action.payload);
    },
    
    // Update invitation expiry (after resend)
    updateInvitationExpiry: (state, action) => {
      const { invitationId, expiresAt } = action.payload;
      const invitation = state.workspaceInvitations.find(inv => inv._id === invitationId);
      if (invitation) {
        invitation.expiresAt = expiresAt;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Send invitation
      .addCase(sendInvitation.pending, (state) => {
        state.sendingInvitation = true;
        state.error = null;
      })
      .addCase(sendInvitation.fulfilled, (state, action) => {
        state.sendingInvitation = false;
      })
      .addCase(sendInvitation.rejected, (state, action) => {
        state.sendingInvitation = false;
        state.error = action.payload;
      })
      
      // Fetch pending invitations
      .addCase(fetchPendingInvitations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingInvitations.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingInvitations = action.payload.data || action.payload || [];
      })
      .addCase(fetchPendingInvitations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.pendingInvitations = [];
      })
      
      // Fetch workspace invitations
      .addCase(fetchWorkspaceInvitations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkspaceInvitations.fulfilled, (state, action) => {
        state.loading = false;
        const responseData = action.payload.data || action.payload;
        state.workspaceInvitations = responseData.invitations || responseData || [];
        state.pagination = {
          currentPage: responseData.currentPage || 1,
          totalPages: responseData.totalPages || 1,
          total: responseData.total || 0
        };
      })
      .addCase(fetchWorkspaceInvitations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.workspaceInvitations = [];
      })
      
      // Fetch invitation details
      .addCase(fetchInvitationDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvitationDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentInvitation = action.payload.data || action.payload;
      })
      .addCase(fetchInvitationDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.currentInvitation = null;
      })
      
      // ✅ ENHANCED: Accept invitation with improved logging
      .addCase(acceptInvitation.pending, (state) => {
        state.processingInvitation = true;
        state.error = null;
        console.log('🔄 Redux: Accept invitation pending');
      })
      .addCase(acceptInvitation.fulfilled, (state, action) => {
        state.processingInvitation = false;
        const { token, data } = action.payload;
        
        console.log('✅ Redux: Invitation accepted, updating state');
        
        // Remove from pending invitations
        state.pendingInvitations = state.pendingInvitations.filter(
          invitation => invitation.token !== token
        );
        
        // Clear current invitation to prevent re-processing
        state.currentInvitation = null;
        
        // Clear any errors
        state.error = null;
      })
      .addCase(acceptInvitation.rejected, (state, action) => {
        state.processingInvitation = false;
        state.error = action.payload;
        console.error('❌ Redux: Accept invitation rejected:', action.payload);
      })
      
      // ✅ ENHANCED: Reject invitation with improved logging
      .addCase(rejectInvitation.pending, (state) => {
        state.processingInvitation = true;
        state.error = null;
        console.log('🔄 Redux: Reject invitation pending');
      })
      .addCase(rejectInvitation.fulfilled, (state, action) => {
        state.processingInvitation = false;
        const { token, data } = action.payload;
        
        console.log('✅ Redux: Invitation rejected, updating state');
        
        // Remove from pending invitations
        state.pendingInvitations = state.pendingInvitations.filter(
          invitation => invitation.token !== token
        );
        
        // Clear current invitation
        state.currentInvitation = null;
        
        // Clear any errors
        state.error = null;
      })
      .addCase(rejectInvitation.rejected, (state, action) => {
        state.processingInvitation = false;
        state.error = action.payload;
        console.error('❌ Redux: Reject invitation rejected:', action.payload);
      })
      
      // Cancel invitation
      .addCase(cancelInvitation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelInvitation.fulfilled, (state, action) => {
        state.loading = false;
        const invitationId = action.payload;
        
        // Remove from workspace invitations
        state.workspaceInvitations = state.workspaceInvitations.filter(
          invitation => invitation._id !== invitationId
        );
      })
      .addCase(cancelInvitation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Resend invitation
      .addCase(resendInvitation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resendInvitation.fulfilled, (state, action) => {
        state.loading = false;
        const { invitationId, data } = action.payload;
        
        // Update expiry date in workspace invitations
        const invitation = state.workspaceInvitations.find(inv => inv._id === invitationId);
        if (invitation && data.data?.expiresAt) {
          invitation.expiresAt = data.data.expiresAt;
        }
      })
      .addCase(resendInvitation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Cleanup expired invitations
      .addCase(cleanupExpiredInvitations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cleanupExpiredInvitations.fulfilled, (state, action) => {
        state.loading = false;
        // Could show a success message with cleanup results
      })
      .addCase(cleanupExpiredInvitations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// Export actions
export const {
  clearError,
  clearCurrentInvitation,
  updateFilters,
  resetPagination,
  removeFromPendingInvitations,
  updateInvitationStatus,
  removeFromWorkspaceInvitations,
  addToWorkspaceInvitations,
  updateInvitationExpiry
} = invitationSlice.actions;

// ✅ SAFE: Selectors with proper error handling
export const selectInvitationsState = (state) => {
  try {
    return state?.invitations || initialState;
  } catch (error) {
    console.warn('InvitationsState selector error:', error);
    return initialState;
  }
};

export const selectPendingInvitations = (state) => {
  try {
    return state?.invitations?.pendingInvitations || [];
  } catch (error) {
    console.warn('PendingInvitations selector error:', error);
    return [];
  }
};

export const selectWorkspaceInvitations = (state) => {
  try {
    return state?.invitations?.workspaceInvitations || [];
  } catch (error) {
    console.warn('WorkspaceInvitations selector error:', error);
    return [];
  }
};

export const selectInvitationDetails = (state) => {
  try {
    return state?.invitations?.currentInvitation || null;
  } catch (error) {
    console.warn('InvitationDetails selector error:', error);
    return null;
  }
};

export const selectInvitationsLoading = (state) => {
  try {
    return state?.invitations?.loading || false;
  } catch (error) {
    console.warn('InvitationsLoading selector error:', error);
    return false;
  }
};

export const selectSendingInvitation = (state) => {
  try {
    return state?.invitations?.sendingInvitation || false;
  } catch (error) {
    console.warn('SendingInvitation selector error:', error);
    return false;
  }
};

export const selectProcessingInvitation = (state) => {
  try {
    return state?.invitations?.processingInvitation || false;
  } catch (error) {
    console.warn('ProcessingInvitation selector error:', error);
    return false;
  }
};

export const selectInvitationsError = (state) => {
  try {
    return state?.invitations?.error || null;
  } catch (error) {
    console.warn('InvitationsError selector error:', error);
    return null;
  }
};

export const selectInvitationsPagination = (state) => {
  try {
    return state?.invitations?.pagination || initialState.pagination;
  } catch (error) {
    console.warn('InvitationsPagination selector error:', error);
    return initialState.pagination;
  }
};

export const selectInvitationsFilters = (state) => {
  try {
    return state?.invitations?.filters || initialState.filters;
  } catch (error) {
    console.warn('InvitationsFilters selector error:', error);
    return initialState.filters;
  }
};

export const selectPendingInvitationsCount = (state) => {
  try {
    return state?.invitations?.pendingInvitations?.length || 0;
  } catch (error) {
    console.warn('PendingInvitationsCount selector error:', error);
    return 0;
  }
};

export const selectWorkspaceInvitationsByStatus = (state, status) => {
  try {
    const invitations = state?.invitations?.workspaceInvitations || [];
    if (status === 'all') return invitations;
    return invitations.filter(invitation => invitation.status === status);
  } catch (error) {
    console.warn('WorkspaceInvitationsByStatus selector error:', error);
    return [];
  }
};

export const selectExpiredInvitations = (state) => {
  try {
    const now = new Date();
    const invitations = state?.invitations?.workspaceInvitations || [];
    return invitations.filter(
      invitation => invitation.status === 'pending' && new Date(invitation.expiresAt) < now
    );
  } catch (error) {
    console.warn('ExpiredInvitations selector error:', error);
    return [];
  }
};

export const selectInvitationById = (state, invitationId) => {
  try {
    const invitations = state?.invitations?.workspaceInvitations || [];
    return invitations.find(invitation => invitation._id === invitationId) || null;
  } catch (error) {
    console.warn('InvitationById selector error:', error);
    return null;
  }
};

export const selectHasPendingInvitations = (state) => {
  try {
    const invitations = state?.invitations?.pendingInvitations || [];
    return invitations.length > 0;
  } catch (error) {
    console.warn('HasPendingInvitations selector error:', error);
    return false;
  }
};

export const selectInvitationStats = (state) => {
  try {
    const invitations = state?.invitations?.workspaceInvitations || [];
    const now = new Date();
    
    return {
      total: invitations.length,
      pending: invitations.filter(inv => inv.status === 'pending').length,
      accepted: invitations.filter(inv => inv.status === 'accepted').length,
      rejected: invitations.filter(inv => inv.status === 'rejected').length,
      expired: invitations.filter(inv => 
        inv.status === 'pending' && new Date(inv.expiresAt) < now
      ).length
    };
  } catch (error) {
    console.warn('InvitationStats selector error:', error);
    return {
      total: 0,
      pending: 0,
      accepted: 0,
      rejected: 0,
      expired: 0
    };
  }
};

export default invitationSlice.reducer;