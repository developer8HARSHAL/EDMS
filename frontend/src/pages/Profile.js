// src/pages/Profile.js - Fixed version
import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Heading, 
  FormControl, 
  FormLabel, 
  Input,
  Button,
  useToast,
  Avatar,
  VStack,
  HStack,
  Text,
  Divider,
  useColorModeValue,
  Alert,
  AlertIcon,
  FormErrorMessage
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, updateUserProfile, error } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  
  // Color mode values
  const boxBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when field is edited
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const validateForm = () => {
    const errors = {};
    
    // Validate name
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    // Validate password change if attempted
    if (formData.newPassword || formData.currentPassword) {
      // If one password field is filled, both must be filled
      if (!formData.currentPassword) {
        errors.currentPassword = 'Current password is required to set a new password';
      }
      
      if (!formData.newPassword) {
        errors.newPassword = 'Please provide a new password';
      } else if (formData.newPassword.length < 8) {
        errors.newPassword = 'Password must be at least 8 characters';
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare data for API - only send what's needed
      const profileData = {
        name: formData.name
      };
      
      // Only include password fields if both are provided
      if (formData.currentPassword && formData.newPassword) {
        profileData.currentPassword = formData.currentPassword;
        profileData.newPassword = formData.newPassword;
      }
      
      // Call API to update profile
      await updateUserProfile(profileData);
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      
      // Reset password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      // Toast is already handled by context, just log here
      console.error('Profile update failed in component:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Container maxW="container.md" py={8}>
      <Box 
        bg={boxBg} 
        p={6} 
        borderRadius="lg" 
        boxShadow="md"
        borderWidth="1px"
        borderColor={borderColor}
      >
        <VStack spacing={6} align="stretch">
          <HStack spacing={6}>
            <Avatar 
              size="xl" 
              name={user?.name} 
              src={user?.avatar} 
              bg="blue.500"
            />
            <Box>
              <Heading size="lg">Your Profile</Heading>
              <Text color="gray.500">Manage your account settings</Text>
            </Box>
          </HStack>
          
          <Divider />
          
          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <VStack spacing={4} align="stretch">
              <FormControl id="name" isInvalid={!!formErrors.name}>
                <FormLabel>Full Name</FormLabel>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
                {formErrors.name && (
                  <FormErrorMessage>{formErrors.name}</FormErrorMessage>
                )}
              </FormControl>
              
              <FormControl id="email" isReadOnly>
                <FormLabel>Email Address</FormLabel>
                <Input
                  name="email"
                  value={formData.email}
                  bg="gray.50"
                />
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Email cannot be changed
                </Text>
              </FormControl>
              
              <Heading size="md" mt={4}>Change Password</Heading>
              
              <FormControl id="currentPassword" isInvalid={!!formErrors.currentPassword}>
                <FormLabel>Current Password</FormLabel>
                <Input
                  name="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={handleChange}
                />
                {formErrors.currentPassword && (
                  <FormErrorMessage>{formErrors.currentPassword}</FormErrorMessage>
                )}
              </FormControl>
              
              <FormControl id="newPassword" isInvalid={!!formErrors.newPassword}>
                <FormLabel>New Password</FormLabel>
                <Input
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleChange}
                />
                {formErrors.newPassword && (
                  <FormErrorMessage>{formErrors.newPassword}</FormErrorMessage>
                )}
              </FormControl>
              
              <FormControl id="confirmPassword" isInvalid={!!formErrors.confirmPassword}>
                <FormLabel>Confirm New Password</FormLabel>
                <Input
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                {formErrors.confirmPassword && (
                  <FormErrorMessage>{formErrors.confirmPassword}</FormErrorMessage>
                )}
              </FormControl>
              
              <Button
                mt={6}
                colorScheme="blue"
                type="submit"
                isLoading={isSubmitting}
                loadingText="Updating..."
              >
                Update Profile
              </Button>
            </VStack>
          </form>
        </VStack>
      </Box>
    </Container>
  );
};

export default Profile;