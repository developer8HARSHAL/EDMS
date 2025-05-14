// src/pages/NotFound.js
import React from 'react';
import { Box, Heading, Text, Button, Center, VStack } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NotFound = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <Center h="80vh">
      <VStack spacing={6} align="center">
        <Heading as="h1" size="2xl">404</Heading>
        <Heading as="h2" size="xl">Page Not Found</Heading>
        <Text fontSize="lg" textAlign="center">
          The page you are looking for doesn't exist or has been moved.
        </Text>
        <Box mt={4}>
          <Button 
            as={RouterLink} 
            to={isAuthenticated ? '/dashboard' : '/login'} 
            colorScheme="blue"
            size="lg"
          >
            Go to {isAuthenticated ? 'Dashboard' : 'Login'}
          </Button>
        </Box>
      </VStack>
    </Center>
  );
};

export default NotFound;