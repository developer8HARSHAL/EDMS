import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import StatusPill from './StatusPill';
import FavoriteToggle from './FavoriteToggle';
import { DueDateChip } from './DueDateChip';
import Avatar from '../ui/Avatar';
import { getFileType } from '../../utils/fileTypeStyles';

// Left-edge accent per lifecycle state — reuses StatusPill's own hue family rather
// than inventing new color. Draft is deliberately neutral (the default, no-signal
// state); in-review and approved are the two states worth scanning a whole list for.
const STATUS_ACCENT = {
  draft: 'border-l-border',
  'in-review': 'border-l-amber-400 dark:border-l-amber-500',
  approved: 'border-l-emerald-500 dark:border-l-emerald-400',
};

// Formats a modified/updated timestamp as a short relative-ish label.
const formatModified = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

// Reusable document row: icon, name, StatusPill, owner, DueDateChip, modified date.
// Home's compact list uses the bare row; the Documents table (step 6) opts into
// selectable/onToggleFavorite for the checkbox + favorite star, per doc 3's spec.
// Root is a div[role=button], not a <button>, since it nests real interactive
// children (checkbox, favorite star) once those props are supplied.
const DocumentRow = ({ document: doc, selectable = false, selected = false, onSelectChange, onToggleFavorite }) => {
  const navigate = useNavigate();
  if (!doc) return null;

  const fileType = getFileType(doc);
  const Icon = fileType.Icon;
  const workspaceId = doc.workspace?._id || doc.workspace;
  const ownerName = doc.owner?.name || doc.uploadedBy?.name;

  const handleActivate = () => {
    navigate(workspaceId ? `/workspaces/${workspaceId}/documents/${doc._id}` : `/documents/preview/${doc._id}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleActivate();
    }
  };

  // Table-mode-only treatment — Home's compact list (selectable=false) keeps the
  // original quiet row so this refinement stays scoped to the Documents page.
  const accent = selectable ? STATUS_ACCENT[doc.status] || 'border-l-transparent' : 'border-l-transparent';
  const rowPadding = selectable ? 'py-2' : 'py-2.5';
  const selectedBg = selected ? 'bg-primary-50 dark:bg-primary-950/30' : 'hover:bg-surface-2';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      className={`flex w-full items-center gap-3 rounded-xl  ${accent} px-3 ${rowPadding} text-left ${selectedBg} transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 focus-visible:ring-offset-surface`}
    >
      {selectable && (
        <input
          type="checkbox"
          checked={selected}
          onClick={(e) => e.stopPropagation()}
          onChange={() => onSelectChange?.(doc._id)}
          className="h-4 w-4 shrink-0 rounded-full border-border text-primary-600 focus:ring-primary-500"
        />
      )}

      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${fileType.tile}`}>
        <Icon className={`h-5 w-5 ${fileType.icon}`} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{doc.name || doc.originalName || 'Untitled document'}</p>
        {ownerName && <p className="truncate text-xs text-ink-muted">{ownerName}</p>}
      </div>

      {/* Table mode (selectable) reserves fixed widths per column so rows align
          regardless of which optional fields a given document has. Home's
          compact list (selectable=false) keeps the old collapse-when-absent flow. */}
      {selectable ? (
        <>
          <div className="w-8 shrink-0 flex justify-center">
            {ownerName && <Avatar name={ownerName} size="sm" />}
          </div>
          <div className="w-24 shrink-0 flex items-center gap-1">
            {doc.status && <StatusPill status={doc.status} />}
            {doc.status === 'approved' && (
              <LockClosedIcon className="h-3 w-3 shrink-0 text-ink-muted" aria-label="Locked — reopen to edit" />
            )}
          </div>
          <div className="w-28 shrink-0 hidden md:block">{doc.dueDate && <DueDateChip date={doc.dueDate} />}</div>
          <div className="w-16 shrink-0 text-right hidden sm:block">
            <span className="text-xs text-ink-muted">{formatModified(doc.updatedAt || doc.lastModified)}</span>
          </div>
          <div className="w-5 shrink-0">
            {onToggleFavorite && (
              <FavoriteToggle isFavorite={!!doc.isFavorite} onToggle={() => onToggleFavorite(doc)} size="sm" />
            )}
          </div>
        </>
      ) : (
        <>
          {ownerName && <Avatar name={ownerName} size="sm" className="shrink-0" />}
          {doc.status && <StatusPill status={doc.status} />}
          {doc.dueDate && <DueDateChip date={doc.dueDate} />}
          {formatModified(doc.updatedAt || doc.lastModified) && (
            <span className="hidden shrink-0 text-xs text-ink-muted sm:block">
              {formatModified(doc.updatedAt || doc.lastModified)}
            </span>
          )}
        </>
      )}
    </div>
  );
};

export default DocumentRow;