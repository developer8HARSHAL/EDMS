// frontend/src/pages/Dashboard.js - Enhanced with Workspace Integration
import React, { useState, useEffect, useMemo } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { 
  DocumentIcon, 
  CloudArrowUpIcon, 
  UsersIcon, 
  ClockIcon,
  ArrowUpTrayIcon,
  PlusIcon,
  FolderIcon,
  UserGroupIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  BellIcon,
  StarIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { useDocuments } from '../hooks/useDocuments';
import { useInvitations } from '../hooks/useInvitations';
import { documentApi } from '../services/apiService';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { StatCard } from '../pages/StatCard';
import WorkspaceCard from '../components/workspace/WorkspaceCard';
import CreateWorkspaceModal from '../components/workspace/CreateWorkspaceModal';
import WorkspaceSelector from '../components/workspace/WorkspaceSelector';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import {Input} from '../components/ui/Input';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { 
  workspaces, 
  loading: workspacesLoading, 
  fetchWorkspaces,  // ✅ Direct access instead of operations.fetchWorkspaces
  createWorkspace,  // ✅ Direct access instead of operations.createWorkspace
  getUserRole,
  getUserPermissions
} = useWorkspaces();

  const { 
    pendingInvitations, 
    fetchPendingInvitations,
    acceptInvitation 
  } = useInvitations();

  // Original document state
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({
    totalDocs: '0',
    uploads: '0',
    shared: '0',
    workspaces: '0'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // New workspace state
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [workspaceSearch, setWorkspaceSearch] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // overview, workspaces, activity
  const [recentActivity, setRecentActivity] = useState([]);

  // Helper function to safely extract documents from API response
  const extractDocumentsFromResponse = (response) => {
    if (!response) {
      console.warn('Received null/undefined response');
      return [];
    }
    
    if (Array.isArray(response)) return response;
    if (response.data) {
      if (Array.isArray(response.data)) return response.data;
      if (response.data.documents && Array.isArray(response.data.documents)) {
        return response.data.documents;
      }
    }
    if (response.documents && Array.isArray(response.documents)) {
      return response.documents;
    }
    if (response.success && response.data && Array.isArray(response.data)) {
      return response.data;
    }
    
    console.warn('Could not extract documents from response, returning empty array');
    return [];
  };

  // ✅ FIXED: Updated fetchData to use operations.fetchWorkspaces
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
    
      try {
        console.log('Fetching dashboard data...');
        
        // Fetch documents
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
        
        // ✅ FIXED: Use operations.fetchWorkspaces
        await Promise.all([
           fetchWorkspaces(), 
          fetchPendingInvitations()
        ]);
        
        // Calculate stats
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        
        const uploadsThisMonth = allDocs.filter(doc => {
          if (!doc) return false;
          const docDate = new Date(doc.uploadDate || doc.createdAt || Date.now());
          return docDate.getMonth() === thisMonth && 
                 docDate.getFullYear() === thisYear;
        });
        
        setStats({
          totalDocs: allDocs.length.toString(),
          uploads: uploadsThisMonth.length.toString(),
          shared: sharedDocs.length.toString(),
          workspaces: workspaces.length.toString()
        });
        
        // Get recent documents
        const recentDocs = [...allDocs]
          .filter(doc => doc)
          .sort((a, b) => {
            const dateA = new Date(a.uploadDate || a.createdAt || 0);
            const dateB = new Date(b.uploadDate || b.createdAt || 0);
            return dateB - dateA;
          })
          .slice(0, 5);
        
        setDocuments(recentDocs);
        
        // Generate recent activity
        setRecentActivity(generateRecentActivity(allDocs, workspaces));
        
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again later.");
        setDocuments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [fetchWorkspaces, fetchPendingInvitations]); // ✅ FIXED: Updated dependency

  // Update stats when workspaces change
  useEffect(() => {
    setStats(prev => ({
      ...prev,
      workspaces: workspaces.length.toString()
    }));
  }, [workspaces]);

  // Filter workspaces based on search
  const filteredWorkspaces = useMemo(() => {
    if (!workspaceSearch) return workspaces.slice(0, 6);
    return workspaces.filter(workspace =>
      workspace.name.toLowerCase().includes(workspaceSearch.toLowerCase()) ||
      workspace.description?.toLowerCase().includes(workspaceSearch.toLowerCase())
    ).slice(0, 6);
  }, [workspaces, workspaceSearch]);

  // Generate recent activity data
  const generateRecentActivity = (docs, workspaces) => {
    const activities = [];
    
    // Recent document uploads
    docs.slice(0, 3).forEach(doc => {
      activities.push({
        type: 'document_upload',
        title: `Uploaded "${doc.name}"`,
        time: new Date(doc.uploadDate || doc.createdAt),
        icon: DocumentIcon,
        color: 'blue'
      });
    });
    
    // Recent workspace joins
    workspaces.slice(0, 2).forEach(workspace => {
      activities.push({
        type: 'workspace_join',
        title: `Joined workspace "${workspace.name}"`,
        time: new Date(workspace.joinedAt || workspace.createdAt),
        icon: BuildingOfficeIcon,
        color: 'green'
      });
    });
    
    return activities.sort((a, b) => b.time - a.time).slice(0, 5);
  };

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

  const handleAcceptInvitation = async (invitationId) => {
    try {
      await acceptInvitation(invitationId);
     await fetchWorkspaces();// ✅ FIXED: Use operations.fetchWorkspaces
    } catch (err) {
      console.error("Error accepting invitation:", err);
    }
  };

  // ✅ NEW: Handle workspace creation
  const handleCreateWorkspace = async (workspaceData) => {
    try {
      console.log('Creating workspace:', workspaceData);
    await createWorkspace(workspaceData);
      
      // Refresh workspaces after creation
      await fetchWorkspaces();

      
      // Close modal
      setShowCreateModal(false);
      
      console.log('Workspace created successfully');
    } catch (error) {
      console.error('Failed to create workspace:', error);
      // Re-throw the error so the modal can handle it
      throw error;
    }
  };

  const TabButton = ({ id, label, icon: Icon, active, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        active
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
          : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
      }`}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome back, {user?.name || 'User'}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Here's what's happening in your workspaces today
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={() => setShowCreateModal(true)}
                leftIcon={<PlusIcon className="h-4 w-4" />}
              >
                New Workspace
              </Button>
              <Button
                as={RouterLink}
                to="/documents/upload"
                variant="outline"
                leftIcon={<ArrowUpTrayIcon className="h-4 w-4" />}
              >
                Upload Document
              </Button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="error">
              {error}
            </Alert>
          )}

          {/* Pending Invitations */}
          {pendingInvitations && pendingInvitations.length > 0 && (
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <BellIcon className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100">
                        You have {pendingInvitations.length} pending workspace invitation{pendingInvitations.length > 1 ? 's' : ''}
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Review and accept to join new workspaces
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/invitations')}
                  >
                    Review Invitations
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Tabs */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <TabButton
              id="overview"
              label="Overview"
              icon={ChartBarIcon}
              active={activeTab === 'overview'}
              onClick={setActiveTab}
            />
            <TabButton
              id="workspaces"
              label="Workspaces"
              icon={BuildingOfficeIcon}
              active={activeTab === 'workspaces'}
              onClick={setActiveTab}
            />
            <TabButton
              id="activity"
              label="Recent Activity"
              icon={ClockIcon}
              active={activeTab === 'activity'}
              onClick={setActiveTab}
            />
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Documents"
                  stat={stats.totalDocs}
                  icon={DocumentIcon}
                  description="Files across all workspaces"
                  isLoading={isLoading}
                />
                <StatCard
                  title="My Workspaces"
                  stat={stats.workspaces}
                  icon={BuildingOfficeIcon}
                  description="Active collaborative spaces"
                  isLoading={workspacesLoading}
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
                              Workspace
                            </th>
                            <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-sm">
                              Type
                            </th>
                            <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-sm">
                              Created
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
                                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
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
                              
                              const workspace = workspaces.find(w => w._id === doc.workspace);
                              
                              return (
                                <tr key={docId} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                  <td className="py-4 px-4">
                                    <div className="font-medium text-gray-900 dark:text-white">
                                      {doc.name || 'Unnamed Document'}
                                    </div>
                                  </td>
                                  <td className="py-4 px-4">
                                    <Badge variant="outline" size="sm">
                                      {workspace?.name || 'Personal'}
                                    </Badge>
                                  </td>
                                  <td className="py-4 px-4 text-gray-500 dark:text-gray-400">
                                    {doc.type || 'Unknown'}
                                  </td>
                                  <td className="py-4 px-4 text-gray-500 dark:text-gray-400">
                                    {new Date(doc.uploadDate || doc.createdAt || Date.now()).toLocaleDateString()}
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
            </>
          )}

          {activeTab === 'workspaces' && (
            <>
              {/* Workspace Search */}
              <div className="flex justify-between items-center">
                <div className="flex-1 max-w-md">
                  <Input
                    placeholder="Search workspaces..."
                    value={workspaceSearch}
                    onChange={(e) => setWorkspaceSearch(e.target.value)}
                    leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
                  />
                </div>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  leftIcon={<PlusIcon className="h-4 w-4" />}
                >
                  Create Workspace
                </Button>
              </div>

              {/* Workspaces Grid */}
              {workspacesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                  ))}
                </div>
              ) : filteredWorkspaces.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredWorkspaces.map((workspace) => (
                    <WorkspaceCard
                      key={workspace._id}
                      workspace={workspace}
                      userRole={getUserRole(workspace._id)}
                      onClick={() => navigate(`/workspaces/${workspace._id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BuildingOfficeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {workspaceSearch ? 'No workspaces found' : 'No workspaces yet'}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    {workspaceSearch 
                      ? 'Try adjusting your search terms'
                      : 'Create your first workspace to start collaborating'
                    }
                  </p>
                  {!workspaceSearch && (
                    <Button
                      onClick={() => setShowCreateModal(true)}
                      leftIcon={<PlusIcon className="h-4 w-4" />}
                    >
                      Create Your First Workspace
                    </Button>
                  )}
                </div>
              )}

              {/* Show more workspaces link */}
              {workspaces.length > 6 && !workspaceSearch && (
                <div className="text-center">
                  <Button
                    as={RouterLink}
                    to="/workspaces"
                    variant="outline"
                  >
                    View All Workspaces ({workspaces.length})
                  </Button>
                </div>
              )}
            </>
          )}

          {activeTab === 'activity' && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Recent Activity
                </h2>
              </CardHeader>
              <CardContent>
                {recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => {
                      const Icon = activity.icon;
                      return (
                        <div key={index} className="flex items-center space-x-4">
                          <div className={`p-2 rounded-lg bg-${activity.color}-100 dark:bg-${activity.color}-900/20`}>
                            <Icon className={`h-5 w-5 text-${activity.color}-600 dark:text-${activity.color}-400`} />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {activity.title}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {activity.time.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ClockIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Bottom Grid - Quick Actions & Storage (shown on overview tab) */}
          {activeTab === 'overview' && (
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
                      onClick={() => setShowCreateModal(true)}
                      className="w-full justify-start"
                      leftIcon={<PlusIcon className="h-4 w-4" />}
                    >
                      Create New Workspace
                    </Button>
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
                      to="/workspaces"
                      variant="outline"
                      className="w-full justify-start"
                      leftIcon={<BuildingOfficeIcon className="h-4 w-4" />}
                    >
                      Browse All Workspaces
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
                        across {stats.workspaces} workspace{stats.workspaces !== '1' ? 's' : ''}.
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
          )}
        </div>
      </div>

      {/* ✅ FIXED: Create Workspace Modal with correct props */}
      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateWorkspace={handleCreateWorkspace}
        isLoading={workspacesLoading.createWorkspace || false}
      />
    </div>
  );
};

// Helper functions (unchanged)
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