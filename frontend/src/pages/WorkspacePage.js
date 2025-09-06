import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import WorkspaceSidebar from '../components/workspace/WorkspaceSidebar';
import MemberList from '../components/members/MemberList';
import InviteMemberModal from '../components/members/InviteMemberModal';
import PermissionGuard from '../components/permissions/PermissionGuard';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { useDocuments } from '../hooks/useDocuments';
import { useInvitations } from '../hooks/useInvitations';
import { useAuth } from '../hooks/useAuth';
import {
  FolderIcon,
  DocumentIcon,
  UserPlusIcon,
  CogIcon,
  ChartBarIcon,
  CalendarIcon,
  ClockIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  StarIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import {
  StarIcon as StarIconSolid
} from '@heroicons/react/24/solid';

const WorkspacePage = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    currentWorkspace,
    workspaces, // Add this for list view
    isLoading: workspaceLoading,
    hasError: workspaceError,
    fetchWorkspace,
    fetchWorkspaces, // Add this for list view
    getUserRole,
    getUserPermissions,
    getWorkspaceById
  } = useWorkspaces();

  const {
    workspaceDocuments,
    workspaceStats,
    recentActivity,
    popularDocuments,
    loading: documentsLoading,
    searchQuery,
    setSearchQuery,
    fetchWorkspaceDocuments,
    fetchWorkspaceStats,
    fetchRecentActivity,
    fetchPopularDocuments,
    toggleFavorite
  } = useDocuments(workspaceId);

  // Add this debugging right after the useDocuments call
  console.log('🔍 WorkspacePage Debug:', {
    workspaceId,
    workspaceDocuments,
    documentsCount: workspaceDocuments?.length || 0,
    documentsLoading
  });


  const {
    workspaceInvitations,
    isLoading: invitationsLoading,
    fetchWorkspaceInvitations,
    sendInvitation
  } = useInvitations();

  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

  // Get user role and permissions for current workspace
  const userRole = getUserRole(workspaceId);
  const userPermissions = getUserPermissions(workspaceId);

  // Load data based on whether we're in list or detail view
  useEffect(() => {
    if (workspaceId && workspaceId !== ':workspaceId' && workspaceId !== 'undefined') {
      // Detail view - load specific workspace data
      console.log('Fetching data for valid workspaceId:', workspaceId);

      fetchWorkspace(workspaceId);
      fetchWorkspaceDocuments(workspaceId);
      fetchWorkspaceStats(workspaceId);
      fetchRecentActivity(workspaceId);
      fetchPopularDocuments(workspaceId);
      fetchWorkspaceInvitations(workspaceId);
    } else if (!workspaceId) {
      // List view - load all workspaces
      console.log('loading workspaces list view');
      fetchWorkspaces();
    } else {
      console.error('Invalid workspaceId:', workspaceId);
      navigate('/dashboard');
    }
  }, [workspaceId, fetchWorkspace, fetchWorkspaces, fetchWorkspaceDocuments, fetchWorkspaceStats, fetchRecentActivity, fetchPopularDocuments, fetchWorkspaceInvitations, navigate]);

  useEffect(() => {
    if (workspaceId && workspaceId !== ':workspaceId' && workspaceId !== 'undefined') {
      console.log('🔄 Loading workspace data for:', workspaceId);

      const loadWorkspaceData = async () => {
        try {
          // Load workspace info
          console.log('📍 Fetching workspace info...');
          await fetchWorkspace(workspaceId);

          // Load documents - this is the main fix!
          console.log('📄 Fetching workspace documents...');
          const docsResult = await fetchWorkspaceDocuments(workspaceId);
          console.log('📄 Documents result:', docsResult);

          // Load stats and activity
          console.log('📊 Fetching stats and activity...');
          await Promise.allSettled([
            fetchWorkspaceStats(workspaceId),
            fetchRecentActivity(workspaceId),
            fetchPopularDocuments(workspaceId),
            fetchWorkspaceInvitations(workspaceId)
          ]);

          console.log('✅ All workspace data loaded successfully');

        } catch (error) {
          console.error('❌ Error loading workspace data:', error);
          // Don't redirect on error, just log it
        }
      };

      loadWorkspaceData();
    }
  }, [workspaceId, fetchWorkspace, fetchWorkspaceDocuments, fetchWorkspaceStats, fetchRecentActivity, fetchPopularDocuments, fetchWorkspaceInvitations]);


  useEffect(() => {
    console.log('📊 Document State Update:', {
      workspaceId,
      documentsArray: workspaceDocuments,
      isArray: Array.isArray(workspaceDocuments),
      length: workspaceDocuments?.length || 0,
      firstDoc: workspaceDocuments?.[0]?.filename || 'No documents'
    });
  }, [workspaceId, workspaceDocuments]);

  useEffect(() => {
    if (workspaceId && workspaceId !== ':workspaceId' && workspaceId !== 'undefined') {
      console.log('🔄 Fetching workspace data for:', workspaceId);

      fetchWorkspace(workspaceId)
        .then(res => console.log('✅ Workspace fetched:', res))
        .catch(err => console.error('❌ Workspace fetch error:', err));

      fetchWorkspaceDocuments(workspaceId)
        .then(res => console.log('📄 Documents fetched successfully:', res))
        .catch(err => console.error('❌ Documents fetch error:', err));

      fetchWorkspaceStats(workspaceId)
        .then(res => console.log('📊 Stats fetched:', res))
        .catch(err => console.error('❌ Stats fetch error:', err));

      fetchRecentActivity(workspaceId)
        .then(res => console.log('🕒 Recent activity fetched:', res))
        .catch(err => console.error('❌ Recent activity fetch error:', err));

      fetchPopularDocuments(workspaceId)
        .then(res => console.log('⭐ Popular documents fetched:', res))
        .catch(err => console.error('❌ Popular documents fetch error:', err));

      fetchWorkspaceInvitations(workspaceId)
        .then(res => console.log('✉️ Invitations fetched:', res))
        .catch(err => console.error('❌ Invitations fetch error:', err));
    } else {
      console.warn('⚠️ Invalid workspaceId:', workspaceId);
    }
  }, [workspaceId]);



  // Handle invitation submission
  const handleInviteSubmit = async (invitationData) => {
    try {
      if (invitationData.invitations) {
        // Bulk invitations
        const results = await Promise.allSettled(
          invitationData.invitations.map(inv => sendInvitation(inv))
        );
        const successful = results.filter(r => r.status === 'fulfilled').length;
        console.log(`${successful} invitations sent successfully`);
      } else {
        // Single invitation
        await sendInvitation(invitationData);
        console.log('Invitation sent successfully');
      }

      // Refresh workspace invitations
      fetchWorkspaceInvitations(workspaceId);
    } catch (error) {
      console.error('Failed to send invitation:', error);
      throw error;
    }
  };
  console.log('🔍 Debug Loading State:', {

    workspaceLoading,
    workspaceId,
    workspaces: workspaces?.length || 0,
    hasWorkspaces: workspaces && workspaces.length > 0
  });

  // Handle loading and error states
  if (workspaceLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // List view - show when no workspaceId
  // List view - show when no workspaceId
  // List view - show when no workspaceId
  if (!workspaceId) {
    console.log('📋 List View Debug:', {
      workspaces: workspaces?.length || 0,
      workspaceLoading,
      workspaceError
    });

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* ✅ Add debugging info in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-2 bg-yellow-100 border rounded text-xs">
              Debug: {workspaces?.length || 0} workspaces loaded, Loading: {workspaceLoading ? 'Yes' : 'No'}
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Workspaces
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                {workspaces?.length || 0} workspaces available
              </p>
            </div>
            <Button
              onClick={() => navigate('/workspaces/create')}
              className="flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Workspace
            </Button>
          </div>

          {/* Workspaces Grid */}
          {workspaces && workspaces.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workspaces.map((workspace) => (
                <Card
                  key={workspace._id}
                  className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/workspaces/${workspace._id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {workspace.name}
                      </h3>
                      {workspace.description && (
                        <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-3">
                          {workspace.description}
                        </p>
                      )}
                    </div>
                    <Badge variant={workspace.isPublic ? 'success' : 'gray'}>
                      {workspace.isPublic ? 'Public' : 'Private'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <div className="flex items-center">
                      <UserPlusIcon className="h-4 w-4 mr-1" />
                      {(workspace.members?.length || 0) + 1} members
                    </div>
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {new Date(workspace.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {workspace.members?.slice(0, 3).map((member) => (
                        <Avatar
                          key={member._id}
                          user={member.user}
                          size="xs"
                        />
                      ))}
                      {workspace.members?.length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-xs text-gray-600 dark:text-gray-300">
                            +{workspace.members.length - 3}
                          </span>
                        </div>
                      )}
                    </div>
                    <Badge variant="primary" className="capitalize">
                      {getUserRole(workspace._id)}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FolderIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No workspaces yet
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Get started by creating your first workspace.
              </p>
              <Button onClick={() => navigate('/workspaces/create')}>
                Create Workspace
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }
  console.log('User permissions for this workspace:', userPermissions);
  console.log('User role:', userRole);
  console.log('🔐 Permission Debug Info:');
  console.log('- workspaceId:', workspaceId);
  console.log('- userRole:', userRole);
  console.log('- userPermissions:', userPermissions);
  console.log('- currentWorkspace:', currentWorkspace);
  console.log('- user:', user);

  // Detail view error handling
  if (workspaceError || !currentWorkspace) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center p-6">
          <div className="text-red-600 mb-4">
            <FolderIcon className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Workspace Not Found
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {workspaceError || "The workspace you're looking for doesn't exist or you don't have access to it."}
          </p>
          <div className="flex space-x-3 justify-center">
            <Button variant="outline" onClick={() => navigate('/workspaces')}>
              Back to Workspaces
            </Button>
            <Button onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  console.log('🕵️‍♂️ documentsLoading:', documentsLoading);
  console.log('🕵️‍♂️ workspaceDocuments array:', workspaceDocuments);
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };



  const handleDownloadDocument = async (doc) => {
    try {
      // Replace with your actual API endpoint
      const response = await fetch(`/api/workspaces/${workspaceId}/documents/${doc._id}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`, // Adjust based on your auth
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      // Get the filename from response headers or use doc filename
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = doc.filename || doc.originalName || doc.name || 'download';

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]*)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('✅ Document downloaded successfully:', filename);

    } catch (error) {
      console.error('❌ Download error:', error);
      alert(`Failed to download document: ${error.message}`);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentWorkspace.name}
              </h1>
              <Badge variant={currentWorkspace.isPublic ? 'success' : 'gray'}>
                {currentWorkspace.isPublic ? 'Public' : 'Private'}
              </Badge>
              <Badge variant="primary" className="capitalize">
                {userRole}
              </Badge>
            </div>
            {currentWorkspace.description && (
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {currentWorkspace.description}
              </p>
            )}
            <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1" />
                Created {formatDate(currentWorkspace.createdAt)}
              </div>
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-1" />
                Updated {formatDate(currentWorkspace.updatedAt)}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/workspaces')}
            >
              ← Back to Workspaces
            </Button>
            <PermissionGuard permissions={['invite']} workspaceId={workspaceId}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInviteModal(true)}
                className="flex items-center"
              >
                <UserPlusIcon className="h-4 w-4 mr-2" />
                Invite Members
              </Button>
            </PermissionGuard>
            <PermissionGuard permissions={['admin']} workspaceId={workspaceId}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/workspaces/${workspaceId}/settings`)}
              >
                <CogIcon className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </PermissionGuard>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <DocumentIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Documents</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {workspaceStats?.totalDocuments || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <FolderIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Storage Used</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatFileSize(workspaceStats?.totalSize || 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <UserPlusIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Members</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {(currentWorkspace.members?.length || 0) + 1}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">This Month</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {workspaceStats?.documentsThisMonth || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Documents and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Documents */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Documents
            </h3>
            <Link
              to={`/workspaces/${workspaceId}/documents`}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {workspaceDocuments?.slice(0, 5).map((doc) => (
              <div key={doc._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center flex-1">
                  <DocumentIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {doc.filename}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(doc.uploadDate)} • {formatFileSize(doc.size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('🔍 View button clicked');
                      console.log('🔍 Current permissions check:');
                      console.log('- Has read permission?', userPermissions?.canView); // ← Fixed: use canView instead of includes
                      console.log('- All permissions:', userPermissions);
                      console.log('- User role:', userRole);

                      // Try navigation anyway to see what happens
                      navigate(`/workspaces/${workspaceId}/documents/${doc._id}`);
                    }}
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {(!workspaceDocuments || workspaceDocuments.length === 0) && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <DocumentIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No documents yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => navigate(`/workspaces/${workspaceId}/upload`)}
                >
                  Upload First Document
                </Button>
              </div>

            )}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            {recentActivity?.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <Avatar
                  user={activity.user}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <span className="font-medium">{activity.user?.name}</span>
                    <span className="text-gray-600 dark:text-gray-300"> {activity.action}</span>
                    {activity.document && (
                      <span className="font-medium"> "{activity.document.filename}"</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            {(!recentActivity || recentActivity.length === 0) && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <ClockIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
  const renderDocumentsTab = () => {
    return (
      <div className="space-y-6">
        {/* Documents Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Documents ({workspaceDocuments.length})
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Manage documents in this workspace
            </p>
          </div>
          <PermissionGuard permissions={['write']} workspaceId={workspaceId}>
            <Button onClick={() => navigate(`/workspaces/${workspaceId}/upload`)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </PermissionGuard>
        </div>

        {/* Documents Grid/List */}
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
        }>
          {workspaceDocuments.map((doc) => (
            <Card key={doc._id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">
                    {doc.filename || doc.originalName || doc.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {formatFileSize(doc.size)} • {formatDate(doc.uploadDate || doc.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => toggleFavorite(doc._id)}
                  className="text-gray-400 hover:text-yellow-500"
                >
                  {doc.isFavorite ? (
                    <StarIconSolid className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <StarIcon className="h-5 w-5" />
                  )}
                </button>
              </div>

              {doc.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                  {doc.description}
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {doc.category && (
                    <Badge variant="secondary" size="sm">
                      {doc.category}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/workspaces/${workspaceId}/documents/${doc._id}`)}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadDocument(doc)}  // ← Use the same handler!
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };


  const renderMembersTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Members
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            {(currentWorkspace.members?.length || 0) + 1} members in this workspace
          </p>
        </div>
        <PermissionGuard permissions={['invite']} workspaceId={workspaceId}>
          <Button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center"
          >
            <UserPlusIcon className="h-4 w-4 mr-2" />
            Invite Members
          </Button>
        </PermissionGuard>
      </div>

      <MemberList
        members={currentWorkspace.members || []}
        workspaceId={workspaceId}
        currentUserRole={userRole}
        isLoading={workspaceLoading}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <WorkspaceSidebar
          workspace={currentWorkspace?.workspace || currentWorkspace}
          userRole={userRole}
          userPermissions={userPermissions}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main Content */}
        <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'
          }`}>
          <div className="p-6">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'overview', name: 'Overview', icon: ChartBarIcon },
                  { id: 'documents', name: 'Documents', icon: DocumentIcon },
                  { id: 'members', name: 'Members', icon: UserPlusIcon }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                  >
                    <tab.icon className="h-4 w-4 mr-2" />
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'documents' && renderDocumentsTab()}
            {activeTab === 'members' && renderMembersTab()}
          </div>
        </div>
      </div>

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSendInvitation={handleInviteSubmit}
        workspace={currentWorkspace}  // ✅ CORRECT - 'currentWorkspace' is defined
        isLoading={invitationsLoading}
      />
    </div>
  );
};

export default WorkspacePage;