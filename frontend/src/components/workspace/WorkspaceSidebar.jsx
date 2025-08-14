import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home, FileText, Users, Settings, Plus, Search, Filter,
  ChevronDown, ChevronRight, Folder, Star, Clock, Archive,
  BarChart3, Bell, Shield, Edit3, Eye, Menu, X, Pin, Hash
} from 'lucide-react';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import { usePermissions } from '../permissions/PermissionGuard';
import { useWorkspaces } from '../../hooks/useWorkspaces';
import { useDocuments } from '../../hooks/useDocuments';

const WorkspaceSidebar = ({
  workspaceId,
  isCollapsed = false,
  onToggleCollapse,
  className = '',
  showQuickActions = true,
  showRecentActivity = true,
  showWorkspaceInfo = true
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [expandedSections, setExpandedSections] = useState(['documents', 'categories']);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { workspace, isLoading } = useWorkspaces();
  const { documents, categories, recentDocuments } = useDocuments();
  const { userRole, isAdmin, isEditor, canPerformAction } = usePermissions(workspaceId);
  
  const currentWorkspace = useSelector(state => 
    state.workspaces.workspaces.find(w => w._id === workspaceId)
  );

  // Navigation items configuration
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      path: `/workspace/${workspaceId}`,
      badge: null,
      requiredPermission: 'read'
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: FileText,
      path: `/workspace/${workspaceId}/documents`,
      badge: documents?.length || 0,
      requiredPermission: 'read',
      expandable: true,
      children: [
        {
          id: 'all-documents',
          label: 'All Documents',
          icon: FileText,
          path: `/workspace/${workspaceId}/documents`,
          count: documents?.length || 0
        },
        {
          id: 'favorites',
          label: 'Favorites',
          icon: Star,
          path: `/workspace/${workspaceId}/documents/favorites`,
          count: documents?.filter(d => d.isFavorite)?.length || 0
        },
        {
          id: 'recent',
          label: 'Recent',
          icon: Clock,
          path: `/workspace/${workspaceId}/documents/recent`,
          count: recentDocuments?.length || 0
        },
        {
          id: 'archived',
          label: 'Archived',
          icon: Archive,
          path: `/workspace/${workspaceId}/documents/archived`,
          count: documents?.filter(d => d.isArchived)?.length || 0
        }
      ]
    },
    {
      id: 'members',
      label: 'Members',
      icon: Users,
      path: `/workspace/${workspaceId}/members`,
      badge: currentWorkspace?.members?.length || 0,
      requiredPermission: 'read'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      path: `/workspace/${workspaceId}/analytics`,
      requiredPermission: 'read'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      path: `/workspace/${workspaceId}/settings`,
      requiredRole: 'admin'
    }
  ];

  // Quick actions
  const quickActions = [
    {
      id: 'upload-document',
      label: 'Upload Document',
      icon: Plus,
      action: () => navigate(`/workspace/${workspaceId}/upload`),
      requiredPermission: 'write',
      primary: true
    },
    {
      id: 'invite-member',
      label: 'Invite Member',
      icon: Users,
      action: () => navigate(`/workspace/${workspaceId}/invite`),
      requiredRole: 'admin'
    }
  ];

  // Categories
  const documentCategories = categories || [
    { id: 'documents', name: 'Documents', count: 15, icon: FileText },
    { id: 'images', name: 'Images', count: 8, icon: FileText },
    { id: 'spreadsheets', name: 'Spreadsheets', count: 5, icon: FileText }
  ];

  // Set active section based on current path
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/documents')) setActiveSection('documents');
    else if (path.includes('/members')) setActiveSection('members');
    else if (path.includes('/analytics')) setActiveSection('analytics');
    else if (path.includes('/settings')) setActiveSection('settings');
    else setActiveSection('dashboard');
  }, [location.pathname]);

  // Toggle section expansion
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // Check if user has required permissions
  const hasPermission = (item) => {
    if (item.requiredRole) {
      if (item.requiredRole === 'admin') return isAdmin;
      if (item.requiredRole === 'editor') return isEditor;
    }
    if (item.requiredPermission) {
      return canPerformAction(item.requiredPermission);
    }
    return true;
  };

  // Render navigation item
  const renderNavItem = (item, isChild = false) => {
    if (!hasPermission(item)) return null;

    const isActive = activeSection === item.id || location.pathname === item.path;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections.includes(item.id);

    const handleClick = () => {
      if (hasChildren && item.expandable) {
        toggleSection(item.id);
      }
      if (item.path) {
        navigate(item.path);
      }
      if (item.action) {
        item.action();
      }
    };

    return (
      <div key={item.id}>
        <button
          onClick={handleClick}
          className={`
            w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg
            transition-colors duration-150
            ${isActive 
              ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }
            ${isChild ? 'ml-4 pl-8' : ''}
            ${isCollapsed ? 'justify-center px-2' : ''}
          `}
        >
          <div className="flex items-center space-x-3">
            <item.icon className={`flex-shrink-0 ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
            {!isCollapsed && (
              <>
                <span className="truncate">{item.label}</span>
                {item.badge !== null && item.badge !== undefined && (
                  <Badge variant="gray" size="sm">
                    {item.badge}
                  </Badge>
                )}
                {item.count !== undefined && (
                  <span className="text-xs text-gray-500">({item.count})</span>
                )}
              </>
            )}
          </div>
          {!isCollapsed && hasChildren && item.expandable && (
            <ChevronRight 
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
            />
          )}
        </button>

        {/* Render children */}
        {!isCollapsed && hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children.map(child => renderNavItem(child, true))}
          </div>
        )}
      </div>
    );
  };

  // Render quick action
  const renderQuickAction = (action) => {
    if (!hasPermission(action)) return null;

    return (
      <button
        key={action.id}
        onClick={action.action}
        className={`
          w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg
          transition-colors duration-150
          ${action.primary 
            ? 'bg-blue-600 text-white hover:bg-blue-700' 
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }
          ${isCollapsed ? 'justify-center px-2' : ''}
        `}
      >
        <action.icon className={`flex-shrink-0 ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
        {!isCollapsed && <span>{action.label}</span>}
      </button>
    );
  };

  // Render category
  const renderCategory = (category) => (
    <button
      key={category.id}
      onClick={() => navigate(`/workspace/${workspaceId}/documents?category=${category.id}`)}
      className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
    >
      <div className="flex items-center space-x-3">
        <Hash className="w-4 h-4 text-gray-400" />
        {!isCollapsed && <span className="truncate">{category.name}</span>}
      </div>
      {!isCollapsed && (
        <span className="text-xs text-gray-500">{category.count}</span>
      )}
    </button>
  );

  if (isLoading || !currentWorkspace) {
    return (
      <div className={`bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`
      bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 
      flex flex-col h-full
      ${isCollapsed ? 'w-16' : 'w-64'}
      transition-all duration-300
      ${className}
    `}>
      {/* Header */}
      {showWorkspaceInfo && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {!isCollapsed ? (
              <div className="flex items-center space-x-3 min-w-0">
                <Avatar 
                  name={currentWorkspace.name}
                  size="sm"
                  variant="square"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {currentWorkspace.name}
                  </h2>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge role={userRole} size="xs" />
                    <span className="text-xs text-gray-500">
                      {currentWorkspace.members?.length || 0} members
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <Avatar 
                name={currentWorkspace.name}
                size="sm"
                variant="square"
              />
            )}
            
            <button
              onClick={onToggleCollapse}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
            >
              {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search workspace..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {showQuickActions && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Quick Actions
            </h3>
          )}
          <div className="space-y-2">
            {quickActions.map(renderQuickAction)}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        {!isCollapsed && (
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Navigation
          </h3>
        )}
        <nav className="space-y-1">
          {navigationItems.map(item => renderNavItem(item))}
        </nav>

        {/* Categories */}
        {!isCollapsed && documentCategories.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Categories
            </h3>
            <div className="space-y-1">
              {documentCategories.map(renderCategory)}
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {showRecentActivity && !isCollapsed && recentDocuments?.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Recent Activity
          </h3>
          <div className="space-y-2">
            {recentDocuments.slice(0, 3).map((doc) => (
              <button
                key={doc._id}
                onClick={() => navigate(`/workspace/${workspaceId}/documents/${doc._id}`)}
                className="w-full flex items-center space-x-2 p-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate font-medium">{doc.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {new Date(doc.lastModified).toLocaleDateString()}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-500">
                {currentWorkspace.members?.filter(m => m.isOnline)?.length || 0} online
              </span>
            </div>
            <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded">
              <Bell className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded">
              <Bell className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Sidebar variants for different use cases
export const CompactWorkspaceSidebar = (props) => (
  <WorkspaceSidebar 
    {...props} 
    isCollapsed={true}
    showQuickActions={false}
    showRecentActivity={false}
  />
);

export const MobileWorkspaceSidebar = ({ isOpen, onClose, ...props }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden">
        <WorkspaceSidebar 
          {...props}
          className="h-full"
          onToggleCollapse={onClose}
        />
      </div>
    </>
  );
};

export default WorkspaceSidebar;