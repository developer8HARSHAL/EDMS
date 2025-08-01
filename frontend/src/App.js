// src/App.js - Fixed version without Chakra UI
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ApplicationRoutes from './components/ApplicationRoutes';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import { validateToken } from './store/slices/authSlice';
import { selectTokenValidated, selectAuthLoading } from './store/slices/authSlice';

// Enhanced loading component with Tailwind
const GlobalLoader = () => (
  <div className="fixed inset-0 bg-gradient-to-br from-slate-50 to-slate-100 flex justify-center items-center z-50">
    <div className="text-center">
      <div className="relative mb-6">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-blue-500 mx-auto"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-r-blue-300 animate-pulse opacity-75"></div>
      </div>
      <div className="space-y-2">
        <p className="text-slate-700 text-lg font-semibold">Initializing application</p>
        <div className="flex justify-center space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
      </div>
    </div>
  </div>
);

function App() {
  const dispatch = useDispatch();
  const tokenValidated = useSelector(selectTokenValidated);
  const authLoading = useSelector(selectAuthLoading);

  // Initialize authentication on app startup
  useEffect(() => {
    if (!tokenValidated) {
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