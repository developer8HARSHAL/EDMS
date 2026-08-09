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

const navLinkClasses = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
    isActive
      ? 'bg-surface-2 text-primary-700 dark:text-primary-300'
      : 'text-ink-muted hover:text-ink hover:bg-surface-2'
  }`;

// Shared nav + workspace-switcher content, rendered once for desktop and once for the mobile drawer
const SidebarContent = ({ workspaces, workspaceId, onNavigate }) => {
  const [workspacesExpanded, setWorkspacesExpanded] = useState(true);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 h-16 border-b border-border shrink-0">
        <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
        <span className="text-lg font-bold text-ink">DocManager</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
          <NavLink key={to} to={to} onClick={onNavigate} className={navLinkClasses}>
            <Icon className="h-5 w-5 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}

        <div className="pt-4">
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
            <div className="mt-1 space-y-0.5">
              {workspaces.length === 0 ? (
                <p className="px-3 py-1.5 text-sm text-ink-muted">No workspaces yet</p>
              ) : (
                workspaces.map((ws) => (
                  <NavLink
                    key={ws._id}
                    to={`/workspaces/${ws._id}`}
                    onClick={onNavigate}
                    className={() =>
                      `block truncate px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        ws._id === workspaceId
                          ? 'bg-surface-2 text-primary-700 dark:text-primary-300 font-medium'
                          : 'text-ink-muted hover:text-ink hover:bg-surface-2'
                      }`
                    }
                  >
                    {ws.name}
                  </NavLink>
                ))
              )}
            </div>
          )}
        </div>
      </nav>
    </div>
  );
};

// mobileOpen/onCloseMobile are controlled by the parent shell (App.js) so the
// hamburger toggle in Navbar can open this same Sidebar instance on small screens
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