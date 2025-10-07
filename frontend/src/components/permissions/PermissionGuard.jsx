import React from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useWorkspaces } from '../../hooks/useWorkspaces';

const PermissionGuard = ({
  children,
  workspaceId,
  requiredRole = null,
  workspaceIdParam,
  requiredPermissions = [],
  allowedRoles = [],
  fallback = null,
  fallbackMessage = "You don't have permission to access this content.",
  showFallback = true,
  userId = null,
  requireOwnership = false,
  requireAnyPermission = false,
  className = '',
  renderProps = false
}) => {
  const { user: currentUser } = useSelector(state => state.auth);
  const { getUserRole, getUserPermissions, canPerformAction } = useWorkspaces();
  const routeParams = useParams();

  // ✅ FIXED: Properly extract workspaceId from params
  const actualWorkspaceId = workspaceId || (workspaceIdParam ? routeParams[workspaceIdParam] : null);

  console.log('🔍 PermissionGuard Debug:', {
    workspaceId,
    workspaceIdParam, 
    routeParams,
    actualWorkspaceId,
    requiredPermissions,
    allowedRoles
  });
  
  // Get workspace and user data
  const workspace = useSelector(state => 
    state.workspaces.workspaces.find(w => w._id === actualWorkspaceId)
  );
  
  const targetUserId = userId || currentUser?.id;
  const userRole = getUserRole(actualWorkspaceId, targetUserId);
  const userPermissions = getUserPermissions(actualWorkspaceId, targetUserId);




  // Permission checking functions
  const checkRolePermission = () => {
    if (!userRole) return false;
    
    // Check specific required role
    if (requiredRole && userRole !== requiredRole) {
      return false;
    }
    
    // Check allowed roles
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      return false;
    }
    
    return true;
  };

const checkPermissions = () => {
  if (requiredPermissions.length === 0) return true;

  console.log('🔐 PermissionGuard checkPermissions debug:');
  console.log('- requiredPermissions:', requiredPermissions);
  console.log('- userPermissions:', userPermissions);
  console.log('- userPermissions type:', typeof userPermissions);

  // Handle object-based permissions (your actual format)
  if (userPermissions && typeof userPermissions === 'object' && !Array.isArray(userPermissions)) {
    console.log('📋 Using object-based permission checking');

    // Map permission names to object properties
    const permissionMap = {
      'read': 'canView',
      'view': 'canView', 
      'write': 'canEdit',
      'edit': 'canEdit',
      'add': 'canAdd',
      'create': 'canAdd',
      'delete': 'canDelete',
      'remove': 'canDelete',
      'invite': 'canInvite',
      'manage': 'canInvite'
    };

    if (requireAnyPermission) {
      // OR logic - user needs at least one of the required permissions
      const result = requiredPermissions.some(permission => {
        const objectKey = permissionMap[permission] || permission;
        const hasPermission = userPermissions[objectKey] === true;
        console.log(`- Checking permission '${permission}' -> '${objectKey}':`, hasPermission);
        return hasPermission;
      });
      console.log('🔍 OR logic result:', result);
      return result;
    } else {
      // AND logic - user needs all required permissions  
      const result = requiredPermissions.every(permission => {
        const objectKey = permissionMap[permission] || permission;
        const hasPermission = userPermissions[objectKey] === true;
        console.log(`- Checking permission '${permission}' -> '${objectKey}':`, hasPermission);
        return hasPermission;
      });
      console.log('🔍 AND logic result:', result);
      return result;
    }
  }

  // FALLBACK: Handle array-based permissions (if you ever use them)
  if (Array.isArray(userPermissions)) {
    console.log('📋 Using array-based permission checking');

    if (requireAnyPermission) {
      return requiredPermissions.some(permission => 
        userPermissions.includes(permission)
      );
    } else {
      return requiredPermissions.every(permission => 
        userPermissions.includes(permission)
      );
    }
  }

  console.log('⚠️ No valid permissions format found');
  return false;
};

   const checkOwnership = () => {
    if (!requireOwnership) return true;
    if (!workspace || !currentUser) return false;
    
    return workspace.owner === currentUser.id || userRole === 'owner';
  };

  const checkWorkspaceAction = (action) => {
    return canPerformAction(actualWorkspaceId, action, targetUserId);
  };

  // Main permission check
const hasPermission = () => {
  // ✅ Non-workspace context: use fallback prop
    if (!actualWorkspaceId) { 
    return fallback === true || fallback === null;
  }

  // ✅ Workspace context: check permissions
  if (!currentUser || !workspace) return false;
  if (!userRole) return false;
  if (!checkOwnership()) return false;
  if (!checkRolePermission()) return false;
  if (!checkPermissions()) return false;
  
  return true;
};
  // Role hierarchy helper
  const getRoleHierarchy = () => {
    const hierarchy = ['viewer', 'editor', 'admin', 'owner'];
    return hierarchy;
  };

  const hasMinimumRole = (minimumRole) => {
    const hierarchy = getRoleHierarchy();
    const userRoleIndex = hierarchy.indexOf(userRole);
    const minimumRoleIndex = hierarchy.indexOf(minimumRole);
    
    return userRoleIndex >= minimumRoleIndex;
  };

  // Enhanced permission checking with actions
  const checkSpecificActions = (actions = []) => {
    if (actions.length === 0) return true;
    
    return actions.every(action => {
      switch (action) {
        case 'read':
          return hasMinimumRole('viewer');
        case 'write':
        case 'edit':
          return hasMinimumRole('editor');
        case 'delete':
          return hasMinimumRole('editor');
        case 'manage_members':
          return hasMinimumRole('admin');
        case 'manage_settings':
          return hasMinimumRole('admin');
        case 'delete_workspace':
          return userRole === 'owner';
        default:
          return checkWorkspaceAction(action);
      }
    });
  };

  // Permission context for render props
  const permissionContext = {
    hasPermission: hasPermission(),
    userRole,
    userPermissions,
    workspace,
    currentUser,
    hasMinimumRole,
    checkSpecificActions,
    canPerformAction: (action) => checkWorkspaceAction(action),
    isOwner: userRole === 'owner',
    isAdmin: userRole === 'admin' || userRole === 'owner',
    isEditor: ['editor', 'admin', 'owner'].includes(userRole),
    isViewer: ['viewer', 'editor', 'admin', 'owner'].includes(userRole)
  };

  // Render props pattern
  if (renderProps) {
    return children(permissionContext);
  }

  // Standard conditional rendering
  const permitted = hasPermission();

  if (!permitted) {
    if (!showFallback) return null;
    
    if (fallback) return fallback;
    
    return (
      <div className={`permission-denied ${className}`}>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {fallbackMessage}
              </p>
              {userRole && (
                <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                  Your current role: {userRole}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <div className={className}>{children}</div>;
};

// Higher-order component for class components
export const withPermissions = (Component, permissionConfig = {}) => {
  return React.forwardRef((props, ref) => {
    return (
      <PermissionGuard {...permissionConfig} renderProps>
        {(permissionContext) => {
          if (!permissionContext.hasPermission) {
            return permissionConfig.fallback || (
              <div className="text-center py-8 text-gray-500">
                Access Denied
              </div>
            );
          }
          return (
            <Component 
              {...props} 
              ref={ref}
              permissionContext={permissionContext}
            />
          );
        }}
      </PermissionGuard>
    );
  });
};

// Convenience components for common use cases
export const AdminOnly = ({ children, workspaceId, fallback, className }) => (
  <PermissionGuard
    workspaceId={workspaceId}
    allowedRoles={['admin', 'owner']}
    fallback={fallback}
    fallbackMessage="Admin access required."
    className={className}
  >
    {children}
  </PermissionGuard>
);

export const OwnerOnly = ({ children, workspaceId, fallback, className }) => (
  <PermissionGuard
    workspaceId={workspaceId}
    requiredRole="owner"
    fallback={fallback}
    fallbackMessage="Owner access required."
    className={className}
  >
    {children}
  </PermissionGuard>
);

export const EditorPlus = ({ children, workspaceId, fallback, className }) => (
  <PermissionGuard
    workspaceId={workspaceId}
    allowedRoles={['editor', 'admin', 'owner']}
    fallback={fallback}
    fallbackMessage="Editor access or higher required."
    className={className}
  >
    {children}
  </PermissionGuard>
);

export const ViewerPlus = ({ children, workspaceId, fallback, className }) => (
  <PermissionGuard
    workspaceId={workspaceId}
    allowedRoles={['viewer', 'editor', 'admin', 'owner']}
    fallback={fallback}
    fallbackMessage="Workspace access required."
    className={className}
  >
    {children}
  </PermissionGuard>
);

// Hook for using permissions in functional components
export const usePermissions = (workspaceId, userId = null) => {
  const { user: currentUser } = useSelector(state => state.auth);
  const { getUserRole, getUserPermissions, canPerformAction } = useWorkspaces();
  
  const workspace = useSelector(state => 
    state.workspaces.workspaces.find(w => w._id === workspaceId)
  );
  
  const targetUserId = userId || currentUser?.id;
  const userRole = getUserRole(workspaceId, targetUserId);
  const userPermissions = getUserPermissions(workspaceId, targetUserId);

  const hasMinimumRole = (minimumRole) => {
    const hierarchy = ['viewer', 'editor', 'admin', 'owner'];
    const userRoleIndex = hierarchy.indexOf(userRole);
    const minimumRoleIndex = hierarchy.indexOf(minimumRole);
    
    return userRoleIndex >= minimumRoleIndex;
  };

  return {
    userRole,
    userPermissions,
    workspace,
    currentUser,
    hasMinimumRole,
    canPerformAction: (action) => canPerformAction(workspaceId, action, targetUserId),
    isOwner: userRole === 'owner',
    isAdmin: userRole === 'admin' || userRole === 'owner',
    isEditor: ['editor', 'admin', 'owner'].includes(userRole),
    isViewer: ['viewer', 'editor', 'admin', 'owner'].includes(userRole),
    hasAccess: !!userRole
  };
}

export default PermissionGuard;