import React from 'react';
import { clsx } from 'clsx';
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

// Deliberate design choice, not an oversight: success/error/warning stay on
// explicit Tailwind hues (red/green/yellow) because they carry semantic meaning
// that a neutral/brand token can't express. Only 'info' routes through primary-*
// tokens below, since it's literally the brand blue with no separate meaning.
// See Badge.jsx for the same policy applied consistently.
const alertVariants = {
  success: {
    container: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
    icon: 'text-green-400',
    title: 'text-green-800 dark:text-green-200',
    description: 'text-green-700 dark:text-green-300',
    iconComponent: CheckCircleIcon
  },
  error: {
    container: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
    icon: 'text-red-400',
    title: 'text-red-800 dark:text-red-200',
    description: 'text-red-700 dark:text-red-300',
    iconComponent: XCircleIcon
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
    icon: 'text-yellow-400',
    title: 'text-yellow-800 dark:text-yellow-200',
    description: 'text-yellow-700 dark:text-yellow-300',
    iconComponent: ExclamationTriangleIcon
  },
  info: {
    container: 'bg-primary-50 border-primary-200 dark:bg-primary-900/20 dark:border-primary-800',
    icon: 'text-primary-400',
    title: 'text-primary-800 dark:text-primary-200',
    description: 'text-primary-700 dark:text-primary-300',
    iconComponent: InformationCircleIcon
  }
};

export const Alert = ({ 
  variant = 'info', 
  title, 
  children, 
  className,
  showIcon = true,
  ...props 
}) => {
  const variantStyles = alertVariants[variant];
  const IconComponent = variantStyles.iconComponent;

  return (
    <div
      className={clsx(
        'border rounded-xl p-4',
        variantStyles.container,
        className
      )}
      {...props}
    >
      <div className="flex">
        {showIcon && (
          <div className="flex-shrink-0">
            <IconComponent className={clsx('h-5 w-5', variantStyles.icon)} />
          </div>
        )}
        <div className={clsx('ml-3', !showIcon && 'ml-0')}>
          {title && (
            <h3 className={clsx('text-sm font-medium', variantStyles.title)}>
              {title}
            </h3>
          )}
          <div className={clsx('text-sm', title ? 'mt-2' : '', variantStyles.description)}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};