import React from 'react';
import { CalendarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const daysUntil = (dateStr) => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;
  const diffMs = date.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
};

const formatShort = (dateStr) =>
  new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

// document.dueDate — yellow as the deadline nears, red once overdue.
// Shade family matches Badge's warning/danger variants exactly (yellow-*/red-*,
// bg-*-100/text-*-800 light, dark:bg-*-900/20) so status colors stay consistent app-wide.
export const DueDateChip = ({ date }) => {
  if (!date) return null;
  const days = daysUntil(date);
  if (days === null) return null;

  const tone =
    days < 0
      ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      : days <= 2
      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
      : 'bg-surface-2 text-ink-muted';

  const label = days < 0 ? `Overdue ${formatShort(date)}` : days === 0 ? 'Due today' : `Due ${formatShort(date)}`;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>
      <CalendarIcon className="h-3 w-3" />
      {label}
    </span>
  );
};

// document.expiryDate — distinct icon + always red-leaning, since expiry is more severe than a due date
export const ExpiryDateChip = ({ date }) => {
  if (!date) return null;
  const days = daysUntil(date);
  if (days === null) return null;

  const tone =
    days < 0
      ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      : days <= 7
      ? 'bg-red-50 text-red-700 dark:bg-red-900/10 dark:text-red-400'
      : 'bg-surface-2 text-ink-muted';

  const label = days < 0 ? `Expired ${formatShort(date)}` : `Expires ${formatShort(date)}`;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>
      <ExclamationTriangleIcon className="h-3 w-3" />
      {label}
    </span>
  );
};

export default DueDateChip;
