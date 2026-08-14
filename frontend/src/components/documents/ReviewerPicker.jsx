import React, { useState, useRef, useEffect } from 'react';
import { UserPlusIcon, CheckIcon } from '@heroicons/react/24/outline';

// Deliberately does NOT use the shared Dropdown primitive — that component closes
// on any click inside its content, which breaks multi-select. Self-contained
// open-state + click-outside-only-close instead, so checking multiple reviewers
// in one open menu works.
const ReviewerPicker = ({ reviewerIds = [], members = [], onChange, disabled = false }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const memberId = (m) => m.user?._id || m.user || m._id;
  const memberName = (m) => m.user?.name || m.name || m.user?.email || m.email || 'Unknown';

  const toggleReviewer = (id) => {
    const next = reviewerIds.includes(id)
      ? reviewerIds.filter((r) => r !== id)
      : [...reviewerIds, id];
    onChange?.(next);
  };

  if (disabled) return null;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors"
      >
        <UserPlusIcon className="h-3.5 w-3.5" />
        {reviewerIds.length > 0 ? `${reviewerIds.length} reviewer${reviewerIds.length > 1 ? 's' : ''}` : 'Add reviewer'}
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-56 rounded-lg border border-border bg-surface shadow-lg py-1 max-h-64 overflow-auto">
          {members.length === 0 ? (
            <p className="px-3 py-2 text-xs text-ink-muted">No workspace members</p>
          ) : (
            members.map((m) => {
              const id = memberId(m);
              const checked = reviewerIds.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleReviewer(id)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-surface-2 text-left"
                >
                  <span className="truncate text-ink">{memberName(m)}</span>
                  {checked && <CheckIcon className="h-4 w-4 shrink-0 text-primary-600" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewerPicker;
