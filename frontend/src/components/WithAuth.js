import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Higher Order Component for protecting routes that require authentication
 * @param {React.Component} component - The component to render if authenticated
 * @returns {React.Component} Either the protected component or redirect to login
 */
const WithAuth = ({ component: Component, ...props }) => {
  const { isAuthenticated, loading, tokenValidated } = useAuth();
  const location = useLocation();

  if (loading || !tokenValidated) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  return Component ? <Component {...props} /> : null;
};

export default WithAuth;