import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Bars3Icon, BellIcon, ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import { useInvitations } from '../hooks/useInvitations';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { Button } from '../components/ui/Button';
import { Dropdown } from '../components/ui/Dropdown';
import Badge from '../components/ui/Badge';
import ThemeToggle from '../components/ui/ThemeToggle';

const getInitials = (name) => {
  if (!name) return 'U';
  return name.split(' ').map((w) => w.charAt(0)).join('').toUpperCase().slice(0, 2);
};

// Thin top bar. Sidebar (components/layout/Sidebar.jsx) owns primary nav —
// this only carries what doesn't fit there: mobile menu trigger, invitations
// bell, profile menu, theme toggle. Public (unauthenticated) pages get the
// logo + sign in/up instead, since Sidebar isn't rendered for them.
const Navbar = ({ onMenuClick }) => {
  const authHook = useAuth();
  const invitationsHook = useInvitations();
  const { searchWorkspaces } = useWorkspaces();
  const navigate = useNavigate();

  const isAuthenticated = authHook?.isAuthenticated || false;
  const user = authHook?.user || null;
  const authReady = authHook?.isAuthReady || false;
  const pendingInvitations = invitationsHook?.pendingInvitations || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);

  // searchWorkspaces() is a synchronous client-side filter over already-loaded
  // workspaces (name/description) — no dedicated document-search endpoint exists yet.
  const searchResults = useMemo(
    () => (searchTerm.trim() ? searchWorkspaces(searchTerm).slice(0, 6) : []),
    [searchTerm, searchWorkspaces]
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectWorkspace = (workspaceId) => {
    setSearchTerm('');
    setSearchOpen(false);
    navigate(`/workspaces/${workspaceId}`);
  };

  const handleLogout = useCallback(() => {
    authHook?.logout?.();
    navigate('/login');
  }, [authHook, navigate]);

  const initials = useMemo(() => getInitials(user?.name), [user?.name]);

  if (!authReady) {
    return (
      <nav className="sticky top-0 z-40 h-16 flex items-center px-4 sm:px-6 bg-surface border-b border-border">
        <span className="text-sm text-ink-muted">Loading...</span>
      </nav>
    );
  }

  return (
    <nav className={`sticky top-0 z-40 h-16 flex items-center px-4 sm:px-6 bg-surface border-b border-border ${isAuthenticated ? 'md:pl-6' : ''}`}>
      {isAuthenticated ? (
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={onMenuClick}
            className="md:hidden -ml-2 p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-2"
            aria-label="Open menu"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div ref={searchRef} className="relative flex-1 max-w-sm mx-3 sm:mx-6">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search workspaces..."
              className="w-full rounded-lg border border-border bg-surface-2 py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
            />

            {searchOpen && searchTerm.trim() && (
              <div className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-border bg-surface shadow-panel z-50 max-h-72 overflow-y-auto">
                {searchResults.length > 0 ? (
                  searchResults.map((ws) => (
                    <button
                      key={ws._id}
                      type="button"
                      onClick={() => handleSelectWorkspace(ws._id)}
                      className="block w-full truncate px-4 py-2 text-left text-sm text-ink hover:bg-surface-2"
                    >
                      {ws.name}
                    </button>
                  ))
                ) : (
                  <p className="px-4 py-3 text-sm text-ink-muted">No workspaces match "{searchTerm}"</p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {pendingInvitations.length > 0 && (
              <RouterLink
                to="/invitations"
                className="relative p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-2"
              >
                <BellIcon className="h-5 w-5" />
                <Badge
                  variant="danger"
                  size="xs"
                  className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 flex items-center justify-center"
                >
                  {pendingInvitations.length}
                </Badge>
              </RouterLink>
            )}

            <Dropdown
              trigger={
                <button className="flex items-center gap-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <span className="hidden md:block text-ink">{user?.name || 'User'}</span>
                  <ChevronDownIcon className="hidden md:block h-4 w-4 text-ink-muted" />
                </button>
              }
            >
              <div className="py-1">
                <RouterLink to="/profile" className="block px-4 py-2 text-sm text-ink hover:bg-surface-2">
                  My Profile
                </RouterLink>
                {pendingInvitations.length > 0 && (
                  <RouterLink to="/invitations" className="block px-4 py-2 text-sm text-ink hover:bg-surface-2">
                    <div className="flex items-center justify-between">
                      <span>Invitations</span>
                      <Badge variant="danger" size="xs">{pendingInvitations.length}</Badge>
                    </div>
                  </RouterLink>
                )}
                <hr className="my-1 border-border" />
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-ink hover:bg-surface-2">
                  Sign Out
                </button>
              </div>
            </Dropdown>

            <ThemeToggle />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between w-full">
          <RouterLink to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
            <span className="text-lg font-bold text-ink">DocManager</span>
          </RouterLink>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Sign In</Button>
            <Button size="sm" onClick={() => navigate('/register')}>Sign Up</Button>
            <ThemeToggle />
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;