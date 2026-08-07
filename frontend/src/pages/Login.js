// frontend/src/pages/Login.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const Login = () => {
  const navigate = useNavigate();
  const { login, guestLogin, isAuthenticated, loading, error: authError, clearError } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (authError) {
      setSubmitError(authError);
    }
  }, [authError]);

  useEffect(() => {
    if (submitError) {
      const timer = setTimeout(() => {
        setSubmitError('');
        clearError();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [submitError, clearError]);

  // Auto-dismiss success messages after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear field-specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Clear submit error when user starts typing
    if (submitError) {
      setSubmitError('');
      clearError();
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitError('');
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await login(formData.email, formData.password);

      setSuccessMessage('Login successful! Redirecting to dashboard...');

      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1000);

    } catch (error) {
      console.error('Login error:', error);

      if (error.message) {
        setSubmitError(error.message);
      } else if (error.response?.data?.message) {
        setSubmitError(error.response.data.message);
      } else if (error.response?.status === 401) {
        setSubmitError('Invalid email or password. Please try again.');
      } else if (error.response?.status === 500) {
        setSubmitError('Server error. Please try again later.');
      } else if (!error.response) {
        setSubmitError('Cannot connect to server. Please check your internet connection.');
      } else {
        setSubmitError('Login failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestLogin = async () => {
    setSubmitError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      await guestLogin();
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Guest login error:', error);
      setSubmitError(error.message || 'Could not start guest session. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1f2e] px-4">
      <div className="w-full max-w-md">
        <div className="bg-[#2a3441] rounded-lg p-6 shadow-xl">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white">
              Log in to your account
            </h2>
          </div>

          {successMessage && (
            <Alert variant="success" className="mb-3">
              {successMessage}
            </Alert>
          )}

          {submitError && (
            <Alert variant="error" className="mb-3">
              {submitError}
            </Alert>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                disabled={isSubmitting}
                className="w-full px-3 py-2.5 bg-[#374151] border border-transparent rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  disabled={isSubmitting}
                  className="w-full px-3 py-2.5 bg-[#374151] border border-transparent rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-400">{errors.password}</p>
              )}
            </div>


            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isSubmitting || loading}
            >
              {isSubmitting || loading ? 'Signing in...' : 'Sign in'}
            </Button>

            {/* Divider */}
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#2a3441] px-2 text-gray-400">or</span>
              </div>
            </div>

            {/* Guest Access */}
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="w-full"
              disabled={isSubmitting || loading}
              onClick={handleGuestLogin}
            >
              Continue as Guest
            </Button>
            <p className="text-center text-xs text-gray-500">
              Explore a shared demo workspace — no account needed. Guest data is public and reset periodically.
            </p>

            {/* Sign Up Link */}
            <div className="text-center mt-4">
              <p className="text-sm text-gray-400">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  Register
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;