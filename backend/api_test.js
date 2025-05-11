const axios = require('axios');

// Base URL for API
const baseURL = 'http://localhost:5000';

// Function to test API endpoints
async function testAPI() {
  console.log('Starting API test...');
  
  // Test variables
  let token = '';
  let userId = '';
  let documentId = '';
  
  try {
    // 1. Test base endpoint
    console.log('\n1. Testing base endpoint...');
    const baseResponse = await axios.get(`${baseURL}`);
    console.log('Base endpoint response:', baseResponse.data);
    console.log('✅ Base endpoint test passed!');
    
    // 2. Register a test user
    console.log('\n2. Testing user registration...');
    const registerData = {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      role: 'user'
    };
    
    const registerResponse = await axios.post(`${baseURL}/api/users/register`, registerData);
    console.log('Registration response status:', registerResponse.status);
    userId = registerResponse.data.user.id;
    token = registerResponse.data.token;
    
    console.log('User registered with ID:', userId);
    console.log('✅ User registration test passed!');
    
    // 3. Test login
    console.log('\n3. Testing user login...');
    const loginData = {
      email: registerData.email,
      password: registerData.password
    };
    
    const loginResponse = await axios.post(`${baseURL}/api/users/login`, loginData);
    console.log('Login response status:', loginResponse.status);
    token = loginResponse.data.token;
    console.log('✅ User login test passed!');
    
    // 4. Test protected profile endpoint
    console.log('\n4. Testing protected profile endpoint...');
    const profileResponse = await axios.get(`${baseURL}/api/users/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Profile response status:', profileResponse.status);
    console.log('Profile data:', profileResponse.data);
    console.log('✅ Protected profile endpoint test passed!');
    
    // 5. Test document upload (create a small test file)
    console.log('\n5. Testing document upload...');
    const fs = require('fs');
    const path = require('path');
    const testFilePath = path.join(__dirname, 'test_file.txt');
    
    // Create a test file
    fs.writeFileSync(testFilePath, 'This is a test file for document upload.');
    
    // Create FormData for file upload
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('name', 'Test Document');
    
    const uploadResponse = await axios.post(`${baseURL}/api/documents`, formData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        ...formData.getHeaders()  
      }
    });
    
    console.log('Upload response status:', uploadResponse.status);
    documentId = uploadResponse.data.data._id;
    console.log('Document uploaded with ID:', documentId);
    console.log('✅ Document upload test passed!');
    
    // 6. Test fetching all documents
    console.log('\n6. Testing get all documents...');
    const documentsResponse = await axios.get(`${baseURL}/api/documents`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Documents response status:', documentsResponse.status);
    console.log('Documents count:', documentsResponse.data.count);
    console.log('✅ Get all documents test passed!');
    
    // 7. Test fetching a single document
    if (documentId) {
      console.log('\n7. Testing get single document...');
      const documentResponse = await axios.get(`${baseURL}/api/documents/${documentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Single document response status:', documentResponse.status);
      console.log('Document data:', documentResponse.data.data.name);
      console.log('✅ Get single document test passed!');
      
      // 8. Test document update
      console.log('\n8. Testing document update...');
      const updateData = {
        name: 'Updated Test Document'
      };
      
      const updateResponse = await axios.put(`${baseURL}/api/documents/${documentId}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Update response status:', updateResponse.status);
      console.log('Updated document name:', updateResponse.data.data.name);
      console.log('✅ Document update test passed!');
      
      // 9. Test document deletion
      console.log('\n9. Testing document deletion...');
      const deleteResponse = await axios.delete(`${baseURL}/api/documents/${documentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Delete response status:', deleteResponse.status);
      console.log('✅ Document deletion test passed!');
    }
    
    // Clean up
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
    
    console.log('\n✅✅✅ All API tests completed successfully! ✅✅✅');
    
  } catch (error) {
    console.error('\n❌ API TEST FAILED ❌');
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Error request:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    
    // Clean up
    const fs = require('fs');
    const path = require('path');
    const testFilePath = path.join(__dirname, 'test_file.txt');
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  }
}

// Run the tests
testAPI();