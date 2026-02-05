import React, { useState, useEffect } from 'react';
import {useSelector} from 'react-redux';

import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import { Alert } from '../components/ui/Alert';
import Modal from '../components/ui/Modal';
import MemberList from '../components/members/MemberList';
import InviteMemberModal from '../components/members/InviteMemberModal';
import PermissionGuard from '../components/permissions/PermissionGuard';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { useInvitations } from '../hooks/useInvitations';
import { useAuth } from '../hooks/useAuth';
import {
  CogIcon,
  TrashIcon,
  UserPlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentIcon,
  UsersIcon,
  EnvelopeIcon,
  CalendarIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import {
  selectCurrentWorkspaceId,
  selectWorkspaceStats,
  selectWorkspaceDocuments
} from '../store/slices/documentsSlice';


const WorkspaceSettings = () => {
 const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  console.log('🔍 WorkspaceSettings mounted');
  console.log('📋 workspaceId from params:', workspaceId);
  console.log('👤 user:', user);


  const {
    currentWorkspace,
    isLoading: workspaceLoading,
    hasError: workspaceError,
    fetchWorkspace,
    fetchStats,
    updateWorkspace,
    deleteWorkspace,
    removeMember,
    updateMemberRole,
    leaveWorkspace,
    getUserRole
  } = useWorkspaces();

  const {
    workspaceInvitations,
    invitationStats,
    isLoading: invitationsLoading,
    fetchWorkspaceInvitations,
    cancelInvitation,
    resendInvitation,
    cleanupExpired,
    sendInvitation
  } = useInvitations();
const workspaceStats = useSelector(state => 
  selectWorkspaceStats(state, workspaceId)
);

const documentStats = workspaceStats?.documents || {};
const documentCount = documentStats.total || 0;


  // Extract members from currentWorkspace
  const workspaceMembers = currentWorkspace?.members || [];
  
  // Get user role for this workspace
  const userRole = getUserRole(workspaceId);

  // Local state
  const [activeTab, setActiveTab] = useState('general');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Form state for workspace details
  const [workspaceForm, setWorkspaceForm] = useState({
    name: '',
    description: '',
    isPublic: false
  });

  // Load data on component mount
  useEffect(() => {
    if (workspaceId) {
      fetchWorkspace(workspaceId);
      
      // Try to fetch stats but don't fail if it errors
      fetchStats(workspaceId).catch(err => {
        console.warn('Could not fetch workspace stats:', err);
      });
      
      fetchWorkspaceInvitations(workspaceId);
    }
  }, [workspaceId]);

  // Update form when workspace data loads
  useEffect(() => {
    if (currentWorkspace) {
      setWorkspaceForm({
        name: currentWorkspace.name || '',
        description: currentWorkspace.description || '',
        isPublic: currentWorkspace.isPublic || false
      });
    }
  }, [currentWorkspace]);

  // Check if user has admin permissions
  const isAdmin = userRole === 'admin' || userRole === 'owner';
  const isOwner = userRole === 'owner';

  // Handle workspace update
const handleUpdateWorkspace = async (e) => {
  e.preventDefault();
  if (!isAdmin) return;

  setIsUpdating(true);
  setUpdateSuccess(false); // Clear previous success state
  
  try {
    // ✅ CORRECT: Pass workspaceId and updates as separate parameters
    await updateWorkspace(workspaceId, {
      name: workspaceForm.name,
      description: workspaceForm.description,
      settings: {
        isPublic: workspaceForm.isPublic,
      }
    });

    // ✅ CRITICAL: Refetch workspace to get updated data
    await fetchWorkspace(workspaceId);
    
    // Show success message
    setUpdateSuccess(true);

    // Keep success message visible longer (2 seconds)
    setTimeout(() => setUpdateSuccess(false), 2000);
    
    console.log('✅ Workspace updated successfully');
  } catch (error) {
    console.error('❌ Failed to update workspace:', error);
    // TODO: Add error toast notification here
  } finally {
    setIsUpdating(false);
  }
};
  // Handle workspace deletion
  const handleDeleteWorkspace = async () => {
    if (!isOwner) return;

    try {
      await deleteWorkspace(workspaceId);
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to delete workspace:', error);
    }
  };

  // Handle leaving workspace
  const handleLeaveWorkspace = async () => {
    if (isOwner) return; // Owner cannot leave

    try {
      await leaveWorkspace(workspaceId);
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to leave workspace:', error);
    }
  };

  // Handle invitation actions
  const handleCancelInvitation = async (invitationId) => {
    try {
      await cancelInvitation(invitationId);
      fetchWorkspaceInvitations(workspaceId);
    } catch (error) {
      console.error('Failed to cancel invitation:', error);
    }
  };

  const handleResendInvitation = async (invitationId) => {
    try {
      await resendInvitation(invitationId);
      fetchWorkspaceInvitations(workspaceId);
    } catch (error) {
      console.error('Failed to resend invitation:', error);
    }
  };

  const handleCleanupExpired = async () => {
    try {
      await cleanupExpired(workspaceId);
      fetchWorkspaceInvitations(workspaceId);
    } catch (error) {
      console.error('Failed to cleanup expired invitations:', error);
    }
  };

  // Handle send invitation - matches InviteMemberModal's onSendInvitation prop
  const handleSendInvitation = async (invitationData) => {
    try {
      console.log('Sending invitation from WorkspaceSettings:', invitationData);
      await sendInvitation(invitationData);
      await fetchWorkspaceInvitations(workspaceId);
      setShowInviteModal(false);
    } catch (error) {
      console.error('Failed to send invitation:', error);
      throw error; // Re-throw so modal can handle it
    }
  };

  // Format date helper
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Loading state
 if (workspaceLoading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin h-12 w-12 border-b-2 border-blue-600 rounded-full"></div>
    </div>
  );
}

if (workspaceError) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="max-w-md mx-auto text-center p-6">
        <div className="text-red-600 mb-4">
          <ExclamationTriangleIcon className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Access Denied
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          You don't have permission to access workspace settings.
        </p>
        <Button onClick={() => navigate(`/workspaces/${workspaceId}`)}>
          Back to Workspace
        </Button>
      </Card>
    </div>
  );
}

if (!currentWorkspace) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-600">Loading workspace...</p>
    </div>
  );
}


  const renderGeneralTab = () => (
    <div className="space-y-6">
      {/* Success Alert */}
      {updateSuccess && (
        <Alert variant="success" className="mb-4">
          <CheckCircleIcon className="h-4 w-4" />
          <span>Workspace updated successfully!</span>
        </Alert>
      )}

      {/* Workspace Details Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Workspace Details
        </h3>
        <form onSubmit={handleUpdateWorkspace} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Workspace Name
            </label>
            <Input
              type="text"
              value={workspaceForm.name}
              onChange={(e) => setWorkspaceForm({ ...workspaceForm, name: e.target.value })}
              placeholder="Enter workspace name"
              required
              disabled={!isAdmin}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              rows="3"
              value={workspaceForm.description}
              onChange={(e) => setWorkspaceForm({ ...workspaceForm, description: e.target.value })}
              placeholder="Enter workspace description"
              disabled={!isAdmin}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublic"
              checked={workspaceForm.isPublic}
              onChange={(e) => setWorkspaceForm({ ...workspaceForm, isPublic: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={!isAdmin}
            />
            <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Make this workspace public
            </label>
          </div>

          {isAdmin && (
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isUpdating}
                className="flex items-center"
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  'Update Workspace'
                )}
              </Button>
            </div>
          )}
        </form>
      </Card>

      {/* Workspace Statistics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Workspace Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <DocumentIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Documents</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                   {documentCount}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <UsersIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Members</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {workspaceMembers?.length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <EnvelopeIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Invitations</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {invitationStats?.pending || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Created</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatDate(currentWorkspace?.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Workspace Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Workspace Information
        </h3>
        <div className="space-y-3">
         
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Visibility</span>
            <Badge variant={currentWorkspace.isPublic ? 'success' : 'gray'}>
              {currentWorkspace.isPublic ? 'Public' : 'Private'}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Owner</span>
            <div className="flex items-center">
              <Avatar user={currentWorkspace.owner} size="sm" className="mr-2" />
              <span className="text-sm text-gray-900 dark:text-white">
                {currentWorkspace.owner?.name}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Your Role</span>
            <Badge variant="primary" className="capitalize">
              {userRole}
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderMembersTab = () => (
    <div className="space-y-6">
      {/* Members Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Workspace Members
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Manage who has access to this workspace and their permissions.
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

      {/* Member Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <UsersIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Members</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {workspaceMembers?.length || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Active</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {workspaceMembers?.filter(m => m.status === 'active').length || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <ClockIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Pending</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {invitationStats?.pending || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Members List */}
      <Card className="p-6">
        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
          Current Members
        </h4>
        <MemberList
          members={workspaceMembers}
          workspaceId={workspaceId}
          currentUserId={user?.id}
          currentUserRole={userRole}
          isLoading={workspaceLoading}
          onRemoveMember={(memberId) => removeMember(workspaceId, memberId)}
          onUpdateRole={(memberId, roleData) => updateMemberRole(workspaceId, memberId, roleData)}
          onInviteMembers={() => setShowInviteModal(true)}
        />
      </Card>
    </div>
  );

  const renderInvitationsTab = () => (
    <div className="space-y-6">
      {/* Invitations Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Pending Invitations
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Manage pending invitations to this workspace.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {invitationStats?.expired > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCleanupExpired}
              className="text-orange-600"
            >
              Clean up {invitationStats.expired} expired
            </Button>
          )}
          <PermissionGuard permissions={['invite']} workspaceId={workspaceId}>
            <Button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center"
            >
              <UserPlusIcon className="h-4 w-4 mr-2" />
              Send Invitation
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Invitation Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
              {invitationStats?.pending || 0}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Pending</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
              {invitationStats?.accepted || 0}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Accepted</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
              {invitationStats?.rejected || 0}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Rejected</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-semibold text-orange-600 dark:text-orange-400">
              {invitationStats?.expired || 0}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Expired</p>
          </div>
        </Card>
      </div>

      {/* Invitations List */}
      <Card className="p-6">
        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
          All Invitations
        </h4>
        
        {workspaceInvitations && workspaceInvitations.length > 0 ? (
          <div className="space-y-4">
            {workspaceInvitations.map((invitation) => (
              <div key={invitation._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {invitation.email}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge 
                          variant={
                            invitation.status === 'pending' ? 'warning' :
                            invitation.status === 'accepted' ? 'success' :
                            invitation.status === 'rejected' ? 'danger' : 'gray'
                          }
                          size="sm"
                        >
                          {invitation.status}
                        </Badge>
                        <Badge variant="gray" size="sm" className="capitalize">
                          {invitation.role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <p>Invited {formatDate(invitation.createdAt)}</p>
                    <p>Expires {formatDate(invitation.expiresAt)}</p>
                    {invitation.invitedBy && (
                      <p>By {invitation.invitedBy.name}</p>
                    )}
                  </div>
                </div>

                {invitation.status === 'pending' && (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResendInvitation(invitation._id)}
                      disabled={invitationsLoading}
                    >
                      Resend
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelInvitation(invitation._id)}
                      disabled={invitationsLoading}
                      className="text-red-600 hover:text-red-700"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <EnvelopeIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No invitations sent yet</p>
            <PermissionGuard permissions={['invite']} workspaceId={workspaceId}>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setShowInviteModal(true)}
              >
                Send First Invitation
              </Button>
            </PermissionGuard>
          </div>
        )}
      </Card>
    </div>
  );

  const renderDangerZoneTab = () => (
    <div className="space-y-6">
      <Alert variant="warning">
        <ExclamationTriangleIcon className="h-4 w-4" />
        <span>
          These actions are permanent and cannot be undone. Please proceed with caution.
        </span>
      </Alert>

      {/* Leave Workspace */}
      {!isOwner && (
        <Card className="p-6 border-orange-200 dark:border-orange-800">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                Leave Workspace
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                You will lose access to all documents and conversations in this workspace.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowLeaveModal(true)}
              className="text-orange-600 border-orange-600 hover:bg-orange-50"
            >
              Leave Workspace
            </Button>
          </div>
        </Card>
      )}

      {/* Delete Workspace */}
      {isOwner && (
        <Card className="p-6 border-red-200 dark:border-red-800">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                Delete Workspace
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Permanently delete this workspace and all its contents. This action cannot be undone.
              </p>
              <div className="mt-3 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                <p>• All documents will be permanently deleted</p>
                <p>• All members will lose access</p>
                <p>• All pending invitations will be canceled</p>
                <p>• Workspace history will be lost</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(true)}
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete Workspace
            </Button>
          </div>
        </Card>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/workspaces/${workspaceId}`)}
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Workspace
            </Button>
          </div>
          <div className="flex items-center space-x-3">
            <CogIcon className="h-8 w-8 text-gray-600 dark:text-gray-400" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Workspace Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manage settings for "{currentWorkspace?.name}"
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'general', name: 'General', icon: CogIcon },
              { id: 'members', name: 'Members', icon: UsersIcon },
              { id: 'invitations', name: 'Invitations', icon: EnvelopeIcon },
              { id: 'danger', name: 'Danger Zone', icon: ExclamationTriangleIcon }
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
        {activeTab === 'general' && renderGeneralTab()}
        {activeTab === 'members' && renderMembersTab()}
        {activeTab === 'invitations' && renderInvitationsTab()}
        {activeTab === 'danger' && renderDangerZoneTab()}
      </div>

      {/* Delete Workspace Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Workspace"
        variant="danger"
      >
        <div className="p-6">
          <div className="flex items-center mb-4">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-600 mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Are you absolutely sure?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                This action cannot be undone. This will permanently delete the workspace
                "{currentWorkspace?.name}" and all its contents.
              </p>
            </div>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-4">
            <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-2">
              This will delete:
            </p>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
              <li>• {workspaceStats?.totalDocuments || 0} documents</li>
              <li>• {workspaceMembers?.length || 0} member access permissions</li>
              <li>• {invitationStats?.pending || 0} pending invitations</li>
              <li>• All workspace history and settings</li>
            </ul>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Please type <strong>{currentWorkspace?.name}</strong> to confirm.
          </p>
          
          <Input
            type="text"
            placeholder={`Type "${currentWorkspace?.name}" here`}
            className="mb-4"
          />
        </div>
        
        <div className="flex justify-end space-x-3 px-6 pb-6">
          <Button
            variant="outline"
            onClick={() => setShowDeleteModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteWorkspace}
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Delete Workspace
          </Button>
        </div>
      </Modal>

      {/* Leave Workspace Modal */}
      <Modal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        title="Leave Workspace"
        variant="warning"
      >
        <div className="p-6">
          <div className="flex items-center mb-4">
            <ExclamationTriangleIcon className="h-12 w-12 text-orange-600 mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Leave "{currentWorkspace?.name}"?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                You will lose access to all documents and conversations in this workspace.
              </p>
            </div>
          </div>
          
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg mb-4">
            <p className="text-sm text-orange-800 dark:text-orange-200">
              You can be re-invited to this workspace later by an admin or owner.
            </p>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 px-6 pb-6">
          <Button
            variant="outline"
            onClick={() => setShowLeaveModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="warning"
            onClick={handleLeaveWorkspace}
          >
            Leave Workspace
          </Button>
        </div>
      </Modal>

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        workspace={currentWorkspace}
        onSendInvitation={handleSendInvitation}
      />
    </div>
  );
};

export default WorkspaceSettings