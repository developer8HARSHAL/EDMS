import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  ArrowUpTrayIcon,
  PlusIcon,
  BellIcon,
  DocumentIcon,
  CloudArrowUpIcon,
  PencilSquareIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

import { documentApi } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { useInvitations } from '../hooks/useInvitations';

import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import CreateWorkspaceModal from '../components/workspace/CreateWorkspaceModal';
import MetricTile from '../components/dashboard/MetricTile';
import AttentionListItem from '../components/dashboard/AttentionListItem';
import DocumentRow from '../components/documents/DocumentRow';

const EMPTY_DASHBOARD = { stats: {}, recentDocuments: [], pendingReview: [], upcomingDeadlines: [] };

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, tokenValidated } = useAuth();
  const { createWorkspace, loading: workspaceActionLoading } = useWorkspaces();
  const { pendingInvitations } = useInvitations();

  const [data, setData] = useState(EMPTY_DASHBOARD);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // GET /documents/dashboard-data — already returns stats/recentDocuments/
  // pendingReview/upcomingDeadlines in one call, so one fetch covers the page.
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await documentApi.getDashboardData();
      setData({
        stats: response.data?.stats || {},
        recentDocuments: response.data?.recentDocuments || [],
        pendingReview: response.data?.pendingReview || [],
        upcomingDeadlines: response.data?.upcomingDeadlines || [],
      });
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && tokenValidated) {
      fetchData();
    }
  }, [isAuthenticated, tokenValidated, fetchData]);

  const handleCreateWorkspace = async (workspaceData) => {
    await createWorkspace(workspaceData);
    setShowCreateModal(false);
  };

  const metricTiles = [
    { label: 'Total documents', value: data.stats.totalDocs ?? 0, icon: DocumentIcon },
    { label: 'Uploaded this month', value: data.stats.thisMonth ?? 0, icon: CloudArrowUpIcon },
    { label: 'Drafts', value: data.stats.draftCount ?? 0, icon: PencilSquareIcon },
    { label: 'In review', value: data.stats.inReviewCount ?? 0, icon: ClockIcon },
    { label: 'Approved', value: data.stats.approvedCount ?? 0, icon: CheckCircleIcon },
  ];

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              Welcome back, {user?.name || 'User'}
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              Here's what needs your attention today.
            </p>
          </div>
          <div className="flex gap-3">
            <Button as={RouterLink} to="/documents/upload" variant="outline" leftIcon={<ArrowUpTrayIcon className="h-4 w-4" />}>
              Upload document
            </Button>
            <Button onClick={() => setShowCreateModal(true)} leftIcon={<PlusIcon className="h-4 w-4" />}>
              New workspace
            </Button>
          </div>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        {/* Pending invitations */}
        {pendingInvitations?.length > 0 && (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface-2 px-5 py-3.5">
            <div className="flex items-center gap-3">
              <div className="icon-badge icon-badge-1 h-9 w-9 shrink-0">
                <BellIcon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink">
                  {pendingInvitations.length} pending workspace invitation{pendingInvitations.length > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-ink-muted">Review and accept to join new workspaces</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/invitations')}>
              Review
            </Button>
          </div>
        )}

        {/* Metric strip */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {isLoading
            ? [...Array(5)].map((_, i) => (
                <div key={i} className="h-[72px] rounded-2xl bg-surface-2 animate-pulse" />
              ))
            : metricTiles.map((tile) => <MetricTile key={tile.label} {...tile} />)}
        </div>

        {/* Needs your review / Upcoming deadlines */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card padding={false} className="p-5">
            <CardHeader className="pb-3 mb-3">
              <h2 className="text-base font-semibold text-ink">Needs your review</h2>
            </CardHeader>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-surface-2 animate-pulse" />)}
              </div>
            ) : data.pendingReview.length > 0 ? (
              <div className="space-y-0.5">
                {data.pendingReview.map((item, i) => (
                  <AttentionListItem key={item?._id || item?.document?._id || i} item={item} />
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-ink-muted">Nothing needs your review right now</p>
            )}
          </Card>

          <Card padding={false} className="p-5">
            <CardHeader className="pb-3 mb-3">
              <h2 className="text-base font-semibold text-ink">Upcoming deadlines</h2>
            </CardHeader>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-surface-2 animate-pulse" />)}
              </div>
            ) : data.upcomingDeadlines.length > 0 ? (
              <div className="space-y-0.5">
                {data.upcomingDeadlines.map((item, i) => (
                  <AttentionListItem key={item?._id || item?.document?._id || i} item={item} />
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-ink-muted">No upcoming deadlines</p>
            )}
          </Card>
        </div>

        {/* Recent documents */}
        <Card padding={false} className="p-5">
          <CardHeader className="pb-3 mb-3">
            <h2 className="text-base font-semibold text-ink">Recent documents</h2>
          </CardHeader>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-surface-2 animate-pulse" />)}
            </div>
          ) : data.recentDocuments.length > 0 ? (
            <div className="space-y-0.5">
              {data.recentDocuments.map((doc) => (
                <DocumentRow key={doc._id} document={doc} />
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-ink-muted">No documents yet</p>
          )}
        </Card>
      </div>

      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateWorkspace={handleCreateWorkspace}
        isLoading={workspaceActionLoading?.createWorkspace || false}
      />
    </div>
  );
};

export default Dashboard;