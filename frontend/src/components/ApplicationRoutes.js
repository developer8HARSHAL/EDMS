// frontend/src/components/ApplicationRoutes.js - COMPLETE FIX
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Import existing pages
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import DocumentList from '../pages/DocumentList';
import UploadDocument from '../pages/UploadDocument';
import DocumentPreview from '../pages/DocumentPreview';
import Profile from '../pages/Profile';
import NotFound from './NotFound';
import ProtectedRoute from './ProtectedRoute';

// Import new workspace pages
import WorkspacePage from '../pages/WorkspacePage';
import WorkspaceSettings from '../pages/WorkspaceSettings';
import InvitationPage from '../pages/InvitationPage';
import LandingPage from '../pages/LandingPage';

import { useParams } from 'react-router-dom';
// Import permission guard for workspace routes
import PermissionGuard from './permissions/PermissionGuard';

function WorkspaceRedirect() {
  const { workspaceId } = useParams();
  return <Navigate to={`/workspaces/${workspaceId}`} replace />;
}

function WorkspaceDocumentsRedirect() {
  const { workspaceId } = useParams();
  return <Navigate to={`/workspaces/${workspaceId}/documents`} replace />;
}

function DocumentPreviewWithPermission() {
  const { workspaceId } = useParams();

  return (
    <PermissionGuard
      workspaceId={workspaceId}
      allowedRoles={['viewer', 'editor', 'admin', 'owner']}
      fallback={<Navigate to="/dashboard" replace />}
    >
      <DocumentPreview />
    </PermissionGuard>
  );
}

const ApplicationRoutes = () => {
  const { isAuthenticated, tokenValidated, loading } = useAuth();

  // Show loading while token validation is in progress
  if (!tokenValidated || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  function PublicRouteWrapper({ children }) {
    const location = useLocation();
    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

    if (isAuthenticated && !isAuthPage) {
      return <Navigate to="/dashboard" replace />;
    }

    return children;
  }

  return (
    <Routes>
      {/* Public routes - only show if user is NOT authenticated */}
      <Route
        path="/"
        element={
          <PublicRouteWrapper>
            <LandingPage />
          </PublicRouteWrapper>
        }
      />


      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Login />
          )
        }
      />

      <Route
        path="/register"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Register />
          )
        }
      />

      {/* ✅ FIXED: Invitation route */}
      <Route
        path="/invitation/:token"
        element={<InvitationPage />}
      />

      {/* Root route redirect */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Protected routes - using ProtectedRoute wrapper */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Document routes */}
      <Route
        path="/documents"
        element={
          <ProtectedRoute>
            <DocumentList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/workspaces/:workspaceId/documents"
        element={
          <ProtectedRoute>
            <DocumentList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/documents/upload"
        element={
          <ProtectedRoute>
            <UploadDocument />
          </ProtectedRoute>
        }
      />

      <Route
        path="/documents/preview/:documentId"
        element={
          <ProtectedRoute>
            <DocumentPreview />
          </ProtectedRoute>
        }
      />

      {/* ✅ MAIN WORKSPACE ROUTE */}
      <Route
        path="/workspaces/:workspaceId"
        element={
          <ProtectedRoute>
            <WorkspacePage />
          </ProtectedRoute>
        }
      />

      {/* ✅ FIXED: Workspace settings - Use allowedRoles instead of requiredPermissions */}
      <Route
        path="/workspaces/:workspaceId/settings"
        element={
          <ProtectedRoute>
            <PermissionGuard
              workspaceIdParam="workspaceId"
              allowedRoles={['admin', 'owner']}
              fallback={<Navigate to="/dashboard" replace />}
            >
              <WorkspaceSettings />
            </PermissionGuard>
          </ProtectedRoute>
        }
      />

      {/* ✅ FIXED: Document preview within workspace context */}
      <Route
        path="/workspaces/:workspaceId/documents/:documentId"
        element={
          <ProtectedRoute>
            <DocumentPreviewWithPermission />
          </ProtectedRoute>
        }
      />

      {/* ✅ FIXED: Upload document to specific workspace */}
      <Route
        path="/workspaces/:workspaceId/upload"
        element={
          <ProtectedRoute>
            <PermissionGuard
              workspaceIdParam="workspaceId"
              allowedRoles={['editor', 'admin', 'owner']}
              fallback={<Navigate to="/dashboard" replace />}
            >
              <UploadDocument />
            </PermissionGuard>
          </ProtectedRoute>
        }
      />

      {/* ✅ FIXED: Workspace analytics */}
      <Route
        path="/workspaces/:workspaceId/analytics"
        element={
          <ProtectedRoute>
            <PermissionGuard
              workspaceIdParam="workspaceId"
              allowedRoles={['admin', 'owner']}
              fallback={<Navigate to="/dashboard" replace />}
            >
              <WorkspacePage />
            </PermissionGuard>
          </ProtectedRoute>
        }
      />

      {/* Pending invitations management */}
      <Route
        path="/invitations"
        element={
          <ProtectedRoute>
            <InvitationPage />
          </ProtectedRoute>
        }
      />

      {/* ✅ FIXED: Legacy redirects for backward compatibility */}
      <Route
        path="/documents/workspace/:workspaceId"
        element={<WorkspaceDocumentsRedirect />}
      />

      <Route
        path="/workspace/:workspaceId"
        element={<WorkspaceRedirect />}
      />

      {/* Catch-all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default ApplicationRoutes;