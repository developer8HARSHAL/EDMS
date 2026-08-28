import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Sun,
  Moon,
  ChevronDown,
  FileText,
  UserCircle,
} from 'lucide-react';

import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { UserAvatar } from '../components/ui/Avatar';

const Navbar = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [search, setSearch] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);

  const profileRef = useRef(null);

  const isDark = theme === 'dark';

  const displayName = user?.name || 'Guest';
  const email = user?.email || 'guest@edmsdemo.com';

  const handleSearch = (event) => {
    event.preventDefault();

    const value = search.trim();

    if (!value) return;

    navigate(`/documents?search=${encodeURIComponent(value)}`);
  };

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
        sticky top-0 z-50
        h-16 w-full
        
        bg-surface/95
        backdrop-blur
      "
    >
      <div className="relative flex h-full w-full items-center px-4 sm:px-5 lg:px-6">
        {/* Mobile navigation */}
        <div className="flex min-w-0 items-center md:hidden">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open menu"
            className="
              mr-2 flex h-9 w-9 shrink-0 items-center justify-center
              rounded-lg text-ink-muted
              transition-colors duration-150
              hover:bg-surface-2 hover:text-ink
              focus-visible:outline-none
              focus-visible:ring-2 focus-visible:ring-primary-500
              focus-visible:ring-offset-2
              focus-visible:ring-offset-surface
            "
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            aria-label="Go to dashboard"
            className="
              inline-flex min-w-0 items-center gap-2.5
              rounded-lg px-1.5 py-1.5
              text-ink
              transition-colors duration-150
              hover:bg-surface-2
              focus-visible:outline-none
              focus-visible:ring-2 focus-visible:ring-primary-500
              focus-visible:ring-offset-2
              focus-visible:ring-offset-surface
            "
          >
            <span
              className="
                flex h-8 w-8 shrink-0 items-center justify-center
                rounded-lg bg-primary-50 text-primary-700
                dark:bg-primary-950/60 dark:text-primary-300
              "
              aria-hidden="true"
            >
              <FileText className="h-[17px] w-[17px]" />
            </span>

            <span className="truncate text-[15px] font-semibold tracking-tight">
              DocManager
            </span>
          </button>
        </div>

        <div className="absolute left-1/2 hidden -translate-x-1/2 sm:block">
          <form onSubmit={handleSearch} className="w-[min(520px,calc(100vw-22rem))]">
            <div
              className="
                flex h-10 w-full items-center
                rounded-xl
                border border-border
                bg-surface-2/50
                px-1
                transition-colors duration-150
                focus-within:border-primary-300
                focus-within:bg-surface
                focus-within:ring-2
                focus-within:ring-primary-500/10
              "
            >
              <Search
                className="ml-2.5 h-[17px] w-[17px] shrink-0 text-ink-muted"
                aria-hidden="true"
              />

              <input
                id="global-search-input"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search documents..."
                className="
                  min-w-0 flex-1
                  border-0 bg-transparent
                  px-2.5
                  text-sm text-ink
                  outline-none ring-0
                  placeholder:text-ink-muted
                  focus:border-0 focus:outline-none focus:ring-0
                  appearance-none
                "
                aria-label="Search documents"
              />

              <kbd
                className="
                  mr-1.5 hidden h-6 min-w-6 items-center justify-center
                  rounded-md border border-border
                  bg-surface px-1.5
                  text-[10px] font-medium text-ink-muted
                  lg:flex
                "
              >
                /
              </kbd>
            </div>
          </form>
        </div>

        {/* Mobile search */}
        <form
          onSubmit={handleSearch}
          className="ml-auto min-w-0 flex-1 sm:hidden"
        >
          <div
            className="
              ml-2 flex h-9 items-center
              rounded-lg border border-border
              bg-surface-2/50 px-1
              focus-within:border-primary-300
              focus-within:bg-surface
              focus-within:ring-2 focus-within:ring-primary-500/10
            "
          >
            <Search
              className="ml-2 h-4 w-4 shrink-0 text-ink-muted"
              aria-hidden="true"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search"
              className="
                min-w-0 flex-1 border-0 bg-transparent
                px-2 text-sm text-ink outline-none ring-0
                placeholder:text-ink-muted focus:border-0
                focus:outline-none focus:ring-0
              "
              aria-label="Search documents"
            />
          </div>
        </form>

        {/* Right controls */}
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              isDark ? 'Switch to light mode' : 'Switch to dark mode'
            }
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="
              flex h-9 w-9 shrink-0 items-center justify-center
              rounded-lg text-ink-muted
              transition-colors duration-150
              hover:bg-surface-2 hover:text-ink
              focus-visible:outline-none
              focus-visible:ring-2 focus-visible:ring-primary-500
              focus-visible:ring-offset-2
              focus-visible:ring-offset-surface
            "
          >
            {isDark ? (
              <Sun className="h-[18px] w-[18px]" aria-hidden="true" />
            ) : (
              <Moon className="h-[18px] w-[18px]" aria-hidden="true" />
            )}
          </button>

          <div
            className="mx-1 hidden h-5 w-px bg-border sm:block"
            aria-hidden="true"
          />

          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((current) => !current)}
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              className="
                flex h-10 items-center gap-2
                rounded-xl px-1.5
                transition-colors duration-150
                hover:bg-surface-2
                focus-visible:outline-none
                focus-visible:ring-2 focus-visible:ring-primary-500
                focus-visible:ring-offset-2
                focus-visible:ring-offset-surface
              "
            >
              <UserAvatar user={user} size="sm" />

              <span className="hidden max-w-[130px] truncate text-left text-sm font-medium text-ink sm:block">
                {displayName}
              </span>

              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 text-ink-muted transition-transform duration-150 ${
                  profileOpen ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>

            {profileOpen && (
              <div
                role="menu"
                className="
                  absolute right-0 top-[calc(100%+8px)] z-50
                  w-64 overflow-hidden
                  rounded-xl
                  
                  bg-surface
                  shadow-panel
                "
              >
                <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
                  <UserAvatar user={user} size="sm" />

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {displayName}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-ink-muted">
                      {email}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate('/profile');
                  }}
                  className="
                    flex w-full items-center gap-2.5
                    px-4 py-2.5 text-left text-sm text-ink
                    transition-colors duration-150
                    hover:bg-surface-2
                    focus-visible:outline-none
                    focus-visible:bg-surface-2
                  "
                >
                  <UserCircle
                    className="h-4 w-4 text-ink-muted"
                    aria-hidden="true"
                  />
                  Profile
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="
                    flex w-full items-center gap-2.5
                    border-t border-border
                    px-4 py-2.5 text-left text-sm text-danger
                    transition-colors duration-150
                    hover:bg-danger-subtle/50
                    focus-visible:outline-none
                    focus-visible:bg-danger-subtle/50
                  "
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-danger"
                    aria-hidden="true"
                  />
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