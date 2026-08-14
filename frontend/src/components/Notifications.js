import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellIcon,
  ClockIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

import { Card } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import apiService from '../services/apiService';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'review', label: 'Needs review' },
  { key: 'deadline', label: 'Deadlines' },
  { key: 'invitation', label: 'Invitations' },
];

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : '';

const Notifications = () => {
  const navigate = useNavigate();

  const [data, setData] = useState({
    pendingReview: [],
    upcomingDeadlines: [],
  });

  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await apiService.documentApi.getDashboardData();

        setData({
          pendingReview: response?.data?.pendingReview || [],
          upcomingDeadlines: response?.data?.upcomingDeadlines || [],
        });
      } catch (error) {
        console.error('Failed to load notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const items = useMemo(() => {
    const review = data.pendingReview.map((doc) => ({
      id: `review-${doc._id}`,
      type: 'review',
      title: 'Review required',
      name: doc.name,
      workspace: doc.workspace?.name,
      date: doc.dueDate,
      description: 'This document is waiting for your review.',
      icon: DocumentCheckIcon,
    }));

    const deadlines = data.upcomingDeadlines.map((doc) => ({
      id: `deadline-${doc._id}`,
      type: 'deadline',
      title: 'Deadline approaching',
      name: doc.name,
      workspace: doc.workspace?.name,
      date: doc.dueDate,
      description: 'This document is due soon.',
      icon: ClockIcon,
    }));

    return [...review, ...deadlines].filter(
      (item) =>
        activeFilter === 'all' || item.type === activeFilter
    );
  }, [data, activeFilter]);

  const total =
    data.pendingReview.length +
    data.upcomingDeadlines.length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">
            Notifications
          </h1>

          <p className="text-sm text-ink-muted mt-1">
            {total
              ? `${total} items need your attention`
              : 'Nothing needs your attention'}
          </p>
        </div>

        <BellIcon className="h-6 w-6 text-ink-muted" />
      </div>

      <div className="flex items-center gap-1 mb-5 border-b border-border">
        {FILTERS.map((filter) => {
          const count =
            filter.key === 'review'
              ? data.pendingReview.length
              : filter.key === 'deadline'
              ? data.upcomingDeadlines.length
              : filter.key === 'all'
              ? total
              : 0;

          return (
            <button
              key={filter.key}
              type="button"
              onClick={() => setActiveFilter(filter.key)}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeFilter === filter.key
                  ? 'border-primary-600 text-primary-700 dark:text-primary-400'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              {filter.label}

              {filter.key !== 'invitation' && count > 0 && (
                <span className="ml-1.5 text-xs text-ink-muted">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <Card padding={false}>
        {loading ? (
          <div className="divide-y divide-border">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="p-5 animate-pulse"
              >
                <div className="h-4 w-40 bg-surface-2 rounded mb-2" />
                <div className="h-3 w-64 bg-surface-2 rounded" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <BellIcon className="h-8 w-8 mx-auto text-ink-muted mb-3" />

            <p className="text-sm font-semibold text-ink">
              Nothing needs your attention
            </p>

            <p className="text-sm text-ink-muted mt-1">
              You're all caught up.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    navigate(`/documents/${item._id}`)
                  }
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-surface-2 transition-colors"
                >
                  <div className="h-9 w-9 rounded-lg bg-primary-50 dark:bg-primary-950/50 text-primary-600 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-ink">
                        {item.title}
                      </p>

                      <Badge
                        variant={
                          item.type === 'review'
                            ? 'warning'
                            : 'gray'
                        }
                        size="xs"
                      >
                        {item.type === 'review'
                          ? 'Action required'
                          : 'Upcoming'}
                      </Badge>
                    </div>

                    <p className="text-sm text-ink mt-1 truncate">
                      {item.name}
                    </p>

                    <p className="text-xs text-ink-muted mt-1">
                      {item.workspace || 'Workspace'}
                      {item.date && ` · Due ${formatDate(item.date)}`}
                    </p>
                  </div>

                  <ArrowRightIcon className="h-4 w-4 text-ink-muted shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Notifications;