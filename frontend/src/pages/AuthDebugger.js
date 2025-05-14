import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import jwt_decode from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to process token and set user
  const processToken = (token) => {
    try {
      const decoded = jwt_decode(token);
      // Check if token is expired
      if (decoded.exp * 1000 < Date.now()) {
        console.warn('Token is expired');
        localStorage.removeItem('authToken');
        setUser(null);
        return false;
      } else {
        console.log('Setting user from token:', decoded);
        setUser(decoded);
        // Set default Authorization header for all axios requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        return true;
      }
    } catch (error) {
      console.error('Error processing token:', error);
      localStorage.removeItem('authToken');
      setUser(null);
      setError('Invalid token');
      return false;
    }
  };

  useEffect(() => {
    // Check if token exists in local storage
    const token = localStorage.getItem('authToken');
    if (token) {
      processToken(token);
    }
    setLoading(false);
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setError(null);
      const response = await axios.post('/api/users/login', { email, password });
      const { token } = response.data;
      
      // Store token in localStorage
      localStorage.setItem('authToken', token);
      
      // Process the token and set user
      const success = processToken(token);
      
      // Debug output
      console.log('Login result:', { 
        success, 
        user: jwt_decode(token),
        tokenInStorage: localStorage.getItem('authToken')
      });
      
      return success;
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Login failed');
      return false;
    }
  };

  // Register function
  const register = async (name, email, password) => {
    try {
      setError(null);
      await axios.post('/api/users/register', { name, email, password });
      return true;
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
      return false;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('authToken');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  // Add clearError function
  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};