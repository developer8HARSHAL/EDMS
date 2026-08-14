import React, { useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { useWorkspaces } from '../../hooks/useWorkspaces';
import {
  HomeIcon,
  DocumentIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const NAV_ITEMS = [
  { label: 'Home', to: '/dashboard', icon: HomeIcon },
  { label: 'Workspaces', to: '/workspaces', icon: BuildingOfficeIcon },
  { label: 'Documents', to: '/documents', icon: DocumentIcon },
  { label: 'Calendar', to: '/calendar', icon: CalendarIcon },
];

// "AI Cost Optimization Advisor" -> "AC", "Guest Demo Workspace" -> "GD",
// single-word names like "workspace1" -> "WO" (first two chars, uppercased).
const getInitials = (name = '') => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return '?';
};

const navLinkClasses = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
    isActive
      ? 'bg-surface-2 text-primary-700 dark:text-primary-300 '
      : 'text-ink-muted hover:text-ink hover:bg-surface/60'
  }`;

// Shared nav + workspace-switcher content, rendered once for desktop and once for the mobile drawer
const SidebarContent = ({ workspaces, workspaceId, onNavigate }) => {
  const [workspacesExpanded, setWorkspacesExpanded] = useState(true);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 h-16 border-b border-border shrink-0">
        <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
        <span className="text-lg font-bold text-ink truncate">DocManager</span>
      </div>

      <nav className="px-3 py-4 space-y-1 shrink-0">
        {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
          <NavLink key={to} to={to} onClick={onNavigate} className={navLinkClasses}>
            <Icon className="h-5 w-5 shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Workspace switcher gets its own scroll region, separate from the fixed nav above it,
          so a long workspace list scrolls on its own instead of pushing nav items off-screen. */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-4">
        <button
          type="button"
          onClick={() => setWorkspacesExpanded((prev) => !prev)}
          className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted hover:text-ink"
        >
          <span>Your workspaces</span>
          {workspacesExpanded ? (
            <ChevronDownIcon className="h-4 w-4" />
          ) : (
            <ChevronRightIcon className="h-4 w-4" />
          )}
        </button>

        {workspacesExpanded && (
          <div className="mt-1 space-y-1">
            {workspaces.length === 0 ? (
              <p className="px-3 py-1.5 text-sm text-ink-muted">No workspaces yet</p>
            ) : (
              workspaces.map((ws) => (
                <NavLink
                  key={ws._id}
                  to={`/workspaces/${ws._id}`}
                  onClick={onNavigate}
                  className={() =>
                    `flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      ws._id === workspaceId
                        ? 'bg-surface text-primary-700 dark:text-primary-300 font-medium shadow-xs'
                        : 'text-ink-muted hover:text-ink hover:bg-surface/60'
                    }`
                  }
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-xs font-semibold text-primary-700 dark:bg-primary-950/60 dark:text-primary-300"
                      aria-hidden="true"
                    >
                      {getInitials(ws.name)}
                    </span>
                    <span className="truncate">{ws.name}</span>
                  </span>
                  {typeof ws.documentCount === 'number' && (
                    <span className="badge-pill shrink-0 whitespace-nowrap">
                      {ws.documentCount} {ws.documentCount === 1 ? 'doc' : 'docs'}
                    </span>
                  )}
                </NavLink>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// mobileOpen/onCloseMobile are controlled by the parent shell (App.js) so the
// hamburger toggle in Navbar can open this same Sidebar instance on small screens.
//
// Background is deliberately bg-surface-2, not bg-surface: cards/panels on every page use
// bg-surface, so giving the sidebar that same color would make it read as "just another card"
// floating in the page rather than as the app's chrome. bg-surface-2 is already the token one
// tier up from page background in the tiering this project uses (index.css: bg < surface <
// surface-2), so this reuses an existing token rather than introducing a new one.
const Sidebar = ({ mobileOpen = false, onCloseMobile }) => {
  const { workspaceId } = useParams();
  const { workspaces } = useWorkspaces();

  return (
    <>
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-surface border-r border-border z-30">
        <SidebarContent workspaces={workspaces} workspaceId={workspaceId} />
      </aside>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-ink/40" onClick={onCloseMobile} aria-hidden="true" />
          <aside className="relative w-64 h-full bg-surface border-r border-border">
            <SidebarContent
              workspaces={workspaces}
              workspaceId={workspaceId}
              onNavigate={onCloseMobile}
            />
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;