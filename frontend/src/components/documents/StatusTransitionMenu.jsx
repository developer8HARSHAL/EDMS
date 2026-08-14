import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import StatusPill from './StatusPill';

// Linear draft -> in-review -> approved flow, plus revert-to-draft from in-review
// and reopen-to-review from approved. Parent decides whether the current user
// may act at all (pass disabled=true) — this menu only encodes the state graph.
const FLOW = {
  draft: ['in-review'],
  'in-review': ['approved', 'draft'],
  approved: ['in-review'],
};

const NEXT_LABEL = {
  draft: 'Revert to draft',
  'in-review': 'Send to review',
  approved: 'Approve',
};

const StatusTransitionMenu = ({ status, onChange, disabled = false, loading = false }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const nextOptions = FLOW[status] || [];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (disabled || nextOptions.length === 0) {
    return <StatusPill status={status} />;
  }

  const handleSelect = (next) => {
    setOpen(false);
    onChange?.(next);
  };

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className="flex items-center gap-1 rounded-full hover:opacity-80 disabled:opacity-50 transition-opacity"
      >
        <StatusPill status={status} />
        <ChevronDownIcon className="h-3.5 w-3.5 text-ink-muted" />
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-48 rounded-lg border border-border bg-surface shadow-lg py-1">
          {nextOptions.map((next) => (
            <button
              key={next}
              type="button"
              onClick={() => handleSelect(next)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-surface-2 text-left"
            >
              <StatusPill status={next} size="sm" />
              <span className="text-ink-muted text-xs">{NEXT_LABEL[next]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default StatusTransitionMenu;
