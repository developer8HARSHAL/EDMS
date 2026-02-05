import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { documentApi } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { useSelector } from 'react-redux';
import PermissionGuard from '../components/permissions/PermissionGuard';
import Badge from '../components/ui/Badge';

const UploadDocument = () => {
  const { workspaceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const { isAuthenticated, user, isAuthReady: authReady } = useAuth();
  
  // ✅ FIX: Use updated hook with backend integration
  const { 
    workspaces, 
    fetchWorkspaces, 
    isLoading: workspacesLoading,
    hasWorkspaces,
    getUserPermissions,
    canPerformAction
  } = useWorkspaces();
  // ✅ FIX: Consolidated state management
  const [state, setState] = useState({
    // File state
    file: null,
    documentName: '',
    documentDescription: '',
    selectedWorkspaceId: workspaceId || '',
    category: '',
    tags: '',
    isPublic: false,
    
    // UI state
    uploading: false,
    uploadProgress: 0,
    showAlert: false,
    alertMessage: '',
    alertType: 'success',
    
    // Loading state
    workspacesInitialized: false,
    mounted: true
  });

  // Get current workspace from Redux if in workspace context
  const currentWorkspace = useSelector(state => 
    workspaceId ? state.workspace?.workspaces?.find(w => w._id === workspaceId) : null
  ) || workspaces.find(w => w._id === workspaceId);

  // Authentication check
  useEffect(() => {
    if (authReady && !isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
    }
  }, [authReady, isAuthenticated, navigate, location.pathname]);

  // ✅ FIX: Load workspaces with proper backend integration
  useEffect(() => {
    const loadWorkspaces = async () => {
      if (
        !workspaceId && 
        !state.workspacesInitialized && 
        isAuthenticated && 
        authReady && 
        state.mounted &&
        !workspacesLoading
      ) {
        try {
          console.log('📄 loading workspaces for dropdown...');
          await fetchWorkspaces();
          
          if (state.mounted) {
            setState(prev => ({ ...prev, workspacesInitialized: true }));
            console.log('✅ Workspaces loaded successfully for upload form');
          }
        } catch (error) {
          console.error('❌ Failed to load workspaces:', error);
          if (state.mounted) {
            showAlert('Failed to load workspaces', 'error');
          }
        }
      }
    };

    loadWorkspaces();
  }, [workspaceId, state.workspacesInitialized, isAuthenticated, authReady, state.mounted, workspacesLoading, fetchWorkspaces]);

  // Set default workspace
  useEffect(() => {
    if (workspaceId) {
      if (state.selectedWorkspaceId !== workspaceId) {
        setState(prev => ({ ...prev, selectedWorkspaceId: workspaceId }));
      }
    } else if (workspaces.length > 0 && !state.selectedWorkspaceId && state.workspacesInitialized) {
      console.log('🔧 Setting default workspace:', workspaces[0]._id);
      setState(prev => ({ ...prev, selectedWorkspaceId: workspaces[0]._id }));
    }
  }, [workspaces, workspaceId, state.selectedWorkspaceId, state.workspacesInitialized]);

  // Cleanup
  useEffect(() => {
    setState(prev => ({ ...prev, mounted: true }));
    return () => {
      setState(prev => ({ ...prev, mounted: false }));
    };
  }, []);

  // Alert auto-hide
  useEffect(() => {
    if (state.showAlert) {
      const timer = setTimeout(() => {
        if (state.mounted) {
          setState(prev => ({ ...prev, showAlert: false }));
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.showAlert, state.mounted]);

  // Constants
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const documentCategories = [
    'General', 'Reports', 'Presentations', 'Spreadsheets', 'Images',
    'Archives', 'Legal', 'Financial', 'Technical', 'Marketing', 'HR', 'Other'
  ];

  const showAlert = useCallback((message, type = 'success') => {
    if (state.mounted) {
      setState(prev => ({
        ...prev,
        alertMessage: message,
        alertType: type,
        showAlert: true
      }));
    }
  }, [state.mounted]);

  const detectCategory = useCallback((file) => {
    const type = file.type.toLowerCase();
    const name = file.name.toLowerCase();

    if (type.includes('image')) return 'Images';
    if (type.includes('pdf') || name.includes('report')) return 'Reports';
    if (type.includes('presentation') || type.includes('powerpoint')) return 'Presentations';
    if (type.includes('sheet') || type.includes('excel')) return 'Spreadsheets';
    if (type.includes('zip') || type.includes('archive')) return 'Archives';
    if (name.includes('legal') || name.includes('contract')) return 'Legal';
    if (name.includes('financial') || name.includes('budget')) return 'Financial';
    
    return 'General';
  }, []);

  // File handling
  const handleFileChange = useCallback((selectedFile) => {
    if (selectedFile && state.mounted) {
      if (selectedFile.size > MAX_FILE_SIZE) {
        showAlert('File is too large. Maximum file size is 50MB.', 'error');
        return;
      }
      
      console.log('📄 File selected:', selectedFile.name);
      
      setState(prev => ({
        ...prev,
        file: selectedFile,
        documentName: prev.documentName || selectedFile.name,
        category: prev.category || detectCategory(selectedFile)
      }));
      
      // ✅ FIX: Proper selection message
      showAlert(`File "${selectedFile.name}" selected. Please fill in details and click Upload.`, 'info');
    }
  }, [state.mounted, showAlert, detectCategory]);

  // Form input handlers
  const handleInputChange = useCallback((field, value) => {
    setState(prev => ({ ...prev, [field]: value }));
  }, []);

  // Remove file handler
  const removeFile = useCallback(() => {
    setState(prev => ({
      ...prev,
      file: null,
      documentName: '',
      documentDescription: '',
      category: '',
      tags: ''
    }));
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    showAlert('File removed', 'info');
  }, [showAlert]);

  // ✅ FIX: Form submission with backend API format
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!state.file) {
      showAlert('Please select a file to upload', 'error');
      return;
    }
    
    if (!state.documentName.trim()) {
      showAlert('Please provide a document name', 'error');
      return;
    }

    if (!state.selectedWorkspaceId) {
      showAlert('Please select a workspace', 'error');
      return;
    }

    // ✅ FIX: Check workspace permissions using backend format
    if (workspaceId && canPerformAction && !canPerformAction(workspaceId, 'add')) {
      showAlert('You do not have permission to upload documents to this workspace', 'error');
      return;
    }
    
    setState(prev => ({ ...prev, uploading: true, uploadProgress: 0 }));
    
    try {
      console.log('🚀 Starting document upload...');
      
      // ✅ FIX: Create FormData matching backend expectations
      const formData = new FormData();
      formData.append('file', state.file);
      formData.append('name', state.documentName.trim());
      formData.append('workspaceId', state.selectedWorkspaceId); // Backend expects this field
      
      // Optional fields
      if (state.documentDescription.trim()) {
        formData.append('description', state.documentDescription.trim());
      }
      
      if (state.category) {
        formData.append('category', state.category);
      }
      
      if (state.tags.trim()) {
        const tagArray = state.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        formData.append('tags', JSON.stringify(tagArray));
      }
      
      formData.append('isPublic', state.isPublic);
      
      if (user && (user.id || user._id)) {
        formData.append('userId', user.id || user._id);
      }
      
      // ✅ FIX: Upload with progress tracking
      const response = await documentApi.uploadDocument(formData, {
        onUploadProgress: (progressEvent) => {
          if (state.mounted) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setState(prev => ({ ...prev, uploadProgress: percentCompleted }));
          }
        }
      });
      
      console.log('✅ Document uploaded successfully:', response);
      
      if (state.mounted) {
        showAlert('Document uploaded successfully!', 'success');
        
        // Navigate after showing success message
        setTimeout(() => {
          if (workspaceId) {
            navigate(`/workspaces/${workspaceId}/documents`);
          } else {
            navigate('/documents');
          }
        }, 2000);
      }
      
    } catch (error) {
      console.error('❌ Upload failed:', error);
      if (state.mounted) {
        const errorMessage = error.response?.data?.message || 'Failed to upload document. Please try again.';
        showAlert(errorMessage, 'error');
      }
    } finally {
      if (state.mounted) {
        setState(prev => ({ ...prev, uploading: false }));
      }
    }
  }, [
    state.file, 
    state.documentName, 
    state.selectedWorkspaceId, 
    state.documentDescription, 
    state.category, 
    state.tags, 
    state.isPublic, 
    state.mounted,
    workspaceId, 
    navigate, 
    showAlert, 
    canPerformAction,
    user
  ]);

  // Cancel handler
  const handleCancel = useCallback(() => {
    if (workspaceId) {
      navigate(`/workspaces/${workspaceId}/documents`);
    } else {
      navigate('/documents');
    }
  }, [workspaceId, navigate]);

  // Utility functions
  const formatFileSize = useCallback((bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    else if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    else return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }, []);

  const getFileIcon = useCallback((file) => {
    if (!file) return 'fas fa-upload text-gray-400';
    
    const type = file.type.toLowerCase();
    
    if (type.includes('pdf')) return 'far fa-file-pdf text-red-500';
    if (type.includes('doc') || type.includes('word')) return 'far fa-file-word text-blue-500';
    if (type.includes('sheet') || type.includes('excel') || type.includes('xls')) return 'far fa-file-excel text-green-500';
    if (type.includes('presentation') || type.includes('powerpoint') || type.includes('ppt')) 
      return 'far fa-file-powerpoint text-orange-500';
    if (type.includes('image')) return 'far fa-file-image text-purple-500';
    if (type.includes('text')) return 'far fa-file-alt text-gray-500';
    if (type.includes('zip') || type.includes('archive') || type.includes('compressed')) 
      return 'far fa-file-archive text-yellow-600';
    
    return 'far fa-file text-gray-500';
  }, []);

  // Drag and drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileChange(droppedFile);
    }
  }, [handleFileChange]);

  // ✅ FIX: Better loading state
const isInitialLoading = !authReady || 
  (isAuthenticated && !state.workspacesInitialized && workspacesLoading) ||
  state.uploading;

  if (isInitialLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-gray-600">loading workspaces...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Main form content
  const formContent = (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Alert Messages */}
        {state.showAlert && (
          <div className={`mb-6 p-4 rounded-lg border ${
            state.alertType === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : state.alertType === 'info'
              ? 'bg-blue-50 border-blue-200 text-blue-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              <i className={`fas ${
                state.alertType === 'success' ? 'fa-check-circle' : 
                state.alertType === 'info' ? 'fa-info-circle' : 
                'fa-exclamation-circle'
              } mr-2`}></i>
              {state.alertMessage}
              <button 
                onClick={() => setState(prev => ({ ...prev, showAlert: false }))}
                className="ml-auto text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <button
              onClick={handleCancel}
              className="hover:text-blue-600 transition-colors"
            >
              {workspaceId ? 'Workspace' : 'Documents'}
            </button>
            {workspaceId && currentWorkspace && (
              <>
                <i className="fas fa-chevron-right mx-2"></i>
                <span className="font-medium">{currentWorkspace.name}</span>
              </>
            )}
            <i className="fas fa-chevron-right mx-2"></i>
            <span>Upload Document</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Upload New Document</h1>
              <p className="text-gray-600 mt-2">
                {workspaceId && currentWorkspace 
                  ? `Add a new document to ${currentWorkspace.name} workspace`
                  : 'Add documents to your document library'
                }
              </p>
            </div>
            
            {workspaceId && currentWorkspace && (
              <Badge variant="primary" className="ml-4">
                <i className="fas fa-users mr-1"></i>
                {currentWorkspace.name}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* File Upload Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">File Upload</h3>
                
                <div 
                  className={`border-2 border-dashed rounded-xl text-center transition-all duration-200 
                    ${state.file 
                      ? 'border-green-400 bg-green-50' 
                      : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'}`}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <div className="py-8 px-4">
                    {state.file ? (
                      <div className="flex flex-col items-center">
                        <div className="h-16 w-16 mb-4 flex items-center justify-center rounded-full bg-green-100">
                          <i className={`${getFileIcon(state.file)} text-2xl`}></i>
                        </div>
                        <p className="text-gray-800 font-medium text-lg mb-1">{state.file.name}</p>
                        <p className="text-gray-500 text-sm mb-4">
                          {formatFileSize(state.file.size)}
                        </p>
                        <button
                          type="button"
                          onClick={removeFile}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors duration-200"
                          disabled={state.uploading}
                        >
                          <i className="fas fa-times mr-2"></i>
                          Remove File
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="h-16 w-16 mb-4 flex items-center justify-center rounded-full bg-blue-100">
                          <i className="fas fa-cloud-upload-alt text-blue-500 text-2xl"></i>
                        </div>
                        <p className="text-gray-700 font-medium mb-1">
                          Drag and drop your file here
                        </p>
                        <p className="text-gray-500 text-sm mb-4">
                          or click to browse your files
                        </p>
                        <p className="text-xs text-gray-400">
                          Maximum file size: 50MB
                        </p>
                      </div>
                    )}
                    
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => handleFileChange(e.target.files[0])}
                      className="hidden"
                      disabled={state.uploading}
                    />
                  </div>
                </div>
              </div>

              {/* Document Details Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Document Details</h3>
                
                <div className="space-y-4">
                  {/* Document Name */}
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Document Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={state.documentName}
                      onChange={(e) => handleInputChange('documentName', e.target.value)}
                      placeholder="Enter document name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={state.uploading}
                      required
                    />
                  </div>

                  {/* Workspace Selector (only if not in workspace context) */}
                  {!workspaceId && (
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        Workspace <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={state.selectedWorkspaceId}
                        onChange={(e) => handleInputChange('selectedWorkspaceId', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={state.uploading || workspacesLoading}
                        required
                      >
                        <option value="">
                          {workspacesLoading ? 'loading woronse.data.workspace;kspaces...' : 'Select workspace'}
                        </option>
                        {workspaces.map(workspace => (
                          <option key={workspace._id} value={workspace._id}>
                            {workspace.name}
                          </option>
                        ))}
                      </select>
                      {workspaces.length === 0 && state.workspacesInitialized && !workspacesLoading && (
                        <p className="text-sm text-red-600 mt-1">
                          No workspaces available. Please create a workspace first.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Description
                    </label>
                    <textarea
                      value={state.documentDescription}
                      onChange={(e) => handleInputChange('documentDescription', e.target.value)}
                      placeholder="Brief description of the document (optional)"
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      disabled={state.uploading}
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Category
                    </label>
                    <select
                      value={state.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={state.uploading}
                    >
                      <option value="">Select category</option>
                      {documentCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Tags
                    </label>
                    <input
                      type="text"
                      value={state.tags}
                      onChange={(e) => handleInputChange('tags', e.target.value)}
                      placeholder="Enter tags separated by commas (e.g., urgent, report, 2024)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={state.uploading}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Separate multiple tags with commas
                    </p>
                  </div>

                  {/* Public Document Toggle */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={state.isPublic}
                      onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      disabled={state.uploading}
                    />
                    <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
                      Make document publicly accessible within workspace
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Upload Progress */}
            {state.uploading && (
              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between text-sm text-blue-800 mb-2">
                  <span>Uploading document...</span>
                  <span>{state.uploadProgress}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out" 
                    style={{width: `${state.uploadProgress}%`}}
                  ></div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-8 border-t border-gray-200 mt-8">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200"
                disabled={state.uploading}
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Cancel
              </button>
              
              <button
                type="submit"
                className={`px-8 py-3 rounded-lg font-medium text-white shadow-sm transition-all duration-200
                  ${state.file && state.documentName.trim() && state.selectedWorkspaceId
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-gray-400 cursor-not-allowed'}`}
                disabled={!state.file || !state.documentName.trim() || !state.selectedWorkspaceId || state.uploading}
              >
                {state.uploading ? (
                  <span className="flex items-center">
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Uploading... {state.uploadProgress}%
                  </span>
                ) : (
                  <span className="flex items-center">
                    <i className="fas fa-upload mr-2"></i>
                    Upload Document
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  // ✅ FIX: Permission check for workspace uploads
  if (workspaceId && currentWorkspace && canPerformAction && !canPerformAction(workspaceId, 'add')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <i className="fas fa-lock text-4xl text-gray-400 mb-4"></i>
          <h3 className="text-xl font-medium text-gray-700 mb-2">Access Denied</h3>
          <p className="text-gray-500 mb-4">You don't have permission to upload documents to this workspace.</p>
          <button
            onClick={() => navigate(`/workspaces/${workspaceId}`)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Workspace
          </button>
        </div>
      </div>
    );
  }

  // Render with permission guard for workspace uploads
  if (workspaceId && currentWorkspace) {
    return (
      <PermissionGuard 
        workspaceId={workspaceId} 
        requiredPermissions={['write']}
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <i className="fas fa-lock text-4xl text-gray-400 mb-4"></i>
              <h3 className="text-xl font-medium text-gray-700 mb-2">Access Denied</h3>
              <p className="text-gray-500 mb-4">You don't have permission to upload documents to this workspace.</p>
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
        {formContent}
      </PermissionGuard>
    );
  }

  return formContent;
};

export default UploadDocument;