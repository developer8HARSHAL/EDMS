import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '../hooks/useAuth';
import { useDocuments } from '../hooks/useDocuments';
import { fetchWorkspace } from '../store/slices/workspaceSlice';
import { selectDocumentsLoading, selectCurrentDocument } from '../store/slices/documentsSlice';
import apiService from '../services/apiService';
import { getFileType } from '../utils/fileTypeStyles';

import PermissionGuard from '../components/permissions/PermissionGuard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Breadcrumb from '../components/documents/Breadcrumb';
import StatusTransitionMenu from '../components/documents/StatusTransitionMenu';
import FavoriteToggle from '../components/documents/FavoriteToggle';
import { DueDateChip, ExpiryDateChip } from '../components/documents/DueDateChip';
import ReviewerAvatarGroup from '../components/documents/ReviewerAvatarGroup';
import ReviewerPicker from '../components/documents/ReviewerPicker';
import ShareRow from '../components/documents/ShareRow';
import EditDocumentModal from '../components/EditDocumentModal';

import {
  PencilIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  DocumentDuplicateIcon,
  ArchiveBoxIcon,
} from '@heroicons/react/24/outline';

const formatDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : null);
const formatSize = (bytes) => {
  if (!bytes) return '0 KB';
  const kb = bytes / 1024;
  return kb < 1024 ? `${Math.round(kb)} KB` : `${(kb / 1024).toFixed(2)} MB`;
};

const DocumentDetail = () => {
  const { documentId, workspaceId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();

  const document = useSelector(selectCurrentDocument);
  const documentLoading = useSelector(selectDocumentsLoading);
  const workspace = useSelector((state) => {
    const current = state.workspaces.currentWorkspace;
    return current && current._id === workspaceId ? current : null;
  });
  const workspaceLoading = useSelector((state) => state.workspaces.loading?.fetchWorkspace || false);

  const {
    fetchDocument,
    toggleFavorite,
    deleteDocument,
    updateDocumentStatus,
    updateDocumentReviewers,
    duplicateDocument,
    archiveDocument,
    downloadDocument,
  } = useDocuments(workspaceId);

  const [showEditModal, setShowEditModal] = useState(false);
  const [previewContent, setPreviewContent] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { state: { from: `/documents/${documentId}` } });
  }, [isAuthenticated, navigate, documentId]);

  useEffect(() => {
    if (!documentId || !isAuthenticated) return;
    fetchDocument(documentId);
    if (workspaceId) dispatch(fetchWorkspace(workspaceId));
  }, [documentId, workspaceId, isAuthenticated, fetchDocument, dispatch]);

  useEffect(() => {
    if (!documentId || !isAuthenticated || !document || documentLoading) return;

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
    return () => { cancelled = true; };
  }, [documentId, isAuthenticated, document, documentLoading]);

  const handleBack = () => navigate(workspaceId ? `/workspaces/${workspaceId}/documents` : '/documents');

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${document.name}"? This can't be undone.`)) return;
    const ok = await deleteDocument(documentId);
    if (ok) handleBack();
  };

  const handleToggleFavorite = () => toggleFavorite(document._id, document.name);

  const handleStatusChange = (nextStatus) => updateDocumentStatus(documentId, nextStatus, workspaceId);

  const handleReviewersChange = (reviewerIds) => updateDocumentReviewers(documentId, reviewerIds);

  const handleShared = () => fetchDocument(documentId);

  const handleDownload = () => downloadDocument(documentId, document.name);
  const handleDuplicate = () => duplicateDocument(documentId, workspaceId, document.name);
  const handleArchive = () => archiveDocument(documentId, workspaceId, document.name);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-300 border-t-primary-600" />
      </div>
    );
  }

  if ((documentLoading || workspaceLoading) && !document) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-300 border-t-primary-600" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-ink mb-2">Document not found</h1>
        <p className="text-ink-muted mb-6">It may have been deleted, or you don't have permission to view it.</p>
        <Button onClick={handleBack}>Back to documents</Button>
      </div>
    );
  }

  const fileType = getFileType(document);
  const Icon = fileType.Icon;
  const ownerName = document.owner?.name || document.uploadedBy?.name;

  return (
    <PermissionGuard
      workspaceId={workspaceId}
      requiredPermissions={['read']}
      fallback={
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-xl font-semibold text-ink mb-2">Access denied</h1>
          <p className="text-ink-muted mb-6">You don't have permission to view this document.</p>
          <Button onClick={() => navigate(`/workspaces/${workspaceId}`)}>Back to workspace</Button>
        </div>
      }
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Breadcrumb workspaceId={workspaceId} workspaceName={workspace?.name} documentName={document.name} />

        <Card className="mb-6">
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${fileType.tile}`}>
              <Icon className={`h-6 w-6 ${fileType.icon}`} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-xl font-semibold text-ink break-words">{document.name}</h1>
                <FavoriteToggle isFavorite={!!document.isFavorite} onToggle={handleToggleFavorite} />
              </div>

              {document.description && <p className="mt-1 text-sm text-ink-muted">{document.description}</p>}

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
                <span>{formatSize(document.size)}</span>
                <span>Uploaded {formatDate(document.uploadDate || document.createdAt)}</span>
                {ownerName && (
                  <span className="flex items-center gap-1.5">
                    <Avatar name={ownerName} size="xs" />
                    {ownerName}
                  </span>
                )}
                {document.lastModified && document.lastModified !== document.createdAt && (
                  <span>Modified {formatDate(document.lastModified)}</span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusTransitionMenu status={document.status} onChange={handleStatusChange} />
                <DueDateChip date={document.dueDate} />
                <ExpiryDateChip date={document.expiryDate} />
                {document.isPublic && <Badge variant="success" size="sm">Public</Badge>}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <ReviewerAvatarGroup reviewerIds={document.reviewers || []} members={workspace?.members || []} />
                <PermissionGuard workspaceId={workspaceId} requiredPermissions={['write']} showFallback={false}>
                  <ReviewerPicker
                    reviewerIds={document.reviewers || []}
                    members={workspace?.members || []}
                    onChange={handleReviewersChange}
                  />
                </PermissionGuard>
              </div>

              {document.tags?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {document.tags.map((tag, i) => (
                    <Badge key={i} variant="gray" outline size="sm">{tag}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
            <button onClick={handleBack} className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
              <ArrowUturnLeftIcon className="h-4 w-4" />
              Back
            </button>

            <div className="flex items-center gap-2">
              <Button onClick={handleDownload} variant="outline" size="sm" title="Download">
                <ArrowDownTrayIcon className="h-4 w-4" />
              </Button>
              <PermissionGuard workspaceId={workspaceId} requiredPermissions={['write']} showFallback={false}>
                <Button onClick={handleDuplicate} variant="outline" size="sm" title="Duplicate">
                  <DocumentDuplicateIcon className="h-4 w-4" />
                </Button>
                <Button onClick={handleArchive} variant="outline" size="sm" title="Archive">
                  <ArchiveBoxIcon className="h-4 w-4" />
                </Button>
                <Button onClick={() => setShowEditModal(true)} variant="outline" size="sm" title="Edit">
                  <PencilIcon className="h-4 w-4" />
                </Button>
              </PermissionGuard>
              <PermissionGuard workspaceId={workspaceId} requiredPermissions={['delete']} showFallback={false}>
                <Button onClick={handleDelete} variant="outline" size="sm" title="Delete">
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </PermissionGuard>
            </div>
          </div>
        </Card>

        <PermissionGuard workspaceId={workspaceId} requiredPermissions={['write']} showFallback={false}>
          <Card className="mb-6">
            <h2 className="text-sm font-medium text-ink mb-3">Sharing</h2>
            <ShareRow documentId={documentId} permissions={document.permissions || []} onShared={handleShared} />
          </Card>
        </PermissionGuard>

        <Card padding={false}>
          {previewLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-300 border-t-primary-600" />
            </div>
          ) : previewError ? (
            <div className="p-8 text-center">
              <p className="text-sm text-ink-muted mb-4">{previewError}</p>
              <Button onClick={handleDownload}>Download instead</Button>
            </div>
          ) : (
            <div className="p-6">
              <DocumentPreviewBody document={document} content={previewContent} onDownload={handleDownload} />
            </div>
          )}
        </Card>
      </div>

      <EditDocumentModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        document={document}
        workspaceId={workspaceId}
        onSuccess={() => {
          setShowEditModal(false);
          fetchDocument(documentId);
        }}
      />
    </PermissionGuard>
  );
};

// Renders the actual file content — text/PDF/image get inline viewers, everything
// else falls back to a "not previewable" card. Kept as a plain function component
// rather than inline JSX since it needs its own decode branching.
const DocumentPreviewBody = ({ document, content, onDownload }) => {
  const [decodedText, setDecodedText] = useState(null);
  const type = document.type?.toLowerCase() || '';

  useEffect(() => {
    if (content instanceof Blob && (type.includes('text') || type.includes('javascript') || type.includes('json'))) {
      content.text().then(setDecodedText);
    }
  }, [content, type]);

  if (!content) return null;

  if (type.includes('text') || type.includes('javascript') || type.includes('json') || type.includes('css') || type.includes('html')) {
    const text = decodedText ?? (typeof content === 'string' ? content : null);
    if (text === null) {
      return <div className="text-sm text-ink-muted">Reading text content...</div>;
    }
    return (
      <pre className="overflow-auto rounded-lg border border-border bg-surface-2 p-4 text-sm font-mono whitespace-pre-wrap text-ink max-h-[600px]">
        {text}
      </pre>
    );
  }

  if (type.includes('pdf')) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    return (
      <iframe
        src={url}
        title="PDF preview"
        className="h-[600px] w-full rounded-lg border border-border"
        onLoad={() => setTimeout(() => URL.revokeObjectURL(url), 1000)}
      />
    );
  }

  if (type.includes('image') || ['png', 'jpg', 'jpeg', 'gif', 'svg'].some((ext) => type.includes(ext))) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: document.type });
    const url = URL.createObjectURL(blob);
    return (
      <div className="flex justify-center">
        <img
          src={url}
          alt={document.name}
          className="max-h-[600px] max-w-full rounded-lg object-contain"
          onLoad={() => setTimeout(() => URL.revokeObjectURL(url), 1000)}
        />
      </div>
    );
  }

  return (
    <div className="py-12 text-center">
      <p className="text-sm text-ink-muted mb-4">This file type ({document.type || 'unknown'}) can't be previewed.</p>
      <Button onClick={onDownload}>Download instead</Button>
    </div>
  );
};

export default DocumentDetail;
