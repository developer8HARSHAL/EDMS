import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  BellIcon,
  SunIcon,
  MoonIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  UserCircleIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { useWorkspaces } from '../hooks/useWorkspaces';

// onMenuClick opens the Sidebar's mobile drawer (components/layout/Sidebar.jsx) —
// required on small screens since Sidebar's own rail is desktop-only (md:flex).
const Navbar = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { searchWorkspaces } = useWorkspaces();

  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const searchRef = useRef(null);
  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  const isDark = theme === 'dark';

  const displayName = user?.name || 'Guest';
  const email = user?.email || 'guest@edmsdemo.com';

  const initials =
    displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'G';

  /*
   * ----------------------------------------------------
   * Close dropdowns when clicking outside
   * ----------------------------------------------------
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }

      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /*
   * ----------------------------------------------------
   * Search
   * ----------------------------------------------------
   */
  const handleSearch = (event) => {
    event.preventDefault();

    const value = search.trim();

    if (!value) return;

    /*
     * Replace this with your actual document search route/API
     * when the backend search endpoint is available.
     */
    navigate(`/documents?search=${encodeURIComponent(value)}`);
  };

  /*
   * ----------------------------------------------------
   * Logout
   * ----------------------------------------------------
   */
  const handleLogout = async () => {
    setProfileOpen(false);

    try {
      await logout();
    } finally {
      navigate('/login');
    }
  };

  return (
    <header
      className="
        sticky
        top-0
        z-50
        h-16
        w-full
        border-b
        border-border
        bg-surface
      "
    >
      <div
        className="flex h-full w-full items-center px-6"
      >
        {/* =================================================
            LEFT — WORKSPACE / APP ICON
        ================================================= */}
        <div className="w-56 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/')}
            aria-label="Workspace"
            className="flex items-center gap-2 text-ink"
          >
            <DocumentTextIcon className="h-5 w-5" />
            <span className="text-sm font-semibold tracking-tight">DocManager</span>
          </button>
        </div>

        {/* =================================================
            RIGHT — UTILITY CONTROLS
        ================================================= */}
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">

          {/* -------------------------------------------------
              SEARCH
          ------------------------------------------------- */}
          <form onSubmit={handleSearch} className="hidden w-full max-w-md sm:block">
            <div
              className="
                flex
                h-10
                w-full
                items-center
                rounded-lg
                border
                border-border
                bg-surface-2/40
                transition-colors
                focus-within:border-primary-400
                focus-within:bg-surface
              "
            >
              <MagnifyingGlassIcon
                className="
                  ml-3
                  h-[17px]
                  w-[17px]
                  shrink-0
                  text-ink-muted
                "
              />

              <input
                id="global-search-input"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search documents..."
               className="
  min-w-0
  flex-1
  border-0
  bg-transparent
  px-2
  text-sm
  text-ink
  outline-none
  ring-0
  focus:border-0
  focus:outline-none
  focus:ring-0
  appearance-none
  placeholder:text-ink-muted
"
                aria-label="Search documents"
              />

              <kbd
                className="
                  mr-1.5
                  hidden
                  h-5
                  min-w-5
                  items-center
                  justify-center
                  rounded
                  border
                  border-border
                  bg-surface
                  px-1
                  text-[10px]
                  font-medium
                  text-ink-muted
                  lg:flex
                "
              >
                /
              </kbd>
            </div>
          </form>

          {/* -------------------------------------------------
              SEPARATOR
          ------------------------------------------------- */}
          <div className="mx-1 h-6 w-px bg-border" />

          {/* =================================================
              NOTIFICATIONS
          ================================================= */}
          <div
            ref={notificationRef}
            className="relative"
          >
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen((current) => !current);
                setProfileOpen(false);
              }}
              aria-label="Notifications"
              aria-expanded={notificationsOpen}
              className="
                relative
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-lg
                text-ink-muted
                transition-colors
                hover:bg-surface-2
                hover:text-ink
              "
            >
              <BellIcon className="h-[19px] w-[19px]" />

              {/* Unread indicator */}
              <span
                className="
                  absolute
                  right-[7px]
                  top-[6px]
                  h-1.5
                  w-1.5
                  rounded-full
                  bg-primary-600
                  ring-2
                  ring-surface
                "
              />
            </button>

            {/* Notification dropdown */}
            {notificationsOpen && (
              <div
                className="
                  absolute
                  right-0
                  top-[calc(100%+10px)]
                  w-[360px]
                  overflow-hidden
                  rounded-xl
                  border
                  border-border
                  bg-surface
                  shadow-lg
                "
              >
                {/* Header */}
                <div
                  className="
                    flex
                    h-12
                    items-center
                    justify-between
                    border-b
                    border-border
                    px-4
                  "
                >
                  <div>
                    <h3 className="text-sm font-semibold text-ink">
                      Notifications
                    </h3>

                    <p className="text-[11px] text-ink-muted">
                      Recent activity
                    </p>
                  </div>


                </div>

                {/* Notification list */}
                <div className="max-h-[340px] overflow-y-auto">

                  {/* Notification 1 */}
                  <button
                    type="button"
                    className="
                      flex
                      w-full
                      gap-3
                      border-b
                      border-border
                      px-4
                      py-3.5
                      text-left
                      transition-colors
                      hover:bg-surface-2
                    "
                  >
                    <span
                      className="
                        flex
                        h-8
                        w-8
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        bg-primary-50
                        text-primary-600
                        dark:bg-primary-950/40
                      "
                    >
                      <DocumentTextIcon className="h-4 w-4" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-medium text-ink">
                        Document requires review
                      </span>

                      <span className="mt-0.5 block text-[11px] leading-4 text-ink-muted">
                        Annual compliance report is waiting for your review.
                      </span>

                      <span className="mt-1.5 block text-[10px] text-ink-muted">
                        12 minutes ago
                      </span>
                    </span>

                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-600" />
                  </button>

                  {/* Notification 2 */}
                  <button
                    type="button"
                    className="
                      flex
                      w-full
                      gap-3
                      border-b
                      border-border
                      px-4
                      py-3.5
                      text-left
                      transition-colors
                      hover:bg-surface-2
                    "
                  >
                    <span
                      className="
                        flex
                        h-8
                        w-8
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        bg-amber-50
                        text-amber-600
                        dark:bg-amber-950/30
                      "
                    >
                      <ClockIcon className="h-4 w-4" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-medium text-ink">
                        Deadline approaching
                      </span>

                      <span className="mt-0.5 block text-[11px] leading-4 text-ink-muted">
                        Vendor agreement is due tomorrow.
                      </span>

                      <span className="mt-1.5 block text-[10px] text-ink-muted">
                        1 hour ago
                      </span>
                    </span>
                  </button>

                  {/* Notification 3 */}
                  <button
                    type="button"
                    className="
                      flex
                      w-full
                      gap-3
                      px-4
                      py-3.5
                      text-left
                      transition-colors
                      hover:bg-surface-2
                    "
                  >
                    <span
                      className="
                        flex
                        h-8
                        w-8
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        bg-emerald-50
                        text-emerald-600
                        dark:bg-emerald-950/30
                      "
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-medium text-ink">
                        Document approved
                      </span>

                      <span className="mt-0.5 block text-[11px] leading-4 text-ink-muted">
                        Q3 policy document was approved by the reviewer.
                      </span>

                      <span className="mt-1.5 block text-[10px] text-ink-muted">
                        3 hours ago
                      </span>
                    </span>
                  </button>
                </div>

                {/* Footer */}
                <div
                  className="
                    border-t
                    border-border
                    px-4
                    py-2.5
                  "
                >
                  <button
                    type="button"
                    className="
                      text-xs
                      font-medium
                      text-primary-600
                      hover:text-primary-700
                      dark:text-primary-400
                    "
                  >
                    Mark all as read
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* -------------------------------------------------
              THEME
          ------------------------------------------------- */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              isDark
                ? 'Switch to light mode'
                : 'Switch to dark mode'
            }
            title={
              isDark
                ? 'Switch to light mode'
                : 'Switch to dark mode'
            }
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-lg
              text-ink-muted
              transition-colors
              hover:bg-surface-2
              hover:text-ink
            "
          >
            {isDark ? (
              <SunIcon className="h-[19px] w-[19px]" />
            ) : (
              <MoonIcon className="h-[19px] w-[19px]" />
            )}
          </button>

          {/* -------------------------------------------------
              SEPARATOR
          ------------------------------------------------- */}
          <div className="mx-1 h-6 w-px bg-border" />

          {/* =================================================
              PROFILE
          ================================================= */}
          <div
            ref={profileRef}
            className="relative"
          >
            <button
              type="button"
              onClick={() => {
                setProfileOpen((current) => !current);
                setNotificationsOpen(false);
              }}
              aria-expanded={profileOpen}
              className="
                flex
                h-9
                items-center
                gap-2
                rounded-lg
                px-1
                transition-colors
                hover:bg-surface-2
              "
            >
              {/* Avatar */}
              <span
                className="
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-primary-100
                  text-[11px]
                  font-semibold
                  text-primary-700
                  dark:bg-primary-900/50
                  dark:text-primary-300
                "
              >
                {initials}
              </span>

              {/* User */}
              <span className="hidden max-w-[110px] truncate text-left text-sm font-medium text-ink sm:block">
                {displayName}
              </span>

              <ChevronDownIcon
                className="
                  h-3.5
                  w-3.5
                  shrink-0
                  text-ink-muted
                "
              />
            </button>

            {/* Profile dropdown */}
            {profileOpen && (
              <div
                className="
                  absolute
                  right-0
                  top-[calc(100%+10px)]
                  w-60
                  overflow-hidden
                  rounded-xl
                  border
                  border-border
                  bg-surface
                  shadow-lg
                "
              >
                <div className="border-b border-border px-4 py-3">
                  <p className="truncate text-sm font-semibold text-ink">
                    {displayName}
                  </p>

                  <p className="mt-0.5 truncate text-xs text-ink-muted">
                    {email}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate('/profile');
                  }}
                  className="
                    flex
                    w-full
                    items-center
                    gap-2.5
                    px-4
                    py-2.5
                    text-left
                    text-sm
                    text-ink
                    hover:bg-surface-2
                  "
                >
                  <UserCircleIcon className="h-4 w-4 text-ink-muted" />
                  Profile
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="
                    flex
                    w-full
                    items-center
                    gap-2.5
                    border-t
                    border-border
                    px-4
                    py-2.5
                    text-left
                    text-sm
                    text-red-600
                    hover:bg-red-50
                    dark:hover:bg-red-950/20
                  "
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;