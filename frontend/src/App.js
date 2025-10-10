// App.js - FIXED: Proper Authentication Initialization (Updated for your setup)
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ApplicationRoutes from './components/ApplicationRoutes';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import { validateToken } from './store/slices/authSlice';
import { selectTokenValidated, selectAuthLoading } from './store/slices/authSlice';
import { store } from './store';

// Enhanced loading component with Tailwind
// Premium loading component with modern design
// Simple loading spinner
const GlobalLoader = () => (
  <div className="fixed inset-0 bg-slate-50 flex justify-center items-center z-50">
    <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-blue-600"></div>
  </div>
);

function App() {
  const dispatch = useDispatch();
  const tokenValidated = useSelector(selectTokenValidated);
  const authLoading = useSelector(selectAuthLoading);

  // ✅ CRITICAL FIX: Make store available globally for interceptors
  useEffect(() => {
    window.store = store;
    console.log('🔧 Store made available globally for API interceptors');
  }, []);

  // ✅ FIXED: Initialize authentication on app startup
  useEffect(() => {
    if (!tokenValidated) {
      console.log('🚀 Initializing authentication...');
      dispatch(validateToken());
    }
  }, [dispatch, tokenValidated]);

  // Show loading screen while validating token
  if (!tokenValidated || authLoading) {
    return <GlobalLoader />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="pb-8">
          <ApplicationRoutes />
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;