// ===== FIXED Register.js =====
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link as RouterLink, useSearchParams } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { Card } from '../components/ui/Card';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  
  // ✅ FIXED: Properly declare invitation handling hooks
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get('invitation');
  const invitationAction = searchParams.get('action'); // 'accept' or 'view'
  const redirectPath = searchParams.get('redirect');
  
  const { register, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // ✅ FIXED: Handle registration success with invitation redirect
  const handleRegisterSuccess = useCallback(() => {
    console.log('Registration successful, checking invitation redirect...');
    
    if (invitationToken && redirectPath) {
      console.log('Redirecting to invitation page after registration:', redirectPath);
      navigate(redirectPath);
    } else if (invitationToken) {
      // Construct invitation URL with action parameter
      const invitationUrl = `/invitations/${invitationToken}${invitationAction ? `?action=${invitationAction}` : ''}`;
      console.log('Redirecting to invitation with token:', invitationUrl);
      navigate(invitationUrl);
    } else {
      console.log('Normal registration flow - redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [invitationToken, invitationAction, redirectPath, navigate]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      handleRegisterSuccess();
    }
  }, [isAuthenticated, handleRegisterSuccess]);

  // Clear previous errors when component mounts ONLY
  useEffect(() => {
    if (typeof clearError === 'function') {
      clearError();
    }
  }, []); // Empty dependency array - only run on mount

  // Auto-hide toast after 5 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const validateEmail = useCallback((email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const validateForm = useCallback(() => {
    let isValid = true;
    
    // Reset previous errors
    setPasswordError('');
    setEmailError('');
    
    // Validate email
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }
    
    // Check if passwords match
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      isValid = false;
    }
    
    // Check password strength (at least 8 characters with mix of letters, numbers)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
      setPasswordError('Password must be at least 8 characters long and include both letters and numbers');
      isValid = false;
    }
    
    return isValid;
  }, [email, password, confirmPassword, validateEmail]);

  const showToast = useCallback((message, type = 'error') => {
    setToastMessage({ message, type });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('Attempting to register...');
      await register(name, email, password);
      
      // Show success toast
      showToast('Registration successful! You can now log in with your credentials.', 'success');
      
      // ✅ FIXED: Handle invitation redirect or normal flow
      if (invitationToken) {
        console.log('Registration successful with invitation - redirecting to invitation page');
        // Small delay to show success message, then redirect to invitation
        setTimeout(() => {
          handleRegisterSuccess();
        }, 1000);
      } else {
        // Navigate to login page after successful registration (normal flow)
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      // Error handling is done via the error state in AuthContext
      // But we'll add an additional toast for unexpected errors
      if (!error) {
        showToast(err.message || 'An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginClick = useCallback(() => {
    console.log('Login link clicked');
    
    // ✅ FIXED: Preserve invitation context when going to login
    if (invitationToken) {
      const loginParams = new URLSearchParams();
      loginParams.set('invitation', invitationToken);
      if (invitationAction) loginParams.set('action', invitationAction);
      if (redirectPath) loginParams.set('redirect', redirectPath);
      
      navigate(`/login?${loginParams.toString()}`);
    } else {
      navigate('/login');
    }
  }, [navigate, invitationToken, invitationAction, redirectPath]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card className="p-8 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-white">
              Join us and start managing your documents
            </p>
            {/* ✅ FIXED: Show invitation context */}
            {invitationToken && (
              <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                {invitationAction === 'accept' 
                  ? 'Create an account to accept your workspace invitation'
                  : 'Create an account to view your workspace invitation'
                }
              </p>
            )}
          </div>

          {/* Toast Notification */}
          {toastMessage && (
            <div className="mb-6">
              <Alert variant={toastMessage.type === 'success' ? 'success' : 'error'}>
                <div className="flex items-center">
                  {toastMessage.type === 'success' ? (
                    <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                  {toastMessage.message}
                </div>
              </Alert>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="mb-6">
              <Alert variant="error">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              </Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2 dark:text-white">
                Full Name *
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 dark:text-white">
                Email address *
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                required
                className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 ${
                  emailError 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                }`}
              />
              {emailError && (
                <p className="mt-1 text-sm text-red-600">{emailError}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2 dark:text-white">
                Password *
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  required
                  className={`w-full px-3 py-2 pr-10 border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 ${
                    passwordError 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                  }`}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 rounded-r-lg transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-white">
                Must be at least 8 characters with letters and numbers
              </p>
              {passwordError && (
                <p className="mt-1 text-sm text-red-600">{passwordError}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2 dark:text-white">
                Confirm Password *
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  required
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 rounded-r-lg transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            
            <div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </div>
                ) : (
                  'Register'
                )}
              </Button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-white">
              Already have an account?{' '}
              <button
                type="button"
                onClick={handleLoginClick}
                className="text-blue-600 hover:text-blue-800 font-medium transition-colors underline bg-transparent border-none cursor-pointer"
              >
                Sign in
              </button>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Register;