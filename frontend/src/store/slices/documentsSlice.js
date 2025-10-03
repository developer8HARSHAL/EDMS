// src/store/slices/documentsSlice.js - Enhanced Documents Redux Slice with Workspace Integration
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { documentApi } from '../../services/apiService';
import workspaceService from '../../services/workspaceService';

// Initial state
const initialState = {
  documents: [],
  workspaceDocuments: {}, // Documents organized by workspace ID
  sharedDocuments: [],
  currentDocument: null,
  favorites: [],
  recentActivity: [],
  popularDocuments: [],
  analytics: {},
  isLoading: false,
  loading: false,
  uploading: false,
  error: null,
  uploadProgress: 0,
  // NEW: Workspace-specific state
  currentWorkspaceId: null,
  workspaceStats: {},
  documentsByCategory: {},
  documentsByTag: {},
  bulkOperationLoading: false,
  filters: {
    searchTerm: '',
    dateRange: null,
    fileType: '',
    category: '',
    tags: [],
    status: 'active',
    sortBy: 'lastModified',
    sortOrder: 'desc',
    // NEW: Workspace filters
    workspaceId: null,
    favoritesOnly: false,
    sizeRange: { min: null, max: null }
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalDocuments: 0,
    documentsPerPage: 10
  }
};

// ===== ASYNC THUNKS =====

// Fetch all documents (user's documents across workspaces)
export const fetchDocuments = createAsyncThunk(
  'documents/fetchDocuments',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await documentApi.getDocuments(params);
      return  response;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch documents';
      return rejectWithValue(message);
    }
  }
);

// NEW: Fetch workspace documents

// FIXED: fetchWorkspaceDocuments in documentsSlice.js
export const fetchWorkspaceDocuments = createAsyncThunk(
  'documents/fetchWorkspaceDocuments',
  async ({ workspaceId, options = {} }, { rejectWithValue }) => {
    try {
      console.log('📄 Fetching documents for workspace:', workspaceId);
      
      const response = await documentApi.getWorkspaceDocuments(workspaceId, options);
      
      console.log('🔍 Raw API response:', response);
      console.log('🔍 Response structure:', {
        hasData: !!response.data,
        dataIsArray: Array.isArray(response.data),
        dataLength: response.data?.length,
        firstItem: response.data?.[0]
      });
      
      // 🔧 FIXED: Use the correct data path
      let documents = [];
      
      if (Array.isArray(response.data)) {
        // If response.data is directly an array of documents
        documents = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        // If response.data.data contains the documents array
        documents = response.data.data;
      } else if (response.data && response.data.documents) {
        // If documents are in response.data.documents
        documents = response.data.documents;
      } else {
        console.warn('⚠️ Unexpected response structure:', response);
        documents = [];
      }
      
      console.log('✅ Documents extracted:', documents.length, 'documents');
      
      return {
        workspaceId,
        documents,
        count: documents.length
      };
    } catch (error) {
      console.error('❌ Error fetching workspace documents:', error);
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch workspace documents'
      );
    }
  }
);

// NEW: Fetch workspace document statistics
export const fetchWorkspaceStats = createAsyncThunk(
  'documents/fetchWorkspaceStats',
  async (workspaceId, { rejectWithValue }) => {
    try {
      const response = await workspaceService.getWorkspaceStats(workspaceId);
      // response is already { success, data: {...} }
      return { workspaceId, stats: response };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);


// NEW: Fetch recent activity
export const fetchRecentActivity = createAsyncThunk(
  'documents/fetchRecentActivity',
  async (workspaceId, { rejectWithValue }) => {
    try {
      const response = await documentApi.getRecentActivity(workspaceId);
      return response.data || response;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch recent activity';
      return rejectWithValue(message);
    }
  }
);

// NEW: Fetch popular documents
export const fetchPopularDocuments = createAsyncThunk(
  'documents/fetchPopularDocuments',
  async (workspaceId, { rejectWithValue }) => {
    try {
      const response = await documentApi.getPopularDocuments(workspaceId);
      return response.data || response;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch popular documents';
      return rejectWithValue(message);
    }
  }
);

// NEW: Fetch documents by category
export const fetchDocumentsByCategory = createAsyncThunk(
  'documents/fetchDocumentsByCategory',
  async ({ workspaceId, category }, { rejectWithValue }) => {
    try {
      const response = await documentApi.getDocumentsByCategory(workspaceId, category);
      return { category, documents: response.data || response };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch documents by category';
      return rejectWithValue(message);
    }
  }
);

// NEW: Fetch documents by tag
export const fetchDocumentsByTag = createAsyncThunk(
  'documents/fetchDocumentsByTag',
  async ({ workspaceId, tag }, { rejectWithValue }) => {
    try {
      const response = await documentApi.getDocumentsByTag(workspaceId, tag);
      return { tag, documents: response.data || response };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch documents by tag';
      return rejectWithValue(message);
    }
  }
);

// NEW: Fetch user favorites
export const fetchFavoriteDocuments = createAsyncThunk(
  'documents/fetchFavoriteDocuments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await documentApi.getFavoriteDocuments();
      return response.data || response;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch favorite documents';
      return rejectWithValue(message);
    }
  }
);

// Fetch shared documents
export const fetchSharedDocuments = createAsyncThunk(
  'documents/fetchSharedDocuments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await documentApi.getSharedDocuments();
      return response.data || response;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch shared documents';
      return rejectWithValue(message);
    }
  }
);

// Fetch single document
export const fetchDocument = createAsyncThunk(
  'documents/fetchDocument',
  async (documentId, { rejectWithValue }) => {
    try {
      const response = await documentApi.getDocument(documentId);
      return response.data || response;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch document';
      return rejectWithValue(message);
    }
  }
);

// Upload document (enhanced with workspace context)
export const uploadDocument = createAsyncThunk(
  'documents/uploadDocument',
  async ({ formData, workspaceId }, { rejectWithValue, dispatch }) => {
    try {
      dispatch(setUploadProgress(0));
      
      // Add workspace ID to form data if provided
      if (workspaceId) {
        formData.append('workspaceId', workspaceId);
      }
      
      const response = await documentApi.uploadDocument(formData);
      
      dispatch(setUploadProgress(100));
      
      // Refresh appropriate document lists
      if (workspaceId) {
        dispatch(fetchWorkspaceDocuments({ workspaceId }));
      } else {
        dispatch(fetchDocuments());
      }
      
      return response.data || response;
    } catch (error) {
      dispatch(setUploadProgress(0));
      const message = error.response?.data?.message || error.message || 'Failed to upload document';
      return rejectWithValue(message);
    }
  }
);

export const updateDocument = createAsyncThunk(
  'documents/updateDocument',
  async ({ documentId, updates, workspaceId }, { rejectWithValue, dispatch }) => {
    try {
      const response = await documentApi.updateDocument(documentId, updates);
      const updatedDoc = response.data || response;
      
      // Don't use updateDocumentLocal - just force a full refresh
      if (workspaceId) {
        // Use immediate dispatch without setTimeout
        await dispatch(fetchWorkspaceDocuments({ workspaceId })).unwrap();
      }
      
      return updatedDoc;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to update document';
      return rejectWithValue(message);
    }
  }
);
// Delete document
export const deleteDocument = createAsyncThunk(
  'documents/deleteDocument',
  async ({ documentId, workspaceId }, { rejectWithValue, dispatch }) => {
    try {
      await documentApi.deleteDocument(documentId);
      
      // Refresh appropriate document lists
      if (workspaceId) {
        dispatch(fetchWorkspaceDocuments({ workspaceId }));
      } else {
        dispatch(fetchDocuments());
      }
      
      return documentId;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to delete document';
      return rejectWithValue(message);
    }
  }
);

// NEW: Toggle favorite document
export const toggleFavorite = createAsyncThunk(
  'documents/toggleFavorite',
  async (documentId, { rejectWithValue }) => {
    try {
      const response = await documentApi.toggleFavorite(documentId);
      return { documentId, isFavorite: response.data?.isFavorite };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to toggle favorite';
      return rejectWithValue(message);
    }
  }
);

// NEW: Move document to different workspace
export const moveDocument = createAsyncThunk(
  'documents/moveDocument',
  async ({ documentId, fromWorkspaceId, toWorkspaceId }, { rejectWithValue, dispatch }) => {
    try {
      const response = await documentApi.moveDocument(documentId, toWorkspaceId);
      
      // Refresh both workspace document lists
      if (fromWorkspaceId) {
        dispatch(fetchWorkspaceDocuments({ workspaceId: fromWorkspaceId }));
      }
      if (toWorkspaceId) {
        dispatch(fetchWorkspaceDocuments({ workspaceId: toWorkspaceId }));
      }
      
      return response.data || response;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to move document';
      return rejectWithValue(message);
    }
  }
);

// NEW: Duplicate document
export const duplicateDocument = createAsyncThunk(
  'documents/duplicateDocument',
  async ({ documentId, workspaceId }, { rejectWithValue, dispatch }) => {
    try {
      const response = await documentApi.duplicateDocument(documentId);
      
      // Refresh workspace documents
      if (workspaceId) {
        dispatch(fetchWorkspaceDocuments({ workspaceId }));
      }
      
      return response.data || response;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to duplicate document';
      return rejectWithValue(message);
    }
  }
);

// NEW: Bulk delete documents
export const bulkDeleteDocuments = createAsyncThunk(
  'documents/bulkDeleteDocuments',
  async ({ documentIds, workspaceId }, { rejectWithValue, dispatch }) => {
    try {
      const response = await documentApi.bulkDeleteDocuments(workspaceId, documentIds);
      
      // Refresh workspace documents
      if (workspaceId) {
        dispatch(fetchWorkspaceDocuments({ workspaceId }));
      }
      
      return { documentIds, workspaceId };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to delete documents';
      return rejectWithValue(message);
    }
  }
);

// NEW: Archive document
export const archiveDocument = createAsyncThunk(
  'documents/archiveDocument',
  async ({ documentId, workspaceId }, { rejectWithValue, dispatch }) => {
    try {
      const response = await documentApi.archiveDocument(documentId);
      
      // Refresh workspace documents
      if (workspaceId) {
        dispatch(fetchWorkspaceDocuments({ workspaceId }));
      }
      
      return { documentId, workspaceId };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to archive document';
      return rejectWithValue(message);
    }
  }
);

// NEW: Search documents
export const searchDocuments = createAsyncThunk(
  'documents/searchDocuments',
  async ({ query, workspaceId, filters = {} }, { rejectWithValue }) => {
    try {
      const response = await documentApi.searchDocuments(query, workspaceId, filters);
      return { workspaceId, documents: response.data || response, query, filters };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to search documents';
      return rejectWithValue(message);
    }
  }
);

// Preview document
export const previewDocument = createAsyncThunk(
  'documents/previewDocument',
  async (documentId, { rejectWithValue }) => {
    try {
      const response = await documentApi.previewDocument(documentId);
      return { documentId, blob: response };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to preview document';
      return rejectWithValue(message);
    }
  }
);

// Download document
export const downloadDocument = createAsyncThunk(
  'documents/downloadDocument',
  async ({ documentId, filename }, { rejectWithValue }) => {
    try {
      const response = await documentApi.downloadDocument(documentId);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename || `document_${documentId}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { documentId, filename };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to download document';
      return rejectWithValue(message);
    }
  }
);

// Documents slice
const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    
    // Set current document
    setCurrentDocument: (state, action) => {
      state.currentDocument = action.payload;
    },
    
    // Clear current document
    clearCurrentDocument: (state) => {
      state.currentDocument = null;
    },
    
    // Set upload progress
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
    
    // NEW: Set current workspace
    setCurrentWorkspace: (state, action) => {
      state.currentWorkspaceId = action.payload;
      state.filters.workspaceId = action.payload;
    },
    
    // Update filters
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    // Reset filters
    resetFilters: (state) => {
      state.filters = { ...initialState.filters, workspaceId: state.currentWorkspaceId };
    },
    
    // Update pagination
    updatePagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    
    // Add document to list (for real-time updates)
    addDocument: (state, action) => {
      const document = action.payload;
      state.documents.unshift(document);
      
      // Add to workspace documents if workspace context exists
      if (document.workspace && state.workspaceDocuments[document.workspace]) {
        state.workspaceDocuments[document.workspace].unshift(document);
      }
      
      state.pagination.totalDocuments += 1;
    },
    
    // Update document in list
    updateDocumentLocal: (state, action) => {
      const updatedDoc = action.payload;
      
      // Update in main documents list
      const index = state.documents.findIndex(doc => doc._id === updatedDoc._id);
      if (index !== -1) {
        state.documents[index] = { ...state.documents[index], ...updatedDoc };
      }
      
      // Update in workspace documents
      if (updatedDoc.workspace && state.workspaceDocuments[updatedDoc.workspace]) {
        const wsIndex = state.workspaceDocuments[updatedDoc.workspace]
          .findIndex(doc => doc._id === updatedDoc._id);
        if (wsIndex !== -1) {
          state.workspaceDocuments[updatedDoc.workspace][wsIndex] = 
            { ...state.workspaceDocuments[updatedDoc.workspace][wsIndex], ...updatedDoc };
        }
      }
      
      // Update current document if it's the same
      if (state.currentDocument?._id === updatedDoc._id) {
        state.currentDocument = { ...state.currentDocument, ...updatedDoc };
      }
    },
    
    // Remove document from list
    removeDocument: (state, action) => {
      const documentId = action.payload;
      
      // Remove from main documents list
      state.documents = state.documents.filter(doc => doc._id !== documentId);
      
      // Remove from workspace documents
      Object.keys(state.workspaceDocuments).forEach(workspaceId => {
        state.workspaceDocuments[workspaceId] = state.workspaceDocuments[workspaceId]
          .filter(doc => doc._id !== documentId);
      });
      
      // Clear current document if it's the same
      if (state.currentDocument?._id === documentId) {
        state.currentDocument = null;
      }
      
      state.pagination.totalDocuments -= 1;
    },
    
    // NEW: Update document favorite status
    updateDocumentFavorite: (state, action) => {
      const { documentId, isFavorite } = action.payload;
      
      // Update in all relevant lists
      [state.documents, ...Object.values(state.workspaceDocuments), state.favorites]
        .flat()
        .forEach(doc => {
          if (doc._id === documentId) {
            doc.isFavorite = isFavorite;
          }
        });
      
      // Update favorites list
      if (isFavorite) {
        const document = state.documents.find(doc => doc._id === documentId);
        if (document && !state.favorites.find(fav => fav._id === documentId)) {
          state.favorites.push(document);
        }
      } else {
        state.favorites = state.favorites.filter(doc => doc._id !== documentId);
      }
    }
  },
  extraReducers: (builder) => {
  // 1. Fix the fetchDocuments case (should NOT handle workspace data)
builder
  .addCase(fetchDocuments.pending, (state) => {
    state.loading = true;
    state.error = null;
  })
  .addCase(fetchDocuments.fulfilled, (state, action) => {
  state.loading = false;
  
  // Handle the actual API response structure
  const documents = action.payload.data || action.payload || [];
  state.documents = Array.isArray(documents) ? documents : [];
  
  // Update pagination
  state.pagination.totalDocuments = action.payload.count || state.documents.length;
  
  console.log(`Stored ${state.documents.length} documents in Redux`);
  state.error = null;
})
  .addCase(fetchDocuments.rejected, (state, action) => {
    state.loading = false;
    state.error = action.payload;
  });


    // 2. Fix the fetchWorkspaceDocuments case (this was the problem!)
builder
  .addCase(fetchWorkspaceDocuments.pending, (state) => {
    state.loading = true;
    state.error = null;
  })
  .addCase(fetchWorkspaceDocuments.fulfilled, (state, action) => {
    state.loading = false;
    console.log('🔧 Redux: Processing workspace documents:', action.payload);
    
    const { workspaceId, documents } = action.payload;
    
    // 🔧 FIXED: Properly store workspace documents
    if (!state.workspaceDocuments) {
      state.workspaceDocuments = {};
    }
    
    state.workspaceDocuments[workspaceId] = Array.isArray(documents) ? documents : [];
    
    console.log('✅ Redux: Workspace documents stored:', {
      workspaceId,
      documentCount: state.workspaceDocuments[workspaceId].length,
      documents: state.workspaceDocuments[workspaceId]
    });
    
    state.error = null;
  })
  .addCase(fetchWorkspaceDocuments.rejected, (state, action) => {
    state.loading = false;
    state.error = action.payload;
    console.error('❌ Redux: Failed to fetch workspace documents:', action.payload);
  });

    // NEW: Fetch workspace stats
   builder
.addCase(fetchWorkspaceStats.fulfilled, (state, action) => {
  console.log('🔍 REDUCER RECEIVED:', action.payload);
  const { workspaceId, stats } = action.payload;
  console.log('📦 Stats object:', stats);
  console.log('📦 Stats.data:', stats.data);
    state.workspaceStats[workspaceId] = stats; 
  console.log('✅ STORED IN REDUX:', state.workspaceStats[workspaceId]);
});

    // NEW: Fetch recent activity
    builder
      .addCase(fetchRecentActivity.fulfilled, (state, action) => {
        state.recentActivity = action.payload;
      });

    // NEW: Fetch popular documents
    builder
      .addCase(fetchPopularDocuments.fulfilled, (state, action) => {
        state.popularDocuments = action.payload;
      });

    // NEW: Fetch documents by category
    builder
      .addCase(fetchDocumentsByCategory.fulfilled, (state, action) => {
        const { category, documents } = action.payload;
        state.documentsByCategory[category] = documents;
      });

    // NEW: Fetch documents by tag
    builder
      .addCase(fetchDocumentsByTag.fulfilled, (state, action) => {
        const { tag, documents } = action.payload;
        state.documentsByTag[tag] = documents;
      });

    // NEW: Fetch favorites
    builder
      .addCase(fetchFavoriteDocuments.fulfilled, (state, action) => {
        state.favorites = action.payload;
      });

    // Fetch shared documents
    builder
      .addCase(fetchSharedDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSharedDocuments.fulfilled, (state, action) => {
        state.loading = false;
        state.sharedDocuments = Array.isArray(action.payload) ? action.payload : [];
        state.error = null;
      })
      .addCase(fetchSharedDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch single document
    builder
      .addCase(fetchDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocument.fulfilled, (state, action) => {
        state.loading = false;
        state.currentDocument = action.payload;
        state.error = null;
      })
      .addCase(fetchDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Upload document
    builder
      .addCase(uploadDocument.pending, (state) => {
        state.uploading = true;
        state.error = null;
      })
      .addCase(uploadDocument.fulfilled, (state, action) => {
        state.uploading = false;
        state.uploadProgress = 0;
        state.error = null;
      })
      .addCase(uploadDocument.rejected, (state, action) => {
        state.uploading = false;
        state.uploadProgress = 0;
        state.error = action.payload;
      });

    // Delete document
    builder
      .addCase(deleteDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(deleteDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

      builder
  .addCase(updateDocument.pending, (state) => {
    state.loading = true;
    state.error = null;
  })
  .addCase(updateDocument.fulfilled, (state, action) => {
    state.loading = false;
    const updatedDoc = action.payload.data || action.payload;
    
    // Update in main documents list
    const index = state.documents.findIndex(doc => doc._id === updatedDoc._id);
    if (index !== -1) {
      state.documents[index] = updatedDoc;
    }
    
    // Update in workspace documents
    if (updatedDoc.workspace && state.workspaceDocuments[updatedDoc.workspace]) {
      const wsIndex = state.workspaceDocuments[updatedDoc.workspace]
        .findIndex(doc => doc._id === updatedDoc._id);
      if (wsIndex !== -1) {
        state.workspaceDocuments[updatedDoc.workspace][wsIndex] = updatedDoc;
      }
    }
    
    // Update current document if it's the same
    if (state.currentDocument?._id === updatedDoc._id) {
      state.currentDocument = updatedDoc;
    }
    
    state.error = null;
  })
  .addCase(updateDocument.rejected, (state, action) => {
    state.loading = false;
    state.error = action.payload;
  });

    // NEW: Toggle favorite
    builder
      .addCase(toggleFavorite.fulfilled, (state, action) => {
        const { documentId, isFavorite } = action.payload;
        documentsSlice.caseReducers.updateDocumentFavorite(state, { payload: { documentId, isFavorite } });
      });

    // NEW: Bulk operations
    builder
      .addCase(bulkDeleteDocuments.pending, (state) => {
        state.bulkOperationLoading = true;
      })
      .addCase(bulkDeleteDocuments.fulfilled, (state) => {
        state.bulkOperationLoading = false;
      })
      .addCase(bulkDeleteDocuments.rejected, (state, action) => {
        state.bulkOperationLoading = false;
        state.error = action.payload;
      });

    // Preview document
    builder
      .addCase(previewDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(previewDocument.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(previewDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Download document
    builder
      .addCase(downloadDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(downloadDocument.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(downloadDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// Export actions
export const {
  clearError,
  setCurrentDocument,
  clearCurrentDocument,
  setUploadProgress,
  setCurrentWorkspace,
  updateFilters,
  resetFilters,
  updatePagination,
  addDocument,
  updateDocumentLocal,
  removeDocument,
  updateDocumentFavorite
} = documentsSlice.actions;

// ===== SELECTORS =====

// Basic selectors
export const selectDocuments = (state) => state.documents.documents;
export const selectCurrentWorkspaceId = (state) => state.documents.currentWorkspaceId;
export const selectWorkspaceDocuments = (state, workspaceId) => 
  state.documents.workspaceDocuments[workspaceId] || [];
export const selectCurrentWorkspaceDocuments = (state) => 
  state.documents.currentWorkspaceId ? 
    state.documents.workspaceDocuments[state.documents.currentWorkspaceId] || [] : 
    state.documents.documents;
export const selectDocumentLoading = (state) => state.documents?.loading || false;
export const selectSharedDocuments = (state) => state.documents.sharedDocuments;
export const selectCurrentDocument = (state) => state.documents.currentDocument;
export const selectFavoriteDocuments = (state) => state.documents.favorites;
export const selectRecentActivity = (state) => state.documents.recentActivity;
export const selectPopularDocuments = (state) => state.documents.popularDocuments;
export const selectDocumentsLoading = (state) => state.documents.loading;
export const selectUploading = (state) => state.documents.uploading;
export const selectUploadProgress = (state) => state.documents.uploadProgress;
export const selectDocumentsError = (state) => state.documents.error;
export const selectFilters = (state) => state.documents.filters;
export const selectPagination = (state) => state.documents.pagination;
export const selectBulkOperationLoading = (state) => state.documents.bulkOperationLoading;
export const selectWorkspaceStats = (state, workspaceId) => 
  state.documents.workspaceStats[workspaceId] || {};
export const selectDocumentsByCategory = (state, category) => 
  state.documents.documentsByCategory[category] || [];
export const selectDocumentsByTag = (state, tag) => 
  state.documents.documentsByTag[tag] || [];

// Complex selectors
export const selectFilteredDocuments = (state) => {
  const { filters, currentWorkspaceId } = state.documents;
  const { searchTerm, fileType, category, tags, status, sortBy, sortOrder, favoritesOnly, sizeRange } = filters;
  
  // Get documents based on context (workspace or all)
  let documents = currentWorkspaceId ? 
    state.documents.workspaceDocuments[currentWorkspaceId] || [] : 
    state.documents.documents;
  
  let filtered = [...documents];
  
  // Filter by favorites
  if (favoritesOnly) {
    filtered = filtered.filter(doc => doc.isFavorite);
  }
  
  // Filter by status
  if (status && status !== 'all') {
    filtered = filtered.filter(doc => doc.status === status);
  }
  
  // Filter by search term
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(doc => 
      doc.name?.toLowerCase().includes(term) ||
      doc.originalName?.toLowerCase().includes(term) ||
      doc.description?.toLowerCase().includes(term) ||
      doc.tags?.some(tag => tag.toLowerCase().includes(term))
    );
  }
  
  // Filter by file type
  if (fileType) {
    filtered = filtered.filter(doc => 
      doc.type?.includes(fileType) || 
      doc.originalName?.toLowerCase().endsWith(fileType.toLowerCase())
    );
  }
  
  // Filter by category
  if (category) {
    filtered = filtered.filter(doc => doc.category === category);
  }
  
  // Filter by tags
  if (tags && tags.length > 0) {
    filtered = filtered.filter(doc => 
      doc.tags && tags.some(tag => doc.tags.includes(tag))
    );
  }
  
  // Filter by size range
  if (sizeRange.min !== null || sizeRange.max !== null) {
    filtered = filtered.filter(doc => {
      const size = doc.size || 0;
      if (sizeRange.min !== null && size < sizeRange.min) return false;
      if (sizeRange.max !== null && size > sizeRange.max) return false;
      return true;
    });
  }
  
  // Sort documents
  filtered.sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'uploadDate' || sortBy === 'lastModified') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
  
  return filtered;
};


// NEW: Selector for document statistics
export const selectDocumentStatistics = (state) => {
  const documents = selectCurrentWorkspaceDocuments(state);
  const totalSize = documents.reduce((sum, doc) => sum + (doc.size || 0), 0);
  const categoryStats = documents.reduce((stats, doc) => {
    const category = doc.category || 'other';
    stats[category] = (stats[category] || 0) + 1;
    return stats;
  }, {});
  const typeStats = documents.reduce((stats, doc) => {
    const type = doc.type?.split('/')[0] || 'unknown';
    stats[type] = (stats[type] || 0) + 1;
    return stats;
  }, {});

  return {
    total: documents.length,
    totalSize,
    categoryStats,
    typeStats,
    favorites: documents.filter(doc => doc.isFavorite).length,
    archived: documents.filter(doc => doc.status === 'archived').length
  };
};

// NEW: Selector for available tags
export const selectAvailableTags = (state) => {
  const documents = selectCurrentWorkspaceDocuments(state);
  const tags = new Set();
  documents.forEach(doc => {
    if (doc.tags) {
      doc.tags.forEach(tag => tags.add(tag));
    }
  });
  return Array.from(tags).sort();
};

// NEW: Selector for available categories
export const selectAvailableCategories = (state) => {
  const documents = selectCurrentWorkspaceDocuments(state);
  const categories = new Set();
  documents.forEach(doc => {
    if (doc.category) {
      categories.add(doc.category);
    }
  });
  return Array.from(categories).sort();
};

export default documentsSlice.reducer;