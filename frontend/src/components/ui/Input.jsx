import React, { useState } from 'react';
import { clsx } from 'clsx';

export const Input = ({
  label,
  error,
  helperText,
  className,
  leftIcon,
  rightIcon,
  disabled,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  // Local focus tracking only drives icon color — user's own onFocus/onBlur still fire.
  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const iconColor = error ? 'text-primary-700 dark:text-primary-300' : isFocused ? 'text-primary-500' : 'text-ink-muted';

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-ink mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className={clsx('absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors duration-150', iconColor)}>
            {leftIcon}
          </div>
        )}
        <input
          disabled={disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={clsx(
            'w-full px-3.5 py-2.5 bg-surface border rounded-xl text-ink placeholder:text-ink-muted outline-none transition-colors duration-150',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            disabled && 'opacity-60 cursor-not-allowed bg-surface-2',
            !disabled && !error && 'hover:border-ink-muted/40',
            error
              ? 'border-primary-400 focus:border-primary-700 focus:ring-1 focus:ring-primary-700'
              : 'border-border focus:border-primary-500 focus:ring-1 focus:ring-primary-500',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className={clsx('absolute inset-y-0 right-0 pr-3.5 flex items-center transition-colors duration-150', iconColor)}>
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-primary-700 dark:text-primary-300">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-ink-muted">{helperText}</p>
      )}
    </div>
  );
};