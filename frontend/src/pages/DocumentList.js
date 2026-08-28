import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Search,
  Plus,
  FolderOpen,
  Building2,
  FileText,
  Star,
} from 'lucide-react';

import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import StatusPill from '../components/documents/StatusPill';
import EmptyState from '../components/ui/EmptyState';
import Table from '../components/ui/Table';
import BulkActionBar from '../components/documents/BulkActionBar';
import PermissionGuard from '../components/permissions/PermissionGuard';
import { useDocuments } from '../hooks/useDocuments';
import { useWorkspaces } from '../hooks/useWorkspaces';

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'in-review', label: 'In review' },
  { key: 'final-review', label: 'Final review' },
  { key: 'approved', label: 'Approved' },
];

const TABS = [
  { key: 'all', label: 'All documents' },
  { key: 'favorites', label: 'Favorites' },
  { key: 'shared', label: 'Shared with me' },
];

const formatDate = (value) => {
  if (!value) return '—';

  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const DocumentList = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { currentWorkspace, getUserRole } = useWorkspaces();
  const userRole = workspaceId ? getUserRole(workspaceId) : null;

  const {
    documents,
    favorites,
    sharedDocuments,
    isLoading,
    error,
    fetchDocuments,
    fetchWorkspaceDocuments,
    fetchFavoriteDocuments,
    fetchSharedDocuments,
    toggleFavorite,
    deleteDocument,
    bulkDeleteDocuments,
  } = useDocuments(workspaceId);

  const [activeTab, setActiveTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    setSelectedIds([]);

    if (workspaceId) {
      fetchWorkspaceDocuments(workspaceId);
    } else if (activeTab === 'favorites') {
      fetchFavoriteDocuments();
    } else if (activeTab === 'shared') {
      fetchSharedDocuments();
    } else {
      fetchDocuments();
    }
  }, [
    workspaceId,
    activeTab,
    fetchWorkspaceDocuments,
    fetchFavoriteDocuments,
    fetchSharedDocuments,
    fetchDocuments,
  ]);

  const sourceDocuments =
    !workspaceId && activeTab === 'favorites'
      ? favorites
      : !workspaceId && activeTab === 'shared'
        ? sharedDocuments
        : documents;

  const filteredDocuments = useMemo(() => {
    const list = Array.isArray(sourceDocuments) ? sourceDocuments : [];
    const term = searchTerm.trim().toLowerCase();

    return list.filter((doc) => {
      if (!doc) return false;

      const matchesStatus =
        statusFilter === 'all' || doc.status === statusFilter;

      const matchesSearch =
        !term ||
        doc.name?.toLowerCase().includes(term) ||
        doc.description?.toLowerCase().includes(term) ||
        doc.tags?.some((tag) => tag.toLowerCase().includes(term));

      return matchesStatus && matchesSearch;
    });
  }, [sourceDocuments, statusFilter, searchTerm]);

  const statusCounts = useMemo(() => {
    const list = Array.isArray(sourceDocuments) ? sourceDocuments : [];

    return list.reduce((acc, doc) => {
      if (doc?.status) {
        acc[doc.status] = (acc[doc.status] || 0) + 1;
      }
      return acc;
    }, {});
  }, [sourceDocuments]);

  const handleSelectChange = (docId) => {
    setSelectedIds((prev) =>
      prev.includes(docId)
        ? prev.filter((id) => id !== docId)
        : [...prev, docId]
    );
  };

  const handleToggleFavorite = (doc) => {
    toggleFavorite(doc._id, doc.name);
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;

    if (
      !window.confirm(
        `Delete ${selectedIds.length} document${
          selectedIds.length > 1 ? 's' : ''
        }? This can't be undone.`
      )
    ) {
      return;
    }

    setBulkLoading(true);

    try {
      if (workspaceId) {
        await bulkDeleteDocuments(selectedIds);
      } else {
        await Promise.all(selectedIds.map((id) => deleteDocument(id)));
      }

      setSelectedIds([]);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleUpload = () => {
    navigate(
      workspaceId
        ? `/workspaces/${workspaceId}/upload`
        : '/documents/upload'
    );
  };

  const pageTitle =
    workspaceId && currentWorkspace
      ? `${currentWorkspace.name} Documents`
      : 'Documents';

  const hasAnyDocuments =
    Array.isArray(sourceDocuments) && sourceDocuments.length > 0;

  const allFilteredSelected =
    filteredDocuments.length > 0 &&
    filteredDocuments.every((doc) => selectedIds.includes(doc._id));

  const handleSelectAll = () => {
    setSelectedIds(
      allFilteredSelected
        ? []
        : filteredDocuments.map((doc) => doc._id)
    );
  };

  const columns = [
    {
      key: 'select',
      label: '',
      width: 'w-[52px]',
      cellClassName: 'px-4',
      render: (doc) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(doc._id)}
          onChange={() => handleSelectChange(doc._id)}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
          aria-label={`Select ${doc.name}`}
        />
      ),
    },

    {
      key: 'name',
      label: 'Document',
      render: (doc) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-ink-muted">
            <FileText className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <p className="truncate font-medium text-ink">
              {doc.name}
            </p>

            {doc.description && (
              <p className="truncate text-xs text-ink-muted">
                {doc.description}
              </p>
            )}
          </div>
        </div>
      ),
    },

    {
      key: 'status',
      label: 'Status',
      width: 'w-[130px]',
      render: (doc) => <StatusPill status={doc.status} size="sm" />
    },

    {
      key: 'dueDate',
      label: 'Due',
      width: 'w-[125px]',
      render: (doc) => formatDate(doc.dueDate),
    },

    {
      key: 'modified',
      label: 'Modified',
      width: 'w-[125px]',
      render: (doc) =>
        formatDate(doc.lastModified || doc.updatedAt),
    },

    {
      key: 'favorite',
      label: '',
      width: 'w-[56px]',
      align: 'right',
      cellClassName: 'px-4',
      render: (doc) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleToggleFavorite(doc);
          }}
          className="rounded-md p-1.5 text-ink-muted hover:bg-surface-2 hover:text-ink"
          aria-label={
            doc.isFavorite
              ? `Remove ${doc.name} from favorites`
              : `Add ${doc.name} to favorites`
          }
        >
          <Star
            className={`h-4 w-4 ${
              doc.isFavorite ? 'fill-current text-primary-500' : ''
            }`}
          />
        </button>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          {workspaceId && currentWorkspace && (
            <Building2 className="h-5 w-5 shrink-0 text-ink-muted" />
          )}

          <h1 className="truncate text-2xl font-bold text-ink">
            {pageTitle}
          </h1>

          {workspaceId && userRole && (
            <Badge variant="primary" size="sm" className="capitalize">
              {userRole}
            </Badge>
          )}
        </div>

        <PermissionGuard
          requiredPermissions={['write']}
          workspaceId={workspaceId}
          showFallback={false}
        >
          <Button
            onClick={handleUpload}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Upload document
          </Button>
        </PermissionGuard>
      </div>

      {!workspaceId && (
        <div className="mb-4 flex items-center gap-1 border-b border-border">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-primary-600 text-primary-700 dark:text-primary-400'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="w-full max-w-sm">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search documents..."
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {STATUS_FILTERS.map((filter) => {
            const count =
              filter.key === 'all'
                ? Array.isArray(sourceDocuments)
                  ? sourceDocuments.length
                  : 0
                : statusCounts[filter.key] || 0;

            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => setStatusFilter(filter.key)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  statusFilter === filter.key
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300'
                    : 'bg-surface-2 text-ink-muted hover:text-ink'
                }`}
              >
                {filter.label}
                <span className="text-ink-muted">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <BulkActionBar
        selectedCount={selectedIds.length}
        onDelete={handleBulkDelete}
        onClearSelection={() => setSelectedIds([])}
      />

      {isLoading ? (
        <div className="card flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-300 border-t-primary-600" />
        </div>
      ) : error ? (
        <div className="card py-16 text-center text-sm text-ink-muted">
          {error}
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="card">
          {hasAnyDocuments ? (
            <EmptyState
              icon={Search}
              title="No documents match"
              description="Try a different search term or status filter."
            />
          ) : (
            <EmptyState
              icon={FolderOpen}
              title="No documents yet"
              description={
                workspaceId
                  ? 'Upload the first document to this workspace.'
                  : 'Upload your first document to get started.'
              }
              actionLabel="Upload document"
              onAction={handleUpload}
            />
          )}
        </div>
      ) : (
        <Table
          columns={columns}
          data={filteredDocuments}
          ariaLabel="Documents"
          onRowClick={(doc) => navigate(`/documents/${doc._id}`)}
        />
      )}

     
    </div>
  );
};

export default DocumentList;