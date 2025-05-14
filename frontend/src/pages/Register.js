// src/pages/Register.js - Fixed version
import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Heading,
  Text,
  useToast,
  FormErrorMessage,
  Container,
  Alert,
  AlertIcon,
  InputGroup,
  InputRightElement,
  IconButton,
  Link
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';

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
  
  const { register, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Clear previous errors when component mounts or form values change
  useEffect(() => {
    if (typeof clearError === 'function') {
      clearError();
    }
  }, [clearError, email, password, confirmPassword]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await register(name, email, password);
      
      // Show success toast
      toast({
        title: 'Registration successful',
        description: 'You can now log in with your credentials',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Navigate to login page after successful registration
      navigate('/login');
    } catch (err) {
      // Error handling is done via the error state in AuthContext
      // But we'll add an additional toast for unexpected errors
      if (!error) {
        toast({
          title: 'Registration failed',
          description: err.message || 'An unexpected error occurred',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxW="md" py={10}>
      <Box
        p={8}
        maxWidth="md"
        borderWidth={1}
        borderRadius={8}
        boxShadow="lg"
      >
        <Stack spacing={4}>
          <Heading size="lg" textAlign="center">
            Create your account
          </Heading>

          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={4}>
              <FormControl id="name" isRequired>
                <FormLabel>Full Name</FormLabel>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </FormControl>
              
              <FormControl id="email" isRequired isInvalid={emailError}>
                <FormLabel>Email address</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                />
                {emailError && <FormErrorMessage>{emailError}</FormErrorMessage>}
              </FormControl>
              
              <FormControl id="password" isRequired isInvalid={passwordError}>
                <FormLabel>Password</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    autoComplete="new-password"
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
                {passwordError && <FormErrorMessage>{passwordError}</FormErrorMessage>}
              </FormControl>
              
              <FormControl id="confirmPassword" isRequired isInvalid={passwordError}>
                <FormLabel>Confirm Password</FormLabel>
                <InputGroup>
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                  />
                  <InputRightElement h="full">
                    <IconButton
                      variant="ghost"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      icon={showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>
              
              <Button
                colorScheme="blue"
                isLoading={isSubmitting}
                type="submit"
                width="full"
                mt={4}
              >
                Register
              </Button>
            </Stack>
          </form>
          
          <Text mt={4} textAlign="center">
            Already have an account?{' '}
            <Link as={RouterLink} to="/login" color="blue.400">
              Sign in
            </Link>
          </Text>
        </Stack>
      </Box>
    </Container>
  );
};

export default Register;