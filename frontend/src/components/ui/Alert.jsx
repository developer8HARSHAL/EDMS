import React from 'react';
import { clsx } from 'clsx';
import {
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle,
  X,
} from 'lucide-react';

const alertVariants = {
  success: {
    icon:
      'bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-400',
    title: 'text-ink',
    description: 'text-ink-muted',
  },

  error: {
    icon:
      'bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-400',
    title: 'text-ink',
    description: 'text-ink-muted',
  },

  warning: {
    icon:
      'bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-400',
    title: 'text-ink',
    description: 'text-ink-muted',
  },

  info: {
    icon:
      'bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-400',
    title: 'text-ink',
    description: 'text-ink-muted',
  },
};

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

export const Alert = ({
  variant = 'info',
  title,
  children,
  className,
  showIcon = true,
  action,
  onClose,
  ...props
}) => {
  const styles =
    alertVariants[variant] || alertVariants.info;

  const IconComponent =
    iconMap[variant] || Info;

  return (
    <div
      role="alert"
      className={clsx(
        'flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3.5 shadow-xs',
        className
      )}
      {...props}
    >
      {showIcon && (
        <div
          className={clsx(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
            styles.icon
          )}
        >
          <IconComponent
            className="h-4 w-4"
            strokeWidth={2}
            aria-hidden="true"
          />
        </div>
      )}

      <div className="min-w-0 flex-1">
        {title && (
          <h3
            className={clsx(
              'text-sm font-semibold leading-5',
              styles.title
            )}
          >
            {title}
          </h3>
        )}

        <div
          className={clsx(
            'text-sm leading-5 text-ink-muted',
            title && 'mt-0.5'
          )}
        >
          {children}
        </div>

        {action && (
          <div className="mt-2">
            {action}
          </div>
        )}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss alert"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <X
            className="h-4 w-4"
            aria-hidden="true"
          />
        </button>
      )}
    </div>
  );
};