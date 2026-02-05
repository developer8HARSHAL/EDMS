// useAuth.js - FIXED: Authentication Hook with Better Token Handling
import { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  validateToken,
  loginUser,
  registerUser,
  updateUserProfile,
  logout,
  clearError,
  selectAuth,
  selectUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  selectTokenValidated
} from '../store/slices/authSlice';

const useAuth = () => {
  const dispatch = useDispatch();
  const initializationRef = useRef(false);
  const validationInProgressRef = useRef(false);

  // Select auth state
  const auth = useSelector(selectAuth);
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const tokenValidated = useSelector(selectTokenValidated);

  // ✅ FIXED: Stable token validation function
  const validateTokenIfNeeded = useCallback(async () => {
    // Prevent multiple simultaneous validations
    if (validationInProgressRef.current || tokenValidated) {
      console.log('🔄 Token validation skipped - already validated or in progress');
      return;
    }

    const token = localStorage.getItem('authToken');
    
    if (!token) {
      console.log('ℹ️ No token found - user not authenticated');
      validationInProgressRef.current = false;
      return;
    }

    console.log('🔍 Starting token validation...');
    validationInProgressRef.current = true;
    
    try {
      await dispatch(validateToken()).unwrap();
      console.log('✅ Token validation completed successfully');
    } catch (error) {
      console.error('❌ Token validation failed:', error);
    } finally {
      validationInProgressRef.current = false;
    }
  }, [dispatch, tokenValidated]);

  // ✅ FIXED: Initialize auth state on mount
  useEffect(() => {
    if (!initializationRef.current) {
      console.log('🚀 Initializing auth state...');
      initializationRef.current = true;
      validateTokenIfNeeded();
    }
  }, [validateTokenIfNeeded]);

  // ✅ FIXED: Stable login function
  const login = useCallback(async (email, password) => {
    try {
      console.log('🔐 Attempting login...');
      const result = await dispatch(loginUser({ email, password })).unwrap();
      console.log('✅ Login successful');
      return result;
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  }, [dispatch]);

  // ✅ FIXED: Stable register function
  const register = useCallback(async (name, email, password) => {
    try {
      console.log('📝 Attempting registration...');
      const result = await dispatch(registerUser({ name, email, password })).unwrap();
      console.log('✅ Registration successful');
      return result;
    } catch (error) {
      console.error('❌ Registration failed:', error);
      throw error;
    }
  }, [dispatch]);

  // ✅ FIXED: Stable logout function
  const logoutUser = useCallback(() => {
    console.log('🚪 Logging out user...');
    dispatch(logout());
    console.log('✅ Logout completed');
  }, [dispatch]);

  // ✅ FIXED: Stable update profile function
  const updateProfile = useCallback(async (profileData) => {
    try {
      console.log('👤 Updating profile...');
      const result = await dispatch(updateUserProfile(profileData)).unwrap();
      console.log('✅ Profile updated successfully');
      return result;
    } catch (error) {
      console.error('❌ Profile update failed:', error);
      throw error;
    }
  }, [dispatch]);

  // ✅ FIXED: Stable clear error function
  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // ✅ UTILITY: Check if auth is ready for use
  const isAuthReady = tokenValidated && !validationInProgressRef.current;

  // ✅ UTILITY: Check if user has specific role
  const hasRole = useCallback((role) => {
    return user?.role === role;
  }, [user]);

  // ✅ UTILITY: Check if user has any of the specified roles
  const hasAnyRole = useCallback((roles) => {
    return roles.includes(user?.role);
  }, [user]);

  // ✅ DEBUG: Log auth state changes in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Auth State Update:', {
        isAuthenticated,
        tokenValidated,
        loading,
        userEmail: user?.email,
        hasError: !!error,
        isAuthReady
      });
    }
  }, [isAuthenticated, tokenValidated, loading, user, error, isAuthReady]);

  return {
    // State
    user,
    isAuthenticated,
    loading,
    error,
    tokenValidated,
    isAuthReady,
    
    // Actions
    login,
    register,
    logout: logoutUser,
    updateProfile,
    clearError: clearAuthError,
    validateToken: validateTokenIfNeeded,
    
    // Utilities
    hasRole,
    hasAnyRole,
    
    // Raw auth state (for advanced usage)
    auth
  };
};

// ✅ BACKWARD COMPATIBILITY: Export both named and default exports
export { useAuth };
export default useAuth;