import React from 'react';
import { Trash2, Download, X } from 'lucide-react';

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
          <X className="h-4 w-4" />
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
            <Download className="h-4 w-4" />
            Export
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-1.5 text-sm text-danger hover:text-danger-subtle-ink px-2 py-1 rounded-lg hover:bg-danger-subtle"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>
    </div>
  );
};

export default BulkActionBar;