import React from 'react';
import { clsx } from 'clsx';

const buttonVariants = {
  primary: 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:bg-primary-200 disabled:text-primary-400 text-white focus:ring-primary-500',
  secondary: 'bg-primary-100 hover:bg-primary-200 active:bg-primary-300 disabled:bg-primary-50 disabled:text-primary-300 text-primary-700 dark:bg-primary-950/60 dark:hover:bg-primary-900/60 dark:active:bg-primary-800/60 dark:text-primary-300 focus:ring-primary-500',
  outline: 'bg-transparent border border-primary-300 hover:bg-primary-50 active:bg-primary-100 disabled:opacity-40 text-primary-700 dark:border-primary-800 dark:text-primary-300 dark:hover:bg-primary-950/40 focus:ring-primary-500',
  ghost: 'hover:bg-surface-hover text-ink-muted hover:text-ink focus:ring-primary-500',
  link: 'text-primary-600 hover:text-primary-700 underline-offset-4 hover:underline focus:ring-primary-500'
};

const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base'
};

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className, 
  isLoading = false,
  loadingText = 'Loading...',
  leftIcon,
  rightIcon,
  as: Component = 'button',
  ...props 
}) => {
  const baseClasses = clsx(
    'inline-flex items-center justify-center font-medium rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50 disabled:cursor-not-allowed',
    buttonVariants[variant],
    buttonSizes[size],
    className
  );

  const content = (
    <>
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {isLoading ? loadingText : children}
      {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </>
  );

  return (
    <Component
      className={baseClasses}
      disabled={isLoading}
      {...props}
    >
      {content}
    </Component>
  );
};