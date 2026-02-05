import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import workspaceService from '../../services/workspaceService';

// Initial state
const initialState = {
  workspaces: [],
  currentWorkspace: null,
  workspaceMembers: [],
  selectedWorkspaceId: null,
  workspaceStats: null,
  isLoading: false,
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
    stats: null,
    fetch: null,
    current: null,
    create: null,
    general: null
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



export const fetchWorkspaces = createAsyncThunk(
  'workspace/fetchWorkspaces',
  async (params = {}, { rejectWithValue }) => {
    try {
      console.log('🔄 Redux: Fetching workspaces with params:', params);
      
      const response = await workspaceService.getWorkspaces(params);
      console.log('📋 Redux: Raw API response:', response);

     const workspacesData = response?.data;  // ✅ go one level higher

if (response?.success && workspacesData?.workspaces) {
  console.log("📦 Thunk parsed workspaces:", workspacesData?.workspaces?.length);

  return {
    workspaces: workspacesData.workspaces,
    pagination: {
      totalDocs: workspacesData.totalDocs || 0,
      totalPages: workspacesData.totalPages || 1,
      currentPage: workspacesData.currentPage || params?.page || 1,
      hasNextPage: workspacesData.hasNextPage || false,
      hasPrevPage: workspacesData.hasPrevPage || false
    }
  };
}


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

      throw new Error('Invalid response format from server');
    } catch (error) {
      console.error('❌ Redux: fetchWorkspaces error:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch workspaces');

    }
  }
);



export const fetchWorkspace = createAsyncThunk(
  'workspace/fetchWorkspace',
  async (workspaceId, { rejectWithValue }) => {
    try {
      console.log("Fetching workspace with ID:", workspaceId);

      const response = await workspaceService.getWorkspace(workspaceId);
      console.log("Raw workspace response:", response);

      if (response) {
  console.log("Workspace data received:", response);
  return response;
}

return rejectWithValue("Invalid workspace data");

    } catch (err) {
      console.error("❌ Failed to fetch workspace:", err);
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);



// Create new workspace - FIXED VERSION
export const createWorkspace = createAsyncThunk(
  'workspaces/createWorkspace',
  async (workspaceData, { rejectWithValue }) => {
    try {
      console.log('🚀 Creating workspace with data:', workspaceData);
      
      const response = await workspaceService.createWorkspace(workspaceData);
console.log('🔨 Raw API Response:', response);

// workspaceService returns the workspace object directly
return response;
      
    } catch (error) {
      console.error('❌ Create workspace error:', error);
      console.error('❌ Error response:', error.response);
      
      // Handle different error formats
      if (error.response?.data?.message) {
        return rejectWithValue(error.response.data.message);
      }
      if (error.response?.data) {
        return rejectWithValue(error.response.data);
      }
      return rejectWithValue(error.message || 'Failed to create workspace');
    }
  }
);

// Update workspace
export const updateWorkspace = createAsyncThunk(
  'workspaces/updateWorkspace',
  async ({ workspaceId, updates }, { rejectWithValue }) => {
    try {
      const response = await workspaceService.updateWorkspace(workspaceId, updates);
      if (response.success && response.data) {
        return response.data.workspace || response.data;
      }
      throw new Error(response.message || 'Failed to update workspace');
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
      const response = await workspaceService.deleteWorkspace(workspaceId);
      if (response.success) {
        return workspaceId;
      }
      throw new Error(response.message || 'Failed to delete workspace');
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
      const response = await workspaceService.addMember(workspaceId, memberData);
      if (response.success && response.data) {
        return response.data.workspace || response.data;
      }
      throw new Error(response.message || 'Failed to add member');
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
      const response = await workspaceService.removeMember(workspaceId, memberId);
      if (response.success) {
        return { workspaceId, memberId };
      }
      throw new Error(response.message || 'Failed to remove member');
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
      const response = await workspaceService.updateMemberRole(workspaceId, memberId, roleData);
      if (response.success && response.data) {
        return response.data.workspace || response.data;
      }
      throw new Error(response.message || 'Failed to update member role');
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
      const response = await workspaceService.leaveWorkspace(workspaceId);
      if (response.success) {
        return workspaceId;
      }
      throw new Error(response.message || 'Failed to leave workspace');
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
      const response = await workspaceService.getWorkspaceStats(workspaceId);
      
      // Check what we actually received
      console.log('📊 Stats response:', response);
      
      // If response has data property, return that
      if (response.data) {
        return response.data;
      }
      
      // Otherwise return response directly (service might have unwrapped it)
      return response;
      
    } catch (error) {
      console.error('❌ Stats error:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch workspace stats');
    }
  }
);

// Workspace slice
const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    // Clear specific errors
    clearErrors: (state) => {
      state.errors = {
        workspaces: null,
        currentWorkspace: null,
        memberOperations: null,
        stats: null,
        fetch: null,
        current: null,
        create: null,
        general: null
      };
    },
    
    // Clear current workspace
    clearCurrentWorkspace: (state) => {
      state.currentWorkspace = null;
      state.workspaceMembers = [];
      state.selectedWorkspaceId = null;
      state.errors.currentWorkspace = null;
      state.errors.current = null;
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
      // ✅ FIXED: Handle backend response format for fetchWorkspaces
      .addCase(fetchWorkspaces.pending, (state) => {
        state.loading.fetchWorkspaces = true;
        state.isLoading = true;
        state.errors.fetch = null;
        state.errors.workspaces = null;
      })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.loading.fetchWorkspaces = false;
        state.isLoading = false;
        
        // ✅ CLEANED UP: Simple response handling
        state.workspaces = action.payload.workspaces || [];
        state.pagination = action.payload.pagination || initialState.pagination;
        
        state.errors.fetch = null;
        state.errors.workspaces = null;
        console.log("🔧 Reducer received payload:", action.payload);
console.log("🔧 Before update:", state.workspaces);
        
        console.log('✅ Redux: Workspaces updated:', state.workspaces.length);
      })
      .addCase(fetchWorkspaces.rejected, (state, action) => {
        state.loading.fetchWorkspaces = false;
        state.isLoading = false;
        state.errors.fetch = action.payload;
        state.errors.workspaces = action.payload;
        state.workspaces = [];
        
        console.error('❌ Redux: fetchWorkspaces rejected:', action.payload);
      })
      
      // ✅ FIXED: Handle backend response format for fetchWorkspace
      .addCase(fetchWorkspace.pending, (state) => {
        state.loading.fetchWorkspace = true;
        state.isLoading = true;
        state.errors.current = null;
        state.errors.currentWorkspace = null;
      })
      .addCase(fetchWorkspace.fulfilled, (state, action) => {
        state.loading.fetchWorkspace = false;
        state.isLoading = false;
        state.currentWorkspace = action.payload;
        state.workspaceMembers = action.payload?.members || [];
        state.selectedWorkspaceId = action.payload?._id;
        state.errors.current = null;
        state.errors.currentWorkspace = null;
      })
      .addCase(fetchWorkspace.rejected, (state, action) => {
        state.loading.fetchWorkspace = false;
        state.isLoading = false;
        state.errors.current = action.payload;
        state.errors.currentWorkspace = action.payload;
        state.currentWorkspace = null;
      })
      
      // Create workspace
      .addCase(createWorkspace.pending, (state) => {
        state.loading.createWorkspace = true;
        state.errors.create = null;
        state.errors.workspaces = null;
      })
      .addCase(createWorkspace.fulfilled, (state, action) => {
        state.loading.createWorkspace = false;
        const newWorkspace = action.payload;
        state.workspaces.unshift(newWorkspace);
        state.currentWorkspace = newWorkspace;
        state.selectedWorkspaceId = newWorkspace._id;
        state.errors.create = null;
      })
      .addCase(createWorkspace.rejected, (state, action) => {
        state.loading.createWorkspace = false;
        state.errors.create = action.payload;
        state.errors.workspaces = action.payload;
      })
      
      // Update workspace
      .addCase(updateWorkspace.pending, (state) => {
        state.loading.updateWorkspace = true;
        state.errors.currentWorkspace = null;
      })
      .addCase(updateWorkspace.fulfilled, (state, action) => {
        state.loading.updateWorkspace = false;
        const updatedWorkspace = action.payload;
        
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
        const updatedWorkspace = action.payload;
        
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
        const updatedWorkspace = action.payload;
        
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
        state.workspaceStats = action.payload;
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

// ✅ FIXED: Add null checks to all selectors
export const selectAllWorkspaces = (state) => state.workspace?.workspaces || [];
export const selectCurrentWorkspace = (state) => state.workspace?.currentWorkspace || null;
export const selectWorkspaceMembers = (state) => state.workspace?.workspaceMembers || [];
export const selectSelectedWorkspaceId = (state) => state.workspace?.selectedWorkspaceId || null;
export const selectWorkspaceStats = (state) => state.workspace?.workspaceStats || null;

// ✅ FIXED: Loading selectors with null checks
export const selectWorkspaceLoading = (state) => state.workspace?.isLoading || state.workspace?.loading?.fetchWorkspaces || false;
export const selectWorkspacesLoading = (state) => state.workspace?.loading?.fetchWorkspaces || false;
export const selectWorkspaceDetailsLoading = (state) => state.workspace?.loading?.fetchWorkspace || false;
export const selectCreateWorkspaceLoading = (state) => state.workspace?.loading?.createWorkspace || false;
export const selectUpdateWorkspaceLoading = (state) => state.workspace?.loading?.updateWorkspace || false;
export const selectDeleteWorkspaceLoading = (state) => state.workspace?.loading?.deleteWorkspace || false;
export const selectMemberOperationsLoading = (state) => state.workspace?.loading?.memberOperations || false;

// ✅ FIXED: Error selectors with null checks - Updated for backend format
export const selectWorkspaceErrors = (state) => state.workspace?.errors || {};
export const selectWorkspacesError = (state) => state.workspace?.errors?.workspaces || state.workspace?.errors?.fetch || null;
export const selectCurrentWorkspaceError = (state) => state.workspace?.errors?.currentWorkspace || state.workspace?.errors?.current || null;
export const selectMemberOperationsError = (state) => state.workspace?.errors?.memberOperations || null;
export const selectWorkspaceStatsError = (state) => state.workspace?.errors?.stats || null;

// ✅ FIXED: Pagination and filters with null checks
export const selectWorkspacePagination = (state) => state.workspace?.pagination || { 
  currentPage: 1, 
  totalPages: 1, 
  totalDocs: 0,
  hasNextPage: false,
  hasPrevPage: false
};
export const selectWorkspaceFilters = (state) => state.workspace?.filters || { 
  search: '', 
  sortBy: 'updatedAt', 
  sortOrder: 'desc', 
  role: '' 
};

// ✅ FIXED: Complex selectors with null checks
export const selectWorkspaceById = (state, workspaceId) => {
  const workspaces = state.workspace?.workspaces || [];
  return workspaces.find(workspace => workspace._id === workspaceId) || null;
};

export const selectUserRoleInWorkspace = (state, workspaceId, userId) => {
  const workspace = selectWorkspaceById(state, workspaceId) || state.workspace?.currentWorkspace;
  if (!workspace || !userId) return null;
  
  // Check if user is owner
  const ownerId = workspace.owner?._id || workspace.owner;
  if (ownerId === userId) return 'owner';
  
  // Find member role
  const member = workspace.members?.find(member => {
    const memberId = member.user?._id || member.user;
    return memberId === userId;
  });
  return member?.role || null;
};

export const selectUserPermissionsInWorkspace = (state, workspaceId, userId) => {
  const workspace = selectWorkspaceById(state, workspaceId) || state.workspace?.currentWorkspace;
  if (!workspace || !userId) return null;
  
  // Owner has all permissions
  const ownerId = workspace.owner?._id || workspace.owner;
  if (ownerId === userId) {
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
    return memberId === userId;
  });
  return member?.permissions || null;
};

export const selectIsWorkspaceOwner = (state, workspaceId, userId) => {
  const workspace = selectWorkspaceById(state, workspaceId);
  if (!workspace || !userId) return false;
  const ownerId = workspace.owner?._id || workspace.owner;
  return ownerId === userId;
};

export const selectWorkspacesByRole = (state, userId, role) => {
  if (!userId) return [];
  
  const workspaces = state.workspace?.workspaces || [];
  return workspaces.filter(workspace => {
    if (role === 'owner') {
      const ownerId = workspace.owner?._id || workspace.owner;
      return ownerId === userId;
    }
    
    const member = workspace.members?.find(m => {
      const memberId = m.user?._id || m.user;
      return memberId === userId;
    });
    return member && member.role === role;
  });
};

export const selectWorkspaceCount = (state) => state.workspace?.workspaces?.length || 0;
export const selectHasWorkspaces = (state) => (state.workspace?.workspaces?.length || 0) > 0;

export default workspaceSlice.reducer;