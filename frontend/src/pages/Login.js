// ===== FIXED Login.js =====
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link as RouterLink, useLocation, useSearchParams } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { Card } from '../components/ui/Card';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [toastMessage, setToastMessage] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // ✅ FIXED: Properly declare invitation handling hooks
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get('invitation');
  const invitationAction = searchParams.get('action'); // 'accept' or 'view'
  const redirectPath = searchParams.get('redirect');
  
  const { login, error, clearError, isAuthenticated, user, loading } = useAuth();

  // ✅ FIXED: Handle login success with invitation redirect
  const handleLoginSuccess = useCallback(() => {
    console.log('Login successful, checking invitation redirect...');
    
    if (invitationToken && redirectPath) {
      console.log('Redirecting to invitation page after login:', redirectPath);
      navigate(redirectPath);
    } else if (invitationToken) {
      // Construct invitation URL with action parameter
      const invitationUrl = `/invitations/${invitationToken}${invitationAction ? `?action=${invitationAction}` : ''}`;
      console.log('Redirecting to invitation with token:', invitationUrl);
      navigate(invitationUrl);
    } else {
      console.log('Normal login flow - redirecting to dashboard');
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [invitationToken, invitationAction, redirectPath, navigate, location]);

  // Redirect if user is already authenticated
  useEffect(() => {
    if (isAuthenticated && user && !loading) {
      handleLoginSuccess();
    }
  }, [isAuthenticated, user, loading, handleLoginSuccess]);

  // Clear previous errors when component mounts ONLY
  useEffect(() => {
    if (typeof clearError === 'function') {
      clearError();
    }
    setFormErrors({});
  }, []); // Empty dependency array - only run on mount

  // Clear form errors when user types
  useEffect(() => {
    if (formErrors.email && email) {
      setFormErrors(prev => ({ ...prev, email: undefined }));
    }
  }, [email, formErrors.email]);

  useEffect(() => {
    if (formErrors.password && password) {
      setFormErrors(prev => ({ ...prev, password: undefined }));
    }
  }, [password, formErrors.password]);

  // Auto-hide toast after 5 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const validateForm = useCallback(() => {
    const errors = {};
    
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!password) {
      errors.password = 'Password is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [email, password]);

  const showToast = useCallback((message, type = 'error') => {
    setToastMessage({ message, type });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('Attempting to login with:', { email });
      const success = await login(email, password);
      
      if (success) {
        console.log('Login successful, will redirect via useEffect');
        // Navigation handled by handleLoginSuccess in useEffect
      } else {
        console.log('Login failed');
        showToast('Please check your credentials and try again');
      }
    } catch (error) {
      console.error('Login process error:', error);
      
      let errorMessage = 'An unexpected error occurred';
      
      if (error.response) {
        if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else {
          switch (error.response.status) {
            case 401:
              errorMessage = 'Invalid email or password';
              break;
            case 403:
              errorMessage = 'Your account is locked or disabled';
              break;
            case 429:
              errorMessage = 'Too many failed attempts. Please try again later';
              break;
            case 500:
              errorMessage = 'Server error. Please try again later';
              break;
            default:
              errorMessage = 'Login failed';
          }
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your internet connection';
      } else {
        errorMessage = error.message || 'Login request failed';
      }
      
      showToast(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterClick = useCallback(() => {
    console.log('Register link clicked');
    
    // ✅ FIXED: Preserve invitation context when going to register
    if (invitationToken) {
      const registerParams = new URLSearchParams();
      registerParams.set('invitation', invitationToken);
      if (invitationAction) registerParams.set('action', invitationAction);
      if (redirectPath) registerParams.set('redirect', redirectPath);
      
      navigate(`/register?${registerParams.toString()}`);
    } else {
      navigate('/register');
    }
  }, [navigate, invitationToken, invitationAction, redirectPath]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Log in to your account
            </h2>
            {/* ✅ FIXED: Show invitation context */}
            {invitationToken && (
              <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                {invitationAction === 'accept' 
                  ? 'Sign in to accept your workspace invitation'
                  : 'Sign in to view your workspace invitation'
                }
              </p>
            )}
          </div>
          
          {/* Toast Notification */}
          {toastMessage && (
            <div className="mb-6">
              <Alert variant={toastMessage.type}>
                {toastMessage.message}
              </Alert>
            </div>
          )}
          
          {/* Error Alert */}
          {error && (
            <div className="mb-6">
              <Alert variant="error">
                {error}
              </Alert>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={formErrors.email}
                isRequired
                autoComplete="email"
                data-testid="email-input"
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={formErrors.password}
                isRequired
                autoComplete="current-password"
                data-testid="password-input"
                placeholder="Enter your password"
                rightIcon={
                  <button
                    type="button"
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                }
              />
            </div>
            
            <div className="flex items-center justify-end">
              <RouterLink
                to="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                Forgot Password?
              </RouterLink>
            </div>
            
            <div>
              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isSubmitting || loading}
                loadingText="Logging in"
                data-testid="login-button"
              >
                Sign in
              </Button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={handleRegisterClick}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors underline bg-transparent border-none cursor-pointer"
              >
                Register
              </button>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;