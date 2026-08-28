import { useState, useEffect, useCallback, useMemo } from 'react';
import { documentApi } from '../services/apiService';
import { useAuth } from './useAuth';
import {
  mapPendingReviewItem,
  mapDeadlineItem,
  buildAttentionGroups,
  isAllCaughtUp as computeIsAllCaughtUp,
  formatRecentDocumentsAsActivity,
  buildPipelineStages,
  buildActiveWorkflows,
  buildTeamWorkload,
} from '../utils/dashboardUtils';

const EMPTY_DASHBOARD = {
  stats: {},
  recentDocuments: [],
  pendingReview: [],
  upcomingDeadlines: [],
};

export const useDashboard = () => {
  const { isAuthenticated, tokenValidated } = useAuth();

  const [data, setData] = useState(EMPTY_DASHBOARD);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await documentApi.getDashboardData();
      const d = response.data || {};

      setData({
        // No finalReviewCount anywhere in the real response — dropped rather
        // than defaulted to 0 silently (see buildPipelineStages, which only
        // reads the 3 counts that actually exist).
        stats: {
          totalDocs: d.stats?.totalDocs ?? 0,
          thisMonth: d.stats?.thisMonth ?? 0,
          draftCount: d.stats?.draftCount ?? 0,
          inReviewCount: d.stats?.inReviewCount ?? 0,
          approvedCount: d.stats?.approvedCount ?? 0,
        },
        recentDocuments: d.recentDocuments ?? [],
        // Mapped here, once, right at the API boundary — everything
        // downstream (buildAttentionGroups, buildActiveWorkflows) works on
        // the QueueItem shape these adapters produce, not the raw response.
        pendingReview: (d.pendingReview ?? []).map(mapPendingReviewItem),
        upcomingDeadlines: (d.upcomingDeadlines ?? []).map(mapDeadlineItem),
      });
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && tokenValidated) {
      fetchData();
    }
  }, [isAuthenticated, tokenValidated, fetchData]);

  // ---- Derived state, memoized off raw data only -------------------------

  const attentionGroups = useMemo(
    () => buildAttentionGroups(data.pendingReview, data.upcomingDeadlines),
    [data.pendingReview, data.upcomingDeadlines]
  );

  const isAllCaughtUp = useMemo(
    () => computeIsAllCaughtUp(attentionGroups),
    [attentionGroups]
  );

  const activeWorkflows = useMemo(
    () => buildActiveWorkflows(data.pendingReview, data.upcomingDeadlines, data.recentDocuments),
    [data.pendingReview, data.upcomingDeadlines, data.recentDocuments]
  );

  // buildPipelineStages(stats) — one param. A second arg (activeWorkflows)
  // was previously passed here and silently dropped, since the function
  // never declared it — pipeline stages have only ever come from stats,
  // this just makes the call match what the function actually does.
  const pipelineStages = useMemo(
    () => buildPipelineStages(data.stats),
    [data.stats]
  );

  // Who currently holds the ball, aggregated across Active Workflows —
  // depends on activeWorkflows, so it's declared after it, not off raw data.
  const teamWorkload = useMemo(
    () => buildTeamWorkload(activeWorkflows),
    [activeWorkflows]
  );

  // recentDocuments is raw here (not through a mapper above) since it's used
  // both for this activity placeholder and for buildActiveWorkflows below,
  // which does its own mapRecentDocumentItem internally.
  const activityItems = useMemo(
    () => formatRecentDocumentsAsActivity(data.recentDocuments),
    [data.recentDocuments]
  );

  return {
    // Raw
    stats: data.stats,
    recentDocuments: data.recentDocuments,
    upcomingDeadlines: data.upcomingDeadlines,
    isLoading,
    error,

    // Derived — UI-ready
    attentionGroups,
    isAllCaughtUp,
    pipelineStages,
    activityItems,
    activeWorkflows,
    teamWorkload,

    // Actions
    refetch: fetchData,
  };
};

export default useDashboard;