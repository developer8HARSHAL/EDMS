import { useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Building2, FileText, Plus, Upload } from 'lucide-react';

import { useAuth } from '../hooks/useAuth';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { useDocuments } from '../hooks/useDocuments';
import { useDashboard } from '../hooks/useDashboard';

import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import StatusPill from '../components/documents/StatusPill';
import EmptyState from '../components/ui/EmptyState';
import CreateWorkspaceModal from '../components/workspace/CreateWorkspaceModal';
import AttentionListItem from '../components/dashboard/AttentionListItem';
import { formatDisplayName } from '../utils/dashboardUtils';

const RECENT_DOCUMENTS_LIMIT = 3;
const ATTENTION_LIMIT = 3;

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const getInitials = (name = '') => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return '?';
};

const formatShortDate = (dateStr) => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    workspaces = [],
    createWorkspace,
    isCreating,
  } = useWorkspaces();

  const { documents = [], getRecentDocuments } = useDocuments();

  const { attentionGroups = [], isAllCaughtUp, isLoading } = useDashboard();

  const [showCreateModal, setShowCreateModal] = useState(false);

  const attentionCount = useMemo(
    () => attentionGroups.reduce((total, group) => total + group.items.length, 0),
    [attentionGroups]
  );

  const topAttentionItems = useMemo(
    () => attentionGroups.flatMap((group) => group.items).slice(0, ATTENTION_LIMIT),
    [attentionGroups]
  );

  const recentDocuments = useMemo(
    () => getRecentDocuments(RECENT_DOCUMENTS_LIMIT),
    [getRecentDocuments]
  );

  const statusText =
    attentionCount > 0
      ? `You have ${attentionCount} document${attentionCount === 1 ? '' : 's'} waiting on you.`
      : "You're all caught up.";

  const handleCreateWorkspace = async (workspaceData) => {
    await createWorkspace(workspaceData);
    setShowCreateModal(false);
  };

  return (
    <div className="min-h-screen bg-surface ">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="space-y-12">

          {/* Hero */}
          <div>
            <h1 className="font-medium text-3xl leading-tight tracking-tight text-ink sm:text-4xl">
              {getGreeting()}, {formatDisplayName(user?.name)}.
            </h1>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                as={RouterLink}
                to="/documents/upload"
                leftIcon={<Upload className="h-4 w-4" aria-hidden="true" />}
              >
                Upload document
              </Button>

              <Button
                as={RouterLink}
                to="/documents"
                variant="outline"
                leftIcon={<FileText className="h-4 w-4" aria-hidden="true" />}
              >
                Browse documents
              </Button>
            </div>
          </div>

          {!isLoading && attentionCount > 0 && !isAllCaughtUp && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-ink-muted">
                  Needs your attention
                </h2>
              </div>

              <Card padding={false} className="divide-y divide-border">
                {topAttentionItems.map((item) => (
                  <button
                    key={item.documentId}
                    type="button"
                    onClick={() => navigate(`/documents/${item.documentId}`)}
                    className="block w-full text-left"
                    aria-label={`Open ${item.title || 'document'}`}
                  >
                    <AttentionListItem item={item} />
                  </button>
                ))}
              </Card>

              {attentionCount > ATTENTION_LIMIT && (
                <button
                  type="button"
                  onClick={() => navigate('/documents?filter=needs-attention')}
                  className="mt-2 text-sm font-medium text-primary-700 hover:underline"
                >
                  View all {attentionCount}

                </button>
              )}
            </section>
          )}

          {/* Your workspaces */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-ink-muted">
                Your workspaces
              </h2>
              {workspaces.length > 0 && (
                <RouterLink
                  to="/workspaces"
                  className="text-sm font-medium text-primary-700 hover:underline"
                >
                  View all
                </RouterLink>
              )}
            </div>

            {workspaces.length === 0 ? (
              <Card>
                <EmptyState
                  icon={Building2}
                  title="No workspaces yet"
                  description="Create a workspace to start organizing documents with your team."
                  actionLabel="Create workspace"
                  onAction={() => setShowCreateModal(true)}
                />
              </Card>
            ) : (
              <div className="flex flex-wrap gap-3">
                {workspaces.map((workspace) => (
                  <RouterLink
                    key={workspace._id}
                    to={`/workspaces/${workspace._id}`}
                    className="flex items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-hover"
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-[10px] font-semibold text-primary-700 dark:bg-primary-950/50 dark:text-primary-300"
                      aria-hidden="true"
                    >
                      {getInitials(workspace.name)}
                    </span>
                    {workspace.name}
                  </RouterLink>
                ))}

                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 rounded-xl border border-dashed border-border px-3.5 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:border-primary-300 hover:text-primary-700"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  New workspace
                </button>
              </div>
            )}
          </section>

          {/* Recent documents */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-ink-muted">
                Recent documents
              </h2>
              {documents.length > 0 && (
                <RouterLink
                  to="/documents"
                  className="text-sm font-medium text-primary-700 hover:underline"
                >
                  View all
                </RouterLink>
              )}
            </div>

            {recentDocuments.length === 0 ? (
              <Card>
                <EmptyState
                  icon={FileText}
                  title="No documents yet"
                  description="Upload your first document to get started."
                  actionLabel="Upload document"
                  onAction={() => navigate('/documents/upload')}
                />
              </Card>
            ) : (
              <Card padding={false} className="divide-y divide-border">
                {recentDocuments.map((document) => (
                  <button
                    key={document._id}
                    type="button"
                    onClick={() => navigate(`/documents/${document._id}`)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-hover"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <FileText className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
                      <span className="truncate text-sm font-medium text-ink">
                        {document.name}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-xs text-ink-muted">
                        {formatShortDate(document.lastModified || document.uploadDate)}
                      </span>
                      {document.status && <StatusPill status={document.status} size="xs" />}
                    </div>
                  </button>
                ))}
              </Card>
            )}
          </section>

        </div>
      </div>

      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateWorkspace={handleCreateWorkspace}
        isLoading={isCreating}
      />
    </div>
  );
};

export default Home;