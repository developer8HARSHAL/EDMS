import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider, Box, Spinner, Center } from '@chakra-ui/react';
import { AuthProvider, useAuth } from './context/AuthContext';

// Import Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DocumentList from './pages/DocumentList';
import UploadDocument from './pages/UploadDocument';

// Import Components
import Navbar from './components/Navbar';

// Custom Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <Center h="100vh">
        <Spinner 
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="blue.500"
          size="xl"
        />
      </Center>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function AppContent() {
  return (
    <Box minH="100vh" bg="gray.50">
      <Router>
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Redirect root to dashboard if authenticated, otherwise to login */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Fallback route for unmatched paths */}
          <Route path="*" element={<Navigate to="/" />} />


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
        </Routes>
      </Router>
    </Box>
  );
}

function App() {
  return (
    <ChakraProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ChakraProvider>
  );
}

export default App;