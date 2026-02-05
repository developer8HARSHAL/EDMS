// src/pages/NotFound.js
import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="text-6xl font-bold text-blue-600 mb-4">404</div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Page Not Found</h1>
      <p className="text-gray-600 text-center mb-8 max-w-md">
        The page you are looking for might have been removed, had its name changed,
        or is temporarily unavailable.
      </p>
      <Link
        to="/"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
      >
        Back to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;