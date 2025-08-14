// frontend/src/components/ApplicationRoutes.js - Enhanced with Workspace Routes
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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

// Import permission guard for workspace routes
import PermissionGuard from './permissions/PermissionGuard';

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

  return (
    <Routes>
      {/* Public routes - only show if user is NOT authenticated */}
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

      {/* Public invitation route - no auth required */}
      <Route 
        path="/invitations/:token" 
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

      {/* Workspace routes
      <Route 
        path="/workspaces" 
        element={
          <ProtectedRoute>
            <WorkspaceList />
          </ProtectedRoute>
        } 
      /> */}

      {/* Individual workspace routes */}
      <Route 
        path="/workspaces/:workspaceId" 
        element={
          <ProtectedRoute>
            <WorkspacePage />
          </ProtectedRoute>
        } 
      />

      {/* Workspace settings - Admin/Owner only */}
      <Route 
        path="/workspaces/:workspaceId/settings" 
        element={
          <ProtectedRoute>
            <PermissionGuard 
              requiredPermissions={['admin']} 
              workspaceIdParam="workspaceId"
              fallback={<Navigate to="/dashboard" replace />}
            >
              <WorkspaceSettings />
            </PermissionGuard>
          </ProtectedRoute>
        } 
      />

      {/* Workspace documents - filtered by workspace */}
      <Route 
        path="/workspaces/:workspaceId/documents" 
        element={
          <ProtectedRoute>
            <PermissionGuard 
              requiredPermissions={['read']} 
              workspaceIdParam="workspaceId"
              fallback={<Navigate to="/dashboard" replace />}
            >
              <DocumentList />
            </PermissionGuard>
          </ProtectedRoute>
        } 
      />

      {/* Upload document to specific workspace */}
      <Route 
        path="/workspaces/:workspaceId/upload" 
        element={
          <ProtectedRoute>
            <PermissionGuard 
              requiredPermissions={['write']} 
              workspaceIdParam="workspaceId"
              fallback={<Navigate to="/dashboard" replace />}
            >
              <UploadDocument />
            </PermissionGuard>
          </ProtectedRoute>
        } 
      />

      {/* Document preview within workspace context */}
      <Route 
        path="/workspaces/:workspaceId/documents/:documentId" 
        element={
          <ProtectedRoute>
            <PermissionGuard 
              requiredPermissions={['read']} 
              workspaceIdParam="workspaceId"
              fallback={<Navigate to="/dashboard" replace />}
            >
              <DocumentPreview />
            </PermissionGuard>
          </ProtectedRoute>
        } 
      />

      {/* Workspace members management */}
      <Route 
        path="/workspaces/:workspaceId/members" 
        element={
          <ProtectedRoute>
            <PermissionGuard 
              requiredPermissions={['read']} 
              workspaceIdParam="workspaceId"
              fallback={<Navigate to="/dashboard" replace />}
            >
              <WorkspacePage />
            </PermissionGuard>
          </ProtectedRoute>
        } 
      />

      {/* Workspace analytics - Admin/Owner only */}
      <Route 
        path="/workspaces/:workspaceId/analytics" 
        element={
          <ProtectedRoute>
            <PermissionGuard 
              requiredPermissions={['admin']} 
              workspaceIdParam="workspaceId"
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

      {/* Legacy redirects for backward compatibility */}
      <Route 
        path="/documents/workspace/:workspaceId" 
        element={<Navigate to="/workspaces/:workspaceId/documents" replace />} 
      />

      <Route 
        path="/workspace/:workspaceId" 
        element={<Navigate to="/workspaces/:workspaceId" replace />} 
      />

      {/* Catch-all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default ApplicationRoutes;