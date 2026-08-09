import React from 'react';
import { clsx } from 'clsx';

export const Input = ({ 
  label, 
  error, 
  helperText,
  className,
  leftIcon,
  rightIcon,
  ...props 
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-ink mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
            {leftIcon}
          </div>
        )}
        <input
          className={clsx(
            'w-full px-3.5 py-2.5 bg-surface border rounded-xl shadow-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 transition-colors duration-200',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            error 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
              : 'border-border focus:border-primary-500 focus:ring-primary-500',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-ink-muted">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-ink-muted">{helperText}</p>
      )}
    </div>
  );
};