import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '../hooks/useAuth';
import { useDocuments } from '../hooks/useDocuments';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { fetchWorkspace } from '../store/slices/workspaceSlice';
import { selectDocumentsLoading, selectCurrentDocument } from '../store/slices/documentsSlice';
import apiService from '../services/apiService';
import { getFileType } from '../utils/fileTypeStyles';

import PermissionGuard from '../components/permissions/PermissionGuard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Breadcrumb from '../components/documents/Breadcrumb';
import StatusTransitionMenu from '../components/documents/StatusTransitionMenu';
import FavoriteToggle from '../components/documents/FavoriteToggle';
import { DueDateChip, ExpiryDateChip } from '../components/documents/DueDateChip';
import WorkflowAssignmentPanel from '../components/documents/WorkflowAssignmentPanel';
import {
  ArrowDownToLine,
  ArrowLeft,
  Eye,
  Trash2,
} from 'lucide-react';

const formatDate = (d) => (
  d
    ? new Date(d).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null
);

const formatSize = (bytes) => {
  if (!bytes) return '0 KB';
  const kb = bytes / 1024;
  return kb < 1024 ? `${Math.round(kb)} KB` : `${(kb / 1024).toFixed(2)} MB`;
};

const getWorkflowPermissionMessage = ({
  status,
  isReviewer,
  isApprover,
  isOwner,
  workflow,
}) => {
  switch (status) {
    case 'draft':
      return isOwner || isReviewer || isApprover
        ? 'You can submit this document for review when it is ready.'
        : 'Document editing is required before it can be submitted for review.';
    case 'in-review':
      if (isReviewer) return 'You are the assigned reviewer. You can pass it to final review or request changes.';
      if (!workflow?.reviewer) return 'A reviewer must be assigned before this document can move forward.';
      return 'The assigned reviewer controls the next workflow transition.';
    case 'final-review':
      if (isApprover) return 'You are the assigned final approver. You can approve or request changes.';
      if (!workflow?.approver) return 'A final approver must be assigned before this document can move forward.';
      return 'The assigned final approver controls the next workflow transition.';
    case 'approved':
      return isOwner
        ? 'As the workspace owner, you can reopen this document if needed.'
        : 'This document is approved. Only the owner can reopen it.';
    default:
      return 'Workflow transitions are controlled by the document roles and current status.';
  }
};

const DocumentDetail = () => {
  const { documentId, workspaceId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();

  const document = useSelector(selectCurrentDocument);
  const documentLoading = useSelector(selectDocumentsLoading);
  const currentUser = useSelector((state) => state.auth.user);
  const workspace = useSelector((state) => {
    const current = state.workspaces.currentWorkspace;
    return current && current._id === workspaceId ? current : null;
  });
  const workspaceLoading = useSelector(
    (state) => state.workspaces.loading?.fetchWorkspace || false
  );

  const { getUserPermissions, getUserRole } = useWorkspaces();
  const userPermissions = getUserPermissions(workspaceId) || {};
  const userRole = getUserRole(workspaceId);

  const {
    fetchDocument,
    toggleFavorite,
    deleteDocument,
    updateDocumentStatus,
    updateDocumentWorkflow,
    downloadDocument,
  } = useDocuments(workspaceId);

  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/documents/${documentId}` } });
    }
  }, [isAuthenticated, navigate, documentId]);

  useEffect(() => {
    if (!documentId || !isAuthenticated) return;
    fetchDocument(documentId);
    if (workspaceId) dispatch(fetchWorkspace(workspaceId));
  }, [documentId, workspaceId, isAuthenticated, fetchDocument, dispatch]);

  useEffect(() => {
    if (!showPreview || !documentId || !isAuthenticated || !document || documentLoading) return;

    let cancelled = false;

    const loadPreview = async () => {
      setPreviewLoading(true);
      setPreviewError(null);

      try {
        const res = await apiService.documentApi.previewDocument(documentId);
        if (!cancelled) setPreviewContent(res);
      } catch (err) {
        try {
          const res = await apiService.documentApi.downloadDocument(documentId);
          if (!cancelled) setPreviewContent(res.data || res);
        } catch {
          if (!cancelled) setPreviewError('Failed to load document preview');
        }
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    };

    loadPreview();

    return () => {
      cancelled = true;
    };
  }, [showPreview, documentId, isAuthenticated, document, documentLoading]);

  const handleBack = () => {
    navigate(
      workspaceId ? `/workspaces/${workspaceId}/documents` : '/documents'
    );
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${document.name}"? This can't be undone.`)) return;
    const ok = await deleteDocument(documentId);
    if (ok) handleBack();
  };

  const handleToggleFavorite = () => toggleFavorite(document._id, document.name);

  const handleStatusChange = (nextStatus, comment) =>
    updateDocumentStatus(documentId, nextStatus, workspaceId, comment);

  const handleWorkflowChange = ({ reviewerId, approverId }) =>
    updateDocumentWorkflow(documentId, { reviewerId, approverId });

  const handleDownload = () => downloadDocument(documentId, document.name);

  const handleTogglePreview = () => {
    setShowPreview((current) => !current);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div
          className="h-7 w-7 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600"
          aria-label="Loading"
        />
      </div>
    );
  }

  if ((documentLoading || workspaceLoading) && !document) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div
          className="h-7 w-7 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600"
          aria-label="Loading document"
        />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-semibold text-ink">Document not found</h1>
        <p className="mt-2 text-ink-muted">
          It may have been deleted, or you don&apos;t have permission to view it.
        </p>
        <Button className="mt-6" onClick={handleBack}>
          Back to documents
        </Button>
      </div>
    );
  }

  const fileType = getFileType(document);
  const Icon = fileType.Icon;
  const ownerName = document.owner?.name || document.uploadedBy?.name;

  const extractId = (value) => (typeof value === 'string' ? value : value?._id);
  const isReviewer = !!currentUser && extractId(document.workflow?.reviewer) === currentUser.id;
  const isApprover = !!currentUser && extractId(document.workflow?.approver) === currentUser.id;
  const isOwner = userRole === 'owner';
  const canEdit = !!userPermissions.canEdit;
  const canManageWorkflow = !!userPermissions.canManageWorkflow;

  const workflowPermissionMessage = getWorkflowPermissionMessage({
    status: document.status,
    isReviewer,
    isApprover,
    isOwner,
    workflow: document.workflow,
  });

  return (
    <div className="min-h-full bg-bg">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Breadcrumb
          workspaceId={workspaceId}
          workspaceName={workspace?.name}
          documentName={document.name}
        />

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
          <main className="min-w-0">
            <section className="border-b border-border pb-6">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${fileType.tile}`}
                  aria-hidden="true"
                >
                  <Icon className={`h-6 w-6 ${fileType.icon}`} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h1 className="break-words text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                        {document.name}
                      </h1>

                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
                        {workspace?.name && <span>{workspace.name}</span>}
                        {workspace?.name && ownerName && <span aria-hidden="true">·</span>}
                        {ownerName && <span>{ownerName}</span>}
                        {document.uploadDate && <span aria-hidden="true">·</span>}
                        {document.uploadDate && (
                          <span>Uploaded {formatDate(document.uploadDate)}</span>
                        )}
                        {document.size !== undefined && document.size !== null && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{formatSize(document.size)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <FavoriteToggle
                      isFavorite={!!document.isFavorite}
                      onToggle={handleToggleFavorite}
                      size="sm"
                    />
                  </div>

                  {document.description && (
                    <p className="mt-3 max-w-3xl leading-6 text-ink-muted">
                      {document.description}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {document.dueDate && <DueDateChip date={document.dueDate} />}
                    {document.expiryDate && <ExpiryDateChip date={document.expiryDate} />}
                    {document.isPublic && (
                      <Badge variant="success" size="sm">
                        Public
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="border-b border-border py-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.08em] text-ink-muted">
                      Document workflow
                    </p>
                    <p className="mt-1 text-sm text-ink-muted">
                      {workflowPermissionMessage}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <StatusTransitionMenu
                    status={document.status}
                    onChange={handleStatusChange}
                    canEdit={canEdit}
                    isReviewer={isReviewer}
                    isApprover={isApprover}
                    isOwner={isOwner}
                    prominent
                  />
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-border bg-surface-2 p-4 sm:p-5">
                <WorkflowAssignmentPanel
                  workflow={document.workflow}
                  members={workspace?.members || []}
                  canManageWorkflow={canManageWorkflow}
                  loading={false}
                  onChange={handleWorkflowChange}
                />
              </div>

              {document.tags?.length > 0 && (
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-ink-muted">Tags</span>
                  {document.tags.map((tag, i) => (
                    <Badge key={i} variant="gray" outline size="sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </section>

            <section className="pt-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold tracking-tight text-ink">
                    Document preview
                  </h2>
                  <p className="mt-1 text-sm text-ink-muted">
                    Preview only loads when you ask to view the document.
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTogglePreview}
                    leftIcon={<Eye className="h-4 w-4" aria-hidden="true" />}
                    aria-expanded={showPreview}
                  >
                    {showPreview ? 'Hide preview' : 'Preview document'}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    leftIcon={<ArrowDownToLine className="h-4 w-4" aria-hidden="true" />}
                  >
                    Download
                  </Button>
                </div>
              </div>

              {showPreview && (
                <Card padding={false} className="mt-4 overflow-hidden">
                  {previewLoading ? (
                    <div className="flex min-h-[320px] items-center justify-center">
                      <div
                        className="h-7 w-7 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600"
                        aria-label="Loading preview"
                      />
                    </div>
                  ) : previewError ? (
                    <div className="flex min-h-[220px] flex-col items-center justify-center px-6 py-12 text-center">
                      <p className="text-sm text-ink-muted">{previewError}</p>
                      <Button className="mt-4" size="sm" onClick={handleDownload}>
                        Download instead
                      </Button>
                    </div>
                  ) : (
                    <div className="p-4 sm:p-6">
                      <DocumentPreviewBody
                        document={document}
                        content={previewContent}
                        onDownload={handleDownload}
                      />
                    </div>
                  )}
                </Card>
              )}
            </section>
          </main>

          <aside className="min-w-0 lg:sticky lg:top-6 lg:self-start">
            <div className="border-l-0 border-border lg:border-l lg:pl-6">
              <div className="space-y-6">
                <section>
                  <h2 className="font-semibold tracking-tight text-ink">
                    Actions
                  </h2>

                  <div className="mt-3">
                    <PermissionGuard
                      workspaceId={workspaceId}
                      requiredPermissions={['delete']}
                      showFallback={false}
                    >
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-danger/30 px-3 text-sm font-medium text-danger transition-colors hover:bg-danger-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Delete document
                      </button>
                    </PermissionGuard>
                  </div>
                </section>

                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Back to documents
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

const DocumentPreviewBody = ({ document, content, onDownload }) => {
  const [decodedText, setDecodedText] = useState(null);
  const type = document.type?.toLowerCase() || '';

  useEffect(() => {
    if (
      content instanceof Blob &&
      (type.includes('text') || type.includes('javascript') || type.includes('json'))
    ) {
      content.text().then(setDecodedText);
    }
  }, [content, type]);

  if (!content) return null;

  if (
    type.includes('text') ||
    type.includes('javascript') ||
    type.includes('json') ||
    type.includes('css') ||
    type.includes('html')
  ) {
    const text = decodedText ?? (typeof content === 'string' ? content : null);

    if (text === null) {
      return <div className="text-sm text-ink-muted">Reading text content...</div>;
    }

    return (
      <pre className="max-h-[600px] overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-surface-2 p-4 font-mono text-sm text-ink">
        {text}
      </pre>
    );
  }

  if (type.includes('pdf')) {
    const blob = content instanceof Blob
      ? content
      : new Blob([content], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    return (
      <iframe
        src={url}
        title="PDF preview"
        className="h-[600px] w-full rounded-xl border border-border"
        onLoad={() => setTimeout(() => URL.revokeObjectURL(url), 1000)}
      />
    );
  }

  if (
    type.includes('image') ||
    ['png', 'jpg', 'jpeg', 'gif', 'svg'].some((ext) => type.includes(ext))
  ) {
    const blob = content instanceof Blob
      ? content
      : new Blob([content], { type: document.type });
    const url = URL.createObjectURL(blob);

    return (
      <div className="flex justify-center">
        <img
          src={url}
          alt={document.name}
          className="max-h-[600px] max-w-full rounded-xl object-contain"
          onLoad={() => setTimeout(() => URL.revokeObjectURL(url), 1000)}
        />
      </div>
    );
  }

  return (
    <div className="py-12 text-center">
      <p className="text-sm text-ink-muted">
        This file type ({document.type || 'unknown'}) can&apos;t be previewed.
      </p>
      <Button className="mt-4" onClick={onDownload}>
        Download instead
      </Button>
    </div>
  );
};

export default DocumentDetail;