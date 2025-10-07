import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSelector, useDispatch } from 'react-redux';
import { fetchDocument } from '../store/slices/documentsSlice';
import { fetchWorkspace } from '../store/slices/workspaceSlice';
import apiService from '../services/apiService';
import PermissionGuard from '../components/permissions/PermissionGuard';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import EditDocumentModal from '../components/EditDocumentModal';

import {
  PencilIcon,
  ArrowDownTrayIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

import {
  selectDocumentsLoading,
  selectCurrentDocument
} from '../store/slices/documentsSlice';
import {
  selectWorkspacesLoading,
  selectAllWorkspaces,
} from '../store/slices/workspaceSlice';


const DocumentPreview = () => {
  const { documentId, workspaceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const [previewContent, setPreviewContent] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState(null);
  const [documentNotFound, setDocumentNotFound] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);  // ✅ Add this

  const document = useSelector(selectCurrentDocument);
  const workspace = useSelector(state =>
    workspaceId ? selectAllWorkspaces(state).find(w => w._id === workspaceId) : null
  );
  const documentLoading = useSelector(selectDocumentsLoading);
  const workspaceLoading = useSelector(selectWorkspacesLoading);



  useEffect(() => {
    console.log('Debug - Document:', document);
    console.log('Debug - DocumentLoading:', documentLoading);
    console.log('Debug - DocumentId:', documentId);
  }, [document, documentLoading, documentId]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
    }
  }, [isAuthenticated, navigate, location.pathname]);

  useEffect(() => {
    if (!documentId || !isAuthenticated) return;

    const fetchData = async () => {
      try {
        await dispatch(fetchDocument(documentId)).unwrap();
        if (workspaceId) {
          await dispatch(fetchWorkspace(workspaceId)).unwrap();
        }
      } catch (error) {
        console.error('Error fetching document or workspace:', error);
        if (error.status === 404) {
          setDocumentNotFound(true);
        }
      }
    };

    fetchData();
  }, [documentId, workspaceId, isAuthenticated, dispatch]);

  useEffect(() => {
    const fetchDocumentPreview = async () => {
      if (!documentId || !isAuthenticated || !document || documentLoading) return;

      setPreviewLoading(true);
      setPreviewError(null);

      try {
        console.log('Fetching document preview for ID:', documentId);
        const previewResponse = await apiService.documentApi.previewDocument(documentId);
        console.log('Preview response type:', previewResponse.constructor.name);
        setPreviewContent(previewResponse);
      } catch (previewErr) {
        console.error('Preview fetch error:', previewErr);
        try {
          console.log('Falling back to downloading the document instead');
          const downloadResponse = await apiService.documentApi.downloadDocument(documentId);
          setPreviewContent(downloadResponse.data || downloadResponse);
        } catch (downloadErr) {
          console.error('Download fallback failed:', downloadErr);
          setPreviewError('Failed to load document preview');
        }
      } finally {
        setPreviewLoading(false);
      }
    };

    if (document && !documentLoading) {
      fetchDocumentPreview();
    }
  }, [documentId, isAuthenticated, document, documentLoading]);

  const renderPreview = () => {
    if (!document || !previewContent) return null;

    const fileType = document.type?.toLowerCase() || '';

    // Text-based documents - DARK MODE FIXED
    if (fileType.includes('text') || fileType.includes('javascript') ||
      fileType.includes('json') || fileType.includes('css') || fileType.includes('html')) {

      let textContent;

      try {
        if (typeof previewContent === 'string') {
          textContent = previewContent;
        } else if (previewContent instanceof ArrayBuffer) {
          textContent = new TextDecoder().decode(previewContent);
        } else if (previewContent instanceof Uint8Array) {
          textContent = new TextDecoder().decode(previewContent);
        } else if (previewContent instanceof Blob) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setPreviewContent(e.target.result);
          };
          reader.readAsText(previewContent);
          return (
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 overflow-auto h-[600px] font-mono text-sm">
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-700 dark:text-gray-300">Reading text content...</span>
              </div>
            </div>
          );
        } else {
          textContent = String(previewContent);
        }
      } catch (error) {
        console.error('Error decoding text content:', error);
        textContent = 'Error: Unable to decode text content';
      }

      return (
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 overflow-auto h-[600px] font-mono text-sm">
          <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">{textContent}</pre>
        </div>
      );
    }

    // PDF documents
    if (fileType.includes('pdf')) {
      try {
        let pdfBlob;

        if (previewContent instanceof Blob) {
          pdfBlob = previewContent;
        } else if (previewContent instanceof ArrayBuffer) {
          pdfBlob = new Blob([previewContent], { type: 'application/pdf' });
        } else if (previewContent instanceof Uint8Array) {
          pdfBlob = new Blob([previewContent], { type: 'application/pdf' });
        } else {
          pdfBlob = new Blob([previewContent], { type: 'application/pdf' });
        }

        const pdfUrl = URL.createObjectURL(pdfBlob);

        return (
          <div className="h-[600px] w-full">
            <iframe
              src={pdfUrl}
              title="PDF Preview"
              className="w-full h-full border-0 rounded-lg shadow"
              onLoad={() => {
                setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
              }}
            />
          </div>
        );
      } catch (error) {
        console.error('Error creating PDF preview:', error);
        return (
          <div className="text-center py-12 px-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <i className="fas fa-file-pdf text-5xl text-red-400 mb-4"></i>
            <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">PDF Preview Error</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Unable to display PDF preview</p>
            <button
              onClick={() => handleDownloadInstead()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <i className="fas fa-download mr-2"></i>
              Download PDF
            </button>
          </div>
        );
      }
    }

    // Image files
    if (fileType.includes('image') ||
      fileType.includes('png') ||
      fileType.includes('jpg') ||
      fileType.includes('jpeg') ||
      fileType.includes('gif') ||
      fileType.includes('svg')) {

      try {
        let imageBlob;

        if (previewContent instanceof Blob) {
          imageBlob = previewContent;
        } else if (previewContent instanceof ArrayBuffer) {
          imageBlob = new Blob([previewContent], { type: document.type });
        } else if (previewContent instanceof Uint8Array) {
          imageBlob = new Blob([previewContent], { type: document.type });
        } else {
          imageBlob = new Blob([previewContent], { type: document.type });
        }

        const imageUrl = URL.createObjectURL(imageBlob);

        return (
          <div className="flex justify-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <img
              src={imageUrl}
              alt={document.name}
              className="max-h-[600px] max-w-full object-contain rounded shadow"
              onLoad={() => {
                setTimeout(() => URL.revokeObjectURL(imageUrl), 1000);
              }}
              onError={(e) => {
                console.error('Image failed to load');
                URL.revokeObjectURL(imageUrl);
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iMTIiIHk9IjEyIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBIZWx2ZXRpY2EsIHNhbnMtc2VyaWYiIGZpbGw9IiNhYWFhYWEiPkltYWdlPC90ZXh0Pjwvc3ZnPg==';
                e.target.className = 'max-h-[600px] max-w-full object-contain rounded shadow border border-gray-200 dark:border-gray-700';
              }}
            />
          </div>
        );
      } catch (error) {
        console.error('Error creating image preview:', error);
        return (
          <div className="text-center py-12 px-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <i className="fas fa-file-image text-5xl text-purple-400 mb-4"></i>
            <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">Image Preview Error</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Unable to display image preview</p>
            <button
              onClick={() => handleDownloadInstead()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <i className="fas fa-download mr-2"></i>
              Download Image
            </button>
          </div>
        );
      }
    }

    // Unsupported file types
    return (
      <div className="text-center py-12 px-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <i className="fas fa-file-alt text-5xl text-gray-400 mb-4"></i>
        <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">Preview not available</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          This document type ({document.type || 'Unknown'}) cannot be previewed directly.
        </p>
        <button
          onClick={() => handleDownloadInstead()}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <i className="fas fa-download mr-2"></i>
          Download Instead
        </button>
      </div>
    );
  };

  const handleDownloadInstead = async () => {
    try {
      const response = await apiService.documentApi.downloadDocument(documentId);

      if (!response) {
        throw new Error('No response received');
      }

      const blobData = response.data || response;
      const blob = blobData instanceof Blob ? blobData : new Blob([blobData]);

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', document?.name || 'download');
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading document:', err);
      setPreviewError('Failed to download document');
    }
  };

  const handleBackNavigation = () => {
    if (workspaceId && workspace) {
      navigate(`/workspaces/${workspaceId}/documents`);
    } else {
      navigate('/documents');
    }
  };

  const handleEditDocument = () => {
    if (!document) {
      alert('Document not loaded yet');
      return;
    }
    setShowEditModal(true);  // ✅ Open modal instead of navigating
  };

  const handleDeleteDocument = async () => {
    if (!window.confirm(`Are you sure you want to delete "${document.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiService.documentApi.deleteDocument(documentId);
      alert('Document deleted successfully');
      handleBackNavigation();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document. Please try again.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-gray-600 dark:text-gray-400">Checking authentication...</p>
      </div>
    );
  }

  if (documentNotFound) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-file-times text-6xl text-gray-400 mb-6"></i>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Document Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The document you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <button
            onClick={handleBackNavigation}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Documents
          </button>
        </div>
      </div>
    );
  }

  if (workspaceId && workspace && document) {
    return (
      <PermissionGuard
        workspaceId={workspaceId}
        requiredPermissions={['read']}
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <i className="fas fa-lock text-4xl text-gray-400 mb-4"></i>
              <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">Access Denied</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">You don't have permission to view documents in this workspace.</p>
              <button
                onClick={() => navigate(`/workspaces/${workspaceId}`)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Back to Workspace
              </button>
            </div>
          </div>
        }
      >
        <DocumentPreviewContent />
      </PermissionGuard>
    );
  }

  function DocumentPreviewContent() {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Breadcrumb Navigation - DARK MODE FIXED */}
          <div className="mb-6">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
              <button
                onClick={handleBackNavigation}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {workspaceId ? 'Workspace' : 'Documents'}
              </button>

              {workspaceId && workspace && (
                <>
                  <i className="fas fa-chevron-right mx-2"></i>
                  <button
                    onClick={() => navigate(`/workspaces/${workspaceId}`)}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
                  >
                    {workspace.name}
                  </button>
                  <i className="fas fa-chevron-right mx-2"></i>
                  <button
                    onClick={() => navigate(`/workspaces/${workspaceId}/documents`)}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    Documents
                  </button>
                </>
              )}

              <i className="fas fa-chevron-right mx-2"></i>
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {document?.name || 'Loading...'}
              </span>
            </div>
          </div>

          {/* Document Header - DARK MODE FIXED */}
          {document && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md mb-6 overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <i className={`${getFileTypeIcon(document.type)} text-2xl mr-3`}></i>
                      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{document.name}</h1>
                    </div>

                    {document.description && (
                      <p className="text-gray-600 dark:text-gray-400 mb-4">{document.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <i className="fas fa-file mr-1"></i>
                        <span>{formatFileSize(document.size)}</span>
                      </div>

                      <div className="flex items-center">
                        <i className="fas fa-calendar mr-1"></i>
                        <span>Uploaded {new Date(document.uploadDate || document.createdAt).toLocaleDateString()}</span>
                      </div>

                      {document.uploadedBy && (
                        <div className="flex items-center">
                          <Avatar
                            user={document.uploadedBy}
                            size="xs"
                            className="mr-2"
                          />
                          <span>by {document.uploadedBy.name || document.uploadedBy.email}</span>
                        </div>
                      )}

                      {document.lastModified && document.lastModified !== document.createdAt && (
                        <div className="flex items-center">
                          <i className="fas fa-edit mr-1"></i>
                          <span>Modified {new Date(document.lastModified).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-6">
                    {workspaceId && workspace && (
                      <Badge variant="primary" className="mb-2">
                        <i className="fas fa-users mr-1"></i>
                        {workspace.name}
                      </Badge>
                    )}

                    {document.category && (
                      <Badge variant="secondary">
                        {document.category}
                      </Badge>
                    )}

                    {document.isPublic && (
                      <Badge variant="success">
                        <i className="fas fa-globe mr-1"></i>
                        Public
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Tags - DARK MODE FIXED */}
                {document.tags && document.tags.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center flex-wrap gap-2">
                      <i className="fas fa-tags text-gray-400 mr-2"></i>
                      {document.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" size="sm">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Bar - DARK MODE FIXED */}
              <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handleBackNavigation}
                      className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors flex items-center text-sm"
                    >
                      <i className="fas fa-arrow-left mr-2"></i>
                      Back
                    </button>

                    <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>

                    <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                      <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                      {document.type || 'Unknown Type'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Button
                      onClick={handleDownloadInstead}
                      variant="outline"
                      size="sm"
                      title="Download"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />

                    </Button>

                    <PermissionGuard
                      workspaceId={workspaceId}
                      requiredPermissions={['write']}
                      fallback={null}
                    >
                      <Button
                        onClick={handleEditDocument}
                        variant="outline"
                        size="sm"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />

                      </Button>
                    </PermissionGuard>
                    <PermissionGuard
                      workspaceId={workspaceId}
                      requiredPermissions={['delete']}
                      fallback={null}
                    >
                      <Button
                        onClick={handleDeleteDocument}
                        variant="outline"
                        size="sm"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </PermissionGuard>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Document Preview - DARK MODE FIXED */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
            {documentLoading || workspaceLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                <p className="ml-3 text-gray-600 dark:text-gray-400">Loading document...</p>
              </div>
            ) : previewLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                <p className="ml-3 text-gray-600 dark:text-gray-400">Loading preview...</p>
              </div>
            ) : previewError ? (
              <div className="p-8 text-center">
                <div className="mx-auto mb-4 text-red-500">
                  <i className="fas fa-exclamation-circle text-4xl"></i>
                </div>
                <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">Preview Error</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">{previewError}</p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={handleDownloadInstead}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <i className="fas fa-download mr-2"></i>
                    Download Instead
                  </button>
                  <button
                    onClick={handleBackNavigation}
                    className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Return to Documents
                  </button>
                </div>
              </div>
            ) : document ? (
              <div className="p-6">
                {renderPreview()}
              </div>
            ) : (
              <div className="p-8 text-center">
                <i className="fas fa-file-times text-4xl text-gray-400 mb-4"></i>
                <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">Document Not Found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">The document could not be loaded.</p>
                <button
                  onClick={handleBackNavigation}
                  className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Return to Documents
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <DocumentPreviewContent />

      {/* Edit Document Modal */}
      <EditDocumentModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        document={document}
        workspaceId={workspaceId}
        onSuccess={() => {
          setShowEditModal(false);
          // Refetch document to show updated data
          if (documentId) {
            dispatch(fetchDocument(documentId));
          }
        }}
      />
    </>
  );
};



const getFileTypeIcon = (type) => {
  if (!type) return 'far fa-file text-gray-400';

  const fileType = type.toLowerCase();

  if (fileType.includes('pdf')) return 'far fa-file-pdf text-red-500';
  if (fileType.includes('doc') || fileType.includes('word')) return 'far fa-file-word text-blue-500';
  if (fileType.includes('xls') || fileType.includes('sheet')) return 'far fa-file-excel text-green-500';
  if (fileType.includes('ppt') || fileType.includes('presentation')) return 'far fa-file-powerpoint text-orange-500';
  if (fileType.includes('jpg') || fileType.includes('jpeg') || fileType.includes('png') || fileType.includes('gif'))
    return 'far fa-file-image text-purple-500';
  if (fileType.includes('zip') || fileType.includes('rar')) return 'far fa-file-archive text-yellow-600';
  if (fileType.includes('txt')) return 'far fa-file-alt text-gray-500';
  if (fileType.includes('js')) return 'fab fa-js text-yellow-400';

  return 'far fa-file text-gray-400';
};

const formatFileSize = (size) => {
  if (!size) return '0 KB';

  const sizeInKB = size / 1024;
  if (sizeInKB < 1024) return `${Math.round(sizeInKB)} KB`;
  return `${(sizeInKB / 1024).toFixed(2)} MB`;
};

export default DocumentPreview;