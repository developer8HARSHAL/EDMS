import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  SimpleGrid, 
  Stat, 
  StatLabel, 
  StatNumber, 
  StatHelpText, 
  Container,
  Icon,
  Flex,
  Stack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Skeleton,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';

import { useColorModeValue } from '@chakra-ui/color-mode';
import { FiFile, FiUpload, FiUsers, FiClock } from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { documentApi } from '../services/apiService';

const StatCard = ({ title, stat, icon, description, isLoading }) => {
  return (
    <Stat
      px={{ base: 2, md: 4 }}
      py={5}
      shadow={'md'}
      border={'1px solid'}
      borderColor={useColorModeValue('gray.200', 'gray.700')}
      rounded={'lg'}
      bg={useColorModeValue('white', 'gray.700')}
      transition="all 0.3s"
      _hover={{ 
        transform: 'translateY(-2px)', 
        shadow: 'lg' 
      }}
    >
      <Flex justifyContent="space-between">
        <Box>
          <StatLabel fontWeight={'medium'} isTruncated>
            {title}
          </StatLabel>
          {isLoading ? (
            <Skeleton height="30px" width="60px" mt={2} mb={2} />
          ) : (
            <StatNumber fontSize={'2xl'} fontWeight={'medium'}>
              {stat}
            </StatNumber>
          )}
          <StatHelpText>{description}</StatHelpText>
        </Box>
        <Box
          my={'auto'}
          color={'blue.500'}
          alignContent={'center'}
        >
          <Icon as={icon} w={8} h={8} />
        </Box>
      </Flex>
    </Stat>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({
    totalDocs: '0',
    uploads: '0',
    shared: '0',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Move all color mode hooks to the top level
  const tableHeaderBg = useColorModeValue("gray.50", "gray.700");
  const tableBorderColor = useColorModeValue("gray.200", "gray.600");
  const noDocsBg = useColorModeValue("gray.50", "gray.700");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const boxBg = useColorModeValue("white", "gray.700");
  const storageBarBg = useColorModeValue("gray.100", "gray.600");

  // Helper function to safely extract documents from API response
  const extractDocumentsFromResponse = (response) => {
    if (!response) {
      console.warn('Received null/undefined response');
      return [];
    }
    
    // Handle case where we already have an array
    if (Array.isArray(response)) {
      return response;
    }
    
    // Try to extract from response.data
    if (response.data) {
      // If data is an array, return it
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      // If data.documents exists and is an array, return it
      if (response.data.documents && Array.isArray(response.data.documents)) {
        return response.data.documents;
      }
    }
    
    // Try to extract from response.documents
    if (response.documents && Array.isArray(response.documents)) {
      return response.documents;
    }
    
    // Handle the correct API response format based on documentController.js
    // The controller returns { success: true, data: documents }
    if (response.success && response.data && Array.isArray(response.data)) {
      return response.data;
    }
    
    console.warn('Could not extract documents from response, returning empty array');
    return [];
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
    
      try {
        console.log('Fetching dashboard data...');
        
        // Fetch all documents
        let allDocs = [];
        let sharedDocs = [];
        
        try {
          const allDocsResponse = await documentApi.getAllDocuments();
          console.log('All documents API response:', allDocsResponse);
          allDocs = extractDocumentsFromResponse(allDocsResponse);
        } catch (docError) {
          console.error('Error fetching all documents:', docError);
          // Continue with empty array instead of throwing
        }
        
        try {
          const sharedDocsResponse = await documentApi.getSharedDocuments();
          console.log('Shared documents API response:', sharedDocsResponse);
          sharedDocs = extractDocumentsFromResponse(sharedDocsResponse);
        } catch (sharedError) {
          console.error('Error fetching shared documents:', sharedError);
          // Continue with empty array instead of throwing
        }
        
        // Calculate stats
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        
        const uploadsThisMonth = allDocs.filter(doc => {
          if (!doc) return false;
          const docDate = new Date(doc.uploadDate || doc.createdAt || Date.now());
          return docDate.getMonth() === thisMonth && 
                 docDate.getFullYear() === thisYear;
        });
        
        // Set statistics
        setStats({
          totalDocs: allDocs.length.toString(),
          uploads: uploadsThisMonth.length.toString(),
          shared: sharedDocs.length.toString(),
        });
        
        // Get 5 most recent documents for display
        const recentDocs = [...allDocs]
          .filter(doc => doc) // Filter out null/undefined entries
          .sort((a, b) => {
            const dateA = new Date(a.uploadDate || a.createdAt || 0);
            const dateB = new Date(b.uploadDate || b.createdAt || 0);
            return dateB - dateA;
          })
          .slice(0, 5);
        
        console.log('Recent docs for display:', recentDocs.length);
        setDocuments(recentDocs);
        
        if (allDocs.length === 0 && recentDocs.length === 0) {
          console.log('No documents found. This may be normal for new users.');
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again later.");
        
        // Fallback to empty data
        setDocuments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDownload = async (docId, docName) => {
    try {
      console.log(`Attempting to download document: ${docName} (ID: ${docId})`);
      const response = await documentApi.downloadDocument(docId);
      
      // Handle different response formats
      const blobData = response.data || response;
      const blob = new Blob([blobData]);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', docName || 'document');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      console.log(`Document download successful: ${docName}`);
    } catch (err) {
      console.error("Error downloading document:", err);
      alert("Failed to download document. Please try again.");
    }
  };

  return (
    <Container maxW="container.xl" py={5}>
      <Box textAlign="left" fontSize="xl" p={5}>
        <Stack spacing={8}>
          <Box>
            <Heading as="h1" size="xl" mb={2}>
              Welcome, {user?.name || 'User'}
            </Heading>
            <Text color={textColor}>
              Here's an overview of your document management system
            </Text>
          </Box>

          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          )}

          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={{ base: 5, md: 4 }}>
            <StatCard
              title="Total Documents"
              stat={stats.totalDocs}
              icon={FiFile}
              description="Files in your repository"
              isLoading={isLoading}
            />
            <StatCard
              title="Uploads This Month"
              stat={stats.uploads}
              icon={FiUpload}
              description="New documents added"
              isLoading={isLoading}
            />
            <StatCard
              title="Shared With Me"
              stat={stats.shared}
              icon={FiUsers}
              description="Documents shared by others"
              isLoading={isLoading}
            />
            <StatCard
              title="Recent Activity"
              stat={isLoading ? "0" : documents.length.toString()}
              icon={FiClock}
              description="Documents recently accessed"
              isLoading={isLoading}
            />
          </SimpleGrid>

          <Box>
            <Flex justify="space-between" align="center" mb={4}>
              <Heading as="h2" size="lg">
                Recent Documents
              </Heading>
              <Button
                as={RouterLink}
                to="/documents"
                size="sm"
                colorScheme="blue"
                leftIcon={<FiFile />}
              >
                View All
              </Button>
            </Flex>

            {documents.length > 0 ? (
              <Box
                border="1px"
                borderColor={tableBorderColor}
                borderRadius="md"
                overflow="hidden"
              >
                <Table variant="simple">
                  <Thead bg={tableHeaderBg}>
                    <Tr>
                      <Th>Document Name</Th>
                      <Th>Type</Th>
                      <Th>Created</Th>
                      <Th>Size</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {isLoading ? (
                      [...Array(5)].map((_, i) => (
                        <Tr key={i}>
                          <Td><Skeleton height="20px" /></Td>
                          <Td><Skeleton height="20px" width="60px" /></Td>
                          <Td><Skeleton height="20px" width="80px" /></Td>
                          <Td><Skeleton height="20px" width="40px" /></Td>
                          <Td><Skeleton height="20px" width="100px" /></Td>
                        </Tr>
                      ))
                    ) : (
                      documents.map((doc) => {
                        // Safely get document ID with fallbacks
                        const docId = doc._id || doc.id;
                        
                        // Skip rendering if no valid ID (prevents React key errors)
                        if (!docId) return null;
                        
                        return (
                          <Tr key={docId}>
                            <Td fontWeight="medium">{doc.name || 'Unnamed Document'}</Td>
                            <Td>{doc.type || 'Unknown'}</Td>
                            <Td>{new Date(doc.uploadDate || doc.createdAt || Date.now()).toLocaleDateString()}</Td>
                            <Td>{formatFileSize(doc.size)}</Td>
                            <Td>
                              <Button
                                as={RouterLink}
                                to={`/documents/preview/${docId}`}
                                size="sm"
                                colorScheme="blue"
                                variant="outline"
                                mr={2}
                              >
                                View
                              </Button>
                              <Button
                                size="sm"
                                colorScheme="green"
                                variant="outline"
                                onClick={() => handleDownload(docId, doc.name)}
                              >
                                Download
                              </Button>
                            </Td>
                          </Tr>
                        );
                      }).filter(Boolean) // Filter out any null entries
                    )}
                  </Tbody>
                </Table>
              </Box>
            ) : !isLoading ? (
              <Box
                p={10}
                textAlign="center"
                bg={noDocsBg}
                borderRadius="md"
              >
                <Text fontSize="lg" mb={4}>
                  No documents found
                </Text>
                <Button
                  as={RouterLink}
                  to="/documents/upload"
                  colorScheme="blue"
                  leftIcon={<FiUpload />}
                >
                  Upload Your First Document
                </Button>
              </Box>
            ) : null}
          </Box>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
            <Box
              p={5}
              shadow="md"
              borderWidth="1px"
              borderRadius="md"
              bg={boxBg}
            >
              <Heading as="h3" size="md" mb={4}>
                Quick Actions
              </Heading>
              <Stack spacing={3}>
                <Button 
                  as={RouterLink}
                  to="/documents/upload"
                  colorScheme="blue" 
                  leftIcon={<FiUpload />}
                  size="md"
                  justifyContent="flex-start"
                >
                  Upload New Document
                </Button>
                <Button
                  as={RouterLink}
                  to="/documents"
                  colorScheme="teal"
                  leftIcon={<FiUsers />}
                  size="md"
                  justifyContent="flex-start"
                >
                  View Documents
                </Button>
                <Button
                  as={RouterLink}
                  to="/profile"
                  colorScheme="purple"
                  size="md"
                  justifyContent="flex-start"
                >
                  Edit Profile Settings
                </Button>
              </Stack>
            </Box>
            
            <Box
              p={5}
              shadow="md"
              borderWidth="1px"
              borderRadius="md"
              bg={boxBg}
            >
              <Heading as="h3" size="md" mb={4}>
                Storage Usage
              </Heading>
              {isLoading ? (
                <Skeleton height="100px" />
              ) : (
                <Box>
                  <Text mb={2}>
                    You are currently using{" "}
                    <Text as="span" fontWeight="bold">
                      {calculateStorageUsage(documents)}
                    </Text>{" "}
                    of your available storage.
                  </Text>
                  <Box
                    w="100%"
                    bg={storageBarBg}
                    borderRadius="full"
                    h="20px"
                    overflow="hidden"
                  >
                    <Box
                      w={calculateStoragePercentage(documents) + "%"}
                      bg="blue.400"
                      h="100%"
                      transition="width 0.5s"
                    />
                  </Box>
                </Box>
              )}
            </Box>
          </SimpleGrid>
        </Stack>
      </Box>
    </Container>
  );
};

// Helper functions
const formatFileSize = (bytes) => {
  if (!bytes) return '0 KB';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round(bytes / Math.pow(1024, i))} ${sizes[i]}`;
};

const calculateStorageUsage = (documents) => {
  const totalBytes = documents.reduce((acc, doc) => acc + (doc.size || 0), 0);
  return formatFileSize(totalBytes);
};

const calculateStoragePercentage = (documents) => {
  // Assuming a limit of 1GB for this example
  const limit = 1 * 1024 * 1024 * 1024; // 1GB in bytes
  const used = documents.reduce((acc, doc) => acc + (doc.size || 0), 0);
  const percentage = (used / limit) * 100;
  return Math.min(percentage, 100); // Cap at 100%
};

export default Dashboard;