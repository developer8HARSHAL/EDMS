import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusPill from '../documents/StatusPill';
import Badge from '../ui/Badge';

// Formats a due/expiry date as relative "in N days" / "N days overdue" text.
// Returns null if the date is missing so the caller can decide what to show.
const relativeDueText = (dateStr) => {
  if (!dateStr) return null;
  const due = new Date(dateStr);
  if (Number.isNaN(due.getTime())) return null;

  const diffDays = Math.ceil((due.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000);
  if (diffDays === 0) return 'Due today';
  if (diffDays < 0) return `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} overdue`;
  return `Due in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
};

// Row used for both "Needs your review" (pendingReview[]) and "Upcoming
// deadlines" (upcomingDeadlines[]) sections on Home. Reads defensively since
// the exact entry shape from /documents/dashboard-data hasn't been verified
// against live data yet.
const AttentionListItem = ({ item }) => {
  const navigate = useNavigate();

  const doc = item?.document || item;
  const docId = doc?._id;
  const workspaceId = doc?.workspace?._id || doc?.workspace;
  const workspaceName = doc?.workspace?.name;
  const dueText = relativeDueText(doc?.dueDate || doc?.expiryDate);

  // Only present on pendingReview items (see getDashboardData) — absent on
  // upcomingDeadlines items, which this component also renders.
  const attentionRole = item?.attentionRole;
  const attentionAction = item?.attentionAction;
  const ACTION_LABEL = { review: 'Review', approve: 'Approve' };

  // The other person relevant to this queue item — whoever uploaded it (for a
  // reviewer's queue) or whoever passed it along (for an approver's queue).
  const counterpartName =
    attentionRole === 'reviewer'
      ? doc?.uploadedBy?.name
      : attentionRole === 'approver'
      ? doc?.workflow?.reviewer?.name
      : null;

  const handleClick = () => {
    if (!docId) return;
    navigate(workspaceId ? `/workspaces/${workspaceId}/documents/${docId}` : `/documents/preview/${docId}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-surface-2 transition-colors"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ink">{doc?.name || 'Untitled document'}</p>
        {(workspaceName || counterpartName || dueText) && (
          <p className="truncate text-xs text-ink-muted">
            {workspaceName}
            {workspaceName && counterpartName ? ' · ' : ''}
            {counterpartName && (attentionRole === 'reviewer' ? `From ${counterpartName}` : `Passed by ${counterpartName}`)}
            {(workspaceName || counterpartName) && dueText ? ' · ' : ''}
            {dueText}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {attentionAction && (
          <Badge variant="primary" size="sm">{ACTION_LABEL[attentionAction]}</Badge>
        )}
        {doc?.status && <StatusPill status={doc.status} />}
      </div>
    </button>
  );
};

export default AttentionListItem;