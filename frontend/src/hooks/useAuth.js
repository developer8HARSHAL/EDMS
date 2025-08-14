// src/hooks/useAuth.js - Custom Authentication Hook (Fixed)
import { useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
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
  selectTokenValidated,
  selectAuthInitialized,
  selectAuthReady
} from '../store/slices/authSlice';

/**
 * Custom hook for authentication functionality
 * Provides all auth-related state and actions with proper error handling
 */
export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Safe selectors with comprehensive error handling
  const authState = useSelector((state) => {
    try {
      return selectAuth(state);
    } catch (error) {
      console.warn('Auth state selector error:', error);
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        tokenValidated: false
      };
    }
  });

  const user = useSelector((state) => {
    try {
      return selectUser(state);
    } catch (error) {
      console.warn('User selector error:', error);
      return null;
    }
  });

  const isAuthenticated = useSelector((state) => {
    try {
      return selectIsAuthenticated(state);
    } catch (error) {
      console.warn('IsAuthenticated selector error:', error);
      return false;
    }
  });

  const loading = useSelector((state) => {
    try {
      return selectAuthLoading(state);
    } catch (error) {
      console.warn('Loading selector error:', error);
      return false;
    }
  });

  const error = useSelector((state) => {
    try {
      return selectAuthError(state);
    } catch (error) {
      console.warn('Error selector error:', error);
      return null;
    }
  });

  const tokenValidated = useSelector((state) => {
    try {
      return selectTokenValidated(state);
    } catch (error) {
      console.warn('TokenValidated selector error:', error);
      return false;
    }
  });

  const authInitialized = useSelector((state) => {
    try {
      return selectAuthInitialized(state);
    } catch (error) {
      console.warn('AuthInitialized selector error:', error);
      return false;
    }
  });

  const authReady = useSelector((state) => {
    try {
      return selectAuthReady(state);
    } catch (error) {
      console.warn('AuthReady selector error:', error);
      return false;
    }
  });

  // Memoized dispatch check to prevent unnecessary calls
  const isDispatchReady = useMemo(() => {
    return typeof dispatch === 'function' && authInitialized;
  }, [dispatch, authInitialized]);

  // Initialize token validation on mount (only once when dispatch is ready)
  useEffect(() => {
    if (isDispatchReady && !tokenValidated) {
      dispatch(validateToken());
    }
  }, [isDispatchReady, tokenValidated]); // Stable dependencies

  // Handle authentication errors with toast notifications
  useEffect(() => {
    if (error) {
      toast.error(error, {
        duration: 5000,
      });
    }
  }, [error]);

  // Memoized action handlers to prevent re-renders
  const handleLogin = useCallback(async (email, password) => {
    if (!isDispatchReady) {
      console.warn('Dispatch not ready for login');
      return false;
    }

    try {
      const result = await dispatch(loginUser({ email, password }));
      
      if (loginUser.fulfilled.match(result)) {
        toast.success('Successfully logged in', {
          duration: 3000,
        });

        // Navigate to intended page or dashboard
        const from = location.state?.from || '/dashboard';
        navigate(from, { replace: true });
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }, [isDispatchReady, dispatch, navigate, location.state?.from]);

  const handleRegister = useCallback(async (name, email, password) => {
    if (!isDispatchReady) {
      console.warn('Dispatch not ready for register');
      return false;
    }

    try {
      const result = await dispatch(registerUser({ name, email, password }));
      
      if (registerUser.fulfilled.match(result)) {
        toast.success('Registration successful', {
          duration: 5000,
        });
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  }, [isDispatchReady, dispatch]);

  const handleUpdateProfile = useCallback(async (profileData) => {
    if (!isDispatchReady) {
      console.warn('Dispatch not ready for profile update');
      return false;
    }

    try {
      const result = await dispatch(updateUserProfile(profileData));
      
      if (updateUserProfile.fulfilled.match(result)) {
        toast.success('Profile updated', {
          duration: 5000,
        });
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Profile update error:', error);
      return false;
    }
  }, [isDispatchReady, dispatch]);

  const handleLogout = useCallback(() => {
    if (!isDispatchReady) {
      console.warn('Dispatch not ready for logout');
      return;
    }

    dispatch(logout());
    toast.success('Successfully logged out', {
      duration: 5000,
    });
    navigate('/login', { replace: true });
  }, [isDispatchReady, dispatch, navigate]);

  const handleClearError = useCallback(() => {
    if (isDispatchReady) {
      dispatch(clearError());
    }
  }, [isDispatchReady, dispatch]);

  // Utility functions with safe user checks
  const hasRole = useCallback((role) => {
    return user?.role === role;
  }, [user?.role]);

  const hasAnyRole = useCallback((roles) => {
    return Array.isArray(roles) && user?.role && roles.includes(user.role);
  }, [user?.role]);

  const canAccess = useCallback((resource, action = 'read') => {
    if (!user) return false;
    
    // Admin can access everything
    if (user.role === 'admin') return true;
    
    // Add more role-based access control logic here
    switch (resource) {
      case 'documents':
        return true; // All authenticated users can access documents
      case 'admin-panel':
        return user.role === 'admin';
      case 'user-management':
        return user.role === 'admin';
      default:
        return false;
    }
  }, [user]);

  // Memoized return object to prevent unnecessary re-renders
  return useMemo(() => ({
    // State
    user,
    isAuthenticated,
    loading,
    error,
    tokenValidated,
    authReady,
    authInitialized,
    auth: authState,

    // Actions
    login: handleLogin,
    register: handleRegister,
    updateProfile: handleUpdateProfile,
    logout: handleLogout,
    clearError: handleClearError,

    // Utility functions
    hasRole,
    hasAnyRole,
    canAccess,

    // For backward compatibility
    isLoading: loading,
  }), [
    user,
    isAuthenticated,
    loading,
    error,
    tokenValidated,
    authReady,
    authInitialized,
    authState,
    handleLogin,
    handleRegister,
    handleUpdateProfile,
    handleLogout,
    handleClearError,
    hasRole,
    hasAnyRole,
    canAccess
  ]);
};

/**
 * Hook for requiring authentication
 * Redirects to login if not authenticated
 */
export const useRequireAuth = (redirectPath = '/login') => {
  const { isAuthenticated, loading, tokenValidated, authReady } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only redirect when we're sure the user isn't authenticated (not during loading)
    if (authReady && tokenValidated && !loading && !isAuthenticated) {
      navigate(redirectPath, { 
        state: { from: location.pathname },
        replace: true
      });
    }
  }, [isAuthenticated, loading, tokenValidated, authReady, navigate, redirectPath, location.pathname]);

  return { isAuthenticated, loading, tokenValidated, authReady };
};

/**
 * Hook for guest-only pages (login, register)
 * Redirects to dashboard if already authenticated
 */
export const useGuestOnly = (redirectPath = '/dashboard') => {
  const { isAuthenticated, loading, tokenValidated, authReady } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authReady && tokenValidated && !loading && isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, loading, tokenValidated, authReady, navigate, redirectPath]);

  return { isAuthenticated, loading, tokenValidated, authReady };
};

export default useAuth;