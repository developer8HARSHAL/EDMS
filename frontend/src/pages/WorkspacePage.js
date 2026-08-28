import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import MetricTile from '../components/dashboard/MetricTile';
import MemberList from '../components/members/MemberList';
import InviteMemberModal from '../components/members/InviteMemberModal';
import PermissionGuard from '../components/permissions/PermissionGuard';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { useDocuments } from '../hooks/useDocuments';
import { useInvitations } from '../hooks/useInvitations';
import { useAuth } from '../hooks/useAuth';
import { selectWorkspaceStats, selectWorkspaceDocuments } from '../store/slices/documentsSlice';
import {
  DocumentIcon,
  FolderIcon,
  UserPlusIcon,
  CogIcon,
  ChartBarIcon,
  CalendarIcon,
  ClockIcon,
  EyeIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';

const TABS = [
  { id: 'overview', label: 'Overview', icon: ChartBarIcon },
  { id: 'documents', label: 'Documents', icon: DocumentIcon },
  { id: 'members', label: 'Members', icon: UserPlusIcon },
];

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

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
    updateMemberRole,
    removeMember,
  } = useWorkspaces();

  const { fetchWorkspaceDocuments, fetchWorkspaceStats } = useDocuments(workspaceId);

  const workspaceDocuments = useSelector((state) => selectWorkspaceDocuments(state, workspaceId));
  const workspaceStats = useSelector((state) => selectWorkspaceStats(state, workspaceId));

  const { isLoading: invitationsLoading, fetchWorkspaceInvitations, sendInvitation } = useInvitations();

  const [activeTab, setActiveTab] = useState('overview');
  const [showInviteModal, setShowInviteModal] = useState(false);

  const userRole = getUserRole(workspaceId);

  const documentStats = workspaceStats?.documents || {};
  const memberStats = workspaceStats?.members || {};
  const memberCount = memberStats.total || 0;
  const documentCount = documentStats.total || 0;
  const storageUsed = documentStats.totalSize || 0;
  const recentUploads = documentStats.recentUploads || 0;

  useEffect(() => {
    if (!workspaceId) return;
    fetchWorkspace(workspaceId);
    fetchWorkspaceDocuments(workspaceId);
    fetchWorkspaceStats(workspaceId);
    fetchWorkspaceInvitations(workspaceId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const handleInviteSubmit = async (invitationData) => {
    if (invitationData.invitations) {
      await Promise.allSettled(invitationData.invitations.map((inv) => sendInvitation(inv)));
    } else {
      await sendInvitation(invitationData);
    }
    fetchWorkspaceInvitations(workspaceId);
  };

  const handleUpdateMemberRole = async (memberId, roleData) => {
    await updateMemberRole(workspaceId, memberId, roleData);
    await fetchWorkspace(workspaceId);
  };

  const handleRemoveMember = async (memberId) => {
    await removeMember(workspaceId, memberId);
    await fetchWorkspace(workspaceId);
  };

  if (workspaceLoading || (!currentWorkspace && !workspaceError)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-300 border-t-primary-600" />
      </div>
    );
  }

  if (workspaceError || !currentWorkspace) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <FolderIcon className="h-10 w-10 mx-auto text-ink-muted mb-4" />
        <h3 className="text-lg font-semibold text-ink mb-2">Workspace not found</h3>
        <p className="text-ink-muted mb-4">
          {workspaceError || "This workspace doesn't exist or you don't have access to it."}
        </p>
        <Button variant="outline" onClick={() => navigate('/workspaces')}>
          Back to workspaces
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Tabs — same pattern as DocumentList.js */}
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
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold text-ink">{currentWorkspace.name}</h1>
                  <Badge variant={currentWorkspace.settings?.isPublic ? 'success' : 'gray'} size="sm">
                    {currentWorkspace.settings?.isPublic ? 'Shared' : 'Private'}
                  </Badge>
                  <Badge variant="primary" size="sm" className="capitalize">
                    {userRole}
                  </Badge>
                </div>
                {currentWorkspace.description && (
                  <p className="text-ink-muted mb-3">{currentWorkspace.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-ink-muted">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    Created {formatDate(currentWorkspace.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <ClockIcon className="h-4 w-4" />
                    Updated {formatDate(currentWorkspace.updatedAt)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => navigate('/workspaces')}>
                  Back to workspaces
                </Button>
                <PermissionGuard requiredPermissions={['invite']} workspaceId={workspaceId} showFallback={false}>
                  <Button variant="outline" size="sm" onClick={() => setShowInviteModal(true)} leftIcon={<UserPlusIcon className="h-4 w-4" />}>
                    Invite
                  </Button>
                </PermissionGuard>
                {(userRole === 'admin' || userRole === 'owner') && (
                  <Button variant="outline" size="sm" onClick={() => navigate(`/workspaces/${workspaceId}/settings`)} leftIcon={<CogIcon className="h-4 w-4" />}>
                    Settings
                  </Button>
                )}
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricTile label="Documents" value={documentCount} icon={DocumentIcon} />
            <MetricTile label="Storage used" value={formatFileSize(storageUsed)} icon={FolderIcon} />
            <MetricTile label="Members" value={memberCount} icon={UserPlusIcon} />
            <MetricTile label="This month" value={recentUploads} icon={ChartBarIcon} />
          </div>

          {/* Recent activity panel deferred — source method (documentApi.getRecentActivity) doesn't exist yet */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-ink">Recent documents</h3>
              <Link to={`/workspaces/${workspaceId}/documents`} className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                View all
              </Link>
            </div>
            <div className="space-y-1">
              {workspaceDocuments?.slice(0, 5).map((doc) => (
                <div key={doc._id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-surface-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <DocumentIcon className="h-4 w-4 text-ink-muted shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{doc.name}</p>
                      <p className="text-xs text-ink-muted">{formatDate(doc.uploadDate || doc.createdAt)} · {formatFileSize(doc.size)}</p>
                    </div>
                  </div>
                  <button onClick={() => navigate(`/workspaces/${workspaceId}/documents/${doc._id}`)} className="text-ink-muted hover:text-ink">
                    <EyeIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {(!workspaceDocuments || workspaceDocuments.length === 0) && (
                <div className="text-center py-8">
                  <DocumentIcon className="h-8 w-8 mx-auto text-ink-muted mb-2" />
                  <p className="text-sm text-ink-muted mb-3">No documents yet</p>
                  <PermissionGuard requiredPermissions={['add']} workspaceId={workspaceId} showFallback={false}>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/workspaces/${workspaceId}/upload`)}>
                      Upload first document
                    </Button>
                  </PermissionGuard>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ink">Documents ({workspaceDocuments?.length || 0})</h2>
              <p className="text-sm text-ink-muted">Full management lives on the Documents page — this is a quick view.</p>
            </div>
            <PermissionGuard requiredPermissions={['add']} workspaceId={workspaceId} showFallback={false}>
              <Button variant="outline" onClick={() => navigate(`/workspaces/${workspaceId}/upload`)} leftIcon={<ArrowUpTrayIcon className="h-4 w-4" />}>
                Upload document
              </Button>
            </PermissionGuard>
          </div>

          <Card padding={false}>
            <div className="divide-y divide-border">
              {workspaceDocuments?.map((doc) => (
                <div
                  key={doc._id}
                  onClick={() => navigate(`/workspaces/${workspaceId}/documents/${doc._id}`)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2 transition-colors cursor-pointer"
                >
                  <DocumentIcon className="h-4 w-4 text-ink-muted shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink truncate">{doc.name}</p>
                    <p className="text-xs text-ink-muted">{formatDate(doc.uploadDate || doc.createdAt)} · {formatFileSize(doc.size)}</p>
                  </div>
                </div>
              ))}
              {(!workspaceDocuments || workspaceDocuments.length === 0) && (
                <div className="text-center py-12 text-sm text-ink-muted">No documents in this workspace yet.</div>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ink">Members</h2>
            </div>
            <PermissionGuard requiredPermissions={['invite']} workspaceId={workspaceId} showFallback={false}>
              <Button variant="outline" size="sm" onClick={() => setShowInviteModal(true)} leftIcon={<UserPlusIcon className="h-4 w-4" />}>
                Invite members
              </Button>
            </PermissionGuard>
          </div>

          <MemberList
            members={currentWorkspace.members || []}
            workspaceId={workspaceId}
            currentUserId={user?.id}
            currentUserRole={userRole}
            onUpdateMemberRole={handleUpdateMemberRole}
            onRemoveMember={handleRemoveMember}
            onInviteMembers={() => setShowInviteModal(true)}
            isLoading={workspaceLoading}
          />
        </div>
      )}

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