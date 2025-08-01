import React, { useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Dropdown } from '../components/ui/Dropdown';
import { XMarkIcon } from '@heroicons/react/24/outline';
import ThemeToggle from '../components/ui/ThemeToggle';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/20/solid";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  // Updated to handle potential undefined state during initialization
  const {
    isAuthenticated = false,
    user = null,
    logout,
    loading = false
  } = useAuth() || {};

  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    if (logout) {
      logout();
      navigate('/login');
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleDropdownToggle = (dropdownName) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  // Generate initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Show loading state while Redux is initializing
  if (loading) {
    return (
      <nav className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <span className="text-xl font-bold text-gray-800 dark:text-white">
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

          {/* Logo */}
          <div className="flex-shrink-0">
            <RouterLink
              to="/"
              className="text-xl font-bold text-gray-800 dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              DocManager
            </RouterLink>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <DesktopNav isAuthenticated={isAuthenticated} currentPath={location.pathname} />
            </div>
          </div>

          {/* Right side - Auth buttons or user menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative">
                <Dropdown
                  trigger={
                    <button className="flex items-center space-x-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          getInitials(user?.name)
                        )}
                      </div>
                      <span className="hidden md:block text-gray-700 dark:text-gray-300">
                        {user?.name || 'User'}
                      </span>
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
                    <RouterLink
                      to="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      Settings
                    </RouterLink>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      Sign Out
                    </button>
                  </div>
                </Dropdown>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                {/* FIXED: Use onClick with navigate instead of wrapping Button in RouterLink */}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    console.log('Login button clicked'); // Debug log
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
                    console.log('Register button clicked'); // Debug log
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
              isAuthenticated={isAuthenticated}
              handleLogout={handleLogout}
              closeMobileMenu={() => setIsMobileMenuOpen(false)}
              navigate={navigate} // Pass navigate to MobileNav
            />
          </div>
        </div>
      )}
    </nav>
  );
};

const DesktopNav = ({ isAuthenticated, currentPath }) => {
  const [openDropdown, setOpenDropdown] = useState(null);

  // Navigation items based on authentication status
  const NAV_ITEMS = isAuthenticated
    ? [
      {
        label: 'Dashboard',
        href: '/dashboard',
      },
      {
        label: 'Documents',
        href: '/documents',
        children: [
          {
            label: 'All Documents',
            subLabel: 'View all your documents',
            href: '/documents',
          },
          {
            label: 'Shared With Me',
            subLabel: 'Documents shared by others',
            href: '/documents/shared',
          },
          {
            label: 'Upload',
            subLabel: 'Upload a new document',
            href: '/documents/upload',
          },
        ],
      },
    ]
    : [
      {
        label: 'Features',
        href: '/features',
      },
      {
        label: 'Pricing',
        href: '/pricing',
      },
    ];

  return (
    <div className="flex space-x-4">
      {NAV_ITEMS.map((navItem) => (
        <div key={navItem.label} className="relative">
          {navItem.children ? (
            <div
              className="relative"
              onMouseEnter={() => setOpenDropdown(navItem.label)}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button
                className={`inline-flex items-center px-3   text-sm font-medium rounded-md transition-colors ${currentPath === navItem.href
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                {navItem.label}
                <ChevronDownIcon className="ml-1 h-4 w-4" />
              </button>

              {openDropdown === navItem.label && (
                <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    {navItem.children.map((child) => (
                      <RouterLink
                        key={child.label}
                        to={child.href}
                        className="group flex items-start px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900  dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            {child.label}
                          </p>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">
                            {child.subLabel}
                          </p>
                        </div>
                        <ChevronRightIcon className="ml-2 h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                      </RouterLink>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <RouterLink
              to={navItem.href}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${currentPath === navItem.href
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              {navItem.label}
            </RouterLink>
          )}
        </div>
      ))}
    </div>
  );
};

const MobileNav = ({ isAuthenticated, handleLogout, closeMobileMenu, navigate }) => {
  const [expandedItem, setExpandedItem] = useState(null);

  // Mobile navigation items based on authentication status
  const NAV_ITEMS = isAuthenticated
    ? [
      {
        label: 'Dashboard',
        href: '/dashboard',
      },
      {
        label: 'All Documents',
        href: '/documents',
      },
      {
        label: 'Shared With Me',
        href: '/documents/shared',
      },
      {
        label: 'Upload Document',
        href: '/documents/upload',
      },
      {
        label: 'My Profile',
        href: '/profile',
      },
      {
        label: 'Settings',
        href: '/settings',
      },
      {
        label: 'Sign Out',
        onClick: handleLogout,
      },
    ]
    : [
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

  const handleItemClick = (item) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.href) {
      navigate(item.href);
    }
    closeMobileMenu();
  };

  return (
    <div className="space-y-1">
      {NAV_ITEMS.map((navItem) => (
        <div key={navItem.label}>
          {navItem.onClick || navItem.href ? (
            <button
              onClick={() => handleItemClick(navItem)}
              className="block w-full text-left px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              {navItem.label}
            </button>
          ) : navItem.children ? (
            <div>
              <button
                onClick={() => setExpandedItem(expandedItem === navItem.label ? null : navItem.label)}
                className="flex items-center justify-between w-full px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                {navItem.label}
                <ChevronDownIcon
                  className={`h-4 w-4 transition-transform ${expandedItem === navItem.label ? 'rotate-180' : ''
                    }`}
                />
              </button>
              {expandedItem === navItem.label && (
                <div className="pl-6 space-y-1">
                  {navItem.children.map((child) => (
                    <button
                      key={child.label}
                      onClick={() => {
                        navigate(child.href);
                        closeMobileMenu();
                      }}
                      className="block w-full text-left px-3  py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
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
              className="block px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              {navItem.label}
            </RouterLink>
          )}
        </div>
      ))}
    </div>
  );
};

export default Navbar;