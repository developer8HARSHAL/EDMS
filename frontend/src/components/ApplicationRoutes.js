import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import NotFound from './NotFound';
import ProtectedRoute from './ProtectedRoute';
import PermissionGuard from './permissions/PermissionGuard';

const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const DocumentList = lazy(() => import('../pages/DocumentList'));
const UploadDocument = lazy(() => import('../pages/UploadDocument'));
const DocumentPreview = lazy(() => import('../pages/DocumentPreview'));
const Profile = lazy(() => import('../pages/Profile'));
const WorkspacePage = lazy(() => import('../pages/WorkspacePage'));
const WorkspaceSettings = lazy(() => import('../pages/WorkspaceSettings'));
const InvitationPage = lazy(() => import('../pages/InvitationPage'));
const LandingPage = lazy(() => import('../pages/LandingPage'));



const RouteLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

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

function PublicRouteWrapper({ children }) {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const { isAuthenticated } = useAuth();

  if (isAuthenticated && !isAuthPage) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

const ApplicationRoutes = () => {
  const { isAuthenticated, tokenValidated, loading } = useAuth();

  if (!tokenValidated || loading) {
    return <RouteLoader />;
  }

  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
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

        <Route
          path="/invitation/:token"
          element={<InvitationPage />}
        />

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

        <Route
          path="/workspaces/:workspaceId"
          element={
            <ProtectedRoute>
              <WorkspacePage />
            </ProtectedRoute>
          }
        />

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

        <Route
          path="/workspaces/:workspaceId/documents/:documentId"
          element={
            <ProtectedRoute>
              <DocumentPreviewWithPermission />
            </ProtectedRoute>
          }
        />

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

        <Route
          path="/invitations"
          element={
            <ProtectedRoute>
              <InvitationPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/documents/workspace/:workspaceId"
          element={<WorkspaceDocumentsRedirect />}
        />

        <Route
          path="/workspace/:workspaceId"
          element={<WorkspaceRedirect />}
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default ApplicationRoutes;