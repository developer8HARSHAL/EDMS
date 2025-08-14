import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { documentApi } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { useSelector } from 'react-redux';
import  PermissionGuard  from '../components/permissions/PermissionGuard';
import  WorkspaceSelector  from '../components/workspace/WorkspaceSelector';
import Badge from '../components/ui/Badge';

const UploadDocument = () => {
  const { workspaceId } = useParams();
  const location = useLocation();
  const [file, setFile] = useState(null);
  const [documentName, setDocumentName] = useState('');
  const [documentDescription, setDocumentDescription] = useState('');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(workspaceId || '');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { workspaces, fetchWorkspaces } = useWorkspaces();

  // Get current workspace from Redux if in workspace context
  const currentWorkspace = useSelector(state => 
    workspaceId ? state.workspace.workspaces.find(w => w._id === workspaceId) : null
  );

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
    }
  }, [isAuthenticated, navigate, location.pathname]);

  // Fetch workspaces if not in specific workspace context
  useEffect(() => {
    if (isAuthenticated && !workspaceId) {
      fetchWorkspaces();
    }
  }, [isAuthenticated, workspaceId, fetchWorkspaces]);

  // Set default workspace from URL params or first available workspace
  useEffect(() => {
    if (workspaceId) {
      setSelectedWorkspaceId(workspaceId);
    } else if (workspaces.length > 0 && !selectedWorkspaceId) {
      setSelectedWorkspaceId(workspaces[0]._id);
    }
  }, [workspaceId, workspaces, selectedWorkspaceId]);

  // Max file size (50MB)
  const MAX_FILE_SIZE = 50 * 1024 * 1024;

  // Predefined categories
  const documentCategories = [
    'General',
    'Reports',
    'Presentations',
    'Spreadsheets',
    'Images',
    'Archives',
    'Legal',
    'Financial',
    'Technical',
    'Marketing',
    'HR',
    'Other'
  ];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (selectedFile) {
      // Check file size
      if (selectedFile.size > MAX_FILE_SIZE) {
        alert('File is too large. Maximum file size is 50MB.');
        return;
      }
      
      setFile(selectedFile);
      // Set document name to file name by default if not already set
      if (!documentName) {
        setDocumentName(selectedFile.name);
      }

      // Auto-detect category based on file type
      if (!category) {
        const detectedCategory = detectCategory(selectedFile);
        setCategory(detectedCategory);
      }
    }
  };

  const detectCategory = (file) => {
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
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFile = e.dataTransfer.files[0];
    
    if (droppedFile) {
      // Check file size
      if (droppedFile.size > MAX_FILE_SIZE) {
        alert('File is too large. Maximum file size is 50MB.');
        return;
      }
      
      setFile(droppedFile);
      // Set document name to file name by default if not already set
      if (!documentName) {
        setDocumentName(droppedFile.name);
      }

      // Auto-detect category
      if (!category) {
        const detectedCategory = detectCategory(droppedFile);
        setCategory(detectedCategory);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      alert('Please select a file to upload');
      return;
    }
    
    if (!documentName.trim()) {
      alert('Please provide a document name');
      return;
    }

    if (!selectedWorkspaceId) {
      alert('Please select a workspace');
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', documentName.trim());
      formData.append('workspace', selectedWorkspaceId);
      
      // Add optional fields
      if (documentDescription.trim()) {
        formData.append('description', documentDescription.trim());
      }
      
      if (category) {
        formData.append('category', category);
      }
      
      if (tags.trim()) {
        // Convert comma-separated tags to array
        const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        formData.append('tags', JSON.stringify(tagArray));
      }
      
      formData.append('isPublic', isPublic);
      
      // Add user ID if available
      if (user && (user.id || user._id)) {
        formData.append('userId', user.id || user._id);
      }
      
      // Upload document
      await documentApi.uploadDocument(formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        }
      });
        
      // Success notification
      alert('Document uploaded successfully');
      
      // Navigate based on context
      if (workspaceId) {
        // If in workspace context, go to workspace documents
        navigate(`/workspaces/${workspaceId}/documents`);
      } else {
        // Otherwise go to general documents
        navigate('/documents');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setDocumentName('');
    setDocumentDescription('');
    setCategory('');
    setTags('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancel = () => {
    if (workspaceId) {
      navigate(`/workspaces/${workspaceId}/documents`);
    } else {
      navigate('/documents');
    }
  };

  // Function to format file size for display
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    else if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    else return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Function to get icon class based on mime type
  const getFileIcon = (file) => {
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
  };

  // If not authenticated, don't render anything (will redirect via useEffect)
  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-gray-600">Checking authentication...</p>
      </div>
    );
  }

  // Permission check for workspace uploads
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
        <UploadForm />
      </PermissionGuard>
    );
  }

  function UploadForm() {
    return (
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header with workspace context */}
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
                {/* Left Column - File Upload */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">File Upload</h3>
                  
                  <div 
                    className={`border-2 border-dashed rounded-xl text-center transition-all duration-200 
                      ${file 
                        ? 'border-green-400 bg-green-50' 
                        : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'}`}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <div className="py-8 px-4">
                      {file ? (
                        <div className="flex flex-col items-center">
                          <div className="h-16 w-16 mb-4 flex items-center justify-center rounded-full bg-green-100">
                            <i className={`${getFileIcon(file)} text-2xl`}></i>
                          </div>
                          <p className="text-gray-800 font-medium text-lg mb-1">{file.name}</p>
                          <p className="text-gray-500 text-sm mb-4">
                            {formatFileSize(file.size)}
                          </p>
                          <button
                            type="button"
                            onClick={removeFile}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors duration-200"
                          >
                            <i className="fas fa-times mr-2"></i>
                            Remove File
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center cursor-pointer" onClick={() => fileInputRef.current.click()}>
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
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={uploading}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column - Document Details */}
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
                        value={documentName}
                        onChange={(e) => setDocumentName(e.target.value)}
                        placeholder="Enter document name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={uploading}
                        required
                      />
                    </div>

                    {/* Workspace Selector (only if not in workspace context) */}
                    {!workspaceId && (
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                          Workspace <span className="text-red-500">*</span>
                        </label>
                        <WorkspaceSelector
                          value={selectedWorkspaceId}
                          onChange={setSelectedWorkspaceId}
                          disabled={uploading}
                          placeholder="Select workspace"
                          className="w-full"
                        />
                      </div>
                    )}

                    {/* Description */}
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        Description
                      </label>
                      <textarea
                        value={documentDescription}
                        onChange={(e) => setDocumentDescription(e.target.value)}
                        placeholder="Brief description of the document (optional)"
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        disabled={uploading}
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={uploading}
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
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="Enter tags separated by commas (e.g., urgent, report, 2024)"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={uploading}
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
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        disabled={uploading}
                      />
                      <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
                        Make document publicly accessible within workspace
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                  <div className="flex justify-between text-sm text-blue-800 mb-2">
                    <span>Uploading document...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out" 
                      style={{width: `${uploadProgress}%`}}
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
                  disabled={uploading}
                >
                  <i className="fas fa-arrow-left mr-2"></i>
                  Cancel
                </button>
                
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className={`px-8 py-3 rounded-lg font-medium text-white shadow-sm transition-all duration-200
                      ${file && selectedWorkspaceId
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-gray-400 cursor-not-allowed'}`}
                    disabled={!file || !selectedWorkspaceId || uploading}
                  >
                    {uploading ? (
                      <span className="flex items-center">
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Uploading...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <i className="fas fa-upload mr-2"></i>
                        Upload Document
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return <UploadForm />;
};

export default UploadDocument;