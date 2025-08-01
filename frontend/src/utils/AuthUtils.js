// src/utils/AuthUtils.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Custom hook to require authentication and redirect to login if not authenticated
 * @param {string} redirectPath - Path to redirect to if not authenticated
 * @returns {object} Authentication state with user and loading status
 */
export const useRequireAuth = (redirectPath = '/login') => {
  const { isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect when we're sure the user isn't authenticated (not during loading)
    if (!loading && !isAuthenticated) {
      navigate(redirectPath, { 
        state: { from: window.location.pathname } 
      });
    }
  }, [isAuthenticated, loading, navigate, redirectPath]);

  return { user, isAuthenticated, loading };
};

/**
 * Helper function to get the auth token from local storage
 * @returns {string|null} The auth token or null if not found
 */
export const getAuthToken = () => {
  return localStorage.getItem('token');
};

/**
 * Helper function to set the auth token in local storage
 * @param {string} token - The auth token to store
 */
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

/**
 * Helper function to check if a user is authenticated
 * @returns {boolean} True if the user is authenticated, false otherwise
 */
export const isUserAuthenticated = () => {
  return !!getAuthToken();
};

/**
 * Helper function to add auth headers to API requests
 * @param {object} headers - Existing headers object
 * @returns {object} Headers with auth token added if available
 */
export const addAuthHeaders = (headers = {}) => {
  const token = getAuthToken();
  if (token) {
    return {
      ...headers,
      'Authorization': `Bearer ${token}`
    };
  }
  return headers;
};

export default {
  useRequireAuth,
  getAuthToken,
  setAuthToken,
  isUserAuthenticated,
  addAuthHeaders
};