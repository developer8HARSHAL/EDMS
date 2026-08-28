import React from 'react';
import { Card } from '../components/ui/Card';

export const StatCard = ({ title, stat, icon: Icon, description, isLoading }) => {
  return (
    <Card className="p-6 hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-sm font-medium text-ink-muted truncate">
            {title}
          </p>
          {isLoading ? (
            <div className="mt-2 mb-2">
              <div className="h-8 w-16 bg-surface-2 rounded animate-pulse"></div>
            </div>
          ) : (
            <p className="mt-2 text-3xl font-semibold text-ink">
              {stat}
            </p>
          )}
          <p className="mt-1 text-sm text-ink-muted">
            {description}
          </p>
        </div>
        <div className="flex-shrink-0 ml-4">
          <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
            <Icon className="h-6 w-6 text-primary-500 dark:text-primary-400" />
          </div>
        </div>
      </div>
    </Card>
  );
};