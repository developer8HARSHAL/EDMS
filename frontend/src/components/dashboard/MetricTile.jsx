import React from 'react';

// Compact, presentational metric tile.
// The parent supplies the already-computed label/value; this component does not
// read or transform backend data.
const MetricTile = ({ label, value, icon: Icon }) => {
  return (
    <div className="card flex min-h-[88px] items-center gap-3 px-4 py-3">
      {Icon && (
        <div className="icon-badge icon-badge-1 h-9 w-9 shrink-0">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
      )}

      <div className="min-w-0">
        <p
          title={label}
          className="truncate text-xs font-medium uppercase tracking-[0.06em] text-ink-muted"
        >
          {label}
        </p>

        <p
          title={String(value)}
          className="mt-1 truncate text-xl font-semibold leading-none tracking-tight text-ink"
        >
          {value}
        </p>
      </div>
    </div>
  );
};

export default MetricTile;