import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import { Alert } from '../components/ui/Alert';
import Modal from '../components/ui/Modal';
import MetricTile from '../components/dashboard/MetricTile';
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
  ArrowLeftIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { selectWorkspaceStats } from '../store/slices/documentsSlice';

const TABS = [
  { id: 'general', name: 'General', icon: CogIcon },
  { id: 'members', name: 'Members', icon: UsersIcon },
  { id: 'invitations', name: 'Invitations', icon: EnvelopeIcon },
  { id: 'danger', name: 'Danger zone', icon: ExclamationTriangleIcon },
];

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const WorkspaceSettings = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

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
    getUserRole,
  } = useWorkspaces();

  const {
    workspaceInvitations,
    invitationStats,
    isLoading: invitationsLoading,
    fetchWorkspaceInvitations,
    cancelInvitation,
    resendInvitation,
    cleanupExpired,
    sendInvitation,
  } = useInvitations();

  const workspaceStats = useSelector((state) => selectWorkspaceStats(state, workspaceId));
  const documentCount = workspaceStats?.documents?.total || 0;
  const workspaceMembers = currentWorkspace?.members || [];
  const adminCount = workspaceMembers.filter((m) => m.role === 'admin').length;
  const userRole = getUserRole(workspaceId);
  const isAdmin = userRole === 'admin' || userRole === 'owner';
  const isOwner = userRole === 'owner';
  const isPublic = !!currentWorkspace?.settings?.isPublic;

  const [activeTab, setActiveTab] = useState('general');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const [workspaceForm, setWorkspaceForm] = useState({ name: '', description: '', isPublic: false });

  useEffect(() => {
    if (!workspaceId) return;
    fetchWorkspace(workspaceId);
    fetchStats(workspaceId).catch((err) => console.warn('Could not fetch workspace stats:', err));
    fetchWorkspaceInvitations(workspaceId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  useEffect(() => {
    if (currentWorkspace) {
      setWorkspaceForm({
        name: currentWorkspace.name || '',
        description: currentWorkspace.description || '',
        isPublic: !!currentWorkspace.settings?.isPublic,
      });
    }
  }, [currentWorkspace]);

  const handleUpdateWorkspace = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsUpdating(true);
    setUpdateSuccess(false);
    try {
      await updateWorkspace(workspaceId, {
        name: workspaceForm.name,
        description: workspaceForm.description,
        settings: { isPublic: workspaceForm.isPublic },
      });
      await fetchWorkspace(workspaceId);
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to update workspace:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!isOwner || deleteConfirmText !== currentWorkspace?.name) return;
    try {
      await deleteWorkspace(workspaceId);
      navigate('/workspaces');
    } catch (error) {
      console.error('Failed to delete workspace:', error);
    }
  };

  const handleLeaveWorkspace = async () => {
    if (isOwner) return;
    try {
      await leaveWorkspace(workspaceId);
      navigate('/workspaces');
    } catch (error) {
      console.error('Failed to leave workspace:', error);
    }
  };

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

  const handleSendInvitation = async (invitationData) => {
    try {
      await sendInvitation(invitationData);
      await fetchWorkspaceInvitations(workspaceId);
      setShowInviteModal(false);
    } catch (error) {
      console.error('Failed to send invitation:', error);
      throw error;
    }
  };

  if (workspaceLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-300 border-t-primary-600" />
      </div>
    );
  }

  if (workspaceError || !currentWorkspace) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <ExclamationTriangleIcon className="h-10 w-10 mx-auto text-red-600 mb-4" />
        <h3 className="text-lg font-semibold text-ink mb-2">Access denied</h3>
        <p className="text-ink-muted mb-4">You don't have permission to access this workspace's settings.</p>
        <Button onClick={() => navigate(`/workspaces/${workspaceId}`)}>Back to workspace</Button>
      </div>
    );
  }

  const renderGeneralTab = () => (
    <div className="space-y-6">
      {updateSuccess && (
        <Alert variant="success">
          <CheckCircleIcon className="h-4 w-4" />
          <span>Workspace updated successfully!</span>
        </Alert>
      )}

      <Card className="p-6">
        <h3 className="text-base font-semibold text-ink mb-4">Workspace details</h3>
        <form onSubmit={handleUpdateWorkspace} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Workspace name</label>
            <Input
              value={workspaceForm.name}
              onChange={(e) => setWorkspaceForm({ ...workspaceForm, name: e.target.value })}
              placeholder="Enter workspace name"
              required
              disabled={!isAdmin}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Description</label>
            <textarea
              className="input-field"
              rows="3"
              value={workspaceForm.description}
              onChange={(e) => setWorkspaceForm({ ...workspaceForm, description: e.target.value })}
              placeholder="Enter workspace description"
              disabled={!isAdmin}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={workspaceForm.isPublic}
              onChange={(e) => setWorkspaceForm({ ...workspaceForm, isPublic: e.target.checked })}
              className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
              disabled={!isAdmin}
            />
            Make this workspace shared
          </label>

          {isAdmin && (
            <div className="flex justify-end">
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Updating...' : 'Update workspace'}
              </Button>
            </div>
          )}
        </form>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricTile label="Documents" value={documentCount} icon={DocumentIcon} />
        <MetricTile label="Members" value={workspaceMembers.length} icon={UsersIcon} />
        <MetricTile label="Pending invites" value={invitationStats?.pending || 0} icon={EnvelopeIcon} />
        <MetricTile label="Created" value={formatDate(currentWorkspace?.createdAt)} icon={CalendarIcon} />
      </div>

      <Card className="p-6">
        <h3 className="text-base font-semibold text-ink mb-4">Workspace information</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-ink-muted">Visibility</span>
            <Badge variant={isPublic ? 'success' : 'gray'}>{isPublic ? 'Shared' : 'Private'}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-ink-muted">Owner</span>
            <div className="flex items-center gap-2">
              <Avatar user={currentWorkspace.owner} size="sm" />
              <span className="text-sm text-ink">{currentWorkspace.owner?.name}</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-ink-muted">Your role</span>
            <Badge variant="primary" className="capitalize">{userRole}</Badge>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderMembersTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-ink">Workspace members</h3>
          <p className="text-sm text-ink-muted">Manage who has access to this workspace and their permissions.</p>
        </div>
        <PermissionGuard requiredPermissions={['invite']} workspaceId={workspaceId} showFallback={false}>
          <Button onClick={() => setShowInviteModal(true)} leftIcon={<UserPlusIcon className="h-4 w-4" />}>
            Invite members
          </Button>
        </PermissionGuard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricTile label="Total members" value={workspaceMembers.length} icon={UsersIcon} />
        <MetricTile label="Admins" value={adminCount} icon={ShieldCheckIcon} />
        <MetricTile label="Pending invites" value={invitationStats?.pending || 0} icon={ClockIcon} />
      </div>

      <MemberList
        members={workspaceMembers}
        workspaceId={workspaceId}
        currentUserId={user?.id}
        currentUserRole={userRole}
        isLoading={workspaceLoading}
        onRemoveMember={(memberId) => removeMember(workspaceId, memberId)}
        onUpdateMemberRole={(memberId, roleData) => updateMemberRole(workspaceId, memberId, roleData)}
        onInviteMembers={() => setShowInviteModal(true)}
      />
    </div>
  );

  const renderInvitationsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-ink">Pending invitations</h3>
          <p className="text-sm text-ink-muted">Manage pending invitations to this workspace.</p>
        </div>
        <div className="flex items-center gap-3">
          {invitationStats?.expired > 0 && (
            <Button variant="outline" size="sm" onClick={handleCleanupExpired}>
              Clean up {invitationStats.expired} expired
            </Button>
          )}
          <PermissionGuard requiredPermissions={['invite']} workspaceId={workspaceId} showFallback={false}>
            <Button onClick={() => setShowInviteModal(true)} leftIcon={<UserPlusIcon className="h-4 w-4" />}>
              Send invitation
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Accepted/rejected/expired keep semantic color — legitimate status differentiation, not decoration */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-semibold text-primary-600 dark:text-primary-400">{invitationStats?.pending || 0}</p>
          <p className="text-sm text-ink-muted">Pending</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-semibold text-green-600 dark:text-green-400">{invitationStats?.accepted || 0}</p>
          <p className="text-sm text-ink-muted">Accepted</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-semibold text-red-600 dark:text-red-400">{invitationStats?.rejected || 0}</p>
          <p className="text-sm text-ink-muted">Rejected</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-semibold text-orange-600 dark:text-orange-400">{invitationStats?.expired || 0}</p>
          <p className="text-sm text-ink-muted">Expired</p>
        </Card>
      </div>

      <Card padding={false}>
        {workspaceInvitations && workspaceInvitations.length > 0 ? (
          <div className="divide-y divide-border">
            {workspaceInvitations.map((invitation) => (
              <div key={invitation._id} className="flex items-center justify-between px-4 py-3.5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-ink">{invitation.email}</p>
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
                    <Badge variant="gray" size="sm" className="capitalize">{invitation.role}</Badge>
                  </div>
                  <p className="text-xs text-ink-muted">
                    Invited {formatDate(invitation.createdAt)} · Expires {formatDate(invitation.expiresAt)}
                    {invitation.invitedBy && ` · By ${invitation.invitedBy.name}`}
                  </p>
                </div>
                {invitation.status === 'pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => handleResendInvitation(invitation._id)} disabled={invitationsLoading}>
                      Resend
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleCancelInvitation(invitation._id)} disabled={invitationsLoading}>
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <EnvelopeIcon className="h-8 w-8 mx-auto text-ink-muted mb-3" />
            <p className="text-sm text-ink-muted mb-3">No invitations sent yet</p>
            <PermissionGuard requiredPermissions={['invite']} workspaceId={workspaceId} showFallback={false}>
              <Button variant="outline" size="sm" onClick={() => setShowInviteModal(true)}>
                Send first invitation
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
        <span>These actions are permanent and cannot be undone. Please proceed with caution.</span>
      </Alert>

      {!isOwner && (
        <Card className="p-6 border-orange-200 dark:border-orange-800">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="text-base font-medium text-ink">Leave workspace</h4>
              <p className="text-sm text-ink-muted mt-1">You will lose access to all documents in this workspace.</p>
            </div>
            <Button variant="outline" onClick={() => setShowLeaveModal(true)} className="text-orange-600 border-orange-600 hover:bg-orange-50 shrink-0">
              Leave workspace
            </Button>
          </div>
        </Card>
      )}

      {isOwner && (
        <Card className="p-6 border-red-200 dark:border-red-800">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="text-base font-medium text-ink">Delete workspace</h4>
              <p className="text-sm text-ink-muted mt-1">Permanently delete this workspace and all its contents.</p>
              <div className="mt-3 space-y-1 text-xs text-ink-muted">
                <p>• All documents will be permanently deleted</p>
                <p>• All members will lose access</p>
                <p>• All pending invitations will be canceled</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setShowDeleteModal(true)} leftIcon={<TrashIcon className="h-4 w-4" />} className="text-red-600 border-red-600 hover:bg-red-50 shrink-0">
              Delete workspace
            </Button>
          </div>
        </Card>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <Button variant="outline" size="sm" onClick={() => navigate(`/workspaces/${workspaceId}`)} leftIcon={<ArrowLeftIcon className="h-4 w-4" />} className="mb-4">
          Back to workspace
        </Button>
        <div className="flex items-center gap-3">
          <CogIcon className="h-7 w-7 text-ink-muted" />
          <div>
            <h1 className="text-2xl font-bold text-ink">Workspace settings</h1>
            <p className="text-sm text-ink-muted">Manage settings for "{currentWorkspace?.name}"</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-6 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-700 dark:text-primary-400'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.name}
          </button>
        ))}
      </div>

      {activeTab === 'general' && renderGeneralTab()}
      {activeTab === 'members' && renderMembersTab()}
      {activeTab === 'invitations' && renderInvitationsTab()}
      {activeTab === 'danger' && renderDangerZoneTab()}

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete workspace" variant="danger">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <ExclamationTriangleIcon className="h-10 w-10 text-red-600 shrink-0" />
            <div>
              <h3 className="text-base font-semibold text-ink">Are you absolutely sure?</h3>
              <p className="text-sm text-ink-muted">
                This will permanently delete "{currentWorkspace?.name}" and all its contents. This cannot be undone.
              </p>
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-4">
            <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-2">This will delete:</p>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
              <li>• {documentCount} documents</li>
              <li>• {workspaceMembers.length} member access permissions</li>
              <li>• {invitationStats?.pending || 0} pending invitations</li>
            </ul>
          </div>

          <p className="text-sm text-ink-muted mb-3">
            Type <strong className="text-ink">{currentWorkspace?.name}</strong> to confirm.
          </p>
          <Input
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder={`Type "${currentWorkspace?.name}" here`}
          />
        </div>

        <div className="flex justify-end gap-3 px-6 pb-6">
          <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteWorkspace} disabled={deleteConfirmText !== currentWorkspace?.name} leftIcon={<TrashIcon className="h-4 w-4" />}>
            Delete workspace
          </Button>
        </div>
      </Modal>

      <Modal isOpen={showLeaveModal} onClose={() => setShowLeaveModal(false)} title="Leave workspace" variant="warning">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <ExclamationTriangleIcon className="h-10 w-10 text-orange-600 shrink-0" />
            <div>
              <h3 className="text-base font-semibold text-ink">Leave "{currentWorkspace?.name}"?</h3>
              <p className="text-sm text-ink-muted">You will lose access to all documents in this workspace.</p>
            </div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
            <p className="text-sm text-orange-800 dark:text-orange-200">You can be re-invited later by an admin or owner.</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 pb-6">
          <Button variant="outline" onClick={() => setShowLeaveModal(false)}>Cancel</Button>
          <Button variant="warning" onClick={handleLeaveWorkspace}>Leave workspace</Button>
        </div>
      </Modal>

      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        workspace={currentWorkspace}
        onSendInvitation={handleSendInvitation}
      />
    </div>
  );
};

export default WorkspaceSettings;