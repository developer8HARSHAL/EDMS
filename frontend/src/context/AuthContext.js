// src/context/AuthContext.js - Fixed version
import React, { createContext, useContext, useState, useEffect } from 'react';
import jwt_decode from 'jwt-decode';
import { useToast } from '@chakra-ui/react';
import { userApi } from '../services/apiService';
import axios from 'axios';

// Create context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  // Function to clear error messages
  const clearError = () => setError(null);

  // Check if token exists and is valid on initial load
  useEffect(() => {
    const validateToken = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          // No token found
          setUser(null);
          setLoading(false);
          return;
        }
        
        try {
          // Decode the token
          const decoded = jwt_decode(token);
          
          // Check if token is expired
          if (decoded.exp * 1000 < Date.now()) {
            console.log('Token expired, logging out');
            localStorage.removeItem('authToken');
            setUser(null);
            setLoading(false);
            return;
          }
          
          // Set authentication header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Set user from token
          setUser({
            id: decoded.id,
            name: decoded.name,
            email: decoded.email,
            role: decoded.role
          });
          
          // Verify token with backend (optional)
          try {
            await userApi.getProfile();
            console.log('Token verified with backend');
          } catch (verifyError) {
            console.error('Token validation failed:', verifyError);
            if (verifyError.response?.status === 401) {
              // Token rejected by server
              localStorage.removeItem('authToken');
              delete axios.defaults.headers.common['Authorization'];
              setUser(null);
            }
          }
        } catch (decodeError) {
          console.error('Token decode error:', decodeError);
          localStorage.removeItem('authToken');
          delete axios.defaults.headers.common['Authorization'];
          setError('Invalid authentication token');
        }
      } catch (error) {
        console.error('Token validation error:', error);
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, []);

  // Login function
  const login = async (email, password) => {
    clearError();
    setLoading(true);
    
    try {
      const data = await userApi.login(email, password);
      
      if (!data || !data.token) {
        setError('No authentication token received');
        return false;
      }
      
      try {
        // Decode and store user data
        const decoded = jwt_decode(data.token);
        setUser({
          id: decoded.id || data.user.id,
          name: decoded.name || data.user.name,
          email: decoded.email || data.user.email,
          role: decoded.role || data.user.role
        });
        
        toast({
          title: 'Login successful',
          description: 'Welcome back!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        return true;
      } catch (decodeError) {
        console.error('Token decode error:', decodeError);
        setError('Invalid token received. Please try again.');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || error.message || 'Login failed. Please check your credentials.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (name, email, password) => {
    clearError();
    setLoading(true);
    
    try {
      await userApi.register(name, email, password);
      
      toast({
        title: 'Registration successful',
        description: 'You can now log in with your credentials',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.response?.data?.message || error.message || 'Registration failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    userApi.logout(); // This removes the token from localStorage
    setUser(null);
    
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  // Update user profile function - FIXED
  const updateUserProfile = async (profileData) => {
    clearError();
    setLoading(true);
    
    try {
      // Call the API service to update the profile
      const updatedUserData = await userApi.updateProfile(profileData);
      
      // Check if we have a valid response with data
      if (!updatedUserData || !updatedUserData.data) {
        throw new Error('Invalid response from server');
      }
      
      // Update user state with new data
      setUser(prev => ({
        ...prev,
        name: updatedUserData.data.name || prev.name,
        // Other fields that might be updated in the future
      }));
      
      return updatedUserData;
    } catch (error) {
      console.error('Profile update error:', error);
      // Use specific error message or fallback to generic message
      const errorMessage = error.message || 'Failed to update profile';
      setError(errorMessage);
      throw error; // Re-throw to let the component handle it
    } finally {
      setLoading(false);
    }
  };

  // Values to expose through context
  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
    updateUserProfile,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;