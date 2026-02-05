import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import WorkspaceSelector from '../components/workspace/WorkspaceSelector';
import PermissionGuard from '../components/permissions/PermissionGuard';
import { useAuth } from '../hooks/useAuth';
import { useDocuments } from '../hooks/useDocuments';
import { useWorkspaces } from '../hooks/useWorkspaces';
import apiService from '../services/apiService';
import {
  DocumentIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  StarIcon,
  FunnelIcon,
  Squares2X2Icon,
  Bars3Icon,
  PlusIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const DocumentList = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  // Get hooks data with proper error handling
  const documentsHookResult = useDocuments(workspaceId);
  const workspacesHookResult = useWorkspaces();

  // Safely destructure hook results with fallbacks
  const {
    documents = [],
    workspaceDocuments = [],
    isLoading: documentsLoading = false,
    error: documentsError = null,
    searchQuery = '',
    setSearchQuery = () => { },
    filters: documentFilters = {},
    updateFilters = () => { },
    fetchDocuments = () => { },
    fetchWorkspaceDocuments = () => { },
    toggleFavorite = () => { },
    deleteDocument = () => { }
  } = documentsHookResult || {};

  const {
    workspaces = [],
    currentWorkspace = null,
    userRole = null,
    userPermissions = {},
    isLoading: workspacesLoading = false,
    fetchWorkspaces = () => { },
    fetchWorkspace = () => { }
  } = workspacesHookResult || {};

  // Create a proper setDocumentFilters function if updateFilters doesn't work as expected
  const setDocumentFilters = (newFilters) => {
    if (typeof updateFilters === 'function') {
      if (typeof newFilters === 'function') {
        updateFilters(newFilters);
      } else {
        updateFilters(() => newFilters);
      }
    }
  };

  // Local state
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Initialize filters from URL params
  useEffect(() => {
    const category = searchParams.get('category') || '';
    const tag = searchParams.get('tag') || '';
    const type = searchParams.get('type') || '';
    const favorite = searchParams.get('favorite') === 'true';

    // Only update if we have actual changes
    setDocumentFilters(prev => {
      const current = prev || {};
      if (
        current.category === category &&
        current.tag === tag &&
        current.type === type &&
        current.favorite === favorite
      ) {
        return current; // Return same object reference to prevent re-render
      }
      return { ...current, category, tag, type, favorite };
    });
  }, [searchParams]); // Remove setDocumentFilters from here

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          from: workspaceId ? `/workspaces/${workspaceId}/documents` : '/documents'
        }
      });
    }
  }, [isAuthenticated, navigate, workspaceId]);

  // Load data based on context (workspace or all documents)
  useEffect(() => {
    if (!isAuthenticated) return;

    if (workspaceId) {
      if (typeof fetchWorkspaceDocuments === 'function') {
        fetchWorkspaceDocuments(workspaceId);
      }
    } else {
      if (typeof fetchDocuments === 'function') {
        fetchDocuments();
      }
    }
  }, [workspaceId, fetchWorkspaceDocuments, fetchDocuments, isAuthenticated]);

  // Enhanced search handler
  const handleSearch = (term) => {
    if (typeof setSearchQuery === 'function') {
      setSearchQuery(term);
    }
    setDocumentFilters(prev => ({ ...(prev || {}), searchTerm: term }));
  };

  // Get current document list based on context
  const currentDocuments = workspaceId ? workspaceDocuments : documents;
  const isLoading = documentsLoading || workspacesLoading;
  const error = documentsError;

  // Enhanced search and filter functionality
  const filteredDocuments = useMemo(() => {
    if (!Array.isArray(currentDocuments)) return [];

    return currentDocuments.filter(doc => {
      if (!doc) return false;

      // Search query filter
      const searchTerm = searchQuery || documentFilters?.searchTerm || '';
      const matchesSearch = !searchTerm ||
        doc.filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      // Category filter
      const matchesCategory = !documentFilters?.category ||
        doc.category === documentFilters.category;

      // Tag filter
      const matchesTag = !documentFilters?.tag ||
        doc.tags?.includes(documentFilters.tag);

      // File type filter
      const matchesType = !documentFilters?.type ||
        doc.mimeType?.includes(documentFilters.type) ||
        doc.fileType?.includes(documentFilters.type);

      // Favorite filter
      const matchesFavorite = !documentFilters?.favorite || doc.isFavorite;

      // Date range filter
      const matchesDateRange = !documentFilters?.dateFrom || !documentFilters?.dateTo ||
        (new Date(doc.uploadDate || doc.createdAt) >= new Date(documentFilters.dateFrom) &&
          new Date(doc.uploadDate || doc.createdAt) <= new Date(documentFilters.dateTo));

      // Size filter
      const matchesSize = !documentFilters?.minSize || !documentFilters?.maxSize ||
        (doc.size >= documentFilters.minSize && doc.size <= documentFilters.maxSize);

      return matchesSearch && matchesCategory && matchesTag &&
        matchesType && matchesFavorite && matchesDateRange && matchesSize;
    });
  }, [currentDocuments, searchQuery, documentFilters]);

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    if (!Array.isArray(currentDocuments)) return { categories: [], tags: [], types: [] };

    const categories = [...new Set(currentDocuments.map(doc => doc.category).filter(Boolean))];
    const tags = [...new Set(currentDocuments.flatMap(doc => doc.tags || []))];
    const types = [...new Set(currentDocuments.map(doc =>
      doc.mimeType || doc.fileType || 'Unknown'
    ).filter(Boolean))];

    return { categories, tags, types };
  }, [currentDocuments]);

  // Handle document actions with proper error handling
  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      if (typeof deleteDocument === 'function') {
        await deleteDocument(documentId);
      } else {
        // Fallback to direct API call
        await apiService.documentApi.deleteDocument(documentId);
        // Manually refresh the list
        if (workspaceId) {
          fetchWorkspaceDocuments(workspaceId);
        } else {
          fetchDocuments();
        }
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document. Please try again.');
    }
  };

  const handleDownloadDocument = async (documentId, documentName) => {
    try {
      const response = await apiService.documentApi.downloadDocument(documentId);
      const blobData = response.data || response;
      const blob = blobData instanceof Blob ? blobData : new Blob([blobData]);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', documentName || 'document');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document. Please try again.');
    }
  };

  const handleToggleFavorite = async (documentId) => {
    try {
      if (typeof toggleFavorite === 'function') {
        await toggleFavorite(documentId);
      } else {
        // Fallback to direct API call
        await apiService.documentApi.toggleFavorite(documentId);
        // Manually refresh the list
        if (workspaceId) {
          fetchWorkspaceDocuments(workspaceId);
        } else {
          fetchDocuments();
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Bulk actions
  const handleSelectDocument = (documentId) => {
    setSelectedDocuments(prev =>
      prev.includes(documentId)
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  const handleSelectAll = () => {
    setSelectedDocuments(
      selectedDocuments.length === filteredDocuments.length
        ? []
        : filteredDocuments.map(doc => doc._id || doc.id)
    );
  };

  const handleBulkDelete = async () => {
    if (selectedDocuments.length === 0) return;

    if (!window.confirm(`Are you sure you want to delete ${selectedDocuments.length} documents?`)) return;

    setBulkActionLoading(true);
    try {
      await Promise.all(selectedDocuments.map(id => handleDeleteDocument(id)));
      setSelectedDocuments([]);
    } catch (error) {
      console.error('Error bulk deleting documents:', error);
      alert('Some documents could not be deleted. Please try again.');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // WorkspaceSelector handlers
  const handleWorkspaceSelect = (workspace) => {
    if (workspace && (workspace._id || workspace.id)) {
      navigate(`/workspaces/${workspace._id || workspace.id}/documents`);
    }
  };

  const handleCreateWorkspace = () => {
    navigate('/workspaces/create');
  };

  // Helper functions
  const formatFileSize = (size) => {
    if (!size || size === 0) return '0 KB';
    const sizeInKB = size / 1024;
    if (sizeInKB < 1024) return `${Math.round(sizeInKB)} KB`;
    return `${(sizeInKB / 1024).toFixed(2)} MB`;
  };

  const getFileTypeIcon = (type) => {
    if (!type) return 'text-gray-400';
    const fileType = type.toLowerCase();

    if (fileType.includes('pdf')) return 'text-red-500';
    if (fileType.includes('doc') || fileType.includes('word')) return 'text-blue-500';
    if (fileType.includes('xls') || fileType.includes('sheet')) return 'text-green-500';
    if (fileType.includes('ppt') || fileType.includes('presentation')) return 'text-orange-500';
    if (fileType.includes('image')) return 'text-purple-500';
    if (fileType.includes('zip') || fileType.includes('rar')) return 'text-yellow-600';
    if (fileType.includes('txt')) return 'text-gray-500';

    return 'text-gray-400';
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const isOwner = (doc) => {
    if (!doc || !user) return false;
    const docOwner = doc.uploadedBy?._id || doc.uploadedBy?.id || doc.owner || '';
    const userId = user?.id || user?._id || '';
    return docOwner === userId;
  };

  // Debug logging
  useEffect(() => {
    console.log('DocumentList Debug:', {
      workspaceId,
      documents: documents?.length || 0,
      workspaceDocuments: workspaceDocuments?.length || 0,
      currentDocuments: currentDocuments?.length || 0,
      isLoading,
      error
    });
  }, [workspaceId, documents, workspaceDocuments, currentDocuments, isLoading, error]);

  // Force fetch if no documents and not loading - with better dependency control
  useEffect(() => {
    if (!isLoading && currentDocuments.length === 0 && !error && isAuthenticated) {
      console.log('Force fetching documents...');
      if (workspaceId && typeof fetchWorkspaceDocuments === 'function') {
        fetchWorkspaceDocuments(workspaceId);
      } else if (!workspaceId && typeof fetchDocuments === 'function') {
        fetchDocuments();
      }
    }
  }, [isLoading, currentDocuments.length, error, isAuthenticated]);

  // If not authenticated, show loading state
  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-gray-600 dark:text-gray-300">Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Debug Button - Remove in production */}
       

        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 space-y-4 lg:space-y-0">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              {workspaceId && currentWorkspace && (
                <BuildingOfficeIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
              )}
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                {workspaceId && currentWorkspace
                  ? `${currentWorkspace.name} Documents`
                  : 'Document Library'
                }
              </h1>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <span>{filteredDocuments.length} documents</span>
              {workspaceId && userRole && (
                <Badge variant="primary" size="sm" className="capitalize">
                  {userRole}
                </Badge>
              )}
              {selectedDocuments.length > 0 && (
                <span className="text-blue-600 dark:text-blue-400">
                  {selectedDocuments.length} selected
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Workspace Selector */}
            {!workspaceId && (
              <WorkspaceSelector
                workspaces={workspaces}
                selectedWorkspace={null}
                onWorkspaceSelect={handleWorkspaceSelect}
                onCreateWorkspace={handleCreateWorkspace}
                placeholder="Filter by workspace"
                className="w-64"
              />
            )}

            {/* View Toggle */}
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  } rounded-l-lg border-r border-gray-300 dark:border-gray-600`}
              >
                <Squares2X2Icon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  } rounded-r-lg`}
              >
                <Bars3Icon className="h-4 w-4" />
              </button>
            </div>

            {/* Upload Button */}
            <PermissionGuard
              requiredPermissions={['write']}  // ✅ Changed from 'permissions'
              workspaceId={workspaceId}
              showFallback={false}  // ✅ Don't show warning, just hide button
            >
              <Button
                onClick={() => navigate(
                  workspaceId
                    ? `/workspaces/${workspaceId}/upload`
                    : '/documents/upload'
                )}
                className="flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </PermissionGuard>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <div className="p-4">
            <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
              {/* Search */}
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search documents..."
                  className="pl-10"
                />
              </div>

              {/* Filter Toggle */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center"
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
                Filters
                {Object.values(documentFilters || {}).some(Boolean) && (
                  <Badge variant="primary" size="sm" className="ml-2">
                    Active
                  </Badge>
                )}
              </Button>

              {/* Bulk Actions */}
              {selectedDocuments.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={bulkActionLoading}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete ({selectedDocuments.length})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDocuments([])}
                  >
                    Clear Selection
                  </Button>
                </div>
              )}
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <select
                      value={documentFilters?.category || ''}
                      onChange={(e) => setDocumentFilters({ ...documentFilters, category: e.target.value })}
                      className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">All Categories</option>
                      {filterOptions.categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  {/* Tag Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tag
                    </label>
                    <select
                      value={documentFilters?.tag || ''}
                      onChange={(e) => setDocumentFilters({ ...documentFilters, tag: e.target.value })}
                      className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">All Tags</option>
                      {filterOptions.tags.map(tag => (
                        <option key={tag} value={tag}>{tag}</option>
                      ))}
                    </select>
                  </div>

                  {/* Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      File Type
                    </label>
                    <select
                      value={documentFilters?.type || ''}
                      onChange={(e) => setDocumentFilters({ ...documentFilters, type: e.target.value })}
                      className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">All Types</option>
                      {filterOptions.types.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {/* Favorites Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Show Only
                    </label>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="favorites"
                        checked={documentFilters?.favorite || false}
                        onChange={(e) => setDocumentFilters({ ...documentFilters, favorite: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="favorites" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Favorites
                      </label>
                    </div>
                  </div>
                </div>

                {/* Clear Filters */}
                {Object.values(documentFilters || {}).some(Boolean) && (
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDocumentFilters({})}
                    >
                      Clear All Filters
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Documents Display */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            <p className="ml-3 text-gray-600 dark:text-gray-300">Loading documents...</p>
          </div>
        ) : error ? (
          <Card className="p-8 text-center">
            <div className="text-red-600 mb-4">
              <DocumentIcon className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-gray-600 dark:text-gray-300">{error}</p>
          </Card>
        ) : filteredDocuments.length === 0 ? (
          <Card className="p-12 text-center">
            {currentDocuments?.length === 0 ? (
              <div>
                <FolderIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No documents yet
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {workspaceId
                    ? 'Get started by uploading your first document to this workspace.'
                    : 'Upload your first document to get started.'
                  }
                </p>
                <PermissionGuard
                  requiredPermissions={['write']}  // ✅ Changed from 'permissions'
                  workspaceId={workspaceId}
                  showFallback={false}
                >
                  <Button
                    onClick={() => navigate(
                      workspaceId
                        ? `/workspaces/${workspaceId}/upload`
                        : '/documents/upload'
                    )}
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                </PermissionGuard>
              </div>
            ) : (
              <div>
                <MagnifyingGlassIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No documents match your search
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Try adjusting your search terms or filters.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setDocumentFilters({});
                  }}
                >
                  Clear Search & Filters
                </Button>
              </div>
            )}
          </Card>
        ) : viewMode === 'grid' ? (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDocuments.map((doc) => (
              <Card key={doc._id || doc.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <DocumentIcon className={`h-8 w-8 ${getFileTypeIcon(doc.mimeType || doc.fileType)}`} />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {doc.name || 'Unnamed Document'}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(doc.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleFavorite(doc._id || doc.id)}
                    className="text-gray-400 hover:text-yellow-500 flex-shrink-0"
                  >
                    {doc.isFavorite ? (
                      <StarIconSolid className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <StarIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {doc.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                    {doc.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <div className="flex items-center">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    {formatDate(doc.uploadDate || doc.createdAt)}
                  </div>
                  {doc.uploadedBy && (
                    <div className="flex items-center">
                      <Avatar user={doc.uploadedBy} size="xs" className="mr-1" />
                      <span className="truncate max-w-20">{doc.uploadedBy.name}</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {doc.tags.slice(0, 2).map((tag, index) => (
                      <Badge key={index} variant="gray" size="sm">
                        {tag}
                      </Badge>
                    ))}
                    {doc.tags.length > 2 && (
                      <Badge variant="gray" size="sm">
                        +{doc.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Workspace badge (only show when not in workspace context) */}
                {!workspaceId && doc.workspace && (
                  <div className="mb-3">
                    <Badge variant="blue" size="sm" className="flex items-center">
                      <BuildingOfficeIcon className="h-3 w-3 mr-1" />
                      {doc.workspace.name}
                    </Badge>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigate(
                        workspaceId
                          ? `/workspaces/${workspaceId}/documents/${doc._id || doc.id}`
                          : `/documents/preview/${doc._id || doc.id}`
                      )}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      title="Preview"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDownloadDocument(doc._id || doc.id, doc.filename)}
                      className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                      title="Download"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                    </button>
                    <PermissionGuard
                      requiredPermissions={['delete']}  // ✅ Changed from 'permissions'
                      workspaceId={workspaceId}
                      showFallback={false}
                    >
                      <button
                        onClick={() => handleDeleteDocument(doc._id || doc.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </PermissionGuard>
                  </div>
                  <Badge
                    variant={doc.isPublic ? 'success' : 'gray'}
                    size="sm"
                  >
                    {doc.isPublic ? 'Public' : 'Private'}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          // List View
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedDocuments.length === filteredDocuments.length}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Document
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Modified
                    </th>
                    {!workspaceId && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Workspace
                      </th>
                    )}
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredDocuments.map((doc) => (
                    <tr key={doc._id || doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedDocuments.includes(doc._id || doc.id)}
                          onChange={() => handleSelectDocument(doc._id || doc.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <DocumentIcon className={`h-6 w-6 mr-3 ${getFileTypeIcon(doc.mimeType || doc.fileType)}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {doc.name || 'Unnamed Document'}
                              </p>
                              <button
                                onClick={() => handleToggleFavorite(doc._id || doc.id)}
                                className="ml-2 text-gray-400 hover:text-yellow-500"
                              >
                                {doc.isFavorite ? (
                                  <StarIconSolid className="h-4 w-4 text-yellow-500" />
                                ) : (
                                  <StarIcon className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                            {doc.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {doc.description}
                              </p>
                            )}
                            {doc.tags && doc.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {doc.tags.slice(0, 2).map((tag, index) => (
                                  <Badge key={index} variant="gray" size="sm">
                                    {tag}
                                  </Badge>
                                ))}
                                {doc.tags.length > 2 && (
                                  <Badge variant="gray" size="sm">
                                    +{doc.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="gray" size="sm">
                          {doc.mimeType || doc.fileType || 'Unknown'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatFileSize(doc.size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatDate(doc.uploadDate || doc.createdAt)}
                        </div>
                        {doc.uploadedBy && (
                          <div className="flex items-center mt-1">
                            <Avatar user={doc.uploadedBy} size="xs" className="mr-1" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {doc.uploadedBy.name}
                            </span>
                          </div>
                        )}
                      </td>
                      {!workspaceId && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {doc.workspace && (
                            <Badge variant="blue" size="sm" className="flex items-center w-fit">
                              <BuildingOfficeIcon className="h-3 w-3 mr-1" />
                              {doc.workspace.name}
                            </Badge>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => navigate(
                              workspaceId
                                ? `/workspaces/${workspaceId}/documents/${doc._id || doc.id}`
                                : `/documents/preview/${doc._id || doc.id}`
                            )}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                            title="Preview"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadDocument(doc._id || doc.id, doc.filename)}
                            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                            title="Download"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                          </button>
                          <PermissionGuard
                            requiredPermissions={['delete']}  // ✅ Changed from 'permissions'
                            workspaceId={workspaceId}
                            showFallback={false}
                          >
                            <button
                              onClick={() => handleDeleteDocument(doc._id || doc.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-800"
                              title="Delete"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </PermissionGuard>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DocumentList;