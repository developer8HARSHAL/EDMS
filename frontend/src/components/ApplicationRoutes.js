// frontend/src/components/ApplicationRoutes.js - FIXED URL PATTERN
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
      workspaceId={workspaceId}  // ← Direct prop
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

      {/* 🔥 FIXED: Changed from /invitations/:token to /invitation/:token */}
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
      

      {/* Document preview within workspace context - SINGLE ROUTE ONLY */}
      <Route 
        path="/workspaces/:workspaceId/documents/:documentId" 
        element={
          <ProtectedRoute>
            <DocumentPreviewWithPermission />  
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

      {/* Pending invitations management - CHANGED route to avoid conflict */}
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