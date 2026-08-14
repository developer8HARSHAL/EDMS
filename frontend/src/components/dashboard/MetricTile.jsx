import React from 'react';

// Single stat tile for the Home metric strip. Purely presentational — parent
// passes the already-computed label/value from dashboard-data.stats.
const MetricTile = ({ label, value, icon: Icon }) => {
  return (
    <div className="card p-4 flex items-center gap-3">
      {Icon && (
        <div className="icon-badge icon-badge-1 h-10 w-10 shrink-0">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-2xl font-semibold text-ink truncate">{value}</p>
        <p className="text-xs text-ink-muted truncate">{label}</p>
      </div>
    </div>
  );
};

export default MetricTile;