import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, LockKeyhole } from 'lucide-react';
import StatusPill from './StatusPill';
import { Button } from '../ui/Button';

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
    <div ref={ref} className="relative inline-flex min-w-0 flex-col items-start gap-1.5">
      {isTransitionAvailable ? (
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          disabled={loading}
          aria-haspopup="menu"
          aria-expanded={open}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3.5 text-left transition-colors duration-150 hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50"
        >
          <StatusPill status={status} />
          <span className="text-sm font-medium text-ink">Change status</span>
          <ChevronDown
            className={`h-4 w-4 text-ink-muted transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
      ) : (
        <div className="flex flex-col items-start gap-2">
          <div className="inline-flex items-center gap-2">
            <StatusPill status={status} />
            <LockKeyhole className="h-3.5 w-3.5 text-ink-muted" aria-hidden="true" />
          </div>
          <p className="max-w-xl text-sm leading-5 text-ink-muted">
            {STATUS_OWNER_LABEL[status] || 'No workflow transition is available to you.'}
          </p>
        </div>
      )}

      {open && pendingTarget === null && (
        <div
          className="absolute left-0 top-full z-20 mt-2 w-72 overflow-hidden rounded-xl border border-border bg-surface shadow-panel"
          role="menu"
        >
          <div className="border-b border-border px-3 py-2.5">
            <p className="text-sm font-semibold text-ink">Change document status</p>
            <p className="mt-0.5 text-xs leading-5 text-ink-muted">
              Only transitions allowed for your current role are shown.
            </p>
          </div>

          <div className="p-1">
            {nextOptions.map((next) => (
              <button
                key={next}
                type="button"
                onClick={() => handleSelect(next)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                role="menuitem"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-primary-700 dark:text-primary-300">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-ink">
                    {EDGE_LABEL[`${status}->${next}`]}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-muted">
                    Status becomes {next.replace(/-/g, ' ')}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {open && pendingTarget !== null && (
        <div className="absolute left-0 top-full z-20 mt-2 w-80 rounded-xl border border-border bg-surface p-4 shadow-panel">
          <p className="text-sm font-semibold text-ink">
            {EDGE_LABEL[`${status}->${pendingTarget}`]}
          </p>
          <p className="mt-1 text-xs leading-5 text-ink-muted">
            A comment is required for this transition.
          </p>
          <textarea
            autoFocus
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Explain what needs to change..."
            rows={4}
            className="input-field mt-3 w-full resize-none px-3 py-2.5"
          />
          <div className="mt-3 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={closeMenu}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmComment}
              disabled={!comment.trim()}
              leftIcon={<Check className="h-4 w-4" aria-hidden="true" />}
            >
              Confirm
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default StatusTransitionMenu;