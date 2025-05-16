import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/apiService';

const DocumentPreview = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  // Removed 'user' since it's not being used
  const { isAuthenticated } = useAuth();
  const [document, setDocument] = useState(null);
  const [previewContent, setPreviewContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/documents/preview/${documentId}` } });
    }
  }, [isAuthenticated, navigate, documentId]);

  useEffect(() => {
    const fetchDocumentDetails = async () => {
      if (!documentId || !isAuthenticated) return;
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching document with ID:', documentId);
        
        // Fetch document details
        const docResponse = await apiService.documentApi.getDocument(documentId);
        console.log('Document response:', docResponse);
        
        // Check if we have a valid response
        if (!docResponse) {
          throw new Error('No response received');
        }
        
        // Handle different response formats
        let docData;
        if (docResponse.data) {
          docData = docResponse.data;
        } else if (docResponse.document) {
          docData = docResponse.document;
        } else if (typeof docResponse === 'object' && Object.keys(docResponse).length > 0) {
          docData = docResponse;
        } else {
          throw new Error('Invalid document data format');
        }
        
        console.log('Parsed document data:', docData);
        setDocument(docData);
        
        // Fetch document preview
        console.log('Fetching document preview for ID:', documentId);
        try {
          const previewResponse = await apiService.documentApi.previewDocument(documentId);
          console.log('Preview response type:', previewResponse.constructor.name);
          setPreviewContent(previewResponse);
        } catch (previewErr) {
          console.error('Preview fetch error:', previewErr);
          // If preview fails, try to get the document content directly
          console.log('Falling back to downloading the document instead');
          const downloadResponse = await apiService.documentApi.downloadDocument(documentId);
          setPreviewContent(downloadResponse.data || downloadResponse);
        }
      } catch (err) {
        console.error('Error fetching document for preview:', err);
        setError(err.message || 'Failed to load document preview');
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentDetails();
  }, [documentId, isAuthenticated]);

  // Function to render different types of previews based on document type
  const renderPreview = () => {
    if (!document || !previewContent) return null;

    const fileType = document.type?.toLowerCase() || '';
    
    // For text-based documents
    if (fileType.includes('text') || fileType.includes('javascript') || 
        fileType.includes('json') || fileType.includes('css') || fileType.includes('html')) {
      // For text content, it's likely already a string
      const textContent = typeof previewContent === 'string' 
        ? previewContent 
        : new TextDecoder().decode(previewContent);
        
      return (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-auto h-[600px] font-mono text-sm">
          <pre>{textContent}</pre>
        </div>
      );
    }
    
    // For PDF documents
    if (fileType.includes('pdf')) {
      // Create object URL from blob data
      const pdfUrl = URL.createObjectURL(
        new Blob([previewContent], { type: 'application/pdf' })
      );
      
      return (
        <div className="h-[600px] w-full">
          <iframe 
            src={pdfUrl}
            title="PDF Preview"
            className="w-full h-full border-0 rounded-lg shadow"
          />
        </div>
      );
    }
    
    // For image files
    if (fileType.includes('image') || 
        fileType.includes('png') || 
        fileType.includes('jpg') || 
        fileType.includes('jpeg') || 
        fileType.includes('gif') || 
        fileType.includes('svg')) {
      // Create object URL from blob data
      const imageUrl = URL.createObjectURL(
        new Blob([previewContent], { type: document.type })
      );
      
      return (
        <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
          <img 
            src={imageUrl} 
            alt={document.name} 
            className="max-h-[600px] max-w-full object-contain rounded shadow"
            onError={(e) => {
              console.error('Image failed to load');
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iMTIiIHk9IjEyIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBIZWx2ZXRpY2EsIHNhbnMtc2VyaWYiIGZpbGw9IiNhYWFhYWEiPkltYWdlPC90ZXh0Pjwvc3ZnPg==';
              e.target.className = 'max-h-[600px] max-w-full object-contain rounded shadow border border-gray-200';
            }}
          />
        </div>
      );
    }
    
    // For unsupported file types
    return (
      <div className="text-center py-12 px-4 bg-gray-50 rounded-lg border border-gray-200">
        <i className="fas fa-file-alt text-5xl text-gray-400 mb-4"></i>
        <h3 className="text-xl font-medium text-gray-700 mb-2">Preview not available</h3>
        <p className="text-gray-500 mb-4">
          This document type ({document.type || 'Unknown'}) cannot be previewed directly.
        </p>
        <button
          onClick={() => handleDownloadInstead()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          <i className="fas fa-download mr-2"></i> 
          Download Instead
        </button>
      </div>
    );
  };

  // Add a helper function to handle downloads
  const handleDownloadInstead = async () => {
    try {
      const response = await apiService.documentApi.downloadDocument(documentId);
      
      if (!response) {
        throw new Error('No response received');
      }
      
      // Handle the response data
      const blobData = response.data || response;
      const blob = blobData instanceof Blob ? blobData : new Blob([blobData]);
      
      // Create download link
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
      setError('Failed to download document');
    }
  };

  // If not authenticated, show loading screen
  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-gray-600">Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center">
          <button
            onClick={() => navigate('/documents')}
            className="mr-4 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Documents
          </button>
          
          {document && (
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <i className={getFileTypeIcon(document.type) + " mr-3"}></i>
              {document.name}
            </h1>
          )}
        </div>
        
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
              <p className="ml-3 text-gray-600">Loading document preview...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 text-red-500">
                <i className="fas fa-exclamation-circle text-4xl"></i>
              </div>
              <h3 className="text-xl font-medium text-gray-700 mb-2">Preview Error</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <button
                onClick={() => navigate('/documents')}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
              >
                Return to Document List
              </button>
            </div>
          ) : (
            <>
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center">
                  {document && (
                    <>
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 mr-2">
                        {document.type || 'Unknown Type'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatFileSize(document.size)}
                      </span>
                    </>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  {document && (
                    <button
                      onClick={handleDownloadInstead}
                      className="text-blue-600 hover:text-blue-800 transition-colors flex items-center text-sm"
                      title="Download"
                    >
                      <i className="fas fa-download mr-1"></i> Download
                    </button>
                  )}
                </div>
              </div>
              
              <div className="p-6">
                {renderPreview()}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to get file type icon (copied from DocumentList for consistency)
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

// Helper function to format file size (copied from DocumentList for consistency)
const formatFileSize = (size) => {
  if (!size) return '0 KB';
  
  const sizeInKB = size / 1024;
  if (sizeInKB < 1024) return `${Math.round(sizeInKB)} KB`;
  return `${(sizeInKB / 1024).toFixed(2)} MB`;
};

export default DocumentPreview;