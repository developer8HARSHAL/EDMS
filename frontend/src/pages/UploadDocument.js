import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentApi } from '../services/apiService';
import { useAuth } from '../context/AuthContext';

const UploadDocument = () => {
  const [file, setFile] = useState(null);
  const [documentName, setDocumentName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/documents/upload' } });
    }
  }, [isAuthenticated, navigate]);

  // Max file size (50MB)
  const MAX_FILE_SIZE = 50 * 1024 * 1024;

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
    }
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
  
  setUploading(true);
  setUploadProgress(0);
  
  try {
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', documentName);
    
    // Add user ID if available
    if (user && (user.id || user._id)) {
      formData.append('userId', user.id || user._id);
    }
    
    // Upload document and actually use the response variable
    await documentApi.uploadDocument(formData, {
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress(percentCompleted);
      }
    });
      
      // Success notification or redirection
     alert('Document uploaded successfully');
    navigate('/documents');
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-800">Upload New Document</h1>
            <p className="text-gray-500 mt-1">Add documents to your document library</p>
          </div>
          
          <form onSubmit={handleSubmit} className="px-8 py-6">
            <div className="mb-6">
              <label 
                className="block text-gray-700 text-sm font-bold mb-2" 
                htmlFor="documentName"
              >
                Document Name
              </label>
              <input
                id="documentName"
                type="text"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="Enter document name"
                className="shadow-sm border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                disabled={uploading}
                required
              />
            </div>

            <div 
              className={`mb-6 border-2 border-dashed rounded-xl text-center transition-all duration-200 
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

            {uploading && (
              <div className="mb-6">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
                    style={{width: `${uploadProgress}%`}}
                  ></div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => navigate('/documents')}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200"
                disabled={uploading}
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Back to Library
              </button>
              <button
                type="submit"
                className={`px-6 py-3 rounded-lg font-medium text-white shadow-sm transition-all duration-200
                  ${file 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-gray-400 cursor-not-allowed'}`}
                disabled={!file || uploading}
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
          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadDocument;