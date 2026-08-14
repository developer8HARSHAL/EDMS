/**
 * seedTestMembers.js
 *
 * Creates throwaway test users (via the real register API, so password
 * hashing/validation happens exactly like production) and adds them as
 * workspace members with varied roles, so EDMS features that need >1
 * member (sharing, reviewers, role-gating) can be tested without email.
 *
 * DOES NOT touch backend code, models, or business logic. The only direct
 * database write here is a targeted $push onto workspace.members[] and
 * (optionally) document.reviewers[] — no other fields are touched, using
 * the exact shapes documented in backend_briefing_for_frontend.md §2.
 *
 * Run manually: node scripts/seedTestMembers.js
 * Run this against a dev/local database only, not production.
 */

const { MongoClient, ObjectId } = require('mongodb');

// ===== CONFIG — fill these in before running =====
const MONGO_URI = `mongodb+srv://harshal:harshal2003@edms-cluster.ctqybsg.mongodb.net/?retryWrites=true&w=majority&appName=edms-cluster` || 'mongodb://localhost:27017/edms'; // match your .env
const API_BASE_URL = 'http://localhost:5000/api'; // your local backend, not Render prod
const WORKSPACE_ID = '6a7d799ec18dba3a0c149e13';
const DOCUMENT_ID_FOR_REVIEWERS = ''; // optional

const TEST_USERS = [
  { name: 'ravi', email: 'Harshalravi@gmail.com', password: 'Harshal2', role: 'editor' },
  { name: 'sara', email: 'Harshalsara@gmail.com', password: 'Harshal2', role: 'viewer' },
  { name: 'jorge', email: 'Harshaljorge@gmail.com', password: 'Harshal2', role: 'admin' },
];

// permissions shape per backend briefing §2 — matches role loosely, edit if you want gaps to test
const permissionsForRole = (role) => ({
  canView: true,
  canEdit: role === 'editor' || role === 'admin',
  canAdd: role === 'editor' || role === 'admin',
  canDelete: role === 'admin',
  canInvite: role === 'admin',
});

async function registerUser(user) {
  const res = await fetch(`${API_BASE_URL}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: user.name, email: user.email, password: user.password }),
  });
  const data = await res.json();
  if (!res.ok || !data.user?.id) {
    // Already-registered is fine for re-runs — just flag anything else
    console.warn(`⚠️  Register failed for ${user.email}: ${data.message || res.status}`);
    return null;
  }
  console.log(`✅ Registered ${user.email} -> ${data.user.id}`);
  return data.user.id;
}

async function run() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();

  try {
    const createdUserIds = [];

    for (const user of TEST_USERS) {
      const userId = await registerUser(user);
      if (userId) createdUserIds.push({ id: userId, role: user.role });
    }

    if (createdUserIds.length === 0) {
      console.log('No users created — nothing to add as members. Check API_BASE_URL is reachable.');
      return;
    }

    const newMembers = createdUserIds.map(({ id, role }) => ({
      user: new ObjectId(id),
      role,
      permissions: permissionsForRole(role),
    }));

    const workspaceResult = await db.collection('workspaces').updateOne(
      { _id: new ObjectId(WORKSPACE_ID) },
      { $push: { members: { $each: newMembers } } }
    );
    console.log(`✅ Workspace members updated: matched ${workspaceResult.matchedCount}, modified ${workspaceResult.modifiedCount}`);

    if (DOCUMENT_ID_FOR_REVIEWERS && DOCUMENT_ID_FOR_REVIEWERS !== 'PASTE_A_DOCUMENT_ID_HERE_OR_LEAVE_NULL') {
      const reviewerIds = createdUserIds.map(({ id }) => new ObjectId(id));
      const docResult = await db.collection('documents').updateOne(
        { _id: new ObjectId(DOCUMENT_ID_FOR_REVIEWERS) },
        { $addToSet: { reviewers: { $each: reviewerIds } } }
      );
      console.log(`✅ Document reviewers updated: matched ${docResult.matchedCount}, modified ${docResult.modifiedCount}`);
    }

    console.log('\nDone. Test account passwords are all "TestPass123!" unless you changed TEST_USERS above.');
  } finally {
    await client.close();
  }
}

run().catch((err) => {
  console.error('❌ Seed script failed:', err);
  process.exit(1);
});
