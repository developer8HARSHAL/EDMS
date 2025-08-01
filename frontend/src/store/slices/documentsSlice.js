// src/store/slices/documentsSlice.js - Documents Redux Slice
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { documentApi } from '../../services/apiService';

// Initial state
const initialState = {
  documents: [],
  sharedDocuments: [],
  currentDocument: null,
  loading: false,
  uploading: false,
  error: null,
  uploadProgress: 0,
  filters: {
    searchTerm: '',
    dateRange: null,
    fileType: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalDocuments: 0,
    documentsPerPage: 10
  }
};

// Async thunks for API calls

// Fetch all documents
export const fetchDocuments = createAsyncThunk(
  'documents/fetchDocuments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await documentApi.getAllDocuments();
      return response.data || response;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch documents';
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

// Upload document
export const uploadDocument = createAsyncThunk(
  'documents/uploadDocument',
  async (formData, { rejectWithValue, dispatch }) => {
    try {
      // You can add upload progress tracking here if needed
      dispatch(setUploadProgress(0));
      
      const response = await documentApi.uploadDocument(formData);
      
      dispatch(setUploadProgress(100));
      
      // Refresh documents list after successful upload
      dispatch(fetchDocuments());
      
      return response.data || response;
    } catch (error) {
      dispatch(setUploadProgress(0));
      const message = error.response?.data?.message || error.message || 'Failed to upload document';
      return rejectWithValue(message);
    }
  }
);

// Delete document
export const deleteDocument = createAsyncThunk(
  'documents/deleteDocument',
  async (documentId, { rejectWithValue, dispatch }) => {
    try {
      await documentApi.deleteDocument(documentId);
      
      // Refresh documents list after successful deletion
      dispatch(fetchDocuments());
      
      return documentId;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to delete document';
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
    
    // Update filters
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    // Reset filters
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    
    // Update pagination
    updatePagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    
    // Add document to list (for real-time updates)
    addDocument: (state, action) => {
      state.documents.unshift(action.payload);
      state.pagination.totalDocuments += 1;
    },
    
    // Update document in list
    updateDocument: (state, action) => {
      const index = state.documents.findIndex(doc => doc._id === action.payload._id);
      if (index !== -1) {
        state.documents[index] = { ...state.documents[index], ...action.payload };
      }
    },
    
    // Remove document from list
    removeDocument: (state, action) => {
      state.documents = state.documents.filter(doc => doc._id !== action.payload);
      state.pagination.totalDocuments -= 1;
    }
  },
  extraReducers: (builder) => {
    // Fetch documents
    builder
      .addCase(fetchDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.loading = false;
        state.documents = Array.isArray(action.payload) ? action.payload : [];
        state.pagination.totalDocuments = action.payload.length || 0;
        state.error = null;
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
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
  updateFilters,
  resetFilters,
  updatePagination,
  addDocument,
  updateDocument,
  removeDocument
} = documentsSlice.actions;

// Selectors
export const selectDocuments = (state) => state.documents.documents;
export const selectSharedDocuments = (state) => state.documents.sharedDocuments;
export const selectCurrentDocument = (state) => state.documents.currentDocument;
export const selectDocumentsLoading = (state) => state.documents.loading;
export const selectUploading = (state) => state.documents.uploading;
export const selectUploadProgress = (state) => state.documents.uploadProgress;
export const selectDocumentsError = (state) => state.documents.error;
export const selectFilters = (state) => state.documents.filters;
export const selectPagination = (state) => state.documents.pagination;

// Complex selectors
export const selectFilteredDocuments = (state) => {
  const { documents, filters } = state.documents;
  const { searchTerm, fileType, sortBy, sortOrder } = filters;
  
  let filtered = [...documents];
  
  // Filter by search term
  if (searchTerm) {
    filtered = filtered.filter(doc => 
      doc.originalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  // Filter by file type
  if (fileType) {
    filtered = filtered.filter(doc => 
      doc.mimeType?.includes(fileType) || 
      doc.originalName?.toLowerCase().endsWith(fileType.toLowerCase())
    );
  }
  
  // Sort documents
  filtered.sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
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

export default documentsSlice.reducer;