import React from 'react';
import { TrashIcon, ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';

// showExport defaults false — no apiService/useDocuments export call exists yet
// (backend has GET /documents/workspace/:id/export, frontend has no wiring to it).
// Pass showExport + onExport once that gap is closed.
const BulkActionBar = ({ selectedCount, onDelete, onExport, showExport = false, onClearSelection }) => {
  if (!selectedCount) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-2.5 mb-3 shadow-panel">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClearSelection}
          className="text-ink-muted hover:text-ink"
          aria-label="Clear selection"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
        <span className="text-sm text-ink">{selectedCount} selected</span>
      </div>

      <div className="flex items-center gap-2">
        {showExport && (
          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink px-2 py-1 rounded-lg hover:bg-surface-2"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Export
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40"
        >
          <TrashIcon className="h-4 w-4" />
          Delete
        </button>
      </div>
    </div>
  );
};

export default BulkActionBar;