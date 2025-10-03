// src/hooks/useDocuments.js - Enhanced Custom Documents Hook with Workspace Integration
import { useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import {
  fetchDocuments,
  fetchWorkspaceDocuments,
  fetchWorkspaceStats,
  fetchRecentActivity,
  fetchPopularDocuments,
  fetchDocumentsByCategory,
  fetchDocumentsByTag,
  fetchFavoriteDocuments,
  fetchSharedDocuments,
  fetchDocument,
  uploadDocument,
  updateDocument,
  deleteDocument,
  toggleFavorite,
  moveDocument,
  duplicateDocument,
  bulkDeleteDocuments,
  archiveDocument,
  searchDocuments,
  previewDocument,
  downloadDocument,
  clearError,
  setCurrentDocument,
  clearCurrentDocument,
  setCurrentWorkspace,
  updateFilters,
  resetFilters,
  updatePagination,
  selectDocuments,
  selectCurrentWorkspaceId,
  selectWorkspaceDocuments,
  selectCurrentWorkspaceDocuments,
  selectSharedDocuments,
  selectCurrentDocument,
  selectFavoriteDocuments,
  selectRecentActivity,
  selectPopularDocuments,
  selectDocumentsLoading,
  selectUploading,
  selectUploadProgress,
  selectDocumentsError,
  selectFilters,
  selectPagination,
  selectBulkOperationLoading,
  selectWorkspaceStats,
  selectDocumentsByCategory,
  selectDocumentsByTag,
  selectFilteredDocuments,
  selectDocumentStatistics,
  selectAvailableTags,
  selectAvailableCategories
} from '../store/slices/documentsSlice';

/**
 * Enhanced custom hook for document management functionality with workspace integration
 * Provides all document-related state and actions with workspace context
 */
export const useDocuments = (workspaceId = null) => {
  const dispatch = useDispatch();

  // Set workspace context
// Add this AFTER the useCallback definitions
// Add this useEffect to ensure data is fetched----------------------------------------------

  // Selectors
  const documents = useSelector(selectDocuments);
  const currentWorkspaceId = useSelector(selectCurrentWorkspaceId);
   // 🔧 FIXED: Simplified workspace documents selector
// Inside the workspaceDocuments selector
const workspaceDocuments = useSelector(state => {
  if (!workspaceId) return state.documents.documents || [];
  return state.documents.workspaceDocuments?.[workspaceId] || [];
});

  const sharedDocuments = useSelector(selectSharedDocuments);
  const currentDocument = useSelector(selectCurrentDocument);
  const favorites = useSelector(selectFavoriteDocuments);
  const recentActivity = useSelector(selectRecentActivity);
  const popularDocuments = useSelector(selectPopularDocuments);
  const loading = useSelector(selectDocumentsLoading);
  const uploading = useSelector(selectUploading);
  const uploadProgress = useSelector(selectUploadProgress);
  const error = useSelector(selectDocumentsError);
  const filters = useSelector(selectFilters);
  const pagination = useSelector(selectPagination);
  const bulkOperationLoading = useSelector(selectBulkOperationLoading);
  const workspaceStats = useSelector(state => 
    selectWorkspaceStats(state, workspaceId || currentWorkspaceId)
  );
  const filteredDocuments = useSelector(selectFilteredDocuments);
  const documentStatistics = useSelector(selectDocumentStatistics);
  const availableTags = useSelector(selectAvailableTags);
  const availableCategories = useSelector(selectAvailableCategories);


  
useEffect(() => {
  if (workspaceId && workspaceId !== 'undefined' && workspaceId !== ':workspaceId') {
    console.log('📄 Fetching workspace documents for:', workspaceId);
    dispatch(fetchWorkspaceDocuments({ workspaceId }));
  } else if (!workspaceId) {
    console.log('📄 Fetching all user documents');
    dispatch(fetchDocuments());
  }
}, [dispatch, workspaceId]);

// Keep only the error handling useEffect:
useEffect(() => {
  if (error) {
    toast.error('Document Error', {
      duration: 5000,
    });
  }
}, [error]);
  // ===== DOCUMENT FETCHING =====

  // Fetch all documents (user's documents across workspaces)
// Make sure this function actually dispatches the action
const handleFetchDocuments = useCallback(async (params = {}) => {
  try {
    console.log('Actually dispatching fetchDocuments...');
    const result = await dispatch(fetchDocuments(params));
    console.log('Fetch result:', result);
    return fetchDocuments.fulfilled.match(result);
  } catch (error) {
    console.error('Fetch documents error:', error);
    return false;
  }
}, [dispatch]);

 // 🔧 FIXED: Enhanced workspace documents fetching
  const handleFetchWorkspaceDocuments = useCallback(async (targetWorkspaceId, options = {}) => {
    const wsId = targetWorkspaceId || workspaceId || currentWorkspaceId;
    if (!wsId) {
      console.error('❌ No workspace ID provided for fetching documents');
      return false;
    }

    try {
      console.log('🚀 Fetching workspace documents for:', wsId);
      const result = await dispatch(fetchWorkspaceDocuments({ workspaceId: wsId, options }));
      
      if (fetchWorkspaceDocuments.fulfilled.match(result)) {
        console.log('✅ Workspace documents fetched successfully:', result.payload);
        return true;
      } else {
        console.error('❌ Failed to fetch workspace documents:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Fetch workspace documents error:', error);
      return false;
    }
  }, [dispatch, workspaceId, currentWorkspaceId]);


  // NEW: Fetch workspace statistics
  const handleFetchWorkspaceStats = useCallback(async (targetWorkspaceId) => {
    const wsId = targetWorkspaceId || workspaceId || currentWorkspaceId;
    if (!wsId) return false;

    try {
      const result = await dispatch(fetchWorkspaceStats(wsId));
      return fetchWorkspaceStats.fulfilled.match(result);
    } catch (error) {
      console.error('Fetch workspace stats error:', error);
      return false;
    }
  }, [dispatch, workspaceId, currentWorkspaceId]);

  // NEW: Fetch recent activity
  const handleFetchRecentActivity = useCallback(async (targetWorkspaceId) => {
    const wsId = targetWorkspaceId || workspaceId || currentWorkspaceId;
    if (!wsId) return false;

    try {
      const result = await dispatch(fetchRecentActivity(wsId));
      return fetchRecentActivity.fulfilled.match(result);
    } catch (error) {
      console.error('Fetch recent activity error:', error);
      return false;
    }
  }, [dispatch, workspaceId, currentWorkspaceId]);

  // NEW: Fetch popular documents
  const handleFetchPopularDocuments = useCallback(async (targetWorkspaceId) => {
    const wsId = targetWorkspaceId || workspaceId || currentWorkspaceId;
    if (!wsId) return false;

    try {
      const result = await dispatch(fetchPopularDocuments(wsId));
      return fetchPopularDocuments.fulfilled.match(result);
    } catch (error) {
      console.error('Fetch popular documents error:', error);
      return false;
    }
  }, [dispatch, workspaceId, currentWorkspaceId]);

  // NEW: Fetch documents by category
  const handleFetchDocumentsByCategory = useCallback(async (category, targetWorkspaceId) => {
    const wsId = targetWorkspaceId || workspaceId || currentWorkspaceId;
    if (!wsId) return false;

    try {
      const result = await dispatch(fetchDocumentsByCategory({ workspaceId: wsId, category }));
      return fetchDocumentsByCategory.fulfilled.match(result);
    } catch (error) {
      console.error('Fetch documents by category error:', error);
      return false;
    }
  }, [dispatch, workspaceId, currentWorkspaceId]);

  // NEW: Fetch documents by tag
  const handleFetchDocumentsByTag = useCallback(async (tag, targetWorkspaceId) => {
    const wsId = targetWorkspaceId || workspaceId || currentWorkspaceId;
    if (!wsId) return false;

    try {
      const result = await dispatch(fetchDocumentsByTag({ workspaceId: wsId, tag }));
      return fetchDocumentsByTag.fulfilled.match(result);
    } catch (error) {
      console.error('Fetch documents by tag error:', error);
      return false;
    }
  }, [dispatch, workspaceId, currentWorkspaceId]);

  // NEW: Fetch favorite documents
  const handleFetchFavoriteDocuments = useCallback(async () => {
    try {
      const result = await dispatch(fetchFavoriteDocuments());
      return fetchFavoriteDocuments.fulfilled.match(result);
    } catch (error) {
      console.error('Fetch favorite documents error:', error);
      return false;
    }
  }, [dispatch]);

  // Fetch shared documents
  const handleFetchSharedDocuments = useCallback(async () => {
    try {
      const result = await dispatch(fetchSharedDocuments());
      return fetchSharedDocuments.fulfilled.match(result);
    } catch (error) {
      console.error('Fetch shared documents error:', error);
      return false;
    }
  }, [dispatch]);

  // Fetch single document
  const handleFetchDocument = useCallback(async (documentId) => {
    try {
      const result = await dispatch(fetchDocument(documentId));
      if (fetchDocument.fulfilled.match(result)) {
        return result.payload;
      }
      return null;
    } catch (error) {
      console.error('Fetch document error:', error);
      return null;
    }
  }, [dispatch]);

  // ===== DOCUMENT OPERATIONS =====

   // 🔧 FIXED: Enhanced upload with workspace refresh
  const handleUploadDocument = useCallback(async (formData, targetWorkspaceId) => {
    const wsId = targetWorkspaceId || workspaceId || currentWorkspaceId;
    
    try {
      const result = await dispatch(uploadDocument({ formData, workspaceId: wsId }));
      
      if (uploadDocument.fulfilled.match(result)) {
        toast.success('Upload successful', {
          duration: 3000,
        });
        
        // 🔧 FIXED: Force refresh workspace documents after upload
        if (wsId) {
          setTimeout(() => {
            handleFetchWorkspaceDocuments(wsId);
          }, 1000);
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Upload document error:', error);
      return false;
    }
  }, [dispatch, workspaceId, currentWorkspaceId, handleFetchWorkspaceDocuments]);


  const handleUpdateDocument = useCallback(async (documentId, updates, targetWorkspaceId) => {
  const wsId = targetWorkspaceId || workspaceId || currentWorkspaceId;
  
  try {
    const result = await dispatch(updateDocument({ documentId, updates, workspaceId: wsId }));
    
    if (updateDocument.fulfilled.match(result)) {
      toast.success('Document updated');
      if (wsId) {
        setTimeout(() => handleFetchWorkspaceDocuments(wsId), 500);
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error('Update document error:', error);
    return false;
  }
}, [dispatch, workspaceId, currentWorkspaceId, handleFetchWorkspaceDocuments]);


  // Delete document with confirmation
  const handleDeleteDocument = useCallback(async (documentId, documentName, targetWorkspaceId) => {
    const wsId = targetWorkspaceId || workspaceId || currentWorkspaceId;
    
    try {
      const result = await dispatch(deleteDocument({ documentId, workspaceId: wsId }));
      
      if (deleteDocument.fulfilled.match(result)) {
         toast.success('document deleted', {
        duration: 3000,
      });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Delete document error:', error);
      return false;
    }
  }, [dispatch, toast, workspaceId, currentWorkspaceId]);

  // NEW: Toggle favorite document
  const handleToggleFavorite = useCallback(async (documentId, documentName) => {
    try {
      const result = await dispatch(toggleFavorite(documentId));
      
      if (toggleFavorite.fulfilled.match(result)) {
        const isFavorite = result.payload.isFavorite;
        toast.success({
          title: isFavorite ? 'Added to Favorites' : 'Removed from Favorites',
          description: `${documentName || 'Document'} has been ${isFavorite ? 'added to' : 'removed from'} favorites`,
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Toggle favorite error:', error);
      return false;
    }
  }, [dispatch, toast]);

  // NEW: Move document to different workspace
  const handleMoveDocument = useCallback(async (documentId, fromWorkspaceId, toWorkspaceId, documentName) => {
    try {
      const result = await dispatch(moveDocument({ documentId, fromWorkspaceId, toWorkspaceId }));
      
      if (moveDocument.fulfilled.match(result)) {
        toast.success({
          title: 'Document Moved',
          description: `${documentName || 'Document'} has been moved successfully`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Move document error:', error);
      return false;
    }
  }, [dispatch, toast]);

  // NEW: Duplicate document
  const handleDuplicateDocument = useCallback(async (documentId, targetWorkspaceId, documentName) => {
    const wsId = targetWorkspaceId || workspaceId || currentWorkspaceId;
    
    try {
      const result = await dispatch(duplicateDocument({ documentId, workspaceId: wsId }));
      
      if (duplicateDocument.fulfilled.match(result)) {
        toast.success({
          title: 'Document Duplicated',
          description: `${documentName || 'Document'} has been duplicated successfully`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Duplicate document error:', error);
      return false;
    }
  }, [dispatch, toast, workspaceId, currentWorkspaceId]);

  // NEW: Bulk delete documents
  const handleBulkDeleteDocuments = useCallback(async (documentIds, targetWorkspaceId) => {
    const wsId = targetWorkspaceId || workspaceId || currentWorkspaceId;
    
    try {
      const result = await dispatch(bulkDeleteDocuments({ documentIds, workspaceId: wsId }));
      
      if (bulkDeleteDocuments.fulfilled.match(result)) {
        toast.success({
          title: 'Documents Deleted',
          description: `${documentIds.length} documents have been deleted successfully`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Bulk delete documents error:', error);
      return false;
    }
  }, [dispatch, toast, workspaceId, currentWorkspaceId]);

  // NEW: Archive document
  const handleArchiveDocument = useCallback(async (documentId, targetWorkspaceId, documentName) => {
    const wsId = targetWorkspaceId || workspaceId || currentWorkspaceId;
    
    try {
      const result = await dispatch(archiveDocument({ documentId, workspaceId: wsId }));
      
      if (archiveDocument.fulfilled.match(result)) {
        toast.success({
          title: 'Document Archived',
          description: `${documentName || 'Document'} has been archived successfully`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Archive document error:', error);
      return false;
    }
  }, [dispatch, toast, workspaceId, currentWorkspaceId]);

  // NEW: Search documents
  const handleSearchDocuments = useCallback(async (query, searchFilters = {}, targetWorkspaceId) => {
    const wsId = targetWorkspaceId || workspaceId || currentWorkspaceId;
    
    try {
      const result = await dispatch(searchDocuments({ query, workspaceId: wsId, filters: searchFilters }));
      return searchDocuments.fulfilled.match(result);
    } catch (error) {
      console.error('Search documents error:', error);
      return false;
    }
  }, [dispatch, workspaceId, currentWorkspaceId]);

  // Preview document
  const handlePreviewDocument = useCallback(async (documentId) => {
    try {
      const result = await dispatch(previewDocument(documentId));
      
      if (previewDocument.fulfilled.match(result)) {
        return result.payload.blob;
      }
      return null;
    } catch (error) {
      console.error('Preview document error:', error);
      return null;
    }
  }, [dispatch]);

  // Download document
  const handleDownloadDocument = useCallback(async (documentId, filename) => {
    try {
      const result = await dispatch(downloadDocument({ documentId, filename }));
      
      if (downloadDocument.fulfilled.match(result)) {
        toast.success({
          title: 'Download Started',
          description: `Downloading ${filename || 'document'}...`,
          status: 'info',
          duration: 2000,
          isClosable: true,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Download document error:', error);
      return false;
    }
  }, [dispatch, toast]);

  // ===== STATE MANAGEMENT =====

  // Set current document
  const handleSetCurrentDocument = useCallback((document) => {
    dispatch(setCurrentDocument(document));
  }, [dispatch]);

  // Clear current document
  const handleClearCurrentDocument = useCallback(() => {
    dispatch(clearCurrentDocument());
  }, [dispatch]);

  // Set current workspace
  const handleSetCurrentWorkspace = useCallback((newWorkspaceId) => {
    dispatch(setCurrentWorkspace(newWorkspaceId));
  }, [dispatch]);

  // Update filters
  const handleUpdateFilters = useCallback((newFilters) => {
    dispatch(updateFilters(newFilters));
  }, [dispatch]);

  // Reset filters
  const handleResetFilters = useCallback(() => {
    dispatch(resetFilters());
  }, [dispatch]);

  // Update pagination
  const handleUpdatePagination = useCallback((newPagination) => {
    dispatch(updatePagination(newPagination));
  }, [dispatch]);

  // Clear errors
  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // ===== UTILITY FUNCTIONS =====

  // Search documents locally
  const handleSearch = useCallback((searchTerm) => {
    dispatch(updateFilters({ searchTerm }));
  }, [dispatch]);

  // Filter by file type
  const handleFilterByType = useCallback((fileType) => {
    dispatch(updateFilters({ fileType }));
  }, [dispatch]);

  // Filter by category
  const handleFilterByCategory = useCallback((category) => {
    dispatch(updateFilters({ category }));
  }, [dispatch]);

  // Filter by tags
  const handleFilterByTags = useCallback((tags) => {
    dispatch(updateFilters({ tags }));
  }, [dispatch]);

  // Filter by favorites
  const handleFilterFavorites = useCallback((favoritesOnly = true) => {
    dispatch(updateFilters({ favoritesOnly }));
  }, [dispatch]);

  // Filter by status
  const handleFilterByStatus = useCallback((status) => {
    dispatch(updateFilters({ status }));
  }, [dispatch]);

  // Sort documents
  const handleSort = useCallback((sortBy, sortOrder = 'desc') => {
    dispatch(updateFilters({ sortBy, sortOrder }));
  }, [dispatch]);

  // Paginate documents
  const getPaginatedDocuments = useCallback((docs, page = 1, perPage = 10) => {
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    return docs.slice(startIndex, endIndex);
  }, []);

  // Get documents by type
  const getDocumentsByType = useCallback((type, docs = workspaceDocuments) => {
    return docs.filter(doc => 
      doc.type?.includes(type) || 
      doc.originalName?.toLowerCase().endsWith(`.${type.toLowerCase()}`)
    );
  }, [workspaceDocuments]);

  // Get recent documents
  const getRecentDocuments = useCallback((count = 5, docs = workspaceDocuments) => {
    return [...docs]
      .sort((a, b) => new Date(b.lastModified || b.uploadDate) - new Date(a.lastModified || a.uploadDate))
      .slice(0, count);
  }, [workspaceDocuments]);

  // NEW: Get documents by size range
  const getDocumentsBySizeRange = useCallback((minSize, maxSize, docs = workspaceDocuments) => {
    return docs.filter(doc => {
      const size = doc.size || 0;
      return size >= minSize && size <= maxSize;
    });
  }, [workspaceDocuments]);

  // NEW: Get documents by date range
  const getDocumentsByDateRange = useCallback((startDate, endDate, docs = workspaceDocuments) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return docs.filter(doc => {
      const docDate = new Date(doc.uploadDate);
      return docDate >= start && docDate <= end;
    });
  }, [workspaceDocuments]);

  // Enhanced document statistics
  const getDocumentStats = useCallback(() => {
    const docs = workspaceDocuments;
    const totalSize = docs.reduce((sum, doc) => sum + (doc.size || 0), 0);
    const typeStats = docs.reduce((stats, doc) => {
      const type = doc.type?.split('/')[0] || 'unknown';
      stats[type] = (stats[type] || 0) + 1;
      return stats;
    }, {});
    
    const categoryStats = docs.reduce((stats, doc) => {
      const category = doc.category || 'other';
      stats[category] = (stats[category] || 0) + 1;
      return stats;
    }, {});

    return {
      total: docs.length,
      totalSize,
      typeStats,
      categoryStats,
      shared: sharedDocuments.length,
      favorites: favorites.length,
      recent: getRecentDocuments(10).length,
      archived: docs.filter(doc => doc.status === 'archived').length
    };
  }, [workspaceDocuments, sharedDocuments, favorites, getRecentDocuments]);

  // NEW: Validate file before upload
  const validateFile = useCallback((file, maxSize = 50 * 1024 * 1024, allowedTypes = []) => {
    const errors = [];
    
    if (file.size > maxSize) {
      errors.push(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
    }
    
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  // NEW: Format file size
  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Memoized values for performance
  const contextualDocuments = useMemo(() => {
    return workspaceId ? workspaceDocuments : documents;
  }, [workspaceId, workspaceDocuments, documents]);

  return {
    // State
    documents: contextualDocuments,
    allDocuments: documents,
    workspaceDocuments,
    sharedDocuments,
    currentDocument,
    favorites,
    recentActivity,
    popularDocuments,
    loading,
    uploading,
    uploadProgress,
    error,
    filters,
    pagination,
    bulkOperationLoading,
    workspaceStats,
    filteredDocuments,
    documentStatistics,
    availableTags,
    availableCategories,
    currentWorkspaceId,

    // Fetching actions
    fetchDocuments: handleFetchDocuments,
    fetchWorkspaceDocuments: handleFetchWorkspaceDocuments,
    fetchWorkspaceStats: handleFetchWorkspaceStats,
    fetchRecentActivity: handleFetchRecentActivity,
    fetchPopularDocuments: handleFetchPopularDocuments,
    fetchDocumentsByCategory: handleFetchDocumentsByCategory,
    fetchDocumentsByTag: handleFetchDocumentsByTag,
    fetchFavoriteDocuments: handleFetchFavoriteDocuments,
    fetchSharedDocuments: handleFetchSharedDocuments,
    fetchDocument: handleFetchDocument,

    // Document operations
    uploadDocument: handleUploadDocument,
    updateDocument: handleUpdateDocument, 
    deleteDocument: handleDeleteDocument,
    toggleFavorite: handleToggleFavorite,
    moveDocument: handleMoveDocument,
    duplicateDocument: handleDuplicateDocument,
    bulkDeleteDocuments: handleBulkDeleteDocuments,
    archiveDocument: handleArchiveDocument,
    searchDocuments: handleSearchDocuments,
    previewDocument: handlePreviewDocument,
    downloadDocument: handleDownloadDocument,

    // State management
    setCurrentDocument: handleSetCurrentDocument,
    clearCurrentDocument: handleClearCurrentDocument,
    setCurrentWorkspace: handleSetCurrentWorkspace,
    updateFilters: handleUpdateFilters,
    resetFilters: handleResetFilters,
    updatePagination: handleUpdatePagination,
    clearError: handleClearError,

    // Utility functions
    search: handleSearch,
    filterByType: handleFilterByType,
    filterByCategory: handleFilterByCategory,
    filterByTags: handleFilterByTags,
    filterFavorites: handleFilterFavorites,
    filterByStatus: handleFilterByStatus,
    sort: handleSort,
    getPaginatedDocuments,
    getDocumentsByType,
    getRecentDocuments,
    getDocumentsBySizeRange,
    getDocumentsByDateRange,
    getDocumentStats,
    validateFile,
    formatFileSize,

    // For backward compatibility
    isLoading: loading,
    isUploading: uploading,
  };
};

/**
 * Hook for document list management with workspace context
 * Automatically fetches documents on mount
 */
// 🔧 FIXED: Enhanced useDocumentList hook
export const useDocumentList = (workspaceId = null, autoFetch = true) => {
  const documentsHook = useDocuments(workspaceId);
  const { fetchWorkspaceDocuments, workspaceDocuments, loading } = documentsHook;

  useEffect(() => {
    if (autoFetch && workspaceId) {
      console.log('🔄 Auto-fetching documents for workspace:', workspaceId);
      fetchWorkspaceDocuments(workspaceId);
    }
  }, [autoFetch, workspaceId, fetchWorkspaceDocuments]);

  // 🔧 FIXED: Add debug logging
  useEffect(() => {
    console.log('📊 useDocumentList Debug:', {
      workspaceId,
      documentsCount: workspaceDocuments?.length || 0,
      loading,
      autoFetch
    });
  }, [workspaceId, workspaceDocuments, loading, autoFetch]);

  return documentsHook;
};

/**
 * Hook for single document management with workspace context
 */
export const useDocument = (documentId, workspaceId = null) => {
  const {
    currentDocument,
    fetchDocument,
    setCurrentDocument,
    clearCurrentDocument,
    loading,
    error
  } = useDocuments(workspaceId);

  useEffect(() => {
    if (documentId) {
      fetchDocument(documentId);
    }
    
    return () => {
      clearCurrentDocument();
    };
  }, [documentId, fetchDocument, clearCurrentDocument]);

  return {
    document: currentDocument,
    loading,
    error,
    setDocument: setCurrentDocument,
    clearDocument: clearCurrentDocument,
    refetch: () => documentId && fetchDocument(documentId)
  };
};

/**
 * Hook for workspace document analytics
 */
export const useWorkspaceDocumentAnalytics = (workspaceId) => {
  const {
    workspaceStats,
    recentActivity,
    popularDocuments,
    documentStatistics,
    fetchWorkspaceStats,
    fetchRecentActivity,
    fetchPopularDocuments,
    loading
  } = useDocuments(workspaceId);

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspaceStats(workspaceId);
      fetchRecentActivity(workspaceId);
      fetchPopularDocuments(workspaceId);
    }
  }, [workspaceId, fetchWorkspaceStats, fetchRecentActivity, fetchPopularDocuments]);

  return {
    stats: workspaceStats,
    recentActivity,
    popularDocuments,
    statistics: documentStatistics,
    loading,
    refresh: () => {
      if (workspaceId) {
        fetchWorkspaceStats(workspaceId);
        fetchRecentActivity(workspaceId);
        fetchPopularDocuments(workspaceId);
      }
    }
  };
};

/**
 * Hook for document search and filtering
 */
export const useDocumentSearch = (workspaceId = null) => {
  const {
    searchDocuments,
    filteredDocuments,
    availableTags,
    availableCategories,
    filters,
    updateFilters,
    resetFilters,
    loading
  } = useDocuments(workspaceId);

  const performSearch = useCallback(async (query, searchFilters = {}) => {
    if (query.trim()) {
      return await searchDocuments(query, searchFilters, workspaceId);
    } else {
      // If no query, just update local filters
      updateFilters(searchFilters);
      return true;
    }
  }, [searchDocuments, updateFilters, workspaceId]);

  return {
    searchResults: filteredDocuments,
    availableTags,
    availableCategories,
    currentFilters: filters,
    loading,
    search: performSearch,
    updateFilters,
    resetFilters,
  };
};

/**
 * Hook for bulk document operations
 */
export const useBulkDocumentOperations = (workspaceId = null) => {
  const {
    bulkDeleteDocuments,
    bulkOperationLoading,
    fetchWorkspaceDocuments
  } = useDocuments(workspaceId);

  const performBulkDelete = useCallback(async (documentIds) => {
    const success = await bulkDeleteDocuments(documentIds, workspaceId);
    if (success && workspaceId) {
      // Refresh the workspace documents
      await fetchWorkspaceDocuments(workspaceId);
    }
    return success;
  }, [bulkDeleteDocuments, fetchWorkspaceDocuments, workspaceId]);

  return {
    bulkDelete: performBulkDelete,
    loading: bulkOperationLoading
    
  };
};

export default useDocuments;