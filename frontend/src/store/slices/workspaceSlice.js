import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { workspaceApi } from '../../services/apiService'; // ✅ FIXED: Use workspaceApi instead of generic apiService

// Initial state
const initialState = {
  workspaces: [],
  currentWorkspace: null,
  workspaceMembers: [],
  selectedWorkspaceId: null,
  workspaceStats: null,
  loading: {
    fetchWorkspaces: false,
    fetchWorkspace: false,
    createWorkspace: false,
    updateWorkspace: false,
    deleteWorkspace: false,
    memberOperations: false,
    fetchStats: false
  },
  errors: {
    workspaces: null,
    currentWorkspace: null,
    memberOperations: null,
    stats: null
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalDocs: 0,
    hasNextPage: false,
    hasPrevPage: false
  },
  filters: {
    search: '',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    role: ''
  }
};

// ✅ FIXED: Updated async thunks to use workspaceApi

// Get user's workspaces
export const fetchWorkspaces = createAsyncThunk(
  'workspaces/fetchWorkspaces',
  async ({ page = 1, limit = 10, search = '', sortBy = 'updatedAt', sortOrder = 'desc' } = {}, { rejectWithValue }) => {
    try {
      const filters = { page, limit, search, sortBy, sortOrder };
      const response = await workspaceApi.getWorkspaces(filters);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch workspaces');
    }
  }
);

// Get single workspace
export const fetchWorkspace = createAsyncThunk(
  'workspaces/fetchWorkspace',
  async (workspaceId, { rejectWithValue }) => {
    try {
      const response = await workspaceApi.getWorkspace(workspaceId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch workspace');
    }
  }
);

// Create new workspace
export const createWorkspace = createAsyncThunk(
  'workspaces/createWorkspace',
  async (workspaceData, { rejectWithValue }) => {
    try {
      const response = await workspaceApi.createWorkspace(workspaceData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create workspace');
    }
  }
);

// Update workspace
export const updateWorkspace = createAsyncThunk(
  'workspaces/updateWorkspace',
  async ({ workspaceId, updates }, { rejectWithValue }) => {
    try {
      const response = await workspaceApi.updateWorkspace(workspaceId, updates);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update workspace');
    }
  }
);

// Delete workspace
export const deleteWorkspace = createAsyncThunk(
  'workspaces/deleteWorkspace',
  async (workspaceId, { rejectWithValue }) => {
    try {
      await workspaceApi.deleteWorkspace(workspaceId);
      return workspaceId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to delete workspace');
    }
  }
);

// Add member to workspace
export const addWorkspaceMember = createAsyncThunk(
  'workspaces/addMember',
  async ({ workspaceId, memberData }, { rejectWithValue }) => {
    try {
      const response = await workspaceApi.addMember(workspaceId, memberData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to add member');
    }
  }
);

// Remove member from workspace
export const removeWorkspaceMember = createAsyncThunk(
  'workspaces/removeMember',
  async ({ workspaceId, memberId }, { rejectWithValue }) => {
    try {
      await workspaceApi.removeMember(workspaceId, memberId);
      return { workspaceId, memberId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to remove member');
    }
  }
);

// Update member role
export const updateMemberRole = createAsyncThunk(
  'workspaces/updateMemberRole',
  async ({ workspaceId, memberId, roleData }, { rejectWithValue }) => {
    try {
      const response = await workspaceApi.updateMemberRole(workspaceId, memberId, roleData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update member role');
    }
  }
);

// Leave workspace
export const leaveWorkspace = createAsyncThunk(
  'workspaces/leaveWorkspace',
  async (workspaceId, { rejectWithValue }) => {
    try {
      await workspaceApi.leaveWorkspace(workspaceId);
      return workspaceId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to leave workspace');
    }
  }
);

// Fetch workspace statistics
export const fetchWorkspaceStats = createAsyncThunk(
  'workspaces/fetchStats',
  async (workspaceId, { rejectWithValue }) => {
    try {
      // Note: This endpoint might not exist yet, implement if needed
      const response = await workspaceApi.getWorkspaceStats(workspaceId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch workspace stats');
    }
  }
);

// Workspace slice
const workspaceSlice = createSlice({
  name: 'workspaces',
  initialState,
  reducers: {
    // Clear specific errors
    clearErrors: (state) => {
      state.errors = {
        workspaces: null,
        currentWorkspace: null,
        memberOperations: null,
        stats: null
      };
    },
    
    // Clear current workspace
    clearCurrentWorkspace: (state) => {
      state.currentWorkspace = null;
      state.workspaceMembers = [];
      state.selectedWorkspaceId = null;
      state.errors.currentWorkspace = null;
    },
    
    // Set current workspace
    setCurrentWorkspace: (state, action) => {
      state.currentWorkspace = action.payload;
      state.workspaceMembers = action.payload?.members || [];
      state.selectedWorkspaceId = action.payload?._id || null;
    },

    // Set selected workspace ID
    setSelectedWorkspace: (state, action) => {
      state.selectedWorkspaceId = action.payload;
    },
    
    // Update filters
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      // Reset pagination when filters change
      state.pagination.currentPage = 1;
    },

    // Clear filters
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.pagination.currentPage = 1;
    },

    // Set current page
    setCurrentPage: (state, action) => {
      state.pagination.currentPage = action.payload;
    },
    
    // Reset pagination
    resetPagination: (state) => {
      state.pagination = initialState.pagination;
    },
    
    // Update workspace in list (for real-time updates)
    updateWorkspaceInList: (state, action) => {
      const index = state.workspaces.findIndex(
        workspace => workspace._id === action.payload._id
      );
      if (index !== -1) {
        state.workspaces[index] = { ...state.workspaces[index], ...action.payload };
      }
    },
    
    // Add workspace to list
    addWorkspaceToList: (state, action) => {
      state.workspaces.unshift(action.payload);
    },
    
    // Remove workspace from list
    removeWorkspaceFromList: (state, action) => {
      state.workspaces = state.workspaces.filter(
        workspace => workspace._id !== action.payload
      );
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch workspaces
      .addCase(fetchWorkspaces.pending, (state) => {
        state.loading.fetchWorkspaces = true;
        state.errors.workspaces = null;
      })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.loading.fetchWorkspaces = false;
        state.workspaces = action.payload.data?.workspaces || action.payload.data || [];
        
        // Handle pagination data
        const data = action.payload.data;
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          state.pagination = {
            currentPage: data.currentPage || 1,
            totalPages: data.totalPages || 1,
            totalDocs: data.totalDocs || 0,
            hasNextPage: data.hasNextPage || false,
            hasPrevPage: data.hasPrevPage || false
          };
        }
      })
      .addCase(fetchWorkspaces.rejected, (state, action) => {
        state.loading.fetchWorkspaces = false;
        state.errors.workspaces = action.payload;
        state.workspaces = [];
      })
      
      // Fetch single workspace
      .addCase(fetchWorkspace.pending, (state) => {
        state.loading.fetchWorkspace = true;
        state.errors.currentWorkspace = null;
      })
      .addCase(fetchWorkspace.fulfilled, (state, action) => {
        state.loading.fetchWorkspace = false;
        state.currentWorkspace = action.payload.data;
        state.workspaceMembers = action.payload.data?.members || [];
        state.selectedWorkspaceId = action.payload.data?._id;
      })
      .addCase(fetchWorkspace.rejected, (state, action) => {
        state.loading.fetchWorkspace = false;
        state.errors.currentWorkspace = action.payload;
        state.currentWorkspace = null;
      })
      
      // Create workspace
      .addCase(createWorkspace.pending, (state) => {
        state.loading.createWorkspace = true;
        state.errors.workspaces = null;
      })
      .addCase(createWorkspace.fulfilled, (state, action) => {
        state.loading.createWorkspace = false;
        const newWorkspace = action.payload.data;
        state.workspaces.unshift(newWorkspace);
        state.currentWorkspace = newWorkspace;
        state.selectedWorkspaceId = newWorkspace._id;
      })
      .addCase(createWorkspace.rejected, (state, action) => {
        state.loading.createWorkspace = false;
        state.errors.workspaces = action.payload;
      })
      
      // Update workspace
      .addCase(updateWorkspace.pending, (state) => {
        state.loading.updateWorkspace = true;
        state.errors.currentWorkspace = null;
      })
      .addCase(updateWorkspace.fulfilled, (state, action) => {
        state.loading.updateWorkspace = false;
        const updatedWorkspace = action.payload.data;
        
        // Update in workspaces list
        const index = state.workspaces.findIndex(
          workspace => workspace._id === updatedWorkspace._id
        );
        if (index !== -1) {
          state.workspaces[index] = updatedWorkspace;
        }
        
        // Update current workspace if it's the same
        if (state.currentWorkspace?._id === updatedWorkspace._id) {
          state.currentWorkspace = updatedWorkspace;
          state.workspaceMembers = updatedWorkspace.members || [];
        }
      })
      .addCase(updateWorkspace.rejected, (state, action) => {
        state.loading.updateWorkspace = false;
        state.errors.currentWorkspace = action.payload;
      })
      
      // Delete workspace
      .addCase(deleteWorkspace.pending, (state) => {
        state.loading.deleteWorkspace = true;
        state.errors.workspaces = null;
      })
      .addCase(deleteWorkspace.fulfilled, (state, action) => {
        state.loading.deleteWorkspace = false;
        const deletedId = action.payload;
        
        // Remove from workspaces list
        state.workspaces = state.workspaces.filter(
          workspace => workspace._id !== deletedId
        );
        
        // Clear current workspace if it was deleted
        if (state.currentWorkspace?._id === deletedId) {
          state.currentWorkspace = null;
          state.workspaceMembers = [];
          state.selectedWorkspaceId = null;
        }
      })
      .addCase(deleteWorkspace.rejected, (state, action) => {
        state.loading.deleteWorkspace = false;
        state.errors.workspaces = action.payload;
      })
      
      // Add member
      .addCase(addWorkspaceMember.pending, (state) => {
        state.loading.memberOperations = true;
        state.errors.memberOperations = null;
      })
      .addCase(addWorkspaceMember.fulfilled, (state, action) => {
        state.loading.memberOperations = false;
        const updatedWorkspace = action.payload.data;
        
        // Update current workspace
        if (state.currentWorkspace?._id === updatedWorkspace._id) {
          state.currentWorkspace = updatedWorkspace;
          state.workspaceMembers = updatedWorkspace.members || [];
        }
        
        // Update in workspaces list
        const index = state.workspaces.findIndex(
          workspace => workspace._id === updatedWorkspace._id
        );
        if (index !== -1) {
          state.workspaces[index] = updatedWorkspace;
        }
      })
      .addCase(addWorkspaceMember.rejected, (state, action) => {
        state.loading.memberOperations = false;
        state.errors.memberOperations = action.payload;
      })
      
      // Remove member
      .addCase(removeWorkspaceMember.pending, (state) => {
        state.loading.memberOperations = true;
        state.errors.memberOperations = null;
      })
      .addCase(removeWorkspaceMember.fulfilled, (state, action) => {
        state.loading.memberOperations = false;
        const { workspaceId, memberId } = action.payload;
        
        // Update current workspace members
        if (state.currentWorkspace?._id === workspaceId) {
          state.workspaceMembers = state.workspaceMembers.filter(
            member => member.user._id !== memberId
          );
          state.currentWorkspace.members = state.workspaceMembers;
        }
        
        // Update in workspaces list
        const index = state.workspaces.findIndex(workspace => workspace._id === workspaceId);
        if (index !== -1) {
          state.workspaces[index].members = state.workspaces[index].members.filter(
            member => member.user._id !== memberId
          );
        }
      })
      .addCase(removeWorkspaceMember.rejected, (state, action) => {
        state.loading.memberOperations = false;
        state.errors.memberOperations = action.payload;
      })
      
      // Update member role
      .addCase(updateMemberRole.pending, (state) => {
        state.loading.memberOperations = true;
        state.errors.memberOperations = null;
      })
      .addCase(updateMemberRole.fulfilled, (state, action) => {
        state.loading.memberOperations = false;
        const updatedWorkspace = action.payload.data;
        
        // Update current workspace
        if (state.currentWorkspace?._id === updatedWorkspace._id) {
          state.currentWorkspace = updatedWorkspace;
          state.workspaceMembers = updatedWorkspace.members || [];
        }
        
        // Update in workspaces list
        const index = state.workspaces.findIndex(
          workspace => workspace._id === updatedWorkspace._id
        );
        if (index !== -1) {
          state.workspaces[index] = updatedWorkspace;
        }
      })
      .addCase(updateMemberRole.rejected, (state, action) => {
        state.loading.memberOperations = false;
        state.errors.memberOperations = action.payload;
      })
      
      // Leave workspace
      .addCase(leaveWorkspace.pending, (state) => {
        state.loading.memberOperations = true;
        state.errors.memberOperations = null;
      })
      .addCase(leaveWorkspace.fulfilled, (state, action) => {
        state.loading.memberOperations = false;
        const leftWorkspaceId = action.payload;
        
        // Remove from workspaces list
        state.workspaces = state.workspaces.filter(
          workspace => workspace._id !== leftWorkspaceId
        );
        
        // Clear current workspace if user left it
        if (state.currentWorkspace?._id === leftWorkspaceId) {
          state.currentWorkspace = null;
          state.workspaceMembers = [];
          state.selectedWorkspaceId = null;
        }
      })
      .addCase(leaveWorkspace.rejected, (state, action) => {
        state.loading.memberOperations = false;
        state.errors.memberOperations = action.payload;
      })

      // Fetch workspace stats
      .addCase(fetchWorkspaceStats.pending, (state) => {
        state.loading.fetchStats = true;
        state.errors.stats = null;
      })
      .addCase(fetchWorkspaceStats.fulfilled, (state, action) => {
        state.loading.fetchStats = false;
        state.workspaceStats = action.payload.data;
      })
      .addCase(fetchWorkspaceStats.rejected, (state, action) => {
        state.loading.fetchStats = false;
        state.errors.stats = action.payload;
      });
  }
});

// Export actions
export const {
  clearErrors,
  clearCurrentWorkspace,
  setCurrentWorkspace,
  setSelectedWorkspace,
  setFilters,
  clearFilters,
  setCurrentPage,
  resetPagination,
  updateWorkspaceInList,
  addWorkspaceToList,
  removeWorkspaceFromList
} = workspaceSlice.actions;

// ✅ FIXED: Complete set of selectors
export const selectAllWorkspaces = (state) => state.workspaces.workspaces;
export const selectCurrentWorkspace = (state) => state.workspaces.currentWorkspace;
export const selectWorkspaceMembers = (state) => state.workspaces.workspaceMembers;
export const selectSelectedWorkspaceId = (state) => state.workspaces.selectedWorkspaceId;
export const selectWorkspaceStats = (state) => state.workspaces.workspaceStats;

// Loading selectors
export const selectWorkspaceLoading = (state) => state.workspaces.loading;
export const selectWorkspaceErrors = (state) => state.workspaces.errors;

// Pagination and filters
export const selectWorkspacePagination = (state) => state.workspaces.pagination;
export const selectWorkspaceFilters = (state) => state.workspaces.filters;

// Complex selectors
export const selectWorkspaceById = (state, workspaceId) =>
  state.workspaces.workspaces.find(workspace => workspace._id === workspaceId);

export const selectUserRoleInWorkspace = (state, workspaceId, userId) => {
  const workspace = selectWorkspaceById(state, workspaceId) || state.workspaces.currentWorkspace;
  if (!workspace || !userId) return null;
  
  // Check if user is owner
  if (workspace.owner === userId || workspace.owner?._id === userId) return 'owner';
  
  // Find member role
  const member = workspace.members?.find(member => 
    member.user === userId || member.user?._id === userId
  );
  return member?.role || null;
};

export const selectUserPermissionsInWorkspace = (state, workspaceId, userId) => {
  const workspace = selectWorkspaceById(state, workspaceId) || state.workspaces.currentWorkspace;
  if (!workspace || !userId) return null;
  
  // Owner has all permissions
  if (workspace.owner === userId || workspace.owner?._id === userId) {
    return {
      canView: true,
      canEdit: true,
      canAdd: true,
      canDelete: true,
      canInvite: true
    };
  }
  
  // Find member permissions
  const member = workspace.members?.find(member => 
    member.user === userId || member.user?._id === userId
  );
  return member?.permissions || null;
};

export const selectIsWorkspaceOwner = (state, workspaceId, userId) => {
  const workspace = selectWorkspaceById(state, workspaceId);
  if (!workspace || !userId) return false;
  return workspace.owner === userId || workspace.owner?._id === userId;
};

// Utility selectors
export const selectWorkspacesByRole = (state, userId, role) => {
  if (!userId) return [];
  
  return state.workspaces.workspaces.filter(workspace => {
    if (role === 'owner') {
      return workspace.owner === userId || workspace.owner?._id === userId;
    }
    
    const member = workspace.members?.find(m => 
      m.user === userId || m.user?._id === userId
    );
    return member && member.role === role;
  });
};

export const selectWorkspaceCount = (state) => state.workspaces.workspaces.length;

export const selectHasWorkspaces = (state) => state.workspaces.workspaces.length > 0;

export default workspaceSlice.reducer;