import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, LockKeyhole } from 'lucide-react';
import StatusPill from './StatusPill';

const getNextOptions = (status, { canEdit, isReviewer, isApprover, isOwner }) => {
  switch (status) {
    case 'draft':
      return canEdit ? ['in-review'] : [];
    case 'in-review':
      return isReviewer ? ['final-review', 'draft'] : [];
    case 'final-review':
      return isApprover ? ['approved', 'in-review'] : [];
    case 'approved':
      return isOwner ? ['in-review'] : [];
    default:
      return [];
  }
};

const EDGE_LABEL = {
  'draft->in-review': 'Submit for review',
  'in-review->final-review': 'Pass to final review',
  'in-review->draft': 'Request changes',
  'final-review->approved': 'Approve',
  'final-review->in-review': 'Request changes',
  'approved->in-review': 'Reopen',
};

const COMMENT_REQUIRED = new Set([
  'in-review->draft',
  'final-review->in-review',
  'approved->in-review',
]);

const STATUS_OWNER_LABEL = {
  draft: 'Editors can submit',
  'in-review': 'Assigned reviewer controls this stage',
  'final-review': 'Assigned final approver controls this stage',
  approved: 'Workspace owner can reopen',
};

const StatusTransitionMenu = ({
  status,
  onChange,
  disabled = false,
  loading = false,
  canEdit = false,
  isReviewer = false,
  isApprover = false,
  isOwner = false,
  prominent = false,
}) => {
  const [open, setOpen] = useState(false);
  const [pendingTarget, setPendingTarget] = useState(null);
  const [comment, setComment] = useState('');
  const ref = useRef(null);

  const nextOptions = getNextOptions(status, {
    canEdit,
    isReviewer,
    isApprover,
    isOwner,
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
        setPendingTarget(null);
        setComment('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeMenu = () => {
    setOpen(false);
    setPendingTarget(null);
    setComment('');
  };

  const handleSelect = (next) => {
    const edge = `${status}->${next}`;

    if (COMMENT_REQUIRED.has(edge)) {
      setPendingTarget(next);
      return;
    }

    closeMenu();
    onChange?.(next);
  };

  const handleConfirmComment = () => {
    if (!comment.trim()) return;

    const target = pendingTarget;
    const trimmed = comment.trim();
    closeMenu();
    onChange?.(target, trimmed);
  };

  const isTransitionAvailable = !disabled && !loading && nextOptions.length > 0;

  return (
    <div ref={ref} className="relative inline-flex flex-col items-start gap-1.5">
      {isTransitionAvailable ? (
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          disabled={loading}
          aria-haspopup="menu"
          aria-expanded={open}
          className={[
            'inline-flex items-center gap-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
            prominent
              ? 'min-h-10 rounded-xl border border-border bg-surface px-3.5'
              : 'rounded-full',
            open ? 'bg-surface-2' : 'hover:bg-surface-2',
            loading ? 'opacity-50' : '',
          ].join(' ')}
        >
          <StatusPill status={status} />
          <ChevronDown
            className={`h-4 w-4 text-ink-muted transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <StatusPill status={status} />
          {!disabled && (
            <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
              <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
              {STATUS_OWNER_LABEL[status] || 'No transition available for you'}
            </span>
          )}
        </div>
      )}

      {open && pendingTarget === null && (
        <div
          className="absolute left-0 top-full z-20 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-surface p-1.5 shadow-soft"
          role="menu"
        >
          <div className="px-2.5 py-2 text-xs text-ink-muted">
            Change document status
          </div>

          {nextOptions.map((next) => (
            <button
              key={next}
              type="button"
              onClick={() => handleSelect(next)}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              role="menuitem"
            >
              <StatusPill status={next} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-ink">
                  {EDGE_LABEL[`${status}->${next}`]}
                </span>
                <span className="mt-0.5 block text-xs text-ink-muted">
                  Move to {next.replace(/-/g, ' ')}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      {open && pendingTarget !== null && (
        <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-xl border border-border bg-surface p-3 shadow-soft">
          <p className="text-sm font-medium text-ink">
            {EDGE_LABEL[`${status}->${pendingTarget}`]}
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            A comment is required for this transition.
          </p>
          <textarea
            autoFocus
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Explain what needs to change..."
            rows={3}
            className="input-field mt-3 resize-none"
          />
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={closeMenu}
              className="rounded-full px-3 py-1.5 text-sm text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmComment}
              disabled={!comment.trim()}
              className="rounded-full bg-primary-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusTransitionMenu;