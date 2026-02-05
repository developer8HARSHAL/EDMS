import React from 'react';
import { useSelector } from 'react-redux';
import { Shield, Edit3, Eye, User, Lock } from 'lucide-react';
import { usePermissions } from './PermissionGuard';

const RoleBasedComponent = ({
  workspaceId,
  roles = {},
  permissions = {},
  fallback = null,
  showRoleInfo = false,
  animateTransitions = true,
  className = '',
  userId = null
}) => {
  const {
    userRole,
    isOwner,
    isAdmin,
    isEditor,
    isViewer,
    hasAccess,
    canPerformAction
  } = usePermissions(workspaceId, userId);

  // Get the appropriate component/content based on user role
  const getContentForRole = () => {
    // Check specific role mappings first
    if (roles.owner && isOwner) return roles.owner;
    if (roles.admin && isAdmin && !isOwner) return roles.admin;
    if (roles.editor && isEditor && !isAdmin) return roles.editor;
    if (roles.viewer && isViewer && !isEditor) return roles.viewer;
    
    // Check permission-based mappings
    for (const [permission, content] of Object.entries(permissions)) {
      if (canPerformAction(permission)) {
        return content;
      }
    }
    
    // Fallback content
    return fallback;
  };

  const content = getContentForRole();

  // Role info component
  const RoleInfo = () => {
    if (!showRoleInfo || !userRole) return null;
    
    const getRoleIcon = (role) => {
      switch (role) {
        case 'owner': return <Shield className="w-4 h-4 text-yellow-500" />;
        case 'admin': return <Shield className="w-4 h-4 text-red-500" />;
        case 'editor': return <Edit3 className="w-4 h-4 text-blue-500" />;
        case 'viewer': return <Eye className="w-4 h-4 text-gray-500" />;
        default: return <User className="w-4 h-4 text-gray-400" />;
      }
    };

    const getRoleColor = (role) => {
      switch (role) {
        case 'owner': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
        case 'admin': return 'bg-red-50 text-red-700 border-red-200';
        case 'editor': return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'viewer': return 'bg-gray-50 text-gray-700 border-gray-200';
        default: return 'bg-gray-50 text-gray-700 border-gray-200';
      }
    };

    return (
      <div className={`inline-flex items-center space-x-2 px-2 py-1 rounded-md border text-xs font-medium ${getRoleColor(userRole)}`}>
        {getRoleIcon(userRole)}
        <span className="capitalize">{userRole}</span>
      </div>
    );
  };

  // No access fallback
  if (!hasAccess) {
    return (
      <div className={`role-based-no-access ${className}`}>
        <div className="flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="text-center">
            <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Access Required
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              You need to be a member of this workspace to view this content.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No content available
  if (!content) {
    return (
      <div className={`role-based-no-content ${className}`}>
        <div className="flex items-center justify-center p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="text-center">
            <User className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              No content available for your current role ({userRole}).
            </p>
            {showRoleInfo && <RoleInfo />}
          </div>
        </div>
      </div>
    );
  }

  // Render content with optional animations
  const wrapperClasses = `
    role-based-content
    ${animateTransitions ? 'transition-all duration-200 ease-in-out' : ''}
    ${className}
  `;

  return (
    <div className={wrapperClasses}>
      {showRoleInfo && (
        <div className="mb-4">
          <RoleInfo />
        </div>
      )}
      {typeof content === 'function' ? content({ userRole, isOwner, isAdmin, isEditor, isViewer }) : content}
    </div>
  );
};

// Specialized role-based components
export const OwnerAdminComponent = ({ workspaceId, ownerContent, adminContent, fallback, className }) => (
  <RoleBasedComponent
    workspaceId={workspaceId}
    roles={{
      owner: ownerContent,
      admin: adminContent
    }}
    fallback={fallback}
    className={className}
  />
);

export const EditorPlusComponent = ({ workspaceId, editorContent, adminContent, ownerContent, fallback, className }) => (
  <RoleBasedComponent
    workspaceId={workspaceId}
    roles={{
      owner: ownerContent,
      admin: adminContent,
      editor: editorContent
    }}
    fallback={fallback}
    className={className}
  />
);

export const AllRolesComponent = ({ workspaceId, ownerContent, adminContent, editorContent, viewerContent, fallback, className }) => (
  <RoleBasedComponent
    workspaceId={workspaceId}
    roles={{
      owner: ownerContent,
      admin: adminContent,
      editor: editorContent,
      viewer: viewerContent
    }}
    fallback={fallback}
    className={className}
  />
);

// Permission-based component for more granular control
export const PermissionBasedComponent = ({ workspaceId, permissions, fallback, className }) => (
  <RoleBasedComponent
    workspaceId={workspaceId}
    permissions={permissions}
    fallback={fallback}
    className={className}
  />
);

// Conditional action component
export const ConditionalAction = ({ 
  workspaceId, 
  action, 
  children, 
  fallback = null, 
  showUnavailable = false,
  unavailableMessage = "This action is not available for your role.",
  className = ''
}) => {
  const { canPerformAction, userRole } = usePermissions(workspaceId);
  
  const canPerform = canPerformAction(action);
  
  if (canPerform) {
    return <div className={className}>{children}</div>;
  }
  
  if (showUnavailable) {
    return (
      <div className={`conditional-action-unavailable ${className}`}>
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {unavailableMessage} (Current role: {userRole})
        </div>
      </div>
    );
  }
  
  return fallback;
};

// Role-based navigation component
export const RoleBasedNavigation = ({ workspaceId, navigationItems = {}, className = '' }) => {
  const { userRole, canPerformAction } = usePermissions(workspaceId);
  
  const getAvailableItems = () => {
    const availableItems = [];
    
    for (const [itemKey, item] of Object.entries(navigationItems)) {
      let hasAccess = true;
      
      // Check role requirements
      if (item.requiredRole) {
        const roleHierarchy = ['viewer', 'editor', 'admin', 'owner'];
        const userRoleIndex = roleHierarchy.indexOf(userRole);
        const requiredRoleIndex = roleHierarchy.indexOf(item.requiredRole);
        hasAccess = userRoleIndex >= requiredRoleIndex;
      }
      
      // Check specific roles
      if (item.allowedRoles && item.allowedRoles.length > 0) {
        hasAccess = item.allowedRoles.includes(userRole);
      }
      
      // Check permissions
      if (item.requiredPermissions && item.requiredPermissions.length > 0) {
        hasAccess = item.requiredPermissions.every(permission => 
          canPerformAction(permission)
        );
      }
      
      if (hasAccess) {
        availableItems.push({ key: itemKey, ...item });
      }
    }
    
    return availableItems;
  };
  
  const availableItems = getAvailableItems();
  
  return (
    <nav className={`role-based-navigation ${className}`}>
      {availableItems.map((item) => (
        <div key={item.key} className="navigation-item">
          {typeof item.component === 'function' 
            ? item.component({ userRole }) 
            : item.component
          }
        </div>
      ))}
    </nav>
  );
};

// Role badge component
export const RoleBadge = ({ workspaceId, userId, showIcon = true, size = 'default', className = '' }) => {
  const { userRole } = usePermissions(workspaceId, userId);
  
  if (!userRole) return null;
  
  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner': return <Shield className="w-3 h-3" />;
      case 'admin': return <Shield className="w-3 h-3" />;
      case 'editor': return <Edit3 className="w-3 h-3" />;
      case 'viewer': return <Eye className="w-3 h-3" />;
      default: return <User className="w-3 h-3" />;
    }
  };
  
  const getRoleColor = (role) => {
    switch (role) {
      case 'owner': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'editor': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'viewer': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    default: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };
  
  return (
    <span className={`
      inline-flex items-center space-x-1 rounded-full border font-medium
      ${getRoleColor(userRole)}
      ${sizeClasses[size]}
      ${className}
    `}>
      {showIcon && getRoleIcon(userRole)}
      <span className="capitalize">{userRole}</span>
    </span>
  );
};

export default RoleBasedComponent;