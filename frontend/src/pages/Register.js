// frontend/src/pages/Register.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const Register = () => {
  const navigate = useNavigate();
  const { register, guestLogin, isAuthenticated, loading, error: authError, clearError } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Clear errors when auth error changes
  useEffect(() => {
    if (authError) {
      setSubmitError(authError);
    }
  }, [authError]);

  // Auto-dismiss error messages after 5 seconds
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

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Name must not exceed 50 characters';
    }

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
    } else if (!/(?=.*[a-z])(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = 'Password must contain both uppercase and lowercase letters';
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous messages
    setSubmitError('');
    setSuccessMessage('');

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Call register function from useAuth hook
      await register(formData.name, formData.email, formData.password);

      // Registration now auto-stores token (auto-login).
      // The isAuthenticated useEffect will redirect to /dashboard.
      setSuccessMessage('Registration successful! Redirecting...');

    } catch (error) {
      console.error('Registration error:', error);

      // Handle specific error messages
      if (error.message) {
        setSubmitError(error.message);
      } else if (error.response?.data?.message) {
        setSubmitError(error.response.data.message);
      } else if (error.response?.status === 400) {
        setSubmitError('User already exists with this email address');
      } else if (error.response?.status === 500) {
        setSubmitError('Server error. Please try again later.');
      } else if (!error.response) {
        setSubmitError('Cannot connect to server. Please check your internet connection.');
      } else {
        setSubmitError('Registration failed. Please try again.');
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
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md">
        {/* Card Container - Reduced padding and size */}
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-panel">
          {/* Header - Reduced spacing */}
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-ink">
              Create your account
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Join us and start managing your documents
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <Alert variant="success" className="mb-3">
              {successMessage}
            </Alert>
          )}

          {/* Error Message */}
          {submitError && (
            <Alert variant="error" className="mb-3">
              {submitError}
            </Alert>
          )}

          {/* Registration Form - Reduced spacing */}
          <form className="space-y-3" onSubmit={handleSubmit}>
            {/* Full Name Input */}
            <Input
              id="name"
              name="name"
              type="text"
              label={<>Full Name <span className="text-red-600 dark:text-red-400">*</span></>}
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              disabled={isSubmitting}
              error={errors.name}
            />

            {/* Email Input */}
            <Input
              id="email"
              name="email"
              type="email"
              label={<>Email address <span className="text-red-600 dark:text-red-400">*</span></>}
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              disabled={isSubmitting}
              error={errors.email}
            />

            {/* Password Input */}
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              label={<>Password <span className="text-red-600 dark:text-red-400">*</span></>}
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              disabled={isSubmitting}
              error={errors.password}
              helperText="Must be 8+ characters with letters and numbers"
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-ink-muted hover:text-ink focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              }
            />

            {/* Confirm Password Input */}
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              label={<>Confirm Password <span className="text-red-600 dark:text-red-400">*</span></>}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              disabled={isSubmitting}
              error={errors.confirmPassword}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-ink-muted hover:text-ink focus:outline-none"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              }
            />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-4"
              disabled={isSubmitting || loading}
            >
              {isSubmitting || loading ? 'Creating account...' : 'Register'}
            </Button>

            {/* Divider */}
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-surface px-2 text-ink-muted">or</span>
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
            <p className="text-center text-xs text-ink-muted">
              Explore a shared demo workspace — no account needed. Guest data is public and reset periodically.
            </p>

            {/* Sign In Link */}
            <div className="text-center mt-4">
              <p className="text-sm text-ink-muted">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;