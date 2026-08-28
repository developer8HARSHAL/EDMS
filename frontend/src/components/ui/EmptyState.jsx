import React from 'react';
import { Button } from './Button';

const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }) => (
  <div className="flex flex-col items-center justify-center text-center py-16 px-6">
    {Icon && (
      <div className="icon-badge icon-badge-1 h-12 w-12 mb-4">
        <Icon className="h-6 w-6" />
      </div>
    )}
    <h3 className="text-base font-semibold text-ink mb-1">{title}</h3>
    {description && <p className="text-sm text-ink-muted max-w-sm mb-6">{description}</p>}
    {actionLabel && onAction && (
      <Button onClick={onAction} size="sm">
        {actionLabel}
      </Button>
    )}
  </div>
);

export default EmptyState;