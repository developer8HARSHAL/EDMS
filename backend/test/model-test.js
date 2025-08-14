// Create test script: backend/test/model-test.js
const mongoose = require('mongoose');
const Workspace = require('../models/workspaceModel');
const User = require('../models/userModel');

async function testModels() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Test workspace creation
    const testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    
    const testWorkspace = await Workspace.create({
      name: 'Test Workspace',
      description: 'Testing workspace creation',
      owner: testUser._id
    });
    
    console.log('✅ Models working correctly');
    console.log('Workspace ID:', testWorkspace._id);
    console.log('Members count:', testWorkspace.members.length);
    
    await testWorkspace.deleteOne();
    await testUser.deleteOne();
    
  } catch (error) {
    console.error('❌ Model test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testModels();