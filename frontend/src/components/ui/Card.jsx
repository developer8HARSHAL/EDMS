import React from 'react';
import { clsx } from 'clsx';

export const Card = ({ children, className, padding = true, ...props }) => {
  return (
    <div
      className={clsx(
        'bg-white dark:bg-gray-800 rounded-lg shadow-soft border border-gray-200 dark:border-gray-700',
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
    <div className={clsx('border-b border-gray-200 dark:border-gray-700 pb-4 mb-4', className)} {...props}>
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