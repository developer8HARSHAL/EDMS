// src/pages/Login.js - Enhanced error handling version
import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Button,
  Stack,
  Heading,
  Text,
  Alert,
  AlertIcon,
  Container,
  Link,
  InputGroup,
  InputRightElement,
  IconButton,
  useToast,
  FormErrorMessage
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  
  const { login, error, clearError, isAuthenticated, user, loading } = useAuth();

  // Redirect if user is already authenticated
  useEffect(() => {
    if (isAuthenticated && user && !loading) {
      // If there's a redirect location saved (e.g., from a protected route), use that
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location, loading]);

  // Clear previous errors when component mounts
  useEffect(() => {
    if (typeof clearError === 'function') {
      clearError();
    }
    // Also clear form errors
    setFormErrors({});
  }, [clearError]);

  const validateForm = () => {
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
  };

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
        console.log('Login successful');
        // No need for navigation here as the useEffect will handle it
      } else {
        console.log('Login failed');
        // Handle specific authentication failures
        toast({
          title: 'Login Failed',
          description: 'Please check your credentials and try again',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Login process error:', error);
      console.log('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      // More specific error handling based on error types
      let errorMessage = 'An unexpected error occurred';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        
        // First check if there's a message in the response data
        if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else {
          // If no specific message, provide a status-based fallback
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
        // The request was made but no response was received
        errorMessage = 'No response from server. Please check your internet connection';
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = error.message || 'Login request failed';
      }
      
      toast({
        title: 'Login Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxW="md" py={12}>
      <Box
        p={8}
        maxWidth="md"
        borderWidth={1}
        borderRadius={8}
        boxShadow="lg"
      >
        <Stack spacing={4}>
          <Heading fontSize="2xl" textAlign="center">
            Log in to your account
          </Heading>
          
          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <Stack spacing={4}>
              <FormControl id="email" isRequired isInvalid={!!formErrors.email}>
                <FormLabel>Email address</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    // Clear error when typing
                    if (formErrors.email) {
                      setFormErrors({...formErrors, email: undefined});
                    }
                  }}
                  autoComplete="email"
                  data-testid="email-input"
                />
                <FormErrorMessage>{formErrors.email}</FormErrorMessage>
              </FormControl>
              
              <FormControl id="password" isRequired isInvalid={!!formErrors.password}>
                <FormLabel>Password</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      // Clear error when typing
                      if (formErrors.password) {
                        setFormErrors({...formErrors, password: undefined});
                      }
                    }}
                    autoComplete="current-password"
                    data-testid="password-input"
                  />
                  <InputRightElement h="full">
                    <IconButton
                      variant="ghost"
                      onClick={() => setShowPassword(!showPassword)}
                      icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    />
                  </InputRightElement>
                </InputGroup>
                <FormErrorMessage>{formErrors.password}</FormErrorMessage>
              </FormControl>
              
              <Link alignSelf="flex-end" fontSize="sm" color="blue.500" href="/forgot-password">
                Forgot Password?
              </Link>
              
              <Stack spacing={6}>
                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  fontSize="md"
                  isLoading={isSubmitting || loading}
                  loadingText="Logging in"
                  data-testid="login-button"
                >
                  Sign in
                </Button>
              </Stack>
            </Stack>
          </form>
          
          <Stack pt={6}>
            <Text align="center">
              Don't have an account?{' '}
              <Link as={RouterLink} to="/register" color="blue.400">
                Register
              </Link>
            </Text>
          </Stack>
          
          {/* Debug section for development only */}
          {process.env.NODE_ENV === 'development' && (
            <Box mt={4} p={3} borderWidth="1px" borderRadius="md" bg="gray.50">
              <Text fontWeight="bold" fontSize="sm">Debug Info:</Text>
              <Text fontSize="xs">Auth Status: {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</Text>
              <Text fontSize="xs">Token: {localStorage.getItem('authToken') ? 'Present' : 'Missing'}</Text>
              <Text fontSize="xs">Loading: {loading ? 'True' : 'False'}</Text>
              <Text fontSize="xs">User: {user ? JSON.stringify(user) : 'null'}</Text>
            </Box>
          )}
        </Stack>
      </Box>
    </Container>
  );
};

export default Login;