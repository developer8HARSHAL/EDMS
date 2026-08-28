import React, { useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useWorkspaces } from '../../hooks/useWorkspaces';
import { useAuth } from '../../hooks/useAuth';
import { useDocuments } from '../../hooks/useDocuments';
import { formatDisplayName } from '../../utils/dashboardUtils';
import { UserAvatar } from '../ui/Avatar';
import {
  Home,
  FileText,
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  HardDrive,
  LogOut,
  BarChart3,
} from 'lucide-react';

const MAX_SIDEBAR_DOCUMENTS = 2;

const getInitials = (name = '') => {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return '?';
};

const primaryNavClasses = ({ isActive }) =>
  `group relative flex min-h-10 items-center gap-3 px-3 text-sm font-medium transition-colors duration-150 ${
    isActive
      ? 'text-primary-700 dark:text-primary-300'
      : 'text-ink-muted hover:text-ink'
  }`;

const primaryIconClasses = (isActive) =>
  `h-[18px] w-[18px] shrink-0 transition-colors duration-150 ${
    isActive
      ? 'text-primary-600 dark:text-primary-400'
      : 'text-ink-muted group-hover:text-ink'
  }`;

const ActiveRail = ({ isActive }) =>
  isActive ? (
    <span
      className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary-600 dark:bg-primary-400"
      aria-hidden="true"
    />
  ) : null;

const SidebarSectionHeader = ({
  icon: Icon,
  label,
  expanded,
  onToggle,
  to,
  isActive,
  onNavigate,
}) => (
  <div className="relative">
    <ActiveRail isActive={isActive} />

    <div className="flex items-center">
      <NavLink
        to={to}
        onClick={onNavigate}
        className={({ isActive: linkActive }) =>
          `group relative flex min-h-10 min-w-0 flex-1 items-center gap-3 px-3 text-sm font-medium transition-colors duration-150 ${
            linkActive
              ? 'text-primary-700 dark:text-primary-300'
              : 'text-ink-muted hover:text-ink'
          }`
        }
      >
        {({ isActive: linkActive }) => (
          <>
            <Icon
              className={primaryIconClasses(linkActive)}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 truncate">{label}</span>
          </>
        )}
      </NavLink>

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={`${expanded ? 'Collapse' : 'Expand'} ${label}`}
        className="
          mr-1 flex h-8 w-8 shrink-0 items-center justify-center
          text-ink-muted transition-colors duration-150
          hover:text-ink
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-primary-500
          focus-visible:ring-offset-1
        "
      >
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-150 ${
            expanded ? '' : '-rotate-90'
          }`}
          aria-hidden="true"
        />
      </button>
    </div>
  </div>
);

const SidebarContent = ({
  workspaces = [],
  documents = [],
  storageLabel,
  documentCount,
  user,
  onLogout,
  onNavigate,
}) => {
  const location = useLocation();
  const [workspacesExpanded, setWorkspacesExpanded] = useState(true);
  const [documentsExpanded, setDocumentsExpanded] = useState(true);

  const visibleDocuments = useMemo(
    () => documents.slice(0, MAX_SIDEBAR_DOCUMENTS),
    [documents]
  );

  const hasMoreDocuments =
    documents.length > MAX_SIDEBAR_DOCUMENTS;

  const isWorkspaceRoute =
    location.pathname === '/workspaces' ||
    location.pathname.startsWith('/workspaces/');

  const isDocumentsRoute =
    location.pathname === '/documents' ||
    location.pathname.startsWith('/documents/');

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className="flex h-16 shrink-0 items-center px-4">
        <NavLink
          to="/dashboard"
          onClick={onNavigate}
          className="
            group flex min-w-0 items-center gap-3
            text-ink
           
          "
          aria-label="DocManager home"
        >
          <span
            className="
              flex h-8 w-8 shrink-0 items-center justify-center
              rounded-lg bg-primary-50 text-primary-700
              dark:bg-primary-950/60 dark:text-primary-300
            "
            aria-hidden="true"
          >
            <FileText className="h-4 w-4" />
          </span>

          <span className="truncate font-semibold tracking-tight">
            DocManager
          </span>
        </NavLink>
      </div>

      <nav
        aria-label="Primary navigation"
        className="min-h-0 flex-1 overflow-y-auto px-3 py-4"
      >
        <div className="space-y-1">
          <div className="relative">
            <ActiveRail isActive={location.pathname === '/home'} />

            <NavLink
              to="/home"
              onClick={onNavigate}
              className={primaryNavClasses}
            >
              {({ isActive }) => (
                <>
                  <Home
                    className={primaryIconClasses(isActive)}
                    aria-hidden="true"
                  />
                  <span>Home</span>
                </>
              )}
            </NavLink>
          </div>

          <div className="relative">
            <ActiveRail isActive={location.pathname === '/dashboard'} />

            <NavLink
              to="/dashboard"
              onClick={onNavigate}
              className={primaryNavClasses}
            >
              {({ isActive }) => (
                <>
                  <BarChart3
                    className={primaryIconClasses(isActive)}
                    aria-hidden="true"
                  />
                  <span>Dashboard</span>
                </>
              )}
            </NavLink>
          </div>

          <div className="pt-2">
            <SidebarSectionHeader
              icon={Building2}
              label="Workspaces"
              to="/workspaces"
              expanded={workspacesExpanded}
              isActive={isWorkspaceRoute}
              onToggle={() =>
                setWorkspacesExpanded((current) => !current)
              }
              onNavigate={onNavigate}
            />

            {workspacesExpanded && (
              <div className="ml-4 mt-1 border-l border-border pl-2">
                {workspaces.length ? (
                  <div className="space-y-0.5">
                    {workspaces.map((workspace) => (
                      <NavLink
                        key={workspace._id}
                        to={`/workspaces/${workspace._id}`}
                        onClick={onNavigate}
                        title={workspace.name}
                        className={`
                          group flex min-w-0 items-center gap-2.5
                          px-3 py-2 text-sm
                          transition-colors duration-150
                          ${
                            location.pathname ===
                            `/workspaces/${workspace._id}`
                              ? 'text-primary-700 dark:text-primary-300'
                              : 'text-ink-muted hover:text-ink'
                          }
                        `}
                      >
                        <span
                          className={`
                            flex h-7 w-7 shrink-0 items-center justify-center
                            rounded-lg font-semibold
                            ${
                              location.pathname ===
                              `/workspaces/${workspace._id}`
                                ? 'bg-primary-100 text-primary-700 dark:bg-primary-950/70 dark:text-primary-300'
                                : 'bg-surface-2 text-ink-muted'
                            }
                          `}
                          aria-hidden="true"
                        >
                          {getInitials(workspace.name)}
                        </span>

                        <span className="min-w-0 flex-1 truncate">
                          {workspace.name}
                        </span>

                        <ChevronRight
                          className="
                            h-3.5 w-3.5 shrink-0
                            text-ink-muted opacity-0
                            transition-opacity duration-150
                            group-hover:opacity-100
                          "
                          aria-hidden="true"
                        />
                      </NavLink>
                    ))}
                  </div>
                ) : (
                  <p className="px-3 py-2 text-sm text-ink-muted">
                    No workspaces yet
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="pt-1">
            <SidebarSectionHeader
              icon={FileText}
              label="Documents"
              to="/documents"
              expanded={documentsExpanded}
              isActive={isDocumentsRoute}
              onToggle={() =>
                setDocumentsExpanded((current) => !current)
              }
              onNavigate={onNavigate}
            />

            {documentsExpanded && (
              <div className="ml-4 mt-1 border-l border-border pl-2">
                {visibleDocuments.length ? (
                  <div className="space-y-0.5">
                    {visibleDocuments.map((document) => (
                      <NavLink
                        key={document._id}
                        to={`/documents?search=${encodeURIComponent(
                          document.name
                        )}`}
                        onClick={onNavigate}
                        title={document.name}
                        className={({ isActive }) =>
                          `group flex min-w-0 items-center gap-2.5 px-3 py-2 text-sm transition-colors duration-150 ${
                            isActive
                              ? 'text-primary-700 dark:text-primary-300'
                              : 'text-ink-muted hover:text-ink'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <FileText
                              className={`
                                h-4 w-4 shrink-0
                                ${
                                  isActive
                                    ? 'text-primary-600 dark:text-primary-400'
                                    : 'text-ink-muted'
                                }
                              `}
                              aria-hidden="true"
                            />
                            <span className="min-w-0 flex-1 truncate">
                              {document.name}
                            </span>
                          </>
                        )}
                      </NavLink>
                    ))}

                    {hasMoreDocuments && (
                      <NavLink
                        to="/documents"
                        onClick={onNavigate}
                        className="
                          group flex items-center gap-2
                          px-3 py-2 text-sm font-medium
                          text-primary-700 transition-colors duration-150
                          hover:text-primary-800
                          dark:text-primary-300
                          dark:hover:text-primary-200
                        "
                      >
                        <span className="ml-6">View all</span>
                        <ChevronRight
                          className="
                            h-3.5 w-3.5
                            transition-transform duration-150
                            group-hover:translate-x-0.5
                          "
                          aria-hidden="true"
                        />
                      </NavLink>
                    )}
                  </div>
                ) : (
                  <p className="px-3 py-2 text-sm text-ink-muted">
                    No documents yet
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="relative pt-1">
            <ActiveRail
              isActive={location.pathname.startsWith('/calendar')}
            />

            <NavLink
              to="/calendar"
              onClick={onNavigate}
              className={primaryNavClasses}
            >
              {({ isActive }) => (
                <>
                  <Calendar
                    className={primaryIconClasses(isActive)}
                    aria-hidden="true"
                  />
                  <span>Calendar</span>
                </>
              )}
            </NavLink>
          </div>
        </div>
      </nav>

      <div className="shrink-0 px-3 py-3 ">
        <div className="px-3 py-2.5 bg-surface-2">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-ink-muted">
            <HardDrive className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Storage</span>
          </div>

          <p className="mt-2 truncate font-medium text-ink">
            {storageLabel}
          </p>

          <p className="text-xs text-ink-muted">
            {documentCount}{' '}
            {documentCount === 1 ? 'document' : 'documents'} ·{' '}
            {workspaces.length}{' '}
            {workspaces.length === 1 ? 'workspace' : 'workspaces'}
          </p>
        </div>

        <div className="border-t-transparent border-border pt-2">
          <NavLink
            to="/profile"
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150 ${
                isActive
                  ? 'bg-surface-2 text-ink'
                  : 'text-ink-muted hover:bg-surface-hover hover:text-ink'
              }`
            }
          >
            <UserAvatar
              user={user}
              size="sm"
              ariaLabel={formatDisplayName(user?.name)}
            />

            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-ink">
                {formatDisplayName(user?.name)}
              </span>
              <span className="block truncate text-xs text-ink-muted">
                View profile
              </span>
            </span>

            <ChevronRight
              className="
                h-4 w-4 shrink-0 text-ink-muted
                transition-transform duration-150
                group-hover:translate-x-0.5
              "
              aria-hidden="true"
            />
          </NavLink>

          <button
            type="button"
            onClick={onLogout}
            className="
              flex w-full items-center gap-3 rounded-lg px-3 py-2.5
              text-sm text-danger transition-colors duration-150
              hover:bg-danger-subtle/60
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-primary-500
              focus-visible:ring-offset-2
            "
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ mobileOpen = false, onCloseMobile }) => {
  const { workspaces = [] } = useWorkspaces();
  const { user, logout } = useAuth();
  const { documents = [], formatFileSize } = useDocuments();

  const totalSize = useMemo(
    () =>
      documents.reduce(
        (sum, document) => sum + (document.size || 0),
        0
      ),
    [documents]
  );

  const documentCount = documents.length;

  const storageLabel =
    documentCount === 0
      ? 'No documents yet'
      : `${formatFileSize(totalSize)} used`;

  const contentProps = {
    workspaces,
    documents,
    documentCount,
    storageLabel,
    user,
    onLogout: logout,
  };

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col shadow-panel bg-surface md:flex">
        <SidebarContent {...contentProps} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] flex md:hidden">
          <button
            type="button"
            className="fixed inset-0 cursor-default bg-overlay/40"
            onClick={onCloseMobile}
            aria-label="Close menu"
          />

          <aside className="relative h-full w-64 border-r border-border bg-surface shadow-panel">
            <SidebarContent
              {...contentProps}
              onNavigate={onCloseMobile}
            />
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;