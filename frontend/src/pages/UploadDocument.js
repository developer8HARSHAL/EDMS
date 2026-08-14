import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Upload, X, ArrowLeft, Loader2, CheckCircle2, AlertCircle, Info,
  Lock, ChevronRight, ChevronDown, FileText, FileSpreadsheet, Image, Archive, File, Users
} from 'lucide-react';
import { documentApi } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { useSelector } from 'react-redux';
import PermissionGuard from '../components/permissions/PermissionGuard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Dropdown, DropdownItem } from '../components/ui/Dropdown';
import Badge from '../components/ui/Badge';

const UploadDocument = () => {
  const { workspaceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const { isAuthenticated, user, isAuthReady: authReady } = useAuth();

  const {
    workspaces,
    fetchWorkspaces,
    isLoading: workspacesLoading,
    canPerformAction
  } = useWorkspaces();

  const [state, setState] = useState({
    file: null,
    documentName: '',
    documentDescription: '',
    selectedWorkspaceId: workspaceId || '',
    category: '',
    tags: '',
    isPublic: false,

    uploading: false,
    uploadProgress: 0,
    showAlert: false,
    alertMessage: '',
    alertType: 'success',

    workspacesInitialized: false,
    mounted: true
  });

  const currentWorkspace = useSelector(state =>
    workspaceId ? state.workspace?.workspaces?.find(w => w._id === workspaceId) : null
  ) || workspaces.find(w => w._id === workspaceId);

  useEffect(() => {
    if (authReady && !isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
    }
  }, [authReady, isAuthenticated, navigate, location.pathname]);

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
          await fetchWorkspaces();
          if (state.mounted) {
            setState(prev => ({ ...prev, workspacesInitialized: true }));
          }
        } catch (error) {
          console.error('Failed to load workspaces:', error);
          if (state.mounted) {
            showAlert('Failed to load workspaces', 'error');
          }
        }
      }
    };

    loadWorkspaces();
  }, [workspaceId, state.workspacesInitialized, isAuthenticated, authReady, state.mounted, workspacesLoading, fetchWorkspaces]);

  useEffect(() => {
    if (workspaceId) {
      if (state.selectedWorkspaceId !== workspaceId) {
        setState(prev => ({ ...prev, selectedWorkspaceId: workspaceId }));
      }
    } else if (workspaces.length > 0 && !state.selectedWorkspaceId && state.workspacesInitialized) {
      setState(prev => ({ ...prev, selectedWorkspaceId: workspaces[0]._id }));
    }
  }, [workspaces, workspaceId, state.selectedWorkspaceId, state.workspacesInitialized]);

  useEffect(() => {
    setState(prev => ({ ...prev, mounted: true }));
    return () => {
      setState(prev => ({ ...prev, mounted: false }));
    };
  }, []);

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

  const handleFileChange = useCallback((selectedFile) => {
    if (selectedFile && state.mounted) {
      if (selectedFile.size > MAX_FILE_SIZE) {
        showAlert('File is too large. Maximum file size is 50MB.', 'error');
        return;
      }

      setState(prev => ({
        ...prev,
        file: selectedFile,
        documentName: prev.documentName || selectedFile.name,
        category: prev.category || detectCategory(selectedFile)
      }));

      showAlert(`File "${selectedFile.name}" selected. Please fill in details and click Upload.`, 'info');
    }
  }, [state.mounted, showAlert, detectCategory]);

  const handleInputChange = useCallback((field, value) => {
    setState(prev => ({ ...prev, [field]: value }));
  }, []);

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

    if (workspaceId && canPerformAction && !canPerformAction(workspaceId, 'add')) {
      showAlert('You do not have permission to upload documents to this workspace', 'error');
      return;
    }

    setState(prev => ({ ...prev, uploading: true, uploadProgress: 0 }));

    try {
      const formData = new FormData();
      formData.append('file', state.file);
      formData.append('name', state.documentName.trim());
      formData.append('workspaceId', state.selectedWorkspaceId); // Backend expects this field

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

      if (state.mounted) {
        showAlert('Document uploaded successfully!', 'success');

        setTimeout(() => {
          if (workspaceId) {
            navigate(`/workspaces/${workspaceId}/documents`);
          } else {
            navigate('/documents');
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Upload failed:', error);
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

  const handleCancel = useCallback(() => {
    if (workspaceId) {
      navigate(`/workspaces/${workspaceId}/documents`);
    } else {
      navigate('/documents');
    }
  }, [workspaceId, navigate]);

  const formatFileSize = useCallback((bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    else if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    else return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }, []);

  // Returns the lucide icon component for a given file's mime type
  const getFileIcon = useCallback((file) => {
    if (!file) return File;

    const type = file.type.toLowerCase();

    if (type.includes('sheet') || type.includes('excel') || type.includes('xls')) return FileSpreadsheet;
    if (type.includes('image')) return Image;
    if (type.includes('zip') || type.includes('archive') || type.includes('compressed')) return Archive;
    if (type.includes('pdf') || type.includes('doc') || type.includes('word') || type.includes('text')) return FileText;

    return File;
  }, []);

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

  const isInitialLoading = !authReady ||
    (isAuthenticated && !state.workspacesInitialized && workspacesLoading) ||
    state.uploading;

  if (isInitialLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-bg">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary-600" />
          <p className="mt-3 text-sm text-ink-muted">Loading workspaces...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const accessDenied = (
    <div className="flex items-center justify-center min-h-screen bg-bg">
      <div className="text-center">
        <Lock className="w-8 h-8 mx-auto text-ink-muted mb-4" />
        <h3 className="text-lg font-semibold text-ink mb-1">Access denied</h3>
        <p className="text-sm text-ink-muted mb-6">You don't have permission to upload documents to this workspace.</p>
        <Button variant="primary" onClick={() => navigate(`/workspaces/${workspaceId}`)}>
          Back to workspace
        </Button>
      </div>
    </div>
  );

  const FileIcon = getFileIcon(state.file);

  const alertStyles = {
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/40 dark:border-green-900 dark:text-green-300',
    info: 'bg-primary-50 border-primary-200 text-primary-800 dark:bg-primary-950/40 dark:border-primary-900 dark:text-primary-300',
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300'
  };

  const AlertIcon = state.alertType === 'success' ? CheckCircle2 : state.alertType === 'info' ? Info : AlertCircle;

  const selectFieldClasses = 'w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl shadow-xs text-ink ' +
    'focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500 transition-colors duration-200 ' +
    'disabled:opacity-50 disabled:cursor-not-allowed';

  const formContent = (
    <div className="bg-bg min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4">
        {state.showAlert && (
          <div className={`mb-6 flex items-center px-4 py-3 rounded-xl border text-sm ${alertStyles[state.alertType]}`}>
            <AlertIcon className="w-4 h-4 mr-2 shrink-0" />
            <span className="flex-1">{state.alertMessage}</span>
            <button
              onClick={() => setState(prev => ({ ...prev, showAlert: false }))}
              className="ml-3 text-current opacity-60 hover:opacity-100"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center text-sm text-ink-muted mb-3">
            <button onClick={handleCancel} className="hover:text-primary-600 transition-colors">
              {workspaceId ? 'Workspace' : 'Documents'}
            </button>
            {workspaceId && currentWorkspace && (
              <>
                <ChevronRight className="w-3.5 h-3.5 mx-1.5" />
                <span className="font-medium text-ink">{currentWorkspace.name}</span>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5 mx-1.5" />
            <span>Upload document</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-ink">Upload document</h1>
              <p className="text-sm text-ink-muted mt-1">
                {workspaceId && currentWorkspace
                  ? `Add a new document to ${currentWorkspace.name}`
                  : 'Add documents to your document library'}
              </p>
            </div>

            {workspaceId && currentWorkspace && (
              <Badge variant="secondary" icon={Users}>
                {currentWorkspace.name}
              </Badge>
            )}
          </div>
        </div>

        <Card padding={false}>
          <form onSubmit={handleSubmit} className="p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* File Upload Section */}
              <div>
                <h3 className="text-sm font-semibold text-ink mb-3">File</h3>

                <div
                  className={`border-2 border-dashed rounded-xl text-center transition-colors duration-150
                    ${state.file
                      ? 'border-border bg-surface-2'
                      : 'border-border hover:border-primary-400 hover:bg-surface-2'}`}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <div className="py-8 px-4">
                    {state.file ? (
                      <div className="flex flex-col items-center">
                        <div className="icon-badge icon-badge-1 h-12 w-12 mb-3">
                          <FileIcon className="w-5 h-5" />
                        </div>
                        <p className="text-ink font-medium mb-0.5">{state.file.name}</p>
                        <p className="text-ink-muted text-xs mb-4 flex items-center">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-green-600" />
                          {formatFileSize(state.file.size)}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          leftIcon={<X className="w-3.5 h-3.5" />}
                          onClick={removeFile}
                          disabled={state.uploading}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          Remove file
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="icon-badge icon-badge-3 h-12 w-12 mb-3">
                          <Upload className="w-5 h-5" />
                        </div>
                        <p className="text-ink font-medium mb-0.5">Drag and drop your file here</p>
                        <p className="text-ink-muted text-sm mb-3">or click to browse your files</p>
                        <p className="text-xs text-ink-muted">Maximum file size: 50MB</p>
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
                <h3 className="text-sm font-semibold text-ink mb-3">Details</h3>

                <div className="space-y-4">
                  <Input
                    label={<>Document name <span className="text-red-500">*</span></>}
                    type="text"
                    value={state.documentName}
                    onChange={(e) => handleInputChange('documentName', e.target.value)}
                    placeholder="Enter document name"
                    disabled={state.uploading}
                    required
                  />

                  {!workspaceId && (
                    <div>
                      <label className="block text-sm font-medium text-ink mb-1">
                        Workspace <span className="text-red-500">*</span>
                      </label>
                      <Dropdown
                        fullWidth
                        trigger={
                          <button
                            type="button"
                            className={`${selectFieldClasses} flex items-center justify-between text-left`}
                            disabled={state.uploading || workspacesLoading}
                          >
                            <span className={state.selectedWorkspaceId ? 'text-ink' : 'text-ink-muted'}>
                              {workspacesLoading
                                ? 'Loading workspaces...'
                                : workspaces.find(w => w._id === state.selectedWorkspaceId)?.name || 'Select workspace'}
                            </span>
                            <ChevronDown className="w-4 h-4 text-ink-muted shrink-0 ml-2" />
                          </button>
                        }
                      >
                        {workspaces.map(workspace => (
                          <DropdownItem
                            key={workspace._id}
                            onClick={() => handleInputChange('selectedWorkspaceId', workspace._id)}
                          >
                            {workspace.name}
                          </DropdownItem>
                        ))}
                      </Dropdown>
                      {workspaces.length === 0 && state.workspacesInitialized && !workspacesLoading && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                          No workspaces available. Please create a workspace first.
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-ink mb-1">Description</label>
                    <textarea
                      value={state.documentDescription}
                      onChange={(e) => handleInputChange('documentDescription', e.target.value)}
                      placeholder="Brief description of the document (optional)"
                      rows={3}
                      className={`${selectFieldClasses} resize-none`}
                      disabled={state.uploading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink mb-1">Category</label>
                    <Dropdown
                      fullWidth
                      trigger={
                        <button
                          type="button"
                          className={`${selectFieldClasses} flex items-center justify-between text-left`}
                          disabled={state.uploading}
                        >
                          <span className={state.category ? 'text-ink' : 'text-ink-muted'}>
                            {state.category || 'Select category'}
                          </span>
                          <ChevronDown className="w-4 h-4 text-ink-muted shrink-0 ml-2" />
                        </button>
                      }
                    >
                      {documentCategories.map(cat => (
                        <DropdownItem key={cat} onClick={() => handleInputChange('category', cat)}>
                          {cat}
                        </DropdownItem>
                      ))}
                    </Dropdown>
                  </div>

                  <Input
                    label="Tags"
                    type="text"
                    value={state.tags}
                    onChange={(e) => handleInputChange('tags', e.target.value)}
                    placeholder="Enter tags separated by commas (e.g., urgent, report, 2024)"
                    helperText="Separate multiple tags with commas"
                    disabled={state.uploading}
                  />

                  <label htmlFor="isPublic" className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={state.isPublic}
                      onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                      disabled={state.uploading}
                    />
                    <span className="text-sm text-ink-muted">
                      Make document publicly accessible within workspace
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {state.uploading && (
              <div className="mt-8 p-4 bg-surface-2 rounded-xl">
                <div className="flex justify-between text-sm text-ink mb-2">
                  <span>Uploading document...</span>
                  <span>{state.uploadProgress}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${state.uploadProgress}%` }} />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-6 border-t border-border mt-8">
              <Button
                type="button"
                variant="outline"
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                onClick={handleCancel}
                disabled={state.uploading}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="primary"
                leftIcon={!state.uploading && <Upload className="w-4 h-4" />}
                isLoading={state.uploading}
                loadingText={`Uploading... ${state.uploadProgress}%`}
                disabled={!state.file || !state.documentName.trim() || !state.selectedWorkspaceId}
              >
                Upload document
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );

  if (workspaceId && currentWorkspace && canPerformAction && !canPerformAction(workspaceId, 'add')) {
    return accessDenied;
  }

  if (workspaceId && currentWorkspace) {
    return (
      <PermissionGuard
        workspaceId={workspaceId}
        requiredPermissions={['write']}
        fallback={accessDenied}
      >
        {formContent}
      </PermissionGuard>
    );
  }

  return formContent;
};

export default UploadDocument;