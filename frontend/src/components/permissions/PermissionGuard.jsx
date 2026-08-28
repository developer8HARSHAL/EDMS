import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useWorkspaces } from '../../hooks/useWorkspaces';
import { fetchWorkspaces } from '../../store/slices/workspaceSlice';

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
  const dispatch = useDispatch();
  const workspacesLoading = useSelector(state => state.workspaces.loading.fetchWorkspaces);
  // Tracks whether we've resolved (found, or confirmed-absent-after-fetch) the workspace
  // this guard needs — starts false so we don't fail-closed before data has loaded.
  const [workspaceResolved, setWorkspaceResolved] = useState(false);

  // ✅ FIXED: Properly extract workspaceId from params
  const actualWorkspaceId = workspaceId || (workspaceIdParam ? routeParams[workspaceIdParam] : null);

  // Get workspace and user data
  const workspace = useSelector(state => 
    state.workspaces.workspaces.find(w => w._id === actualWorkspaceId)
  );

  useEffect(() => {
    if (!actualWorkspaceId || workspace) {
      setWorkspaceResolved(true);
      return;
    }
    if (!workspacesLoading) {
      dispatch(fetchWorkspaces()).finally(() => setWorkspaceResolved(true));
    }
  }, [actualWorkspaceId, workspace, workspacesLoading, dispatch]);

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

  // Handle object-based permissions (your actual format)
  if (userPermissions && typeof userPermissions === 'object' && !Array.isArray(userPermissions)) {
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
      return requiredPermissions.some(permission => {
        const objectKey = permissionMap[permission] || permission;
        return userPermissions[objectKey] === true;
      });
    } else {
      // AND logic - user needs all required permissions  
      return requiredPermissions.every(permission => {
        const objectKey = permissionMap[permission] || permission;
        return userPermissions[objectKey] === true;
      });
    }
  }

  // FALLBACK: Handle array-based permissions (if you ever use them)
  if (Array.isArray(userPermissions)) {
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

  // Wait for the workspace fetch to resolve before judging permission or handing off
  // to either render mode — otherwise every workspace-scoped route fails-closed on
  // first render whenever the workspaces list isn't already warm in Redux.
  if (actualWorkspaceId && !workspace && !workspaceResolved) {
    if (renderProps) return children({ ...permissionContext, hasPermission: false, isLoading: true });
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-300 border-t-primary-600" />
      </div>
    );
  }

  // Render props pattern
  if (renderProps) {
    return children(permissionContext);
  }

  const permitted = hasPermission();

  if (!permitted) {
    if (!showFallback) return null;
    
    if (fallback) return fallback;
    
    return (
      <div className={`permission-denied ${className}`}>
        <div className="bg-warning-subtle border border-warning-subtle-ink/20 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-warning-subtle-ink" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-warning-subtle-ink">
                {fallbackMessage}
              </p>
              {userRole && (
                <p className="text-xs text-warning-subtle-ink/80 mt-1">
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
              <div className="text-center py-8 text-ink-muted">
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