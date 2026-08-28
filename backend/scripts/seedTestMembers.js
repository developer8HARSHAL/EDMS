/**
 * seedTestMembers_direct.js
 *
 * Creates a fresh test workspace and test users, then directly adds those users
 * to workspace.members[] with the required roles/permissions.
 *
 * IMPORTANT:
 * - No invitation flow is used.
 * - Uses the real register API for users.
 * - Creates the workspace through the real POST /api/workspaces endpoint.
 * - Direct MongoDB write is used only for workspace member assignment.
 * - Development/local database only. Do NOT run against production.
 *
 * Run:
 *   node scripts/seedTestMembers_direct.js
 *
 * Required:
 *   MONGODB_URI
 *
 * Optional:
 *   API_BASE_URL=http://localhost:5000/api
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = `mongodb+srv://harshalpinge2_db_user:Harshal@082003@edms-cluster.ctqybsg.mongodb.net/?appName=edms-cluster`;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

if (!MONGO_URI) {
  throw new Error('MONGODB_URI environment variable is required.');
}

const RUN_ID = Date.now();

const TEST_USERS = {
  admin: {
    name: 'Test Admin',
    email: `workflow-admin-${RUN_ID}@test.com`,
    password: 'TestPass123!',
    role: 'admin',
  },
  editor: {
    name: 'Test Editor',
    email: `workflow-editor-${RUN_ID}@test.com`,
    password: 'TestPass123!',
    role: 'editor',
  },
  viewer: {
    name: 'Test Viewer',
    email: `workflow-viewer-${RUN_ID}@test.com`,
    password: 'TestPass123!',
    role: 'viewer',
  },
  reviewer: {
    name: 'Test Reviewer',
    email: `workflow-reviewer-${RUN_ID}@test.com`,
    password: 'TestPass123!',
    role: 'editor',
  },
  approver: {
    name: 'Test Approver',
    email: `workflow-approver-${RUN_ID}@test.com`,
    password: 'TestPass123!',
    role: 'editor',
  },
  uploader: {
    name: 'Test Uploader',
    email: `workflow-uploader-${RUN_ID}@test.com`,
    password: 'TestPass123!',
    role: 'editor',
  },
  workflowManager: {
    name: 'Test Workflow Manager',
    email: `workflow-manager-${RUN_ID}@test.com`,
    password: 'TestPass123!',
    role: 'admin',
  },
};

function permissionsForRole(role, isWorkflowManager = false) {
  const permissions = {
    canView: true,
    canEdit: false,
    canAdd: false,
    canDelete: false,
    canInvite: false,
    canManageWorkflow: false,
  };

  if (role === 'admin' || role === 'editor') {
    permissions.canEdit = true;
    permissions.canAdd = true;
  }

  if (role === 'admin') {
    permissions.canDelete = true;
    permissions.canInvite = true;
  }

  // Explicit grant. Admin does NOT get this automatically.
  if (isWorkflowManager) {
    permissions.canManageWorkflow = true;
  }

  return permissions;
}

async function request(method, path, { token, body } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => null);
  return { status: response.status, data };
}

async function registerUser(user) {
  const result = await request('POST', '/users/register', {
    body: {
      name: user.name,
      email: user.email,
      password: user.password,
    },
  });

  if (result.status !== 200 && result.status !== 201) {
    throw new Error(
      `Registration failed for ${user.email}: ${JSON.stringify(result.data)}`
    );
  }

  const id = result.data?.user?.id;
  const token = result.data?.token;

  if (!id || !token) {
    throw new Error(
      `Registration response missing user id/token for ${user.email}: ${JSON.stringify(result.data)}`
    );
  }

  console.log(`✅ Registered ${user.email} -> ${id}`);
  return { id, token };
}

async function createWorkspace(ownerToken) {
  const workspaceName = `Workflow Test Workspace ${RUN_ID}`;

  const result = await request('POST', '/workspaces', {
    token: ownerToken,
    body: {
      name: workspaceName,
      description: 'Temporary workspace for EDMS workflow/API testing',
    },
  });

  if (result.status !== 200 && result.status !== 201) {
    throw new Error(
      `Workspace creation failed: ${JSON.stringify(result.data)}`
    );
  }

  const workspaceId =
    result.data?.data?._id ||
    result.data?.data?.id ||
    result.data?._id ||
    result.data?.id;

  if (!workspaceId || !ObjectId.isValid(workspaceId)) {
    throw new Error(
      `Workspace ID missing from create response: ${JSON.stringify(result.data)}`
    );
  }

  console.log(`✅ Workspace created: ${workspaceName}`);
  console.log(`   workspaceId: ${workspaceId}`);

  return workspaceId;
}

async function run() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();

  try {
    const db = client.db();

    console.log('--- Creating test users ---');

    const users = {};
    const owner = {
      name: 'Test Owner',
      email: `workflow-owner-${RUN_ID}@test.com`,
      password: 'TestPass123!',
    };

    const ownerAuth = await registerUser(owner);
    users.owner = { ...owner, ...ownerAuth };

    for (const [key, user] of Object.entries(TEST_USERS)) {
      const auth = await registerUser(user);
      users[key] = { ...user, ...auth };
    }

    console.log('\n--- Creating workspace ---');
    const workspaceIdString = await createWorkspace(users.owner.token);
    const workspaceId = new ObjectId(workspaceIdString);

    const workspace = await db.collection('workspaces').findOne({
      _id: workspaceId,
    });

    if (!workspace) {
      throw new Error(`Workspace not found after creation: ${workspaceIdString}`);
    }

    console.log(`\nWorkspace owner: ${users.owner.email}`);

    console.log('\n--- Directly assigning members + roles ---');

    const memberDefinitions = [
      ['admin', 'admin', false],
      ['editor', 'editor', false],
      ['viewer', 'viewer', false],
      ['reviewer', 'editor', false],
      ['approver', 'editor', false],
      ['uploader', 'editor', false],
      ['workflowManager', 'admin', true],
    ];

    const members = memberDefinitions.map(([key, role, isWorkflowManager]) => ({
      user: new ObjectId(users[key].id),
      role,
      permissions: permissionsForRole(role, isWorkflowManager),
      joinedAt: new Date(),
    }));

    await db.collection('workspaces').updateOne(
      { _id: workspaceId },
      { $push: { members: { $each: members } } }
    );

    for (const [key, role, isWorkflowManager] of memberDefinitions) {
      console.log(
        `✅ ${key}: role=${role}, canManageWorkflow=${isWorkflowManager}`
      );
    }

    const finalWorkspace = await db.collection('workspaces').findOne(
      { _id: workspaceId },
      { projection: { name: 1, owner: 1, members: 1 } }
    );

    console.log('\n============================================================');
    console.log('TEST WORKSPACE READY');
    console.log('============================================================');
    console.log(`Workspace ID: ${workspaceIdString}`);
    console.log(`Workspace:    ${finalWorkspace.name}`);
    console.log(`Owner ID:     ${users.owner.id}`);
    console.log('');
    console.log('Members:');

    for (const [key, user] of Object.entries(users)) {
      if (key === 'owner') {
        console.log(`  owner           ${user.email}`);
        continue;
      }

      const member = finalWorkspace.members.find(
        (item) => item.user.toString() === user.id
      );

      console.log(
        `  ${key.padEnd(15)} ${user.email} | role=${member?.role} | canManageWorkflow=${member?.permissions?.canManageWorkflow}`
      );
    }

    console.log('\nUse this workspace directly for manual workflow/API testing.');
    console.log('No invitations were created or sent.');
  } finally {
    await client.close();
  }
}

run().catch((error) => {
  console.error('❌ Seed script failed:', error.message);
  process.exit(1);
});