import { useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  FileText,
  Plus,
  Upload,
  Users,
} from 'lucide-react';

import { useAuth } from '../hooks/useAuth';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { useInvitations } from '../hooks/useInvitations';
import { useDashboard } from '../hooks/useDashboard';

import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import CreateWorkspaceModal from '../components/workspace/CreateWorkspaceModal';
import { formatDisplayName } from '../utils/dashboardUtils';

import {
  AttentionQueueItem,
  ActiveWorkflowRow,
  ProfileCard,
  ProfileCardShape,
  RecentDocumentsTable,
  WorkflowPipelineStrip,
} from '../components/dashboard/DashboardWidgets';



const ATTENTION_LIMIT = 4;
const WORKFLOW_LIMIT = 2;
const RECENT_DOCUMENTS_LIMIT = 5;
const TOP_ROW_MIN_HEIGHT = 'min-h-[360px]';


const SectionHeader = ({ title }) => (
  <div className="border-b border-border px-5 py-4 sm:px-6">
    <h2 className="text-base font-semibold tracking-tight text-ink sm:text-lg">
      {title}
    </h2>
  </div>
);

const SnapshotBand = ({ stats, activeCount, isLoading = false }) => {
  const metrics = [
    {
      key: 'total',
      label: 'Total documents',
      value: stats.totalDocs ?? 0,
      meta: 'Across your workspaces',
      icon: FileText,
      badge: 'icon-badge-3',
    },
    {
      key: 'month',
      label: 'Added this month',
      value: stats.thisMonth ?? 0,
      meta: 'Newly added documents',
      icon: Upload,
      badge: 'icon-badge-3',
    },
    {
      key: 'workflow',
      label: 'In workflow',
      value: activeCount,
      meta:
        activeCount > 0
          ? `${activeCount} active ${
              activeCount === 1 ? 'document' : 'documents'
            }`
          : 'Nothing currently moving',
      icon: Users,
      badge: 'icon-badge-3',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 ">
      {metrics.map((metric) => {
        const Icon = metric.icon;

        return (
          <Card
            key={metric.key}
            padding={false}
            className="group overflow-hidden"
          >
            <div className="flex min-h-[124px] flex-col justify-between p-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
                    {metric.label}
                  </p>

                  <p className="mt-1 text-xs leading-4 text-ink-muted">
                    {metric.meta}
                  </p>
                </div>

                <span
                  className={`icon-badge ${metric.badge} h-9 w-9`}
                  aria-hidden="true"
                >
                  <Icon className="h-4 w-4" />
                </span>
              </div>

              {/* Metric */}
              <div className="mt-5 flex items-end justify-between gap-3">
                {isLoading ? (
                  <div
                    className="h-8 w-16 animate-pulse rounded-lg bg-surface-2"
                    aria-hidden="true"
                  />
                ) : (
                  <p className="font-mono text-3xl font-semibold leading-none tracking-tight text-ink tabular-nums">
                    {metric.value}
                  </p>
                )}

                {!isLoading && (
                  <span
                    className="mb-1 h-1.5 w-1.5 rounded-full bg-primary-500"
                    aria-hidden="true"
                  />
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

const EmptyAttention = () => (
  <div className="flex min-h-[220px] flex-1 justify-center">
    <EmptyState
      icon={CheckCircle2}
      title="You're all caught up"
      description="No documents currently require your action."
    />
  </div>
);

const LoadingRows = ({ count = 2 }) => (
  <div className="divide-y divide-border">
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className="space-y-2 px-5 py-4 sm:px-6">
        <div className="h-4 w-2/5 animate-pulse rounded bg-surface-2" />
        <div className="h-3 w-3/5 animate-pulse rounded bg-surface-2" />
      </div>
    ))}
  </div>
);

const EmptyWorkflow = ({ onUpload }) => (
  <EmptyState
    icon={FileText}
    title="No active workflow"
    description="Documents will appear here when they enter review."
    actionLabel="Upload document"
    onAction={onUpload}
  />
);

const Overview = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    workspaces,
    createWorkspace,
    loading: workspaceActionLoading,
    getMemberInfo,
  } = useWorkspaces();

  const { pendingInvitations } = useInvitations();

  const {
    isLoading,
    error,
    stats = {},
    attentionGroups = [],
    isAllCaughtUp,
    pipelineStages = [],
    activeWorkflows = [],
    teamWorkload = [],
    recentDocuments = [],
  } = useDashboard();

  const [showCreateModal, setShowCreateModal] = useState(false);

  const attentionCount = useMemo(
    () =>
      attentionGroups.reduce(
        (total, group) => total + group.items.length,
        0
      ),
    [attentionGroups]
  );

  const visibleAttentionGroups = useMemo(() => {
    let remaining = ATTENTION_LIMIT;

    return attentionGroups
      .map((group) => {
        if (remaining <= 0) return null;

        const items = group.items.slice(0, remaining);
        remaining -= items.length;

        return items.length
          ? { ...group, items, totalCount: group.items.length }
          : null;
      })
      .filter(Boolean);
  }, [attentionGroups]);

  const hiddenAttentionCount = Math.max(
    0,
    attentionCount - ATTENTION_LIMIT
  );

  const visibleWorkflows = useMemo(
    () => activeWorkflows.slice(0, WORKFLOW_LIMIT),
    [activeWorkflows]
  );

  // activeWorkflows is capped at 6 for display (buildActiveWorkflows' default
  // limit) — not a real total. pipelineStages comes from stats aggregate
  // counts (uncapped), so in-review + final-review is the true "in workflow"
  // figure for the snapshot KPI.
  const trueInWorkflowCount = useMemo(() => {
    const inReview = pipelineStages.find((s) => s.stageKey === 'in-review')?.count ?? 0;
    const finalReview = pipelineStages.find((s) => s.stageKey === 'final-review')?.count ?? 0;
    return inReview + finalReview;
  }, [pipelineStages]);



  const currentUserWorkload = useMemo(() => {
    const userId = user?._id;
    const userName = user?.name?.trim().toLowerCase();

    return (
      teamWorkload.find(
        (person) => person.id && userId && person.id === userId
      ) ||
      teamWorkload.find(
        (person) =>
          person.name?.trim().toLowerCase() === userName
      ) ||
      null
    );
  }, [teamWorkload, user?._id, user?.name]);

  // Per-workspace role/permissions for the signed-in user — getMemberInfo
  // takes user.id (not user._id; both exist on the auth user object, but
  // useWorkspaces.js's own internal comparisons use .id, so this matches
  // that hook's own convention rather than guessing).
  const workspaceAccess = useMemo(
    () =>
      (workspaces ?? []).map((workspace) => {
        const memberInfo = getMemberInfo?.(workspace._id, user?.id) ?? null;

        return {
          id: workspace._id,
          name: workspace.name,
          userRole: memberInfo?.role ?? null,
          userPermissions: memberInfo?.permissions ?? null,
          joinedAt: memberInfo?.joinedAt ?? null,
        };
      }),
    [workspaces, getMemberInfo, user?.id]
  );

  const goToDocument = (documentId) => {
    navigate(`/documents/${documentId}`);
  };

  const handleCreateWorkspace = async (workspaceData) => {
    await createWorkspace(workspaceData);
    setShowCreateModal(false);
  };

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="space-y-6">

          {/* Header */}
          <header className="flex flex-col gap-4  pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="font-sans font-bold text-2xl text-ink">
                Dashboard
              </p>

              <p className="mt-1 text-sm text-ink-muted">
                {attentionCount > 0
                  ? `${attentionCount} item${attentionCount === 1 ? '' : 's'
                  } need your attention.`
                  : 'Everything is up to date.'}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <Button
                as={RouterLink}
                to="/documents/upload"
                variant="outline"
                leftIcon={
                  <Upload
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                }
              >
                Upload document
              </Button>

              <Button
                onClick={() => setShowCreateModal(true)}
                leftIcon={
                  <Plus
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                }
              >
                New workspace
              </Button>
            </div>
          </header>

          {pendingInvitations?.length > 0 && (
            <Card
              padding={false}
              className="overflow-hidden border-primary-200 dark:border-primary-800"
            >
              <div className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <Bell
                    className="h-4 w-4 shrink-0 text-primary-600"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">
                      {pendingInvitations.length} pending workspace invitation
                      {pendingInvitations.length > 1 ? 's' : ''}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      Review before joining a workspace.
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/invitations')}
                >
                  Review invitations
                </Button>
              </div>
            </Card>
          )}

          {error && <Alert variant="error">{error}</Alert>}

          {/* Global summary — directly below the page header */}
          <SnapshotBand
            stats={stats}
            activeCount={trueInWorkflowCount}
            isLoading={isLoading}
          />

          {/* Primary operational grid */}
          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-12">
            {/* Needs Attention — primary action surface */}
            <Card
              padding={false}
              className={`flex ${TOP_ROW_MIN_HEIGHT} flex-col overflow-hidden xl:col-span-8`}
            >
              <SectionHeader
                title="Needs attention"

              />

              <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
                {isLoading ? (
                  <LoadingRows count={4} />
                ) : attentionCount === 0 || isAllCaughtUp ? (
                  <EmptyAttention />
                ) : (
                  <div>
                    {visibleAttentionGroups.map((group) => (
                      <section key={group.groupKey}>
                        {visibleAttentionGroups.length > 1 && (
                          <div className="flex items-center bg-surface-2 px-5 py-2 sm:px-6">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                              {group.groupLabel}
                            </p>
                            <span className="font-mono text-xs tabular-nums text-ink-muted">
                              {group.totalCount}
                            </span>
                          </div>
                        )}

                        {group.items.map((item) => (
                          <AttentionQueueItem
                            key={item.documentId}
                            {...item}
                            currentUserName={user?.name}
                            onClick={goToDocument}
                          />
                        ))}
                      </section>
                    ))}

                    {hiddenAttentionCount > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          navigate('/documents?filter=needs-attention')
                        }
                        className="flex w-full items-center justify-between  px-5 py-3 text-left text-sm font-medium text-primary-700 transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset sm:px-6"
                      >
                        View {hiddenAttentionCount} more
                        <ArrowRight
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </Card>

<div className="xl:col-span-4">
  {isLoading ? (
    <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden xl:max-w-none">
      <ProfileCardShape />

      {/* Loading content */}
      <div className="absolute inset-0 z-10 flex flex-col px-5 pb-5 pt-9 sm:px-6">
        <div className="flex flex-col items-center">
          <div className="h-20 w-20 animate-pulse rounded-full bg-white/10" />

          <div className="mt-3 h-4 w-32 animate-pulse rounded-control bg-white/10" />

          <div className="mt-2 h-3 w-48 animate-pulse rounded-control bg-white/10" />
        </div>

        <div className="mt-5 space-y-4">
          <div className="h-px bg-white/15" />

          <div className="space-y-2">
            <div className="h-3 w-28 animate-pulse rounded-control bg-white/10" />
            <div className="h-4 w-full animate-pulse rounded-control bg-white/10" />
            <div className="h-4 w-4/5 animate-pulse rounded-control bg-white/10" />
          </div>

          <div className="h-px bg-white/15" />

          <div className="space-y-2">
            <div className="h-3 w-24 animate-pulse rounded-control bg-white/10" />
            <div className="h-4 w-full animate-pulse rounded-control bg-white/10" />
            <div className="h-4 w-3/4 animate-pulse rounded-control bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  ) : (
    <ProfileCard
      user={user}
      workspaces={workspaceAccess}
      workflow={{
        role: currentUserWorkload?.role ?? null,
        activeCount: currentUserWorkload?.count ?? 0,
      }}
      attentionCount={attentionCount}
      onViewProfile={() => navigate('/profile')}
      onReviewAttention={() =>
        navigate('/documents?filter=needs-attention')
      }
    />
  )}
</div>



          </div>

   
   
{/* Operational detail */}
<div className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-12">
  <Card
    padding={false}
    className="flex h-full min-h-0 flex-col overflow-hidden xl:col-span-8"
  >
    <SectionHeader title="Current workflow" />

    <div className="min-h-0">
      {isLoading ? (
        <LoadingRows count={2} />
      ) : activeWorkflows.length === 0 ? (
        <EmptyWorkflow
          onUpload={() => navigate('/documents/upload')}
        />
      ) : (
        <div>
          {visibleWorkflows.map((item) => (
            <ActiveWorkflowRow
              key={item.documentId}
              {...item}
              workflowStages={pipelineStages}
              onClick={goToDocument}
            />
          ))}

          {activeWorkflows.length > WORKFLOW_LIMIT && (
            <button
              type="button"
              onClick={() =>
                navigate('/documents?filter=in-progress')
              }
              className="flex w-full items-center justify-between border-t border-border px-5 py-3 text-sm font-medium text-primary-700 transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset sm:px-6"
            >
              <span>
                View {activeWorkflows.length - WORKFLOW_LIMIT}{' '}
                more active workflows
              </span>

              <ArrowRight
                className="h-4 w-4"
                aria-hidden="true"
              />
            </button>
          )}
        </div>
      )}
    </div>
  </Card>

  <Card
    padding={false}
    className="flex h-full min-h-0 flex-col overflow-hidden xl:col-span-4"
  >
    {isLoading ? (
      <div className="flex h-full min-h-0 flex-col p-4 sm:p-5">
        <div className="h-8 w-full animate-pulse rounded-xl bg-surface-2" />

        <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex min-h-0 flex-1 items-center gap-3 rounded-xl border border-border bg-surface-2/40 p-3.5"
            >
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-surface-2" />

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="h-4 w-20 animate-pulse rounded bg-surface-2" />
                  <div className="h-4 w-14 animate-pulse rounded bg-surface-2" />
                </div>

                <div className="mt-2 h-2 w-full animate-pulse rounded-full bg-surface-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    ) : (
      <WorkflowPipelineStrip stages={pipelineStages} />
    )}
  </Card>
</div>
          {/* Supporting context */}
          <div className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-12">
            {/* Recently added — full-width, not sharing a row so the table has room */}
            <Card padding={false} className="overflow-hidden xl:col-span-12">
              {isLoading ? (
                <div className="flex flex-col">
                  <div className="px-5 py-4 sm:px-6">
                    <div className="h-4 w-32 animate-pulse rounded bg-surface-2" />
                    <div className="mt-2 h-3 w-20 animate-pulse rounded bg-surface-2" />
                  </div>
                  <div className="space-y-3 px-5 pb-5 sm:px-6">
                    <div className="h-12 animate-pulse rounded bg-surface-2" />
                    <div className="h-12 animate-pulse rounded bg-surface-2" />
                    <div className="h-12 animate-pulse rounded bg-surface-2" />
                  </div>
                </div>
              ) : (
                <RecentDocumentsTable
                  documents={recentDocuments.slice(0, RECENT_DOCUMENTS_LIMIT)}
                  currentUserId={user?._id}
                  onClick={goToDocument}
                  onViewAll={() => navigate('/documents?sort=newest')}
                />
              )}
            </Card>



          </div>
        </div>
      </div>

      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateWorkspace={handleCreateWorkspace}
        isLoading={
          workspaceActionLoading?.createWorkspace || false
        }
      />
    </div>
  );
};

export { Overview };
export const Dashboard = Overview;
export default Overview;