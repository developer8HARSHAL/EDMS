import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, FolderKanban, ChevronRight, Settings } from 'lucide-react';

import { useWorkspaces } from '../hooks/useWorkspaces';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';

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
  } = useWorkspaces();

  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [createError, setCreateError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

  const handleCreate = async () => {
    setCreateError('');
    setIsSaving(true);

    try {
      await createWorkspace({
        name: newName.trim(),
        description: newDescription.trim(),
      });

      setNewName('');
      setNewDescription('');
      setIsCreating(false);
    } catch (error) {
      setCreateError(error.message || 'Failed to create workspace');
    } finally {
      setIsSaving(false);
    }
  };

  const cancelCreate = () => {
    setIsCreating(false);
    setNewName('');
    setNewDescription('');
    setCreateError('');
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (workspace) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="icon-badge icon-badge-3 h-9 w-9 text-xs font-semibold">
            {getInitials(workspace.name)}
          </div>

          <div className="min-w-0">
            <p className="truncate font-medium text-ink">
              {workspace.name}
            </p>

            <p className="truncate text-xs text-ink-muted">
              {workspace.settings?.isPublic ? 'Shared' : 'Private'}
            </p>
          </div>
        </div>
      ),
    },

    {
      key: 'role',
      label: 'Role',
      render: (workspace) => (
        <Badge variant="primary" size="sm" className="capitalize">
          {workspace.userRole || '—'}
        </Badge>
      ),
    },

    {
      key: 'members',
      label: 'Members',
      align: 'center',
      render: (workspace) => workspace.memberCount ?? 0,
    },

    {
      key: 'documents',
      label: 'Documents',
      align: 'center',
      render: (workspace) => workspace.documentCount ?? 0,
    },

    {
      key: 'updated',
      label: 'Updated',
      align: 'right',
      render: (workspace) => formatUpdated(workspace.updatedAt),
    },

    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (workspace) => (
        <div className="flex items-center justify-end gap-1">
          {(workspace.userRole === 'admin' ||
            workspace.userRole === 'owner') && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/workspaces/${workspace._id}/settings`);
              }}
              className="rounded-md p-1.5 text-ink-muted hover:bg-surface-2 hover:text-ink"
              aria-label={`Settings for ${workspace.name}`}
            >
              <Settings className="h-4 w-4" />
            </button>
          )}

          <ChevronRight className="h-4 w-4 text-ink-muted" />
        </div>
      ),
    },
  ];

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
        <div className="card overflow-hidden">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 border-b border-border px-5 py-4 last:border-0"
            >
              <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-surface-2" />

              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-1/4 animate-pulse rounded bg-surface-2" />
                <div className="h-3 w-1/6 animate-pulse rounded bg-surface-2" />
              </div>
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
        <Table
          columns={columns}
          data={workspaces}
          onRowClick={(workspace) =>
            navigate(`/workspaces/${workspace._id}`)
          }
        />
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

      <Modal
        isOpen={isCreating}
        onClose={cancelCreate}
        title="Create workspace"
      >
        <div className="px-6 pt-5 pb-4">
          {createError && (
            <p className="mb-4 rounded-lg bg-primary-50 px-3 py-2 text-sm text-primary-700 dark:bg-primary-950/60 dark:text-primary-300">
              {createError}
            </p>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">
                Workspace name
                <span className="ml-1 text-primary-600">*</span>
              </label>

              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Consumer Legal Team"
                autoFocus
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">
                Description
                <span className="ml-1 font-normal text-ink-muted">
                  (optional)
                </span>
              </label>

              <textarea
                className="input-field min-h-[88px] resize-none"
                rows={3}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Briefly describe what this workspace is for"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <Button
            variant="outline"
            onClick={cancelCreate}
            disabled={isSaving}
          >
            Cancel
          </Button>

          <Button
            onClick={handleCreate}
            disabled={isSaving || !newName.trim()}
          >
            {isSaving ? 'Creating...' : 'Create workspace'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Workspaces;