// src/App.js - Updated with authentication flow
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { AuthProvider } from './context/AuthContext';
import AuthContext from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DocumentList from './pages/DocumentList';
import UploadDocument from './pages/UploadDocument';
// import DocumentDetail from './pages/DocumentDetail';
import NotFound from './components/NotFound';

// Styles
import './App.css';

function App() {
  return (
    <ChakraProvider>
      <AuthProvider>
        <Router>
          <Navbar />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes - require authentication */}
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
            
            {/* <Route 
              path="/documents/:id" 
              element={
                <ProtectedRoute>
                  <DocumentDetail />
                </ProtectedRoute>
              } 
            /> */}
            
            {/* Redirect root to dashboard if authenticated, otherwise to login */}
            <Route 
              path="/" 
              element={
                <AuthChecker 
                  authenticatedPath="/dashboard"
                  unauthenticatedPath="/login"
                />
              } 
            />
            
            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ChakraProvider>
  );
}

// Helper component to handle conditional redirects based on auth status
const AuthChecker = ({ authenticatedPath, unauthenticatedPath }) => {
  const { isAuthenticated, loading } = React.useContext(AuthContext);
  
  if (loading) {
    return null; // Or a loading spinner
  }
  
  return isAuthenticated ? 
    <Navigate to={authenticatedPath} replace /> : 
    <Navigate to={unauthenticatedPath} replace />;
};

export default App;