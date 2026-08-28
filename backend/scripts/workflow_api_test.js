/**
 * EDMS — Workflow API Test Script
 * Covers design_plan.md Phase 5 (workflow assignment) and Phase 6 (status transitions).
 * Zero dependencies — uses Node 18+ built-in fetch. Run: node workflow_api_test.js
 *
 * READ BEFORE RUNNING — two unconfirmed things you need to resolve first:
 *
 * 1. GRANTING canManageWorkflow TO A NON-OWNER (the "workflow manager" test case).
 *    Traced workspaceService.js's validateMemberData(): it only forwards `role`,
 *    `userId`, `email` to the API — any `permissions` object is silently dropped
 *    before the request is even sent. There is no confirmed client-side or
 *    documented path to grant canManageWorkflow to an admin. The WORKFLOW_MANAGER
 *    test cases below are stubbed with a TODO — either point GRANT_WORKFLOW_MANAGER_URL
 *    at whatever real endpoint does this (if one exists server-side), or skip those
 *    cases until it does.
 *
 * 2. EXACT REQUEST/RESPONSE SHAPES for PATCH /:id/workflow and PATCH /:id/status.
 *    design_plan.md documents the intended body ({reviewerId, approverId} and
 *    {status, comment}) but not response envelopes or exact error codes/messages.
 *    Assertions below check status codes only, not response body shape — tighten
 *    them once you've seen real responses.
 */

const BASE_URL = 'http://localhost:5000/api';

// Fill these in — either pre-existing seeded accounts, or this script will
// register fresh ones if REGISTER_TEST_USERS is true.
const REGISTER_TEST_USERS = true;
const RUN_ID = Date.now();

const TEST_USERS = {
  owner: {
    name: 'Test Owner',
    email: `workflow-owner-${RUN_ID}@test.com`,
    password: 'Harshal2'
  },
  admin: {
    name: 'Test Admin',
    email: `workflow-admin-${RUN_ID}@test.com`,
    password: 'TestPass123!'
  },
  editor: {
    name: 'Test Editor',
    email: `workflow-editor-${RUN_ID}@test.com`,
    password: 'TestPass123!'
  },
  viewer: {
    name: 'Test Viewer',
    email: `workflow-viewer-${RUN_ID}@test.com`,
    password: 'TestPass123!'
  },
  reviewer: {
    name: 'Test Reviewer',
    email: `workflow-reviewer-${RUN_ID}@test.com`,
    password: 'TestPass123!'
  },
  approver: {
    name: 'Test Approver',
    email: `workflow-approver-${RUN_ID}@test.com`,
    password: 'TestPass123!'
  },
  uploader: {
    name: 'Test Uploader',
    email: `workflow-uploader-${RUN_ID}@test.com`,
    password: 'TestPass123!'
  },
  workflowManager: {
    name: 'Test WF Manager',
    email: `workflow-manager-${RUN_ID}@test.com`,
    password: 'Harshal2'
  }
};

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

async function request(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty/non-JSON body */ }
  return { status: res.status, data };
}

async function registerOrLogin(user) {
  if (REGISTER_TEST_USERS) {
    const reg = await request('POST', '/users/register', {
      body: user,
    });

    console.log(
      `  Register ${user.email}: ${reg.status}`,
      JSON.stringify(reg.data)
    );

    if (reg.status === 201 || reg.status === 200) {
      return reg.data;
    }

    throw new Error(
      `Registration failed for ${user.email}: ${JSON.stringify(reg.data)}`
    );
  }

  const login = await request('POST', '/users/login', {
    body: {
      email: user.email,
      password: user.password,
    },
  });

  if (!login.data?.token) {
    throw new Error(
      `Login failed for ${user.email}: ${JSON.stringify(login.data)}`
    );
  }

  return login.data;
}

// ---------------------------------------------------------------------------
// Assertion + reporting
// ---------------------------------------------------------------------------

const results = [];

function record(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? '✅ PASS' : '❌ FAIL'} — ${name}${detail ? ` (${detail})` : ''}`);
}

function expectStatus(name, res, expectedStatuses) {
  const expected = Array.isArray(expectedStatuses) ? expectedStatuses : [expectedStatuses];
  const pass = expected.includes(res.status);
  record(name, pass, `got ${res.status}, expected ${expected.join(' or ')}`);
  if (!pass) {
    console.log(`    -> ${JSON.stringify(res.data)}`);
  }
}

function printSummary() {
  const passed = results.filter((r) => r.pass).length;
  console.log('\n' + '='.repeat(60));
  console.log(`RESULTS: ${passed}/${results.length} passed`);
  const failed = results.filter((r) => !r.pass);
  if (failed.length) {
    console.log('\nFailed cases:');
    failed.forEach((f) => console.log(`  - ${f.name} (${f.detail})`));
  }
  console.log('='.repeat(60));
}

// ---------------------------------------------------------------------------
// Setup — users, workspace, membership, document
// ---------------------------------------------------------------------------

async function setup() {
  console.log('--- Setting up test users ---');
  const auth = {};
  for (const [key, user] of Object.entries(TEST_USERS)) {
    const result = await registerOrLogin(user);
    auth[key] = { token: result.token, id: result.user?.id };
    console.log(`  ${key}: ${user.email} -> id ${auth[key].id}`);
  }

  console.log('\n--- Creating workspace as owner ---');
  const wsRes = await request('POST', '/workspaces', {
    token: auth.owner.token,
    body: { name: `Workflow Test WS ${Date.now()}`, description: 'API test workspace' },
  });
  const workspaceId = wsRes.data?.data?._id || wsRes.data?._id;
  if (!workspaceId) throw new Error(`Workspace creation failed: ${JSON.stringify(wsRes.data)}`);
  console.log(`  workspace: ${workspaceId}`);

  console.log('\n--- Adding members via invitation flow (direct add is disabled) ---');
  const roleAssignments = [
    ['admin', 'admin'],
    ['editor', 'editor'],
    ['viewer', 'viewer'],
    ['reviewer', 'editor'],   // reviewer just needs workspace membership, editor is a safe default
    ['approver', 'editor'],
    ['uploader', 'editor'],
  ];
  for (const [key, role] of roleAssignments) {
    const sendRes = await request('POST', '/invitations/send', {
      token: auth.owner.token,
      body: { workspaceId, inviteeEmail: TEST_USERS[key].email, role },
    });
    // Exact response shape unconfirmed — try the common wrapper patterns and
    // fall back to logging the raw body if none match, rather than guessing further.
    const invitationToken =
      sendRes.data?.data?.token || sendRes.data?.invitation?.token || sendRes.data?.token;
    if (!invitationToken) {
      console.log(`  send invite to ${key}: status ${sendRes.status} -> NO TOKEN FOUND: ${JSON.stringify(sendRes.data)}`);
      continue;
    }
    const acceptRes = await request('POST', `/invitations/${invitationToken}/accept`, {
      token: auth[key].token,
    });
    console.log(`  ${key} invited (${sendRes.status}) + accepted (${acceptRes.status}) as ${role}`);
    if (acceptRes.status >= 400) {
      console.log(`    -> ${JSON.stringify(acceptRes.data)}`);
    }
  }

  // TODO (see header note #1) — no confirmed way to grant canManageWorkflow yet.
  // Also note: direct member-add is disabled (see invitation flow above), so
  // whatever grants this permission is probably a role-update call after
  // acceptance, not part of the invite payload — unconfirmed either way.
  // const grantRes = await request('PUT', `/workspaces/${workspaceId}/members/<memberId>`, {
  //   token: auth.owner.token,
  //   body: { role: 'admin', permissions: { canManageWorkflow: true } },
  // });

  console.log('\n--- Uploading test document as uploader ---');
  const form = new FormData();
  form.append('workspaceId', workspaceId);
  form.append('name', 'workflow-test-doc.txt');
  form.append('file', new Blob(['test content']), 'workflow-test-doc.txt');
  const docRes = await fetch(`${BASE_URL}/documents`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${auth.uploader.token}` },
    body: form,
  });
  const docData = await docRes.json();
  const documentId = docData?.data?._id || docData?._id;
  if (!documentId) throw new Error(`Document upload failed: ${JSON.stringify(docData)}`);
  console.log(`  document: ${documentId}`);

  return { auth, workspaceId, documentId };
}

// ---------------------------------------------------------------------------
// Phase 5 — Workflow assignment (PATCH /:id/workflow)
// ---------------------------------------------------------------------------

async function testWorkflowAssignment({ auth, documentId }) {
  console.log('\n=== PHASE 5 — Workflow assignment ===\n');

  const assign = (token, reviewerId, approverId) =>
    request('PATCH', `/documents/${documentId}/workflow`, {
      token,
      body: { reviewerId, approverId },
    });

  let res;

  res = await assign(auth.owner.token, auth.reviewer.id, auth.approver.id);
  expectStatus('Owner can assign workflow', res, 200);

  res = await assign(auth.admin.token, auth.reviewer.id, auth.approver.id);
  expectStatus('Normal admin (no canManageWorkflow) cannot assign', res, 403);

  res = await assign(auth.editor.token, auth.reviewer.id, auth.approver.id);
  expectStatus('Editor cannot assign', res, 403);

  res = await assign(auth.viewer.token, auth.reviewer.id, auth.approver.id);
  expectStatus('Viewer cannot assign', res, 403);

  res = await assign(auth.owner.token, 'not-a-valid-id', auth.approver.id);
  expectStatus('Invalid reviewer ID rejected', res, 400);

  res = await assign(auth.owner.token, auth.reviewer.id, 'not-a-valid-id');
  expectStatus('Invalid approver ID rejected', res, 400);

  res = await assign(auth.owner.token, auth.uploader.id, auth.approver.id);
  expectStatus('Uploader as reviewer rejected', res, 400);

  res = await assign(auth.owner.token, auth.reviewer.id, auth.reviewer.id);
  expectStatus('Reviewer === approver rejected', res, 400);

  console.log('  [SKIPPED] Workflow manager (non-owner, canManageWorkflow) can assign — see header note #1');

  // Leave a valid assignment in place for the status-transition tests below.
  await assign(auth.owner.token, auth.reviewer.id, auth.approver.id);
}

// ---------------------------------------------------------------------------
// Phase 6 — Status transitions (PATCH /:id/status)
// ---------------------------------------------------------------------------

async function testStatusTransitions({ auth, documentId }) {
  console.log('\n=== PHASE 6 — Status transitions ===\n');

  const setStatus = (token, status, comment) =>
    request('PATCH', `/documents/${documentId}/status`, {
      token,
      body: comment ? { status, comment } : { status },
    });

  let res;

  res = await setStatus(auth.editor.token, 'in-review');
  expectStatus('draft -> in-review by canEdit user', res, 200);

  res = await setStatus(auth.admin.token, 'final-review');
  expectStatus('in-review -> final-review by non-reviewer rejected', res, 403);

  res = await setStatus(auth.reviewer.token, 'draft', 'sending back for changes');
  expectStatus('in-review -> draft by assigned reviewer (with comment)', res, 200);

  await setStatus(auth.editor.token, 'in-review'); // resubmit for next case

  res = await setStatus(auth.reviewer.token, 'final-review');
  expectStatus('in-review -> final-review by assigned reviewer', res, 200);

  res = await setStatus(auth.reviewer.token, 'approved');
  expectStatus('Reviewer cannot approve (approver-only action)', res, 403);

  res = await setStatus(auth.approver.token, 'in-review', 'needs more work');
  expectStatus('final-review -> in-review by assigned approver (with comment)', res, 200);

  await setStatus(auth.reviewer.token, 'final-review'); // back to final-review for approval test

  res = await setStatus(auth.approver.token, 'approved');
  expectStatus('final-review -> approved by assigned approver', res, 200);

  res = await setStatus(auth.admin.token, 'in-review');
  expectStatus('approved -> in-review by non-owner admin rejected', res, 403);

  res = await setStatus(auth.owner.token, 'in-review', 'contract terms changed');
  expectStatus('Owner can reopen approved doc (with mandatory comment)', res, 200);

  res = await setStatus(auth.reviewer.token, 'final-review');
  await setStatus(auth.approver.token, 'approved');
  res = await setStatus(auth.owner.token, 'in-review'); // no comment this time
  expectStatus('Owner reopen without comment rejected (comment mandatory)', res, 400);

  res = await setStatus(auth.editor.token, 'approved');
  expectStatus('Invalid direct transition (skips intermediate states) rejected', res, 400);

  console.log('  [MANUAL CHECK NEEDED] Missing workflow assignment prevents submission —');
  console.log('  run this against a document with no workflow.reviewer/approver assigned yet.');
}

// ---------------------------------------------------------------------------

(async () => {
  try {
    const ctx = await setup();
    await testWorkflowAssignment(ctx);
    await testStatusTransitions(ctx);
  } catch (err) {
    console.error('\n💥 Setup or fatal error:', err.message);
  } finally {
    printSummary();
  }
})();