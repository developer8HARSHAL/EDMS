// src/hooks/useDocuments.js - Custom Documents Hook
import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useToast } from '@chakra-ui/react';
import {
  fetchDocuments,
  fetchSharedDocuments,
  fetchDocument,
  uploadDocument,
  deleteDocument,
  previewDocument,
  downloadDocument,
  clearError,
  setCurrentDocument,
  clearCurrentDocument,
  updateFilters,
  resetFilters,
  updatePagination,
  selectDocuments,
  selectSharedDocuments,
  selectCurrentDocument,
  selectDocumentsLoading,
  selectUploading,
  selectUploadProgress,
  selectDocumentsError,
  selectFilters,
  selectPagination,
  selectFilteredDocuments
} from '../store/slices/documentsSlice';

/**
 * Custom hook for document management functionality
 * Provides all document-related state and actions
 */
export const useDocuments = () => {
  const dispatch = useDispatch();
  const toast = useToast();

  // Selectors
  const documents = useSelector(selectDocuments);
  const sharedDocuments = useSelector(selectSharedDocuments);
  const currentDocument = useSelector(selectCurrentDocument);
  const loading = useSelector(selectDocumentsLoading);
  const uploading = useSelector(selectUploading);
  const uploadProgress = useSelector(selectUploadProgress);
  const error = useSelector(selectDocumentsError);
  const filters = useSelector(selectFilters);
  const pagination = useSelector(selectPagination);
  const filteredDocuments = useSelector(selectFilteredDocuments);

  // Handle document errors with toast notifications
  useEffect(() => {
    if (error) {
      toast({
        title: 'Document Error',
        description: error,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [error, toast]);

  // Fetch all documents
  const handleFetchDocuments = useCallback(async () => {
    try {
      const result = await dispatch(fetchDocuments());
      return fetchDocuments.fulfilled.match(result);
    } catch (error) {
      console.error('Fetch documents error:', error);
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

  // Upload document
  const handleUploadDocument = useCallback(async (formData) => {
    try {
      const result = await dispatch(uploadDocument(formData));
      
      if (uploadDocument.fulfilled.match(result)) {
        toast({
          title: 'Upload Successful',
          description: 'Document has been uploaded successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Upload document error:', error);
      return false;
    }
  }, [dispatch, toast]);

  // Delete document with confirmation
  const handleDeleteDocument = useCallback(async (documentId, documentName) => {
    try {
      const result = await dispatch(deleteDocument(documentId));
      
      if (deleteDocument.fulfilled.match(result)) {
        toast({
          title: 'Document Deleted',
          description: `${documentName || 'Document'} has been deleted successfully`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Delete document error:', error);
      return false;
    }
  }, [dispatch, toast]);

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
        toast({
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

  // Set current document
  const handleSetCurrentDocument = useCallback((document) => {
    dispatch(setCurrentDocument(document));
  }, [dispatch]);

  // Clear current document
  const handleClearCurrentDocument = useCallback(() => {
    dispatch(clearCurrentDocument());
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

  // Search documents
  const handleSearch = useCallback((searchTerm) => {
    dispatch(updateFilters({ searchTerm }));
  }, [dispatch]);

  // Filter by file type
  const handleFilterByType = useCallback((fileType) => {
    dispatch(updateFilters({ fileType }));
  }, [dispatch]);

  // Sort documents
  const handleSort = useCallback((sortBy, sortOrder = 'desc') => {
    dispatch(updateFilters({ sortBy, sortOrder }));
  }, [dispatch]);

  // Paginate documents
  const getPaginatedDocuments = useCallback((documents, page = 1, perPage = 10) => {
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    return documents.slice(startIndex, endIndex);
  }, []);

  // Get documents by type
  const getDocumentsByType = useCallback((type) => {
    return documents.filter(doc => 
      doc.mimeType?.includes(type) || 
      doc.originalName?.toLowerCase().endsWith(`.${type.toLowerCase()}`)
    );
  }, [documents]);

  // Get recent documents
  const getRecentDocuments = useCallback((count = 5) => {
    return [...documents]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, count);
  }, [documents]);

  // Get document statistics
  const getDocumentStats = useCallback(() => {
    const totalSize = documents.reduce((sum, doc) => sum + (doc.size || 0), 0);
    const typeStats = documents.reduce((stats, doc) => {
      const type = doc.mimeType?.split('/')[0] || 'unknown';
      stats[type] = (stats[type] || 0) + 1;
      return stats;
    }, {});

    return {
      total: documents.length,
      totalSize,
      typeStats,
      shared: sharedDocuments.length
    };
  }, [documents, sharedDocuments]);

  return {
    // State
    documents,
    sharedDocuments,
    currentDocument,
    loading,
    uploading,
    uploadProgress,
    error,
    filters,
    pagination,
    filteredDocuments,

    // Actions
    fetchDocuments: handleFetchDocuments,
    fetchSharedDocuments: handleFetchSharedDocuments,
    fetchDocument: handleFetchDocument,
    uploadDocument: handleUploadDocument,
    deleteDocument: handleDeleteDocument,
    previewDocument: handlePreviewDocument,
    downloadDocument: handleDownloadDocument,
    setCurrentDocument: handleSetCurrentDocument,
    clearCurrentDocument: handleClearCurrentDocument,
    updateFilters: handleUpdateFilters,
    resetFilters: handleResetFilters,
    updatePagination: handleUpdatePagination,
    clearError: handleClearError,

    // Utility functions
    search: handleSearch,
    filterByType: handleFilterByType,
    sort: handleSort,
    getPaginatedDocuments,
    getDocumentsByType,
    getRecentDocuments,
    getDocumentStats,

    // For backward compatibility
    isLoading: loading,
    isUploading: uploading,
  };
};

/**
 * Hook for document list management
 * Automatically fetches documents on mount
 */
export const useDocumentList = (autoFetch = true) => {
  const documentsHook = useDocuments();
  const { fetchDocuments, documents, loading } = documentsHook;

  useEffect(() => {
    if (autoFetch && documents.length === 0 && !loading) {
      fetchDocuments();
    }
  }, [autoFetch, documents.length, loading, fetchDocuments]);

  return documentsHook;
};

/**
 * Hook for single document management
 */
export const useDocument = (documentId) => {
  const {
    currentDocument,
    fetchDocument,
    setCurrentDocument,
    clearCurrentDocument,
    loading,
    error
  } = useDocuments();

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

export default useDocuments;