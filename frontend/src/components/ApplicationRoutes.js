// src/components/ApplicationRoutes.js - FIXED VERSION
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Import pages
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import DocumentList from '../pages/DocumentList';
import UploadDocument from '../pages/UploadDocument';
import DocumentPreview from '../pages/DocumentPreview';
import Profile from '../pages/Profile';
import NotFound from './NotFound'; // FIXED: Removed '../components/' prefix
import ProtectedRoute from './ProtectedRoute';

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
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
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
      
      {/* Catch-all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default ApplicationRoutes;