// src/hooks/useAuth.js - Custom Authentication Hook (Cleaned)
import { useEffect } from 'react';
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
  selectTokenValidated
} from '../store/slices/authSlice';

/**
 * Custom hook for authentication functionality
 * Provides all auth-related state and actions
 */
export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Selectors
  const auth = useSelector(selectAuth);
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const tokenValidated = useSelector(selectTokenValidated);

  // Initialize token validation on mount
  useEffect(() => {
    if (!tokenValidated) {
      dispatch(validateToken());
    }
  }, [dispatch, tokenValidated]);

  // Handle authentication errors with toast notifications
  useEffect(() => {
    if (error) {
      toast.error('Authentication error', {
        duration: 5000,
      });
    }
  }, [error]);

  // Login function with navigation
  const handleLogin = async (email, password) => {
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
  };

  // Register function
  const handleRegister = async (name, email, password) => {
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
  };

  // Update profile function
  const handleUpdateProfile = async (profileData) => {
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
  };

  // Logout function with navigation
  const handleLogout = () => {
    dispatch(logout());
    toast.success('Successfully logged out', {
      duration: 5000,
    });
    navigate('/login', { replace: true });
  };

  // Clear error function
  const handleClearError = () => {
    dispatch(clearError());
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return roles.includes(user?.role);
  };

  // Check if user can access resource (basic permission check)
  const canAccess = (resource, action = 'read') => {
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
  };

  return {
    // State
    user,
    isAuthenticated,
    loading,
    error,
    tokenValidated,
    auth,

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
  };
};

/**
 * Hook for requiring authentication
 * Redirects to login if not authenticated
 */
export const useRequireAuth = (redirectPath = '/login') => {
  const { isAuthenticated, loading, tokenValidated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only redirect when we're sure the user isn't authenticated (not during loading)
    if (tokenValidated && !loading && !isAuthenticated) {
      navigate(redirectPath, { 
        state: { from: location.pathname },
        replace: true
      });
    }
  }, [isAuthenticated, loading, tokenValidated, navigate, redirectPath, location.pathname]);

  return { isAuthenticated, loading, tokenValidated };
};

/**
 * Hook for guest-only pages (login, register)
 * Redirects to dashboard if already authenticated
 */
export const useGuestOnly = (redirectPath = '/dashboard') => {
  const { isAuthenticated, loading, tokenValidated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (tokenValidated && !loading && isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, loading, tokenValidated, navigate, redirectPath]);

  return { isAuthenticated, loading, tokenValidated };
};

export default useAuth;