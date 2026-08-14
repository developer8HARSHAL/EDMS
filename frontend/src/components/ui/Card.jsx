import React from 'react';
import { clsx } from 'clsx';

export const Card = ({ children, className, padding = true, ...props }) => {
  return (
    <div
      className={clsx(
        'bg-surface rounded-2xl shadow-xs border border-border',
        padding && 'p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className, ...props }) => {
  return (
    <div className={clsx('border-b border-border pb-4 mb-4', className)} {...props}>
      {children}
    </div>
  );
};

export const CardContent = ({ children, className, ...props }) => {
  return (
    <div className={clsx(className)} {...props}>
      {children}
    </div>
  );
};