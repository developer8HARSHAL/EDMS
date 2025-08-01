import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  DocumentIcon, 
  CloudArrowUpIcon, 
  UsersIcon, 
  ClockIcon,
  ArrowUpTrayIcon 
} from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import { documentApi } from '../services/apiService';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { StatCard } from '../pages/StatCard'; 

const Dashboard = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({
    totalDocs: '0',
    uploads: '0',
    shared: '0',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to safely extract documents from API response
  const extractDocumentsFromResponse = (response) => {
    if (!response) {
      console.warn('Received null/undefined response');
      return [];
    }
    
    // Handle case where we already have an array
    if (Array.isArray(response)) {
      return response;
    }
    
    // Try to extract from response.data
    if (response.data) {
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      if (response.data.documents && Array.isArray(response.data.documents)) {
        return response.data.documents;
      }
    }
    
    // Try to extract from response.documents
    if (response.documents && Array.isArray(response.documents)) {
      return response.documents;
    }
    
    // Handle the correct API response format based on documentController.js
    if (response.success && response.data && Array.isArray(response.data)) {
      return response.data;
    }
    
    console.warn('Could not extract documents from response, returning empty array');
    return [];
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
    
      try {
        console.log('Fetching dashboard data...');
        
        // Fetch all documents
        let allDocs = [];
        let sharedDocs = [];
        
        try {
          const allDocsResponse = await documentApi.getAllDocuments();
          console.log('All documents API response:', allDocsResponse);
          allDocs = extractDocumentsFromResponse(allDocsResponse);
        } catch (docError) {
          console.error('Error fetching all documents:', docError);
        }
        
        try {
          const sharedDocsResponse = await documentApi.getSharedDocuments();
          console.log('Shared documents API response:', sharedDocsResponse);
          sharedDocs = extractDocumentsFromResponse(sharedDocsResponse);
        } catch (sharedError) {
          console.error('Error fetching shared documents:', sharedError);
        }
        
        // Calculate stats
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        
        const uploadsThisMonth = allDocs.filter(doc => {
          if (!doc) return false;
          const docDate = new Date(doc.uploadDate || doc.createdAt || Date.now());
          return docDate.getMonth() === thisMonth && 
                 docDate.getFullYear() === thisYear;
        });
        
        // Set statistics
        setStats({
          totalDocs: allDocs.length.toString(),
          uploads: uploadsThisMonth.length.toString(),
          shared: sharedDocs.length.toString(),
        });
        
        // Get 5 most recent documents for display
        const recentDocs = [...allDocs]
          .filter(doc => doc)
          .sort((a, b) => {
            const dateA = new Date(a.uploadDate || a.createdAt || 0);
            const dateB = new Date(b.uploadDate || b.createdAt || 0);
            return dateB - dateA;
          })
          .slice(0, 5);
        
        console.log('Recent docs for display:', recentDocs.length);
        setDocuments(recentDocs);
        
        if (allDocs.length === 0 && recentDocs.length === 0) {
          console.log('No documents found. This may be normal for new users.');
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again later.");
        setDocuments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDownload = async (docId, docName) => {
    try {
      console.log(`Attempting to download document: ${docName} (ID: ${docId})`);
      const response = await documentApi.downloadDocument(docId);
      
      const blobData = response.data || response;
      const blob = new Blob([blobData]);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', docName || 'document');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      console.log(`Document download successful: ${docName}`);
    } catch (err) {
      console.error("Error downloading document:", err);
      alert("Failed to download document. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome, {user?.name || 'User'}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Here's an overview of your document management system
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="error">
              {error}
            </Alert>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Documents"
              stat={stats.totalDocs}
              icon={DocumentIcon}
              description="Files in your repository"
              isLoading={isLoading}
            />
            <StatCard
              title="Uploads This Month"
              stat={stats.uploads}
              icon={CloudArrowUpIcon}
              description="New documents added"
              isLoading={isLoading}
            />
            <StatCard
              title="Shared With Me"
              stat={stats.shared}
              icon={UsersIcon}
              description="Documents shared by others"
              isLoading={isLoading}
            />
            <StatCard
              title="Recent Activity"
              stat={isLoading ? "0" : documents.length.toString()}
              icon={ClockIcon}
              description="Documents recently accessed"
              isLoading={isLoading}
            />
          </div>

          {/* Recent Documents */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Recent Documents
                </h2>
                <Button
                  as={RouterLink}
                  to="/documents"
                  variant="outline"
                  size="sm"
                  leftIcon={<DocumentIcon className="h-4 w-4" />}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {documents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-sm">
                          Document Name
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-sm">
                          Type
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-sm">
                          Created
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-sm">
                          Size
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-sm">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        [...Array(5)].map((_, i) => (
                          <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                            <td className="py-4 px-4">
                              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        documents.map((doc) => {
                          const docId = doc._id || doc.id;
                          if (!docId) return null;
                          
                          return (
                            <tr key={docId} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                              <td className="py-4 px-4">
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {doc.name || 'Unnamed Document'}
                                </div>
                              </td>
                              <td className="py-4 px-4 text-gray-500 dark:text-gray-400">
                                {doc.type || 'Unknown'}
                              </td>
                              <td className="py-4 px-4 text-gray-500 dark:text-gray-400">
                                {new Date(doc.uploadDate || doc.createdAt || Date.now()).toLocaleDateString()}
                              </td>
                              <td className="py-4 px-4 text-gray-500 dark:text-gray-400">
                                {formatFileSize(doc.size)}
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex space-x-2">
                                  <Button
                                    as={RouterLink}
                                    to={`/documents/preview/${docId}`}
                                    size="sm"
                                    variant="outline"
                                  >
                                    View
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDownload(docId, doc.name)}
                                  >
                                    Download
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        }).filter(Boolean)
                      )}
                    </tbody>
                  </table>
                </div>
              ) : !isLoading ? (
                <div className="text-center py-12">
                  <DocumentIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No documents found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Get started by uploading your first document
                  </p>
                  <Button
                    as={RouterLink}
                    to="/documents/upload"
                    leftIcon={<ArrowUpTrayIcon className="h-4 w-4" />}
                  >
                    Upload Your First Document
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Bottom Grid - Quick Actions & Storage */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Quick Actions
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    as={RouterLink}
                    to="/documents/upload"
                    className="w-full justify-start"
                    leftIcon={<ArrowUpTrayIcon className="h-4 w-4" />}
                  >
                    Upload New Document
                  </Button>
                  <Button
                    as={RouterLink}
                    to="/documents"
                    variant="outline"
                    className="w-full justify-start"
                    leftIcon={<DocumentIcon className="h-4 w-4" />}
                  >
                    View All Documents
                  </Button>
                  <Button
                    as={RouterLink}
                    to="/profile"
                    variant="outline"
                    className="w-full justify-start"
                    leftIcon={<UsersIcon className="h-4 w-4" />}
                  >
                    Edit Profile Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Storage Usage */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Storage Usage
                </h3>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      You are currently using{" "}
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {calculateStorageUsage(documents)}
                      </span>{" "}
                      of your available storage.
                    </p>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-primary-500 h-3 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${calculateStoragePercentage(documents)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {calculateStoragePercentage(documents).toFixed(1)}% of 1GB used
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions
const formatFileSize = (bytes) => {
  if (!bytes) return '0 KB';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round(bytes / Math.pow(1024, i))} ${sizes[i]}`;
};

const calculateStorageUsage = (documents) => {
  const totalBytes = documents.reduce((acc, doc) => acc + (doc.size || 0), 0);
  return formatFileSize(totalBytes);
};

const calculateStoragePercentage = (documents) => {
  const limit = 1 * 1024 * 1024 * 1024; // 1GB in bytes
  const used = documents.reduce((acc, doc) => acc + (doc.size || 0), 0);
  const percentage = (used / limit) * 100;
  return Math.min(percentage, 100);
};

export default Dashboard;