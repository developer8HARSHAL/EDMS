import React from 'react';
import { AlertCircle, CalendarDays } from 'lucide-react';

/*
 * One blue hue family throughout, matching StatusPill.jsx's convention.
 * Urgency (normal -> due soon -> overdue) is communicated by escalating
 * weight within that one hue — plus the AlertCircle vs CalendarDays icon
 * swap — not by switching to red.
 */

const daysUntil = (dateStr) => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Math.round(
    (target - today) / (1000 * 60 * 60 * 24)
  );
};

const formatShort = (dateStr) =>
  new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

export const DueDateChip = ({ date }) => {
  if (!date) return null;

  const days = daysUntil(date);
  if (days === null) return null;

  const isOverdue = days < 0;
  const isDueSoon = days >= 0 && days <= 2;

  const label = isOverdue
    ? `Overdue · ${formatShort(date)}`
    : days === 0
      ? 'Due today'
      : days === 1
        ? 'Due tomorrow'
        : `Due ${formatShort(date)}`;

  const iconClass = isOverdue
    ? 'text-danger-subtle-ink'
    : isDueSoon
      ? 'text-warning-subtle-ink'
      : 'text-ink-muted';

  const textClass = isOverdue
    ? 'font-semibold text-danger-subtle-ink'
    : isDueSoon
      ? 'font-medium text-warning-subtle-ink'
      : 'text-ink-muted';

  const surfaceClass = isOverdue
    ? 'border-danger-subtle-ink/20 bg-danger-subtle px-2 py-0.5'
    : isDueSoon
      ? 'border-warning-subtle-ink/20 bg-warning-subtle px-2 py-0.5'
      : 'border-border bg-surface-2 px-2 py-0.5';

  return (
    <span
      className={`inline-flex min-h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border text-[11px] leading-5 ${surfaceClass}`}
      aria-label={`${label}${isOverdue ? ' — requires attention' : ''}`}
      title={label}
    >
      {isOverdue ? (
        <AlertCircle className={`h-3 w-3 shrink-0 ${iconClass}`} aria-hidden="true" />
      ) : (
        <CalendarDays className={`h-3 w-3 shrink-0 ${iconClass}`} aria-hidden="true" />
      )}

      <span className={textClass}>{label}</span>
    </span>
  );
};

export const ExpiryDateChip = ({ date }) => {
  if (!date) return null;

  const days = daysUntil(date);
  if (days === null) return null;

  const isExpired = days < 0;
  const isApproaching = days >= 0 && days <= 7;

  const label = isExpired
    ? `Expired · ${formatShort(date)}`
    : `Expires ${formatShort(date)}`;

  const tone = isExpired
    ? 'border-danger-subtle-ink/20 bg-danger-subtle font-semibold text-danger-subtle-ink'
    : isApproaching
      ? 'border-warning-subtle-ink/20 bg-warning-subtle font-medium text-warning-subtle-ink'
      : 'border-border bg-surface-2 text-ink-muted';

  return (
    <span
      className={`inline-flex min-h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-2 py-0.5 text-[11px] leading-5 ${tone}`}
      aria-label={label}
      title={label}
    >
      <CalendarDays className="h-3 w-3 shrink-0" aria-hidden="true" />
      {label}
    </span>
  );
};

export default DueDateChip;