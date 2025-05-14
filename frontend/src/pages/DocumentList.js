import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/apiService';

const DocumentList = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!user) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Add request logging
        console.log('Fetching documents from API...');
        const response = await apiService.documentApi.getAllDocuments();
        console.log('Raw API response:', response); // Debug log
        
        // Normalized document parsing function
        const normalizeDocuments = (responseData) => {
          if (!responseData) return [];
          
          // Handle different response formats
          let docs = [];
          if (Array.isArray(responseData)) {
            docs = responseData;
          } else if (responseData && Array.isArray(responseData.data)) {
            docs = responseData.data;
          } else if (responseData && responseData.data && Array.isArray(responseData.data.documents)) {
            docs = responseData.data.documents;
          } else if (responseData && responseData.documents && Array.isArray(responseData.documents)) {
            docs = responseData.documents;
          } else if (responseData && typeof responseData === 'object') {
            // If it's an object but not in expected format, try to extract values
            // Filter out non-document objects (like success messages, metadata, etc.)
            docs = Object.values(responseData).filter(item => 
              item && typeof item === 'object' && (item.name || item.fileName)
            );
          }
          
          // Normalize document objects to have consistent properties
          return docs.map(doc => {
            if (!doc) return null;
            
            return {
              id: doc._id || doc.id || '',
              name: doc.name || doc.fileName || 'Unnamed Document',
              type: doc.type || doc.fileType || doc.mimeType || 'Unknown',
              size: doc.size || doc.fileSize || 0,
              uploadDate: doc.uploadDate || doc.createdAt || doc.dateUploaded || new Date(),
              owner: doc.owner || doc.userId || doc.ownerId || '',
            };
          }).filter(Boolean); // Remove null entries
        };
        
        const normalizedDocs = normalizeDocuments(response);
        console.log('Normalized documents:', normalizedDocs); // Debug log
        
        setDocuments(normalizedDocs);
      } catch (error) {
        console.error('Error fetching documents:', error);
        setError('Failed to load documents. Please try again later.');
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [user]);

  useEffect(() => {
    if (Array.isArray(documents)) {
      const filtered = documents.filter(doc => 
        doc && doc.name && doc.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDocuments(filtered);
    } else {
      setFilteredDocuments([]);
    }
  }, [searchTerm, documents]);

  const handleDeleteDocument = async (documentId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        console.log(`Deleting document with ID: ${documentId}`);
        await apiService.documentApi.deleteDocument(documentId);
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        alert('Document deleted successfully');
      } catch (error) {
        console.error('Error deleting document:', error);
        alert('Failed to delete document. Please try again.');
      }
    }
  };

  const handleDownloadDocument = async (documentId, documentName) => {
    try {
      console.log(`Downloading document with ID: ${documentId}`);
      const response = await apiService.documentApi.downloadDocument(documentId);
      
      // Check if the response has a data property that contains the blob
      const blobData = response.data || response;
      
      // Ensure we have a Blob object
      const blob = blobData instanceof Blob ? blobData : new Blob([blobData]);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', documentName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document. Please try again.');
    }
  };

  // Function to display file sizes in a more readable format
  const formatFileSize = (size) => {
    if (!size) return '0 KB';
    
    const sizeInKB = size / 1024;
    if (sizeInKB < 1024) return `${Math.round(sizeInKB)} KB`;
    return `${(sizeInKB / 1024).toFixed(2)} MB`;
  };

  // Function to get file type icon class based on document type
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

  // Function to check document ownership - safely handle different id formats
  const isOwner = (doc) => {
    const docOwner = doc.owner || '';
    const userId = user?.id || user?._id || '';
    return docOwner === userId;
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">Document Library</h1>
          <Link 
            to="/documents/upload" 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium shadow-md hover:bg-blue-700 transition-colors duration-200 flex items-center"
          >
            <i className="fas fa-upload mr-2"></i>
            Upload Document
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input 
                type="text" 
                placeholder="Search documents..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {error && (
            <div className="mx-6 my-4 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded">
              <div className="flex items-center">
                <i className="fas fa-exclamation-circle mr-2"></i>
                <p>{error}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
              <p className="ml-3 text-gray-600">Loading documents...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Document</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Size</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDocuments.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center">
                        {loading ? (
                          <p className="text-gray-500">Loading documents...</p>
                        ) : documents.length === 0 ? (
                          <div className="flex flex-col items-center">
                            <i className="far fa-folder-open text-gray-300 text-5xl mb-4"></i>
                            <p className="text-gray-500 mb-2">No documents found</p>
                            <Link 
                              to="/documents/upload" 
                              className="text-blue-500 hover:text-blue-700 font-medium"
                            >
                              Upload your first document
                            </Link>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <i className="fas fa-search text-gray-300 text-5xl mb-4"></i>
                            <p className="text-gray-500">No documents match your search</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredDocuments.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <i className={`${getFileTypeIcon(doc.type)} text-xl mr-3`}></i>
                            <div className="text-sm font-medium text-gray-900">{doc.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            {doc.type || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatFileSize(doc.size)}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          <div className="flex space-x-3">
                            <button 
                              onClick={() => handleDownloadDocument(doc.id, doc.name)}
                              className="text-blue-600 hover:text-blue-800 transition-colors flex items-center"
                              title="Download"
                            >
                              <i className="fas fa-download mr-1"></i> Download
                            </button>
                            {(isOwner(doc) || user?.role === 'admin') && (
                              <button 
                                onClick={() => handleDeleteDocument(doc.id)}
                                className="text-red-500 hover:text-red-700 transition-colors flex items-center"
                                title="Delete"
                              >
                                <i className="fas fa-trash-alt mr-1"></i> Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentList;