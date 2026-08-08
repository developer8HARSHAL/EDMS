// frontend/src/pages/Dashboard.js - FIXED: Maximum update depth exceeded
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';

import {
  DocumentIcon,
  DocumentTextIcon,
  TableCellsIcon,
  PresentationChartBarIcon,
  PhotoIcon,
  ArchiveBoxIcon,
  CloudArrowUpIcon,
  UsersIcon,
  ClockIcon,
  ArrowUpTrayIcon,
  PlusIcon,
  FolderIcon,
  UserGroupIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  BellIcon,
  StarIcon,
  BuildingOfficeIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  Cog6ToothIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';

import jwtDecode from 'jwt-decode';
import axios from 'axios';
import apiService from '../services/apiService';
import workspaceService from '../services/workspaceService';

import { useAuth } from '../hooks/useAuth';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { useDocuments } from '../hooks/useDocuments';
import { useInvitations } from '../hooks/useInvitations';
import { documentApi } from '../services/apiService';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { StatCard } from '../pages/StatCard';
import WorkspaceCard from '../components/workspace/WorkspaceCard';
import CreateWorkspaceModal from '../components/workspace/CreateWorkspaceModal';
import WorkspaceSelector from '../components/workspace/WorkspaceSelector';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import { Input } from '../components/ui/Input';

// Maps a document to a type identity: icon + literal (purge-safe) Tailwind classes.
// Only reads fields already used elsewhere in this file (type / filename).
const FILE_TYPE_STYLES = {
  pdf: {
    label: 'PDF', Icon: DocumentTextIcon,
    tile: 'bg-rose-50 dark:bg-rose-950/40', icon: 'text-rose-500 dark:text-rose-400',
    rail: 'bg-rose-500'
  },
  doc: {
    label: 'Doc', Icon: DocumentTextIcon,
    tile: 'bg-blue-50 dark:bg-blue-950/40', icon: 'text-blue-500 dark:text-blue-400',
    rail: 'bg-blue-500'
  },
  sheet: {
    label: 'Sheet', Icon: TableCellsIcon,
    tile: 'bg-emerald-50 dark:bg-emerald-950/40', icon: 'text-emerald-500 dark:text-emerald-400',
    rail: 'bg-emerald-500'
  },
  slide: {
    label: 'Slides', Icon: PresentationChartBarIcon,
    tile: 'bg-orange-50 dark:bg-orange-950/40', icon: 'text-orange-500 dark:text-orange-400',
    rail: 'bg-orange-500'
  },
  image: {
    label: 'Image', Icon: PhotoIcon,
    tile: 'bg-violet-50 dark:bg-violet-950/40', icon: 'text-violet-500 dark:text-violet-400',
    rail: 'bg-violet-500'
  },
  archive: {
    label: 'Archive', Icon: ArchiveBoxIcon,
    tile: 'bg-slate-100 dark:bg-slate-800', icon: 'text-slate-500 dark:text-slate-400',
    rail: 'bg-slate-400'
  },
  default: {
    label: 'File', Icon: DocumentIcon,
    tile: 'bg-slate-100 dark:bg-slate-800', icon: 'text-slate-500 dark:text-slate-400',
    rail: 'bg-slate-400'
  }
};

const getFileType = (doc) => {
  const raw = (doc?.type || doc?.filename?.split('.').pop() || '').toLowerCase();
  if (raw.includes('pdf')) return FILE_TYPE_STYLES.pdf;
  if (['doc', 'docx'].some(e => raw.includes(e))) return FILE_TYPE_STYLES.doc;
  if (['xls', 'xlsx', 'csv'].some(e => raw.includes(e))) return FILE_TYPE_STYLES.sheet;
  if (['ppt', 'pptx'].some(e => raw.includes(e))) return FILE_TYPE_STYLES.slide;
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].some(e => raw.includes(e))) return FILE_TYPE_STYLES.image;
  if (['zip', 'rar', '7z'].some(e => raw.includes(e))) return FILE_TYPE_STYLES.archive;
  return FILE_TYPE_STYLES.default;
};

// Deterministic initials + accent color for workspace tiles (no Avatar-component
// assumptions, no fabricated member data).
const INITIAL_COLORS = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
];
const initialsFor = (name = '') => {
  const clean = name.trim();
  const letter = clean ? clean[0].toUpperCase() : '?';
  const idx = clean.length ? clean.charCodeAt(0) % INITIAL_COLORS.length : 0;
  return { letter, className: INITIAL_COLORS[idx] };
};

const Dashboard = () => {

  const navigate = useNavigate();
  const { user, isAuthenticated, tokenValidated } = useAuth();

  const {
    workspaces,
    loading: workspacesLoading,
    fetchWorkspaces,
    createWorkspace,
    getUserRole,
    getUserPermissions
  } = useWorkspaces();


  const {
    pendingInvitations,
    fetchPendingInvitations,
    acceptInvitation
  } = useInvitations();

  // Original document state
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({
    totalDocs: '0',
    uploads: '0',
    shared: '0',
    workspaces: '0'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // New workspace state
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [workspaceSearch, setWorkspaceSearch] = useState('');

  // Initialize tab from URL
  const getInitialTab = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['overview', 'workspaces', 'activity'].includes(tabParam)) {
      return tabParam;
    }
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [searchParams, setSearchParams] = useSearchParams();

  // Update tab when URL changes
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'workspaces', 'activity'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Handler to change tabs
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId }, { replace: true });
  };

  // overview, workspaces, activity
  const [recentActivity, setRecentActivity] = useState([]);

  // âœ… FIX: Create stable reference for fetchData function
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('-----Fetching dashboard data...');
      const response = await documentApi.getDashboardData();
      console.log('----API Response:', response);
      console.log('-----Stats from API:', response.data.stats);

      const newStats = {
        totalDocs: response.data.stats.totalDocs.toString(),
        uploads: response.data.stats.thisMonth.toString(),
        shared: '0',
        workspaces: workspaces.length.toString()
      };

      console.log('-----Setting stats to:', newStats);
      setDocuments(response.data.recentDocuments);
      setStats(newStats);
    } catch (err) {
      console.error('-----Dashboard fetch error:', err);
      setError("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, [workspaces.length]);

  // âœ… FIX: Use the stable fetchData function with proper dependencies
  useEffect(() => {
    // Only fetch if authenticated and token is validated
    if (isAuthenticated && tokenValidated) {
      fetchData();
    }
  }, [isAuthenticated, tokenValidated, fetchData]); // âœ… fetchData is now stable

  // Update stats when workspaces change
  useEffect(() => {
    setStats(prev => ({
      ...prev,
      workspaces: workspaces.length.toString()
    }));
  }, [workspaces.length]); // âœ… Only depend on length, not the entire array

  // Filter workspaces based on search
  const filteredWorkspaces = useMemo(() => {
    if (!workspaceSearch) return workspaces;
    return workspaces.filter(workspace =>
      workspace.name.toLowerCase().includes(workspaceSearch.toLowerCase()) ||
      workspace.description?.toLowerCase().includes(workspaceSearch.toLowerCase())
    )
  }, [workspaces, workspaceSearch]);

  // âœ… FIX: Stable generate recent activity function
  const generateRecentActivity = useCallback((docs, workspaces) => {
    const activities = [];

    // Recent document uploads
    docs.slice(0, 3).forEach(doc => {
      activities.push({
        type: 'document_upload',
        title: `Uploaded "${doc.name}"`,
        time: new Date(doc.uploadDate || doc.createdAt),
        icon: DocumentIcon,
        color: 'blue'
      });
    });

    // Recent workspace joins
    workspaces.slice(0, 2).forEach(workspace => {
      activities.push({
        type: 'workspace_join',
        title: `Joined workspace "${workspace.name}"`,
        time: new Date(workspace.joinedAt || workspace.createdAt),
        icon: BuildingOfficeIcon,
        color: 'green'
      });
    });

    return activities.sort((a, b) => b.time - a.time).slice(0, 5);
  }, []); // âœ… No dependencies needed

  const handleDownload = async (docId, docName) => {
    try {
      console.log(`Attempting to download document: ${docName} (ID: ${docId})`);
      const response = await documentApi.downloadDocument(docId);

      const blobData = response.data || response;
      const blob = new Blob([blobData]);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', docName || 'document');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      console.log(`Document download successful: ${docName}`);
    } catch (err) {
      console.error("Error downloading document:", err);
      alert("Failed to download document. Please try again.");
    }
  };

  const handleAcceptInvitation = async (invitationId) => {
    try {
      await acceptInvitation(invitationId);
      await fetchWorkspaces(); // âœ… This is fine since it's user-triggered
    } catch (err) {
      console.error("Error accepting invitation:", err);
    }
  };

  const handleCreateWorkspace = async (workspaceData) => {
    try {
      console.log('ðŸ¢ Creating workspace:', workspaceData);

      // Check auth state before creating workspace
      console.log('ðŸ” Auth check before workspace creation:', {
        isAuthenticated,
        hasToken: !!localStorage.getItem('authToken'),
        hasAxiosHeader: !!axios.defaults.headers.common['Authorization'],
        user: user ? { id: user.id, email: user.email } : null
      });

      await createWorkspace(workspaceData);
      setShowCreateModal(false);
      console.log('âœ… Workspace created successfully');
    } catch (error) {
      console.error('âŒ Failed to create workspace:', error);

      // Check if it's an auth error
      if (error.response?.status === 401) {
        console.error('âŒ 401 Unauthorized - Token issue detected');
        console.log('ðŸ” Current token:', localStorage.getItem('authToken'));
        console.log('ðŸ” Current axios header:', axios.defaults.headers.common['Authorization']);
      }

      throw error;
    }
  };

  // Underline tab, not filled pill
  const TabButton = ({ id, label, icon: Icon, active }) => (
    <button
      onClick={() => handleTabChange(id)}
      className={`relative flex items-center gap-2 px-1 py-3 text-sm font-medium transition-colors ${active
        ? 'text-blue-600 dark:text-blue-400'
        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
      {active && (
        <span className="absolute -bottom-px left-0 right-0 h-0.5 rounded-full bg-blue-600 dark:bg-blue-400" />
      )}
    </button>
  );

  // Derived, not fetched: most recent document + top workspaces, from data already in state.
  const featuredDoc = documents?.[0] || null;
  const panelWorkspaces = workspaces?.slice(0, 4) || [];
  const storagePct = calculateStoragePercentage(documents);
  const ringCircumference = 2 * Math.PI * 52;
  const ringOffset = ringCircumference - (storagePct / 100) * ringCircumference;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-8">

          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Welcome back, {user?.name || 'User'}
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Here's what's happening across your workspaces today.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                as={RouterLink}
                to="/documents/upload"
                variant="outline"
                leftIcon={<ArrowUpTrayIcon className="h-4 w-4" />}
              >
                Upload document
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                leftIcon={<PlusIcon className="h-4 w-4" />}
              >
                New workspace
              </Button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="error">
              {error}
            </Alert>
          )}

          {/* Pending Invitations */}
          {pendingInvitations && pendingInvitations.length > 0 && (
            <div className="flex items-center justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50/70 px-5 py-3.5 dark:border-blue-900/60 dark:bg-blue-950/30">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                  <BellIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {pendingInvitations.length} pending workspace invitation{pendingInvitations.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Review and accept to join new workspaces
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/invitations')}>
                Review
              </Button>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex gap-6 border-b border-slate-200 dark:border-slate-800">
            <TabButton id="overview" label="Overview" icon={ChartBarIcon} active={activeTab === 'overview'} />
            <TabButton id="workspaces" label="Workspaces" icon={BuildingOfficeIcon} active={activeTab === 'workspaces'} />
            <TabButton id="activity" label="Recent activity" icon={ClockIcon} active={activeTab === 'activity'} />
          </div>

          {/* ============ OVERVIEW ============ */}
          {activeTab === 'overview' && (
            <>
              {/* Hero row: featured document (large) + workspaces & roles (compact) */}
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                {/* Featured document — the largest, richest element on the page */}
                <div className="lg:col-span-2">
                  {isLoading ? (
                    <div className="h-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse" />
                  ) : featuredDoc ? (
                    (() => {
                      const meta = getFileType(featuredDoc);
                      const docId = featuredDoc._id || featuredDoc.id;
                      const ws = workspaces.find(w =>
                        w._id === featuredDoc.workspace ||
                        w.id === featuredDoc.workspace ||
                        w._id === featuredDoc.workspace?._id ||
                        w._id === featuredDoc.workspaceId
                      );
                      return (
                        <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 shadow-panel dark:border-slate-800 dark:bg-slate-900">
                          <span className={`absolute left-0 top-0 h-full w-1 ${meta.rail}`} />
                          <div>
                            <p className="mb-4 text-xs font-medium uppercase tracking-wider text-slate-400">
                              Continue where you left off
                            </p>
                            <div className="flex items-start gap-4">
                              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${meta.tile}`}>
                                <meta.Icon className={`h-7 w-7 ${meta.icon}`} />
                              </div>
                              <div className="min-w-0">
                                <h2 className="truncate text-xl font-semibold text-slate-900 dark:text-white">
                                  {featuredDoc.name || featuredDoc.filename || 'Unnamed document'}
                                </h2>
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                  <Badge variant="outline" size="sm">{ws?.name || 'Personal'}</Badge>
                                  <span className="text-slate-300 dark:text-slate-700">&bull;</span>
                                  <span>{meta.label}</span>
                                  <span className="text-slate-300 dark:text-slate-700">&bull;</span>
                                  <span>
                                    Updated {new Date(featuredDoc.uploadDate || featuredDoc.createdAt || Date.now()).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-6 flex gap-3">
                            <Button as={RouterLink} to={`/documents/preview/${docId}`} leftIcon={<EyeIcon className="h-4 w-4" />}>
                              Open document
                            </Button>
                            <Button variant="outline" onClick={() => handleDownload(docId, featuredDoc.name)} leftIcon={<ArrowUpRightIcon className="h-4 w-4" />}>
                              Download
                            </Button>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="flex h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-center dark:border-slate-700 dark:bg-slate-900">
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                        <DocumentIcon className="h-5 w-5 text-slate-400" />
                      </div>
                      <h3 className="text-sm font-medium text-slate-900 dark:text-white">No documents yet</h3>
                      <p className="mt-1 mb-4 text-sm text-slate-500 dark:text-slate-400">Upload your first file to get started</p>
                      <Button as={RouterLink} to="/documents/upload" size="sm" leftIcon={<ArrowUpTrayIcon className="h-4 w-4" />}>
                        Upload document
                      </Button>
                    </div>
                  )}
                </div>

                {/* Workspaces & roles — collaboration surface, real data only */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Your workspaces</p>
                    <RouterLink to="/workspaces" className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
                      View all
                    </RouterLink>
                  </div>
                  {workspacesLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-11 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
                      ))}
                    </div>
                  ) : panelWorkspaces.length > 0 ? (
                    <div className="space-y-1">
                      {panelWorkspaces.map((workspace) => {
                        const { letter, className } = initialsFor(workspace.name);
                        return (
                          <button
                            key={workspace._id}
                            onClick={() => navigate(`/workspaces/${workspace._id}`)}
                            className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
                          >
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${className}`}>
                              {letter}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{workspace.name}</p>
                              <p className="truncate text-xs capitalize text-slate-500 dark:text-slate-400">
                                {getUserRole(workspace._id) || 'Member'}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-6 text-center">
                      <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">No workspaces yet</p>
                      <Button size="sm" onClick={() => setShowCreateModal(true)} leftIcon={<PlusIcon className="h-4 w-4" />}>
                        Create one
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Compact metric bar — one row, not four boxes */}
              <div className="grid grid-cols-2 divide-x divide-slate-200 rounded-2xl border border-slate-200 bg-white sm:grid-cols-4 dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
                {[
                  { label: 'Total documents', value: stats.totalDocs, icon: DocumentIcon, loading: isLoading },
                  { label: 'Uploads this month', value: stats.uploads, icon: CloudArrowUpIcon, loading: isLoading },
                  { label: 'Shared with me', value: stats.shared, icon: UsersIcon, loading: isLoading },
                  { label: 'Workspaces', value: stats.workspaces, icon: BuildingOfficeIcon, loading: workspacesLoading },
                ].map((m) => (
                  <div key={m.label} className="flex items-center gap-3 px-5 py-4">
                    <m.icon className="h-4 w-4 shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      {m.loading ? (
                        <div className="h-5 w-8 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                      ) : (
                        <p className="text-lg font-semibold leading-none text-slate-900 dark:text-white">{m.value}</p>
                      )}
                      <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{m.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Documents — enriched rows, hover actions */}
              <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">Recent documents</h2>
                  <Button as={RouterLink} to="/documents" variant="outline" size="sm">View all</Button>
                </div>

                {documents.length > 0 ? (
                  <div>
                    {isLoading ? (
                      [...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-slate-50 dark:border-slate-800/60 last:border-0">
                          <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
                          <div className="h-4 flex-1 max-w-xs rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                        </div>
                      ))
                    ) : (
                      documents.map((doc) => {
                        const docId = doc._id || doc.id;
                        if (!docId) return null;

                        // âœ… FIX: Improved workspace lookup with multiple fallbacks
                        let workspace = null;
                        if (doc.workspace) {
                          workspace = workspaces.find(w =>
                            w._id === doc.workspace ||
                            w.id === doc.workspace ||
                            w._id === doc.workspace._id ||
                            w._id === doc.workspaceId
                          );
                        }
                        if (!workspace && doc.workspaceId) {
                          workspace = workspaces.find(w =>
                            w._id === doc.workspaceId ||
                            w.id === doc.workspaceId
                          );
                        }

                        const meta = getFileType(doc);

                        return (
                          <div
                            key={docId}
                            className="group flex items-center gap-4 px-6 py-3.5 border-b border-slate-50 dark:border-slate-800/60 last:border-0 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.tile}`}>
                              <meta.Icon className={`h-4 w-4 ${meta.icon}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                                {doc.name || doc.filename || 'Unnamed Document'}
                              </p>
                              <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <Badge variant="outline" size="sm">{workspace?.name || 'Personal'}</Badge>
                                <span>{new Date(doc.uploadDate || doc.createdAt || Date.now()).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="flex shrink-0 gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                              <Button as={RouterLink} to={`/documents/preview/${docId}`} size="sm" variant="outline">View</Button>
                              <Button size="sm" variant="outline" onClick={() => handleDownload(docId, doc.name)}>Download</Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : !isLoading ? (
                  <div className="text-center py-14 px-6">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                      <DocumentIcon className="h-5 w-5 text-slate-400" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-1">No documents yet</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Get started by uploading your first document</p>
                    <Button as={RouterLink} to="/documents/upload" leftIcon={<ArrowUpTrayIcon className="h-4 w-4" />}>
                      Upload your first document
                    </Button>
                  </div>
                ) : null}
              </div>

              {/* Quick actions (tiles) + Storage (ring) */}
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-400">Quick actions</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                      { label: 'Create workspace', sub: 'Start a new team space', icon: PlusIcon, accent: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400', onClick: () => setShowCreateModal(true) },
                      { label: 'Upload document', sub: 'Add a new file', icon: ArrowUpTrayIcon, accent: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400', to: '/documents/upload' },
                      { label: 'Browse workspaces', sub: 'See everything you belong to', icon: Squares2X2Icon, accent: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400', to: '/workspaces' },
                      { label: 'Profile settings', sub: 'Update your account', icon: Cog6ToothIcon, accent: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400', to: '/profile' },
                    ].map((action) => {
                      const content = (
                        <>
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.accent}`}>
                            <action.icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{action.label}</p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{action.sub}</p>
                          </div>
                        </>
                      );
                      const className = "flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-panel dark:border-slate-800 dark:bg-slate-900";
                      return action.to ? (
                        <RouterLink key={action.label} to={action.to} className={className}>{content}</RouterLink>
                      ) : (
                        <button key={action.label} onClick={action.onClick} className={className}>{content}</button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <p className="mb-4 text-xs font-medium uppercase tracking-wider text-slate-400">Storage</p>
                  {isLoading ? (
                    <div className="mx-auto h-32 w-32 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
                  ) : (
                    <div className="flex flex-col items-center">
                      <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
                        <circle cx="64" cy="64" r="52" fill="none" strokeWidth="10" className="stroke-slate-100 dark:stroke-slate-800" />
                        <circle
                          cx="64" cy="64" r="52" fill="none" strokeWidth="10" strokeLinecap="round"
                          className="stroke-blue-600 transition-all duration-700 ease-out"
                          strokeDasharray={ringCircumference}
                          strokeDashoffset={ringOffset}
                        />
                      </svg>
                      <div className="-mt-20 mb-16 text-center">
                        <p className="text-xl font-semibold text-slate-900 dark:text-white">{storagePct.toFixed(0)}%</p>
                        <p className="text-xs text-slate-400">of 1GB</p>
                      </div>
                      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-slate-900 dark:text-white">{calculateStorageUsage(documents)}</span>
                        {" "}across {stats.workspaces} workspace{stats.workspaces !== '1' ? 's' : ''}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ============ WORKSPACES TAB ============ */}
          {activeTab === 'workspaces' && (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 max-w-md">
                  <Input
                    placeholder="Search workspaces..."
                    value={workspaceSearch}
                    onChange={(e) => setWorkspaceSearch(e.target.value)}
                    leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
                  />
                </div>
                <Button onClick={() => setShowCreateModal(true)} leftIcon={<PlusIcon className="h-4 w-4" />}>
                  Create workspace
                </Button>
              </div>

              {workspacesLoading ? (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"></div>
                  ))}
                </div>
              ) : filteredWorkspaces.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {filteredWorkspaces.map((workspace) => (
                    <WorkspaceCard
                      key={workspace._id}
                      workspace={workspace}
                      userRole={getUserRole(workspace._id)}
                      onEdit={(workspace) => {
                        console.log('Edit workspace:', workspace.name);
                      }}
                      onDelete={async (workspace) => {
                        if (window.confirm(`Delete "${workspace.name}"?`)) {
                          try {
                            console.log('Delete workspace:', workspace.name);
                          } catch (error) {
                            console.error('Delete failed:', error);
                          }
                        }
                      }}
                      onInviteMembers={(workspace) => {
                        navigate(`/workspaces/${workspace._id}`);
                      }}
                      onViewMembers={(workspace) => {
                        navigate(`/workspaces/${workspace._id}`);
                      }}
                      onClick={() => navigate(`/workspaces/${workspace._id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-14">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                    <BuildingOfficeIcon className="h-5 w-5 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                    {workspaceSearch ? 'No workspaces found' : 'No workspaces yet'}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    {workspaceSearch ? 'Try adjusting your search terms' : 'Create your first workspace to start collaborating'}
                  </p>
                  {!workspaceSearch && (
                    <Button onClick={() => setShowCreateModal(true)} leftIcon={<PlusIcon className="h-4 w-4" />}>
                      Create your first workspace
                    </Button>
                  )}
                </div>
              )}

              {workspaces.length > 6 && !workspaceSearch && (
                <div className="text-center">
                  <Button as={RouterLink} to="/workspaces" variant="outline">
                    View all workspaces ({workspaces.length})
                  </Button>
                </div>
              )}
            </>
          )}

          {/* ============ ACTIVITY TAB ============ */}
          {activeTab === 'activity' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-5 text-base font-semibold text-slate-900 dark:text-white">Recent activity</h2>
              {recentActivity.length > 0 ? (
                <div className="timeline-rail space-y-5 pl-1">
                  {recentActivity.map((activity, index) => {
                    const Icon = activity.icon;
                    return (
                      <div key={index} className="relative flex items-start gap-4 pl-9">
                        <div className={`absolute left-0 flex h-8 w-8 items-center justify-center rounded-full bg-${activity.color}-50 dark:bg-${activity.color}-900/20 ring-4 ring-white dark:ring-slate-900`}>
                          <Icon className={`h-4 w-4 text-${activity.color}-600 dark:text-${activity.color}-400`} />
                        </div>
                        <div className="min-w-0 pt-1">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{activity.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{activity.time.toLocaleString()}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                    <ClockIcon className="h-4 w-4 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">No recent activity</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* âœ… FIXED: Create Workspace Modal with correct props */}
      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateWorkspace={handleCreateWorkspace}
        isLoading={workspacesLoading?.createWorkspace || false}
      />
    </div>
  );
};

// Helper functions (unchanged)
const formatFileSize = (bytes) => {
  if (!bytes) return '0 KB';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round(bytes / Math.pow(1024, i))} ${sizes[i]}`;
};

const calculateStorageUsage = (documents) => {
  const totalBytes = documents.reduce((acc, doc) => acc + (doc.size || 0), 0);
  return formatFileSize(totalBytes);
};

const calculateStoragePercentage = (documents) => {
  const limit = 1 * 1024 * 1024 * 1024; // 1GB in bytes
  const used = documents.reduce((acc, doc) => acc + (doc.size || 0), 0);
  const percentage = (used / limit) * 100;
  return Math.min(percentage, 100);
};

export default Dashboard;