// src/components/AuthStatus.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AuthStatus = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return (
      <div className="flex space-x-4">
        <Link 
          to="/login"
          className="text-gray-800 hover:text-blue-600 transition-colors px-3 py-2 rounded-md text-sm font-medium"
        >
          Login
        </Link>
        <Link 
          to="/register"
          className="bg-blue-600 text-white hover:bg-blue-700 transition-colors px-4 py-2 rounded-md text-sm font-medium"
        >
          Register
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="text-sm text-gray-700">
        Welcome, <span className="font-medium">{user?.name || 'User'}</span>
      </div>
      <button
        onClick={handleLogout}
        className="text-red-600 hover:text-red-800 transition-colors px-3 py-2 rounded-md text-sm font-medium"
      >
        Logout
      </button>
    </div>
  );
};

export default AuthStatus;