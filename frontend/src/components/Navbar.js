import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Link as RouterLink, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { useInvitations } from '../hooks/useInvitations';
import { Button } from '../components/ui/Button';
import { Dropdown } from '../components/ui/Dropdown';
import Badge from '../components/ui/Badge';
import { XMarkIcon } from '@heroicons/react/24/outline';
import ThemeToggle from '../components/ui/ThemeToggle';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { 
  ChevronDownIcon, 
  ChevronRightIcon,
  PlusIcon,
  BuildingOfficeIcon,
  DocumentIcon,
  UserGroupIcon,
  BellIcon,
  HomeIcon,
  Cog6ToothIcon
} from "@heroicons/react/20/solid";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  // ✅ FIXED: Safe hook calls with proper error handling
  const authHook = useAuth();
  const workspacesHook = useWorkspaces();
  const invitationsHook = useInvitations();

  // ✅ FIXED: Safe destructuring with correct property names and memoization
  const authData = useMemo(() => ({
    isAuthenticated: authHook?.isAuthenticated || false,
    user: authHook?.user || null,
    logout: authHook?.logout,
    loading: authHook?.loading || false,
    authReady: authHook?.isAuthReady || false  // ✅ FIXED: Use isAuthReady instead of authReady
  }), [
    authHook?.isAuthenticated,
    authHook?.user,
    authHook?.logout,
    authHook?.loading,
    authHook?.isAuthReady  // ✅ FIXED: Use isAuthReady instead of authReady
  ]);

  // ✅ FIXED: Workspace integration with safe destructuring and memoization
  const workspaceData = useMemo(() => ({
    workspaces: workspacesHook?.workspaces || [],
    currentWorkspace: workspacesHook?.currentWorkspace || null,
    loading: workspacesHook?.loading || false,
    fetchWorkspaces: workspacesHook?.fetchWorkspaces,
    setCurrentWorkspace: workspacesHook?.setCurrentWorkspace,
    isReady: workspacesHook?.isReady || false
  }), [
    workspacesHook?.workspaces,
    workspacesHook?.currentWorkspace,
    workspacesHook?.loading,
    workspacesHook?.fetchWorkspaces,
    workspacesHook?.setCurrentWorkspace,
    workspacesHook?.isReady
  ]);

  // ✅ FIXED: Invitation integration with safe destructuring and memoization
  const invitationData = useMemo(() => ({
    pendingInvitations: invitationsHook?.pendingInvitations || [],
    fetchPendingInvitations: invitationsHook?.fetchPendingInvitations,
    isReady: invitationsHook?.isReady || false
  }), [
    invitationsHook?.pendingInvitations,
    invitationsHook?.fetchPendingInvitations,
    invitationsHook?.isReady
  ]);

  const navigate = useNavigate();
  const location = useLocation();
  const { workspaceId } = useParams();

  // ✅ FIXED: Memoized values to prevent useEffect dependency changes
  const currentPath = useMemo(() => location.pathname, [location.pathname]);
  const currentWorkspaceId = useMemo(() => workspaceId, [workspaceId]);

  // ✅ FIXED: Fetch workspace data when authenticated - stable dependencies
  useEffect(() => {
    const shouldFetch = authData.isAuthenticated && 
                       authData.authReady && 
                       !workspaceData.loading && 
                       workspaceData.workspaces.length === 0 &&  // ✅ Only fetch if empty
                       workspaceData.fetchWorkspaces;

    if (shouldFetch) {
      console.log('🚀 Navbar: Auto-fetching workspaces...');
      workspaceData.fetchWorkspaces();
    }
  }, [
    authData.isAuthenticated,
    authData.authReady,
    workspaceData.loading,
    workspaceData.workspaces.length  // ✅ Track length, not array
  ]);

  // ✅ FIXED: Fetch pending invitations when authenticated - stable dependencies  
  useEffect(() => {
    const shouldFetch = authData.isAuthenticated && 
                       authData.authReady && 
                       invitationData.isReady && 
                       invitationData.fetchPendingInvitations;

    if (shouldFetch) {
      invitationData.fetchPendingInvitations();
    }
  }, [
    authData.isAuthenticated,
    authData.authReady,
    invitationData.isReady
  ]); // ✅ Removed fetchPendingInvitations from deps to prevent loops

  // ✅ FIXED: Set current workspace based on URL - stable dependencies with proper workspace finding
  useEffect(() => {
    const shouldSetWorkspace = currentWorkspaceId && 
                              workspaceData.workspaces.length > 0 && 
                              workspaceData.setCurrentWorkspace;

    if (shouldSetWorkspace) {
      const workspace = workspaceData.workspaces.find(w => w._id === currentWorkspaceId);
      const shouldUpdate = workspace && 
                          (!workspaceData.currentWorkspace || 
                           workspaceData.currentWorkspace._id !== currentWorkspaceId);
      
      if (shouldUpdate) {
        workspaceData.setCurrentWorkspace(workspace);
      }
    }
  }, [
    currentWorkspaceId,
    workspaceData.workspaces.length, // Use length instead of array reference
    workspaceData.currentWorkspace?._id // Only track the ID
  ]); // ✅ Removed setCurrentWorkspace to prevent loops

  // ✅ FIXED: Memoized logout handler
  const handleLogout = useCallback(() => {
    if (authData.logout) {
      authData.logout();
      navigate('/login');
    }
  }, [authData.logout, navigate]);

  // ✅ FIXED: Memoized toggle functions
  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

const toggleTimeout = useRef(null);

const handleDropdownToggle = useCallback((dropdownName) => {
  clearTimeout(toggleTimeout.current);
  toggleTimeout.current = setTimeout(() => {
    setOpenDropdown(prev => prev === dropdownName ? null : dropdownName);
  }, 500); // delay in ms
}, []);



  // ✅ FIXED: Memoized utility functions
  const getInitials = useCallback((name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, []);

  // ✅ FIXED: Memoized derived state
  const derivedState = useMemo(() => ({
    isInWorkspace: !!currentWorkspaceId,
    isLoading: authData.loading || !authData.authReady,
    isReady: authHook && authData.authReady
  }), [currentWorkspaceId, authData.loading, authData.authReady, authHook]);

  // ✅ FIXED: Show loading state with proper conditions
  if (derivedState.isLoading || !derivedState.isReady) {
    return (
      <nav className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                DocManager
              </span>
            </div>
            <div className="text-gray-500">Loading...</div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Logo & Workspace Context */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10? rounded-lg flex items-center justify-center">
                  <img src="/logo.png" alt="Logo" className="w-18 h-10" />
                  {/* <FileText className="w-6 h-6 text-white" /> */}
                </div>
            <RouterLink
              to="/"
              className="text-xl font-bold text-gray-800 dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              DocManager
            </RouterLink>
            
            {/* Workspace Context Indicator */}
            {authData.isAuthenticated && derivedState.isInWorkspace && workspaceData.currentWorkspace && (
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <BuildingOfficeIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {workspaceData.currentWorkspace.name}
                </span>
                <Badge variant="outline" size="xs">
                  {workspaceData.currentWorkspace.members?.length || 0} members
                </Badge>
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <DesktopNav 
                isAuthenticated={authData.isAuthenticated} 
                currentPath={currentPath}
                workspaces={workspaceData.workspaces}
                currentWorkspace={workspaceData.currentWorkspace}
                isInWorkspace={derivedState.isInWorkspace}
                workspaceId={currentWorkspaceId}
              />
            </div>
          </div>

          {/* Right side - Auth buttons or user menu */}
          <div className="flex items-center space-x-4">
            {authData.isAuthenticated ? (
              <>
                {/* Notifications for invitations */}
                {invitationData.pendingInvitations.length > 0 && (
                  <div className="relative">
                    <RouterLink
                      to="/invitations"
                      className="relative p-2 text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200 transition-colors"
                    >
                      <BellIcon className="h-6 w-6" />
                      <Badge 
                        variant="danger" 
                        size="xs" 
                        className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 flex items-center justify-center"
                      >
                        {invitationData.pendingInvitations.length}
                      </Badge>
                    </RouterLink>
                  </div>
                )}

                {/* ✅ FIXED: User dropdown with stable user data */}
                <div className="relative">
                  <Dropdown
                    trigger={
                      <button className="flex items-center space-x-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {authData.user?.avatar ? (
                            <img
                              src={authData.user.avatar}
                              alt={authData.user.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            getInitials(authData.user?.name)
                          )}
                        </div>
                        <span className="hidden md:block text-gray-700 dark:text-gray-300">
                          {authData.user?.name || 'User'}
                        </span>
                        <ChevronDownIcon className="hidden md:block h-4 w-4 text-gray-400" />
                      </button>
                    }
                  >
                    <div className="py-1">
                      <RouterLink
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        My Profile
                      </RouterLink>
                      {/* <RouterLink
                        to="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        Settings
                      </RouterLink> */}
                      {invitationData.pendingInvitations.length > 0 && (
                        <RouterLink
                          to="/invitations"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                          <div className="flex items-center justify-between">
                            <span>Invitations</span>
                            <Badge variant="danger" size="xs">
                              {invitationData.pendingInvitations.length}
                            </Badge>
                          </div>
                        </RouterLink>
                      )}
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        Sign Out
                      </button>
                    </div>
                  </Dropdown>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    console.log('Login button clicked');
                    navigate('/login');
                  }}
                >
                  Sign In
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hidden md:inline-flex"
                  onClick={() => {
                    console.log('Register button clicked');
                    navigate('/register');
                  }}
                >
                  Sign Up
                </Button>
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <MobileNav
              isAuthenticated={authData.isAuthenticated}
              handleLogout={handleLogout}
              closeMobileMenu={() => setIsMobileMenuOpen(false)}
              navigate={navigate}
              workspaces={workspaceData.workspaces}
              currentWorkspace={workspaceData.currentWorkspace}
              isInWorkspace={derivedState.isInWorkspace}
              workspaceId={currentWorkspaceId}
              pendingInvitations={invitationData.pendingInvitations}
            />
          </div>
        </div>
      )}
    </nav>
  );
};

// ✅ FIXED: Memoized DesktopNav component with stable props
const DesktopNav = React.memo(({ 
  isAuthenticated, 
  currentPath, 
  workspaces, 
  currentWorkspace, 
  isInWorkspace, 
  workspaceId 
}) => {
  const [openDropdown, setOpenDropdown] = useState(null);

  // ✅ FIXED: Memoized navigation items to prevent re-computation
  const navItems = useMemo(() => {
    if (!isAuthenticated) {
      return [
        {
          // label: 'Features',
          href: '/features',
        },
        {
          // label: 'Pricing',
          href: '/pricing',
        },
      ];
    }

    if (isInWorkspace && currentWorkspace) {
      // Workspace-specific navigation
      return [
        {
          label: 'Dashboard',
          href: '/dashboard',
          icon: HomeIcon,
        },
        {
          label: 'Workspace',
          href: `/workspaces/${workspaceId}`,
          icon: BuildingOfficeIcon,
          children: [
            {
              label: 'Workspace Home',
              subLabel: 'Overview and activity',
              href: `/workspaces/${workspaceId}`,
              icon: HomeIcon,
            },
            {
              label: 'Documents',
              subLabel: 'Browse workspace files',
              href: `/workspaces/${workspaceId}/documents`,
              icon: DocumentIcon,
            },
            {
              label: 'Members',
              subLabel: 'Manage team members',
              href: `/workspaces/${workspaceId}/members`,
              icon: UserGroupIcon,
            },
            {
              label: 'Settings',
              subLabel: 'Workspace settings',
              href: `/workspaces/${workspaceId}/settings`,
              icon: Cog6ToothIcon,
            },
          ],
        },
        {
          label: 'All Workspaces',
          href: '/workspaces',
          icon: BuildingOfficeIcon,
        },
      ];
    }

    // Global navigation (not in workspace)
    return [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: HomeIcon,
      },
      {
        label: 'Workspaces',
        href: '/workspaces',
        icon: BuildingOfficeIcon,
        children: [
          {
            label: 'Browse Workspaces',
            subLabel: 'View all your workspaces',
            href: '/dashboard?tab=workspaces',
            icon: BuildingOfficeIcon,
          },
          ...workspaces.slice(0, 5).map(workspace => ({
            label: workspace.name,
            subLabel: `${workspace.members?.length || 0} members`,
            href: `/workspaces/${workspace._id}`,
            icon: BuildingOfficeIcon,
          })),
          ...(workspaces.length > 5 ? [{
            label: 'View All',
            subLabel: `+${workspaces.length - 5} more workspaces`,
             href: '/dashboard#workspaces',
            icon: ChevronRightIcon,
          }] : []),
        ],
      },
      {
        label: 'Documents',
        href: '/documents',
        icon: DocumentIcon,
        children: [
          {
            label: 'All Documents',
            subLabel: 'View all your documents',
            href: '/documents',
            icon: DocumentIcon,
          },
          {
            label: 'Shared With Me',
            subLabel: 'Documents shared by others',
            href: '/documents/shared',
            icon: UserGroupIcon,
          },
          {
            label: 'Upload Document',
            subLabel: 'Upload a new document',
            href: '/documents/upload',
            icon: PlusIcon,
          },
        ],
      },
    ];
  }, [isAuthenticated, isInWorkspace, currentWorkspace, workspaceId, workspaces]);

  // ✅ FIXED: Memoized dropdown handlers
const hoverTimeout = useRef(null);
const closeTimeout = useRef(null);

const handleMouseEnter = useCallback((label) => {
  // Cancel close timer if mouse comes back quickly
  clearTimeout(closeTimeout.current);

  hoverTimeout.current = setTimeout(() => {
    setOpenDropdown(label);
  }, 300); // delay for opening (ms)
}, []);

const handleMouseLeave = useCallback(() => {
  // Delay closing instead of instantly
  closeTimeout.current = setTimeout(() => {
    setOpenDropdown(null);
  }, 500); // delay before closing (ms)
}, []);


  return (
    <div className="flex space-x-4">
      {navItems.map((navItem) => (
        <div key={navItem.label} className="relative">
          {navItem.children ? (
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter(navItem.label)}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentPath === navItem.href
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                {navItem.icon && <navItem.icon className="mr-2 h-4 w-4" />}
                {navItem.label}
                <ChevronDownIcon className="ml-1 h-4 w-4" />
              </button>

              {openDropdown === navItem.label && (
                <div className="absolute left-0 mt-2 w-64 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-2">
                    {navItem.children.map((child) => (
                      <RouterLink
                        key={child.label}
                        to={child.href}
                        className="group flex items-start px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        {child.icon && (
                          <child.icon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-blue-500 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                            {child.label}
                          </p>
                          {child.subLabel && (
                            <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5 truncate">
                              {child.subLabel}
                            </p>
                          )}
                        </div>
                        <ChevronRightIcon className="ml-2 h-4 w-4 text-gray-400 group-hover:text-blue-500 flex-shrink-0 mt-0.5" />
                      </RouterLink>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <RouterLink
              to={navItem.href}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                currentPath === navItem.href
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              {navItem.icon && <navItem.icon className="mr-2 h-4 w-4" />}
              {navItem.label}
            </RouterLink>
          )}
        </div>
      ))}
    </div>
  );
});

// ✅ FIXED: Memoized MobileNav component with stable props
const MobileNav = React.memo(({ 
  isAuthenticated, 
  handleLogout, 
  closeMobileMenu, 
  navigate,
  workspaces,
  currentWorkspace,
  isInWorkspace,
  workspaceId,
  pendingInvitations
}) => {
  const [expandedItem, setExpandedItem] = useState(null);

  // ✅ FIXED: Memoized mobile navigation items
  const navItems = useMemo(() => {
    if (!isAuthenticated) {
      return [
        {
          label: 'Features',
          href: '/features',
        },
        {
          label: 'Pricing',
          href: '/pricing',
        },
        {
          label: 'Sign In',
          href: '/login',
        },
        {
          label: 'Sign Up',
          href: '/register',
        },
      ];
    }

    const baseItems = [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: HomeIcon,
      },
    ];

    if (isInWorkspace && currentWorkspace) {
      // In workspace context
      baseItems.push(
        {
          label: currentWorkspace.name,
          icon: BuildingOfficeIcon,
          children: [
            {
              label: 'Workspace Home',
              href: `/workspaces/${workspaceId}`,
            },
            {
              label: 'Documents',
              href: `/workspaces/${workspaceId}/documents`,
            },
            {
              label: 'Members',
              href: `/workspaces/${workspaceId}/members`,
            },
            {
              label: 'Settings',
              href: `/workspaces/${workspaceId}/settings`,
            },
          ],
        },
        {
          label: 'All Workspaces',
          href: '/workspaces',
          icon: BuildingOfficeIcon,
        }
      );
    } else {
      // Global context
      baseItems.push(
        {
          label: 'Workspaces',
          href: '/workspaces',
          icon: BuildingOfficeIcon,
        },
        {
          label: 'All Documents',
          href: '/documents',
          icon: DocumentIcon,
        },
        {
          label: 'Upload Document',
          href: '/documents/upload',
          icon: PlusIcon,
        }
      );
    }

    // Add user-specific items
    baseItems.push(
      {
        label: 'My Profile',
        href: '/profile',
      },
      {
        label: 'Settings',
        href: '/settings',
      }
    );

    // Add invitations if any
    if (pendingInvitations.length > 0) {
      baseItems.push({
        label: `Invitations (${pendingInvitations.length})`,
        href: '/invitations',
        badge: pendingInvitations.length,
      });
    }

    baseItems.push({
      label: 'Sign Out',
      onClick: handleLogout,
    });

    return baseItems;
  }, [
    isAuthenticated,
    isInWorkspace,
    currentWorkspace,
    workspaceId,
    pendingInvitations.length,
    handleLogout
  ]);

  // ✅ FIXED: Memoized item click handler
  const handleItemClick = useCallback((item) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.href) {
      navigate(item.href);
    }
    closeMobileMenu();
  }, [navigate, closeMobileMenu]);

  // ✅ FIXED: Memoized expand handler
  const handleExpandToggle = useCallback((label) => {
    setExpandedItem(prev => prev === label ? null : label);
  }, []);

  return (
    <div className="space-y-1">
      {/* Current workspace indicator for mobile */}
      {isAuthenticated && isInWorkspace && currentWorkspace && (
        <div className="px-3 py-2 mb-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <BuildingOfficeIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {currentWorkspace.name}
            </span>
            <Badge variant="outline" size="xs">
              {currentWorkspace.members?.length || 0}
            </Badge>
          </div>
        </div>
      )}

      {navItems.map((navItem) => (
        <div key={navItem.label}>
          {navItem.onClick || (navItem.href && !navItem.children) ? (
            <button
              onClick={() => handleItemClick(navItem)}
              className="flex items-center justify-between w-full text-left px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <div className="flex items-center space-x-2">
                {navItem.icon && <navItem.icon className="h-5 w-5" />}
                <span>{navItem.label}</span>
              </div>
              {navItem.badge && (
                <Badge variant="danger" size="xs">
                  {navItem.badge}
                </Badge>
              )}
            </button>
          ) : navItem.children ? (
            <div>
              <button
                onClick={() => handleExpandToggle(navItem.label)}
                className="flex items-center justify-between w-full px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                <div className="flex items-center space-x-2">
                  {navItem.icon && <navItem.icon className="h-5 w-5" />}
                  <span>{navItem.label}</span>
                </div>
                <ChevronDownIcon
                  className={`h-4 w-4 transition-transform ${
                    expandedItem === navItem.label ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedItem === navItem.label && (
                <div className="pl-6 space-y-1 mt-1">
                  {navItem.children.map((child) => (
                    <button
                      key={child.label}
                      onClick={() => {
                        navigate(child.href);
                        closeMobileMenu();
                      }}
                      className="block w-full text-left px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                    >
                      {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <RouterLink
              to={navItem.href}
              onClick={closeMobileMenu}
              className="flex items-center space-x-2 px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              {navItem.icon && <navItem.icon className="h-5 w-5" />}
              <span>{navItem.label}</span>
            </RouterLink>
          )}
        </div>
      ))}
    </div>
  );
});

// Add display names for debugging
DesktopNav.displayName = 'DesktopNav';
MobileNav.displayName = 'MobileNav';

export default Navbar;