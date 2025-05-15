// src/components/ApplicationRoutes.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Import pages
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import DocumentList from '../pages/DocumentList';
import UploadDocument from '../pages/UploadDocument';
import DocumentPreview from '../pages/DocumentPreview';
import Profile from '../pages/Profile';
import NotFound from '../components/NotFound';
import WithAuth from './WithAuth';
import ProtectedRoute from './ProtectedRoute'; // Added this import

const ApplicationRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <Login />
          )
        } 
      />
      
      <Route 
        path="/register" 
        element={
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <Register />
          )
        } 
      />

      {/* Protected routes */}
      <Route path="/" element={<WithAuth component={Dashboard} />} />
      <Route path="/documents" element={<WithAuth component={DocumentList} />} />
      <Route path="/documents/upload" element={<WithAuth component={UploadDocument} />} />
      <Route path="/profile" element={<WithAuth component={Profile} />} />
      
      {/* Fixed route - using ProtectedRoute correctly */}
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