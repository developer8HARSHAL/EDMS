import React from 'react';
import Badge from '../ui/Badge';

// Maps document.status ('draft'|'in-review'|'approved') to a Badge variant + label.
// Wraps the existing Badge primitive rather than owning its own color classes.
const STATUS_CONFIG = {
  draft: { label: 'Draft', variant: 'gray' },
  'in-review': { label: 'In review', variant: 'warning' },
  approved: { label: 'Approved', variant: 'success' },
};

const StatusPill = ({ status, size = 'sm' }) => {
  const config = STATUS_CONFIG[status] || { label: status || 'Unknown', variant: 'gray' };

  return (
    <Badge variant={config.variant} size={size}>
      {config.label}
    </Badge>
  );
};

export default StatusPill;