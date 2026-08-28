import React from 'react';
import { clsx } from 'clsx';

export const Card = ({ children, className, padding = true, ...props }) => {
  return (
    <div
      className={clsx('card', padding && 'p-6', className)}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className, ...props }) => {
  return (
    <div className={clsx('border-b border-border/60 pb-4 mb-5', className)} {...props}>
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