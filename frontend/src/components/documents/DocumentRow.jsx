import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusPill from './StatusPill';
import Avatar from '../ui/Avatar';
import { getFileType } from '../../utils/fileTypeStyles';

// Formats a modified/updated timestamp as a short relative-ish label.
const formatModified = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

// Reusable document row: icon, name, StatusPill, owner, modified date.
// Used by Home's recent-documents list; the Documents table (step 7) can
// wrap or extend this rather than duplicating the layout.
const DocumentRow = ({ document: doc }) => {
  const navigate = useNavigate();
  if (!doc) return null;

  const fileType = getFileType(doc);
  const Icon = fileType.Icon;
  const workspaceId = doc.workspace?._id || doc.workspace;
  const ownerName = doc.owner?.name || doc.uploadedBy?.name;

  const handleClick = () => {
    navigate(workspaceId ? `/workspaces/${workspaceId}/documents/${doc._id}` : `/documents/preview/${doc._id}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-surface-2 transition-colors"
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${fileType.tile}`}>
        <Icon className={`h-5 w-5 ${fileType.icon}`} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{doc.name || doc.originalName || 'Untitled document'}</p>
        {ownerName && <p className="truncate text-xs text-ink-muted">{ownerName}</p>}
      </div>

      {ownerName && <Avatar name={ownerName} size="sm" className="shrink-0" />}
      {doc.status && <StatusPill status={doc.status} />}

      {formatModified(doc.updatedAt || doc.lastModified) && (
        <span className="hidden shrink-0 text-xs text-ink-muted sm:block">
          {formatModified(doc.updatedAt || doc.lastModified)}
        </span>
      )}
    </button>
  );
};

export default DocumentRow;