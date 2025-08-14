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
  StarIcon
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
    isLoading: workspaceLoading,
    hasError: workspaceError,
    fetchWorkspace,
    getUserRole,
    getUserPermissions,
    getWorkspaceById
  } = useWorkspaces();

  const {
    workspaceDocuments,
    workspaceStats,
    recentActivity,
    popularDocuments,
    isLoading: documentsLoading,
    searchQuery,
    setSearchQuery,
    fetchWorkspaceDocuments,
    fetchWorkspaceStats,
    fetchRecentActivity,
    fetchPopularDocuments,
    toggleFavorite
  } = useDocuments();

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

  // Load workspace data
  useEffect(() => {
    if (workspaceId) {
      fetchWorkspace(workspaceId);
      fetchWorkspaceDocuments(workspaceId);
      fetchWorkspaceStats(workspaceId);
      fetchRecentActivity(workspaceId);
      fetchPopularDocuments(workspaceId);
      fetchWorkspaceInvitations(workspaceId);
    }
  }, [workspaceId, fetchWorkspace, fetchWorkspaceDocuments, fetchWorkspaceStats, fetchRecentActivity, fetchPopularDocuments, fetchWorkspaceInvitations]);

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
          <Button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
                  <button
                    onClick={() => toggleFavorite(doc._id)}
                    className="text-gray-400 hover:text-yellow-500"
                  >
                    {doc.isFavorite ? (
                      <StarIconSolid className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <StarIcon className="h-4 w-4" />
                    )}
                  </button>
                  <Link
                    to={`/workspaces/${workspaceId}/documents/${doc._id}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Link>
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

  const renderDocumentsTab = () => (
    <div className="space-y-6">
      {/* Documents Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Documents
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            {workspaceDocuments?.length || 0} documents in this workspace
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
          <PermissionGuard permissions={['write']} workspaceId={workspaceId}>
            <Button
              onClick={() => navigate(`/workspaces/${workspaceId}/upload`)}
            >
              Upload Document
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Documents Grid/List */}
      <div className={viewMode === 'grid' 
        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
        : 'space-y-4'
      }>
        {workspaceDocuments?.map((doc) => (
          <Card key={doc._id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <DocumentIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {doc.filename}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(doc.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleFavorite(doc._id)}
                className="text-gray-400 hover:text-yellow-500"
              >
                {doc.isFavorite ? (
                  <StarIconSolid className="h-4 w-4 text-yellow-500" />
                ) : (
                  <StarIcon className="h-4 w-4" />
                )}
              </button>
            </div>
            
            {doc.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                {doc.description}
              </p>
            )}

            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
              <span>Uploaded {formatDate(doc.uploadDate)}</span>
              <div className="flex items-center">
                <Avatar user={doc.uploadedBy} size="xs" className="mr-1" />
                {doc.uploadedBy?.name}
              </div>
            </div>

            {doc.tags && doc.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {doc.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="gray" size="sm">
                    {tag}
                  </Badge>
                ))}
                {doc.tags.length > 3 && (
                  <Badge variant="gray" size="sm">
                    +{doc.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <Link
                  to={`/workspaces/${workspaceId}/documents/${doc._id}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                >
                  <EyeIcon className="h-4 w-4" />
                </Link>
                <PermissionGuard permissions={['write']} workspaceId={workspaceId}>
                  <button className="text-gray-600 dark:text-gray-400 hover:text-blue-600 text-sm">
                    <ShareIcon className="h-4 w-4" />
                  </button>
                  <button className="text-gray-600 dark:text-gray-400 hover:text-green-600 text-sm">
                    <ArrowDownTrayIcon className="h-4 w-4" />
                  </button>
                </PermissionGuard>
              </div>
              <Badge 
                variant={doc.isPublic ? 'success' : 'gray'} 
                size="sm"
              >
                {doc.isPublic ? 'Public' : 'Private'}
              </Badge>
            </div>
          </Card>
        ))}
      </div>

      {(!workspaceDocuments || workspaceDocuments.length === 0) && (
        <div className="text-center py-12">
          <DocumentIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No documents yet
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Get started by uploading your first document to this workspace.
          </p>
          <PermissionGuard permissions={['write']} workspaceId={workspaceId}>
            <Button onClick={() => navigate(`/workspaces/${workspaceId}/upload`)}>
              Upload Document
            </Button>
          </PermissionGuard>
        </div>
      )}
    </div>
  );

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
          workspace={currentWorkspace}
          userRole={userRole}
          userPermissions={userPermissions}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main Content */}
        <div className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
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
                    className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
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
        workspace={currentWorkspace}
        isLoading={invitationsLoading}
      />
    </div>
  );
};

export default WorkspacePage;