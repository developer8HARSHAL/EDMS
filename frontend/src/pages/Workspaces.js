import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Search, Plus, FolderKanban, ChevronRight, Settings } from 'lucide-react';

import { useWorkspaces } from '../hooks/useWorkspaces';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import CreateWorkspaceModal from '../components/workspace/CreateWorkspaceModal';

const getInitials = (name = '') => {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (!words.length) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return (words[0][0] + words[1][0]).toUpperCase();
};

const formatUpdated = (dateString) => {
  if (!dateString) return '—';

  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const Workspaces = () => {
  const navigate = useNavigate();

  const {
    workspaces,
    isLoading,
    hasWorkspaces,
    filters,
    setFilters,
    fetchWorkspaces,
    createWorkspace,
    pagination,
    setCurrentPage,
    loading: workspaceActionLoading,
  } = useWorkspaces();

  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [isCreating, setIsCreating] = useState(false);

  // Search-filtered results live separately from the canonical `workspaces` list
  // (which Sidebar reads globally) — see workspaceSlice.js fetchWorkspaces reducer.
  const searchResults = useSelector((state) => state.workspaces.searchResults);
  const workspaceCards = searchResults ?? workspaces;

  useEffect(() => {
    fetchWorkspaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters({ search: searchInput });
        fetchWorkspaces({ search: searchInput });
      }
    }, 300);

    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const closeCreateModal = () => setIsCreating(false);


  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">
            Workspaces
          </h1>
        </div>

        <Button
          onClick={() => setIsCreating(true)}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          New workspace
        </Button>
      </div>

      <div className="mb-4 max-w-md">
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search workspaces..."
          leftIcon={<Search className="h-4 w-4" />}
        />
      </div>

      {isLoading && !hasWorkspaces ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="card min-h-[220px] p-5"
              aria-hidden="true"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-surface-2" />

                  <div className="min-w-0 space-y-2">
                    <div className="h-4 w-32 animate-pulse rounded bg-surface-2" />
                    <div className="h-3 w-20 animate-pulse rounded bg-surface-2" />
                  </div>
                </div>

                <div className="h-8 w-8 animate-pulse rounded-lg bg-surface-2" />
              </div>

              <div className="mt-6 h-10 w-full animate-pulse rounded-xl bg-surface-2" />

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="h-14 animate-pulse rounded-xl bg-surface-2" />
                <div className="h-14 animate-pulse rounded-xl bg-surface-2" />
              </div>

              <div className="mt-5 h-3 w-24 animate-pulse rounded bg-surface-2" />
            </div>
          ))}
        </div>
      ) : !hasWorkspaces && !isCreating ? (
        <div className="card p-10 text-center">
          <FolderKanban className="mx-auto mb-3 h-7 w-7 text-ink-muted" />

          <p className="font-semibold text-ink">
            No workspaces yet
          </p>

          <p className="mt-1 mb-5 text-sm text-ink-muted">
            Create one to start organizing documents.
          </p>

          <Button
            onClick={() => setIsCreating(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create workspace
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {workspaceCards.map((workspace) => {
            const isPrivate = !workspace.settings?.isPublic;
            const canManage =
              workspace.userRole === 'admin' ||
              workspace.userRole === 'owner';

            return (
              <article
                key={workspace._id}
                role="button"
                tabIndex={0}
                onClick={() =>
                  navigate(`/workspaces/${workspace._id}`)
                }
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    navigate(`/workspaces/${workspace._id}`);
                  }
                }}
       className="
  card
  group
  flex
  min-h-[220px]
  cursor-pointer
  flex-col
  p-5
  transition-colors
  duration-150

  focus-visible:outline-none
  focus-visible:ring-2
  focus-visible:ring-primary-500
  focus-visible:ring-offset-2
  focus-visible:ring-offset-bg
  dark:hover:border-primary-800
  dark:hover:bg-primary-950/30
"
              >
                {/* Identity / actions */}
                <div className="flex min-w-0 items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="icon-badge icon-badge-3 h-11 w-11 text-xs font-semibold"
                      aria-hidden="true"
                    >
                      {getInitials(workspace.name)}
                    </div>

                    <div className="min-w-0">
                      <h2
                        title={workspace.name}
                        className="truncate text-base font-semibold tracking-tight text-ink"
                      >
                        {workspace.name}
                      </h2>

                      <p className="mt-0.5 text-xs text-ink-muted">
                        {isPrivate ? 'Private workspace' : 'Shared workspace'}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {canManage && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(
                            `/workspaces/${workspace._id}/settings`
                          );
                        }}
                        className="
                          flex
                          h-8
                          w-8
                          items-center
                          justify-center
                          rounded-lg
                          text-ink-muted
                          transition-colors
                          hover:bg-surface-2
                          hover:text-ink
                          focus-visible:outline-none
                          focus-visible:ring-2
                        "
                        aria-label={`Settings for ${workspace.name}`}
                      >
                        <Settings
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                      </button>
                    )}

                    <span
                      className="
                        flex
                        h-8
                        w-8
                        items-center
                        justify-center
                        rounded-lg
                        text-ink-muted
                        transition-all
                        group-hover:bg-surface-2
                        group-hover:text-primary-700
                      "
                      aria-hidden="true"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>

                {/* Access */}
                <div className="mt-5 flex items-center justify-between gap-3">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                    Access
                  </span>

                  <Badge
                    variant="primary"
                    size="sm"
                    className="capitalize"
                  >
                    {workspace.userRole || '—'}
                  </Badge>
                </div>

                {/* Metrics */}
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="card-nested rounded-xl p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">
                      Documents
                    </p>

                    <p className="mt-1 font-mono text-lg font-semibold leading-none tabular-nums text-ink">
                      {workspace.documentCount ?? 0}
                    </p>
                  </div>

                  <div className="card-nested rounded-xl p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">
                      Members
                    </p>

                    <p className="mt-1 font-mono text-lg font-semibold leading-none tabular-nums text-ink">
                      {workspace.memberCount ?? 0}
                    </p>
                  </div>
                </div>

                {/* Footer metadata */}
                <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                  <span className="text-xs text-ink-muted">
                    Updated {formatUpdated(workspace.updatedAt)}
                  </span>

                  <span className="text-xs font-medium text-primary-700 transition-transform group-hover:translate-x-0.5 dark:text-primary-300">
                    Open workspace →
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-ink-muted">
          <Button
            variant="outline"
            disabled={!pagination.hasPrevPage}
            onClick={() =>
              setCurrentPage(pagination.currentPage - 1)
            }
          >
            Previous
          </Button>

          <span>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>

          <Button
            variant="outline"
            disabled={!pagination.hasNextPage}
            onClick={() =>
              setCurrentPage(pagination.currentPage + 1)
            }
          >
            Next
          </Button>
        </div>
      )}

      <CreateWorkspaceModal
        isOpen={isCreating}
        onClose={closeCreateModal}
        onCreateWorkspace={createWorkspace}
        isLoading={workspaceActionLoading?.createWorkspace || false}
      />
    </div>
  );
};

export default Workspaces;