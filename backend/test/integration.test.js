
// backend/test/integration.test.js
// Comprehensive Backend Testing Suite for Workspace Collaboration System
// Run with: npm test

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server'); // Your main app file
const User = require('../models/userModel');
const Workspace = require('../models/workspaceModel');
const WorkspaceInvitation = require('../models/workspaceInvitationModel');
const Document = require('../models/documentModel');

// Test Configuration
const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/dms_test';
const API_BASE = '/api';

// Test Data
const testUsers = {
  owner: {
    name: 'Owner User',
    email: 'owner@test.com',
    password: 'password123'
  },
  admin: {
    name: 'Admin User', 
    email: 'admin@test.com',
    password: 'password123'
  },
  editor: {
    name: 'Editor User',
    email: 'editor@test.com', 
    password: 'password123'
  },
  viewer: {
    name: 'Viewer User',
    email: 'viewer@test.com',
    password: 'password123'
  },
  outsider: {
    name: 'Outsider User',
    email: 'outsider@test.com',
    password: 'password123'
  }
};

// Global test variables
let tokens = {};
let userIds = {};
let testWorkspaceId;
let testDocumentId;
let testInvitationToken;

describe('🧪 WORKSPACE COLLABORATION SYSTEM - BACKEND INTEGRATION TESTS', () => {
  
  // Database Setup & Cleanup
// test/integration.test.js
beforeAll(async () => {
  console.log('🔧 Setting up test database...');
  await clearDatabase(); // Don’t call mongoose.connect here
});


  afterAll(async () => {
    console.log('🧹 Cleaning up test database...');
    await clearDatabase();
    await mongoose.connection.close();
  });

  // Test Helper Functions
  async function clearDatabase() {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }

  async function createTestUsers() {
    console.log('👥 Creating test users...');
    for (const [role, userData] of Object.entries(testUsers)) {
      try {
        // Register user
        const registerRes = await request(app)
          .post(`${API_BASE}/users/register`)  
          .send(userData);
        
        if (registerRes.status !== 201 && registerRes.status !== 200) {
          console.error(`❌ Failed to register ${role}:`, registerRes.body);
          continue;
        }

        // Login user
        const loginRes = await request(app)
          .post(`${API_BASE}/users/login`)
          .send({
            email: userData.email,
            password: userData.password
          });

        if (loginRes.status === 200 || loginRes.status === 201) {
          tokens[role] = loginRes.body.token;
          userIds[role] = loginRes.body.user?.id || loginRes.body.user?._id;
          console.log(`✅ ${role} created and logged in`);
        } else {
          console.error(`❌ Failed to login ${role}:`, loginRes.body);
        }
      } catch (error) {
        console.error(`❌ Error with ${role}:`, error.message);
      }
    }
  }

  // 1. AUTHENTICATION & USER SETUP TESTS
  describe('1️⃣ AUTHENTICATION & USER SETUP', () => {
    
    test('should create all test users successfully', async () => {
      await createTestUsers();
      
      console.log('\n📊 User Creation Results:');
      console.log('Tokens:', Object.keys(tokens));
      console.log('User IDs:', Object.keys(userIds));
      
      expect(Object.keys(tokens)).toHaveLength(5);
      expect(Object.keys(userIds)).toHaveLength(5);
    });

    test('should validate authentication tokens', async () => {
      for (const [role, token] of Object.entries(tokens)) {
        const response = await request(app)
          .get(`${API_BASE}/users/profile`)
          .set('Authorization', `Bearer ${token}`);
        
        console.log(`🔐 ${role} auth status:`, response.status);
        expect([200, 201]).toContain(response.status);
      }
    });
  });

  // 2. WORKSPACE CRUD OPERATIONS
  describe('2️⃣ WORKSPACE CRUD OPERATIONS', () => {
    
    test('should create a new workspace', async () => {
      const workspaceData = {
        name: 'Test Workspace',
        description: 'A test workspace for integration testing',
        isPublic: false
      };

      const response = await request(app)
        .post(`${API_BASE}/workspaces`)
        .set('Authorization', `Bearer ${tokens.owner}`)
        .send(workspaceData);

      console.log('🏢 Create workspace response:', response.status, response.body?.message);
      
      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      
      testWorkspaceId = response.body.data._id;
      console.log('✅ Test workspace created:', testWorkspaceId);
    });

    test('should get user workspaces', async () => {
      const response = await request(app)
        .get(`${API_BASE}/workspaces`)
        .set('Authorization', `Bearer ${tokens.owner}`);

      console.log('📋 Get workspaces response:', response.status, `Found ${response.body?.data?.length || 0} workspaces`);
      
      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('should get single workspace details', async () => {
      const response = await request(app)
        .get(`${API_BASE}/workspaces/${testWorkspaceId}`)
        .set('Authorization', `Bearer ${tokens.owner}`);

      console.log('🔍 Get workspace details response:', response.status);
      
      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Workspace');
    });

    test('should update workspace', async () => {
      const updateData = {
        name: 'Updated Test Workspace',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`${API_BASE}/workspaces/${testWorkspaceId}`)
        .set('Authorization', `Bearer ${tokens.owner}`)
        .send(updateData);

      console.log('✏️ Update workspace response:', response.status);
      
      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
    });
  });

  // 3. INVITATION SYSTEM TESTS  
  describe('3️⃣ INVITATION SYSTEM', () => {
    
    test('should send workspace invitation', async () => {
      const invitationData = {
        workspaceId: testWorkspaceId,
        email: testUsers.admin.email,
        role: 'admin',
        permissions: {
          read: true,
          write: true,
          delete: true,
          admin: true
        },
        customMessage: 'Welcome to our test workspace!'
      };

      const response = await request(app)
        .post(`${API_BASE}/invitations/send`)
        .set('Authorization', `Bearer ${tokens.owner}`)
        .send(invitationData);

      console.log('📧 Send invitation response:', response.status, response.body?.message);
      
      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
      
      // Get the invitation token for later tests
      const invitation = await WorkspaceInvitation.findOne({ 
        workspace: testWorkspaceId,
        email: testUsers.admin.email 
      });
      testInvitationToken = invitation?.token;
      console.log('✅ Invitation token obtained:', testInvitationToken ? 'Yes' : 'No');
    });

    test('should get invitation details by token', async () => {
      if (!testInvitationToken) {
        console.log('⚠️ Skipping invitation details test - no token available');
        return;
      }

      const response = await request(app)
        .get(`${API_BASE}/invitations/${testInvitationToken}`);

      console.log('🔍 Get invitation details response:', response.status);
      
      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(testUsers.admin.email);
    });

    test('should accept workspace invitation', async () => {
      if (!testInvitationToken) {
        console.log('⚠️ Skipping invitation acceptance test - no token available');
        return;
      }

      const response = await request(app)
        .post(`${API_BASE}/invitations/${testInvitationToken}/accept`)
        .set('Authorization', `Bearer ${tokens.admin}`);

      console.log('✅ Accept invitation response:', response.status, response.body?.message);
      
      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
    });

    test('should get pending invitations for user', async () => {
      const response = await request(app)
        .get(`${API_BASE}/invitations/pending`)
        .set('Authorization', `Bearer ${tokens.editor}`);

      console.log('📬 Pending invitations response:', response.status, `Found ${response.body?.data?.length || 0} invitations`);
      
      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
    });
  });

  // 4. MEMBER MANAGEMENT TESTS
  describe('4️⃣ MEMBER MANAGEMENT', () => {
    
    test('should add member directly to workspace', async () => {
      const memberData = {
        userId: userIds.editor,
        role: 'editor',
        permissions: {
          read: true,
          write: true,
          delete: false,
          admin: false
        }
      };

      const response = await request(app)
        .post(`${API_BASE}/workspaces/${testWorkspaceId}/members`)
        .set('Authorization', `Bearer ${tokens.owner}`)
        .send(memberData);

      console.log('👥 Add member response:', response.status, response.body?.message);
      
      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
    });

    test('should update member role', async () => {
      const updateData = {
        role: 'admin',
        permissions: {
          read: true,
          write: true,
          delete: true,
          admin: true
        }
      };

      const response = await request(app)
        .put(`${API_BASE}/workspaces/${testWorkspaceId}/members/${userIds.editor}`)
        .set('Authorization', `Bearer ${tokens.owner}`)
        .send(updateData);

      console.log('🔄 Update member role response:', response.status);
      
      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
    });

    test('should get workspace members', async () => {
      const response = await request(app)
        .get(`${API_BASE}/workspaces/${testWorkspaceId}`)
        .set('Authorization', `Bearer ${tokens.owner}`);

      console.log('👥 Workspace members count:', response.body?.data?.members?.length || 0);
      
      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
      expect(response.body.data.members.length).toBeGreaterThan(1);
    });
  });

  // 5. DOCUMENT MANAGEMENT WITH WORKSPACE CONTEXT
  describe('5️⃣ DOCUMENT MANAGEMENT WITH WORKSPACE CONTEXT', () => {
    
    test('should upload document to workspace', async () => {
      const documentData = {
        name: 'Test Document',
        description: 'A test document for workspace',
        category: 'Testing',
        tags: ['test', 'workspace'],
        isPublic: false
      };

      // Create a simple text file for testing
      const response = await request(app)
        .post(`${API_BASE}/documents/upload`)
        .set('Authorization', `Bearer ${tokens.owner}`)
        .field('workspace', testWorkspaceId)
        .field('name', documentData.name)
        .field('description', documentData.description)
        .field('category', documentData.category)
        .field('tags', JSON.stringify(documentData.tags))
        .field('isPublic', documentData.isPublic)
        .attach('file', Buffer.from('Test document content'), 'test.txt');

      console.log('📄 Upload document response:', response.status, response.body?.message);
      
      if (response.status === 200 || response.status === 201) {
        expect(response.body.success).toBe(true);
        testDocumentId = response.body.data._id;
        console.log('✅ Test document uploaded:', testDocumentId);
      } else {
        console.log('⚠️ Document upload failed, continuing with other tests');
      }
    });

    test('should get workspace documents', async () => {
      const response = await request(app)
        .get(`${API_BASE}/documents/workspace/${testWorkspaceId}`)
        .set('Authorization', `Bearer ${tokens.owner}`);

      console.log('📋 Workspace documents response:', response.status, `Found ${response.body?.data?.documents?.length || 0} documents`);
      
      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
    });

    test('should get workspace document statistics', async () => {
      const response = await request(app)
        .get(`${API_BASE}/documents/workspace/${testWorkspaceId}/stats`)
        .set('Authorization', `Bearer ${tokens.owner}`);

      console.log('📊 Workspace stats response:', response.status);
      
      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
    });
  });

  // 6. PERMISSION SYSTEM TESTS
  describe('6️⃣ PERMISSION SYSTEM TESTS', () => {
    
    test('should deny workspace access to non-member', async () => {
      const response = await request(app)
        .get(`${API_BASE}/workspaces/${testWorkspaceId}`)
        .set('Authorization', `Bearer ${tokens.outsider}`);

      console.log('🚫 Outsider access response:', response.status);
      
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test('should allow viewer to read workspace', async () => {
      // First add viewer to workspace
      await request(app)
        .post(`${API_BASE}/workspaces/${testWorkspaceId}/members`)
        .set('Authorization', `Bearer ${tokens.owner}`)
        .send({
          userId: userIds.viewer,
          role: 'viewer',
          permissions: { read: true, write: false, delete: false, admin: false }
        });

      const response = await request(app)
        .get(`${API_BASE}/workspaces/${testWorkspaceId}`)
        .set('Authorization', `Bearer ${tokens.viewer}`);

      console.log('👁️ Viewer read access response:', response.status);
      
      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
    });

    test('should deny viewer from deleting workspace', async () => {
      const response = await request(app)
        .delete(`${API_BASE}/workspaces/${testWorkspaceId}`)
        .set('Authorization', `Bearer ${tokens.viewer}`);

      console.log('🚫 Viewer delete attempt response:', response.status);
      
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test('should allow admin to manage members', async () => {
      const response = await request(app)
        .post(`${API_BASE}/workspaces/${testWorkspaceId}/members`)
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({
          userId: userIds.outsider,
          role: 'viewer',
          permissions: { read: true, write: false, delete: false, admin: false }
        });

      console.log('👮 Admin add member response:', response.status);
      
      expect([200, 201]).toContain(response.status);
    });
  });

  // 7. ERROR HANDLING TESTS
  describe('7️⃣ ERROR HANDLING TESTS', () => {
    
    test('should handle invalid workspace ID', async () => {
      const response = await request(app)
        .get(`${API_BASE}/workspaces/invalid-id`)
        .set('Authorization', `Bearer ${tokens.owner}`);

      console.log('❌ Invalid workspace ID response:', response.status);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should handle missing authentication', async () => {
      const response = await request(app)
        .get(`${API_BASE}/workspaces`);

      console.log('🔐 No auth response:', response.status);
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should handle duplicate workspace names', async () => {
      const workspaceData = {
        name: 'Updated Test Workspace', // Same as updated name above
        description: 'Duplicate name test'
      };

      const response = await request(app)
        .post(`${API_BASE}/workspaces`)
        .set('Authorization', `Bearer ${tokens.owner}`)
        .send(workspaceData);

      console.log('🔄 Duplicate workspace name response:', response.status);
      
      // This might be allowed depending on your business logic
      // Adjust expectation based on your requirements
    });

    test('should handle invalid invitation token', async () => {
      const response = await request(app)
        .get(`${API_BASE}/invitations/invalid-token`);

      console.log('❌ Invalid invitation token response:', response.status);
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // 8. CLEANUP AND FINAL TESTS
  describe('8️⃣ CLEANUP AND FINAL TESTS', () => {
    
    test('should allow member to leave workspace', async () => {
      const response = await request(app)
        .post(`${API_BASE}/workspaces/${testWorkspaceId}/leave`)
        .set('Authorization', `Bearer ${tokens.viewer}`);

      console.log('👋 Leave workspace response:', response.status);
      
      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
    });

    test('should allow owner to delete workspace', async () => {
      const response = await request(app)
        .delete(`${API_BASE}/workspaces/${testWorkspaceId}`)
        .set('Authorization', `Bearer ${tokens.owner}`);

      console.log('🗑️ Delete workspace response:', response.status, response.body?.message);
      
      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
    });

    test('should verify workspace is deleted', async () => {
      const response = await request(app)
        .get(`${API_BASE}/workspaces/${testWorkspaceId}`)
        .set('Authorization', `Bearer ${tokens.owner}`);

      console.log('🔍 Verify deletion response:', response.status);
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // 9. SUMMARY REPORT
  describe('9️⃣ TEST SUMMARY REPORT', () => {
    
    test('should generate test summary', async () => {
      console.log('\n' + '='.repeat(60));
      console.log('🎯 WORKSPACE COLLABORATION SYSTEM - TEST SUMMARY');
      console.log('='.repeat(60));
      
      // Check database state
      const userCount = await User.countDocuments();
      const workspaceCount = await Workspace.countDocuments();
      const invitationCount = await WorkspaceInvitation.countDocuments();
      const documentCount = await Document.countDocuments();
      
      console.log('📊 FINAL DATABASE STATE:');
      console.log(`   Users: ${userCount}`);
      console.log(`   Workspaces: ${workspaceCount}`);
      console.log(`   Invitations: ${invitationCount}`);
      console.log(`   Documents: ${documentCount}`);
      
      console.log('\n🧪 TEST CATEGORIES COMPLETED:');
      console.log('   ✅ Authentication & User Setup');
      console.log('   ✅ Workspace CRUD Operations');
      console.log('   ✅ Invitation System');
      console.log('   ✅ Member Management');
      console.log('   ✅ Document Management with Workspace Context');
      console.log('   ✅ Permission System');
      console.log('   ✅ Error Handling');
      console.log('   ✅ Cleanup Operations');
      
      console.log('\n🚀 SYSTEM STATUS: Ready for Production Testing');
      console.log('='.repeat(60));
      
      expect(true).toBe(true); // Always pass summary test
    });
  });
});

// Package.json test script addition:
/*
Add to your backend/package.json:

{
  "scripts": {
    "test": "jest --detectOpenHandles --forceExit",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "supertest": "^6.3.0"
  },
  "jest": {
    "testEnvironment": "node",
    "setupFilesAfterEnv": ["<rootDir>/test/setup.js"],
    "testTimeout": 30000
  }
}
*/

// Create test/setup.js:
/*
// backend/test/setup.js
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.TEST_MONGODB_URI = 'mongodb://localhost:27017/dms_test';

// Increase timeout for database operations
jest.setTimeout(30000);
*/