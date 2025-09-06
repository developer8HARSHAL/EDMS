// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSelector } from 'react-redux';
import PermissionGuard  from './permissions/PermissionGuard';

/**
 * A wrapper component that protects routes requiring authentication
 * and optionally workspace permissions
 * Redirects to login if user is not authenticated
 * Shows access denied if workspace permissions are insufficient
 */
const ProtectedRoute = ({ 
  children, 
  requireWorkspace = false,
  requiredPermissions = [],
  requiredRole = null,
  minimumRole = null,
  requireOwnership = false,
  fallbackPath = '/dashboard',
  showAccessDenied = true
}) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();
  const params = useParams();
  
  // Extract workspace ID from URL params if available
  const workspaceId = params.workspaceId || params.workspace;
  
  // Get workspace data from Redux store
  const workspace = useSelector(state => 
    workspaceId ? state.workspace?.workspaces?.find(w => w._id === workspaceId) : null
  );
  const workspaceLoading = useSelector(state => state.workspace?.loading || false);

  // Show loading spinner while authentication state is being determined
  if (loading || (requireWorkspace && workspaceLoading)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">
            {loading ? 'Checking authentication...' : 'loading workspace...'}
          </p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Save the location they were trying to access for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If workspace is required but not found
  if (requireWorkspace && workspaceId && !workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <i className="fas fa-exclamation-triangle text-6xl text-yellow-500 mb-6"></i>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Workspace Not Found</h1>
          <p className="text-gray-600 mb-6">
            The workspace you're trying to access doesn't exist or you don't have permission to view it.
          </p>
          <button
            onClick={() => window.location.href = fallbackPath}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <i className="fas fa-home mr-2"></i>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // If workspace permissions are required
  if (requireWorkspace && workspaceId && (
    requiredPermissions.length > 0 || 
    requiredRole || 
    minimumRole || 
    requireOwnership
  )) {
    const AccessDeniedFallback = () => (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <i className="fas fa-shield-alt text-6xl text-red-500 mb-6"></i>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don't have sufficient permissions to access this area of the workspace.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = `/workspaces/${workspaceId}`}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Workspace
            </button>
            <button
              onClick={() => window.location.href = fallbackPath}
              className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <i className="fas fa-home mr-2"></i>
              Go to Dashboard
            </button>
          </div>
          
          {workspace && (
            <div className="mt-6 p-4 bg-gray-100 rounded-lg text-left">
              <h3 className="font-medium text-gray-800 mb-2">Workspace Info:</h3>
              <p className="text-sm text-gray-600 mb-1">
                <strong>Name:</strong> {workspace.name}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Your Role:</strong> {getUserRoleInWorkspace(workspace, user) || 'No access'}
              </p>
            </div>
          )}
        </div>
      </div>
    );

    return (
      <PermissionGuard
        workspaceId={workspaceId}
        requiredPermissions={requiredPermissions}
        requiredRole={requiredRole}
        minimumRole={minimumRole}
        requireOwnership={requireOwnership}
        fallback={showAccessDenied ? <AccessDeniedFallback /> : <Navigate to={fallbackPath} replace />}
      >
        {children}
      </PermissionGuard>
    );
  }

  // Render children if all checks pass
  return children;
};

/**
 * Higher-order component for workspace-specific protected routes
 */
export const WorkspaceProtectedRoute = ({ 
  children, 
  requiredPermissions = ['read'],
  ...props 
}) => {
  return (
    <ProtectedRoute
      requireWorkspace={true}
      requiredPermissions={requiredPermissions}
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
};

/**
 * Admin-only workspace routes
 */
export const AdminProtectedRoute = ({ children, ...props }) => {
  return (
    <WorkspaceProtectedRoute
      minimumRole="admin"
      requiredPermissions={['admin']}
      {...props}
    >
      {children}
    </WorkspaceProtectedRoute>
  );
};

/**
 * Owner-only workspace routes
 */
export const OwnerProtectedRoute = ({ children, ...props }) => {
  return (
    <WorkspaceProtectedRoute
      requireOwnership={true}
      {...props}
    >
      {children}
    </WorkspaceProtectedRoute>
  );
};

/**
 * Editor-level workspace routes (Editor and above)
 */
export const EditorProtectedRoute = ({ children, ...props }) => {
  return (
    <WorkspaceProtectedRoute
      minimumRole="editor"
      requiredPermissions={['write']}
      {...props}
    >
      {children}
    </WorkspaceProtectedRoute>
  );
};

/**
 * Routes that require specific workspace permissions
 */
export const PermissionProtectedRoute = ({ 
  children, 
  permissions = [], 
  ...props 
}) => {
  return (
    <WorkspaceProtectedRoute
      requiredPermissions={permissions}
      {...props}
    >
      {children}
    </WorkspaceProtectedRoute>
  );
};

/**
 * Multi-workspace route protection (for workspace selection pages)
 */
export const MultiWorkspaceProtectedRoute = ({ children, ...props }) => {
  return (
    <ProtectedRoute {...props}>
      {children}
    </ProtectedRoute>
  );
};

// Helper function to get user role in workspace
const getUserRoleInWorkspace = (workspace, user) => {
  if (!workspace || !user) return null;
  
  const userId = user._id || user.id;
  
  // Check if user is owner
  if (workspace.owner === userId || workspace.owner?._id === userId) {
    return 'Owner';
  }
  
  // Check members array
  const member = workspace.members?.find(m => 
    (m.user === userId || m.user?._id === userId || m._id === userId)
  );
  
  if (member) {
    return member.role ? member.role.charAt(0).toUpperCase() + member.role.slice(1) : 'Member';
  }
  
  return null;
};

export default ProtectedRoute;