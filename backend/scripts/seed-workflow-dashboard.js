require('dotenv').config();

const mongoose = require('mongoose');

const User = require('../models/userModel');
const Workspace = require('../models/workspaceModel');
const Document = require('../models/documentModel');

const WORKSPACE_PREFIX = 'Workflow Test Workspace ';

const USER_PREFIXES = {
  owner: 'workflow-owner-',
  admin: 'workflow-admin-',
  editor: 'workflow-editor-',
  viewer: 'workflow-viewer-',
  reviewer: 'workflow-reviewer-',
  approver: 'workflow-approver-',
  uploader: 'workflow-uploader-',
  workflowManager: 'workflow-manager-',
};

const DAY = 24 * 60 * 60 * 1000;

const daysFromNow = (days) =>
  new Date(Date.now() + days * DAY);

/*
|--------------------------------------------------------------------------
| DASHBOARD TEST DATA
|--------------------------------------------------------------------------
|
| Total: 37
|
| Draft        : 9
| In Review    : 10
| Final Review : 5
| Approved     : 13
|
*/

const DOCUMENTS = [
  // ------------------------------------------------------------------------
  // DRAFT - 9
  // ------------------------------------------------------------------------

  {
    name: 'onboarding-guide.pdf',
    status: 'draft',
  },

  {
    name: 'q3-budget-notes.txt',
    status: 'draft',
  },

  {
    name: 'vendor-shortlist.csv',
    status: 'draft',
  },

  {
    name: 'nda-draft.pdf',
    status: 'draft',
  },

  {
    name: 'office-relocation-plan.pdf',
    status: 'draft',
  },

  {
    name: 'brand-guidelines-v2.pdf',
    status: 'draft',
  },

  {
    name: 'contract-draft.pdf',
    status: 'draft',
  },

  {
    name: 'sales-report.csv',
    status: 'draft',
  },

  {
    name:
      'enterprise-client-information-security-policy-draft-v4.pdf',
    status: 'draft',
  },

  // ------------------------------------------------------------------------
  // IN REVIEW - 10
  // Current holder = reviewer
  // ------------------------------------------------------------------------

  {
    name: 'employment-agreement.pdf',
    status: 'in-review',
    reviewer: 'reviewer',
    approver: 'approver',
    dueDate: daysFromNow(-2),
  },

  {
    name: 'vendor-agreement.pdf',
    status: 'in-review',
    reviewer: 'reviewer',
    approver: 'approver',
    dueDate: daysFromNow(-1),
  },

  {
    name: 'privacy-policy.pdf',
    status: 'in-review',
    reviewer: 'reviewer',
    approver: 'approver',
    dueDate: daysFromNow(1),
  },

  {
    name: 'security-review.pdf',
    status: 'in-review',
    reviewer: 'reviewer',
    approver: null,
    dueDate: daysFromNow(2),
  },

  {
    name: 'access-control-policy.pdf',
    status: 'in-review',
    reviewer: 'reviewer',
    approver: null,
    dueDate: daysFromNow(6),
  },

  {
    name: 'incident-response-plan.pdf',
    status: 'in-review',
    reviewer: 'reviewer',
    approver: 'approver',
  },

  {
    name: 'client-proposal.pdf',
    status: 'in-review',
    reviewer: 'reviewer',
    approver: 'approver',
    dueDate: daysFromNow(4),
  },

  {
    name: 'project-scope.pdf',
    status: 'in-review',
    reviewer: 'reviewer',
    approver: null,
    dueDate: daysFromNow(8),
  },

  {
    name: 'risk-assessment.pdf',
    status: 'in-review',
    reviewer: 'reviewer',
    approver: 'approver',
  },

  {
    name: 'data-retention-policy.pdf',
    status: 'in-review',
    reviewer: 'reviewer',
    approver: 'approver',
    dueDate: daysFromNow(12),
  },

  // ------------------------------------------------------------------------
  // FINAL REVIEW - 5
  // Current holder = approver
  // ------------------------------------------------------------------------

  {
    name: 'compliance-review.pdf',
    status: 'final-review',
    reviewer: 'reviewer',
    approver: 'approver',
    dueDate: daysFromNow(-3),
  },

  {
    name: 'terms-of-service.pdf',
    status: 'final-review',
    reviewer: 'reviewer',
    approver: 'approver',
    dueDate: daysFromNow(1),
  },

  {
    name: 'data-processing-agreement.pdf',
    status: 'final-review',
    reviewer: 'reviewer',
    approver: 'approver',
    dueDate: daysFromNow(9),
  },

  {
    name: 'device-policy.pdf',
    status: 'final-review',
    reviewer: 'reviewer',
    approver: 'approver',
  },

  {
    name:
      'enterprise-information-security-and-data-protection-policy-final-review-v3.pdf',
    status: 'final-review',
    reviewer: 'reviewer',
    approver: 'approver',
    dueDate: daysFromNow(5),
  },

  // ------------------------------------------------------------------------
  // APPROVED - 13
  // ------------------------------------------------------------------------

  {
    name: 'remote-work-policy.pdf',
    status: 'approved',
    reviewer: 'reviewer',
    approver: 'approver',
    approvedDaysAgo: 1,
  },

  {
    name: '2025-annual-report.pdf',
    status: 'approved',
    reviewer: 'reviewer',
    approver: 'approver',
    approvedDaysAgo: 3,
  },

  {
    name: '2025-compliance-report.pdf',
    status: 'approved',
    reviewer: 'reviewer',
    approver: 'approver',
    approvedDaysAgo: 5,
  },

  {
    name: '2025-security-policy.pdf',
    status: 'approved',
    reviewer: 'reviewer',
    approver: 'approver',
    approvedDaysAgo: 7,
  },

  {
    name: 'employee-handbook.pdf',
    status: 'approved',
    reviewer: 'reviewer',
    approver: 'approver',
    approvedDaysAgo: 9,
  },

  {
    name: 'access-policy.pdf',
    status: 'approved',
    reviewer: 'reviewer',
    approver: 'approver',
    approvedDaysAgo: 11,
  },

  {
    name: 'business-continuity-plan.pdf',
    status: 'approved',
    reviewer: 'reviewer',
    approver: 'approver',
    approvedDaysAgo: 13,
  },

  {
    name: 'backup-policy.pdf',
    status: 'approved',
    reviewer: 'reviewer',
    approver: 'approver',
    approvedDaysAgo: 15,
  },

  {
    name: 'internal-controls.pdf',
    status: 'approved',
    reviewer: 'reviewer',
    approver: 'approver',
    approvedDaysAgo: 17,
  },

  {
    name: 'client-contract-final.pdf',
    status: 'approved',
    reviewer: 'reviewer',
    approver: 'approver',
    approvedDaysAgo: 19,
  },

  {
    name: 'project-closure.pdf',
    status: 'approved',
    reviewer: 'reviewer',
    approver: 'approver',
    approvedDaysAgo: 21,
  },

  {
    name: 'vendor-policy.pdf',
    status: 'approved',
    reviewer: 'reviewer',
    approver: 'approver',
    approvedDaysAgo: 23,
  },

  {
    name: 'information-governance-policy.pdf',
    status: 'approved',
    reviewer: 'reviewer',
    approver: 'approver',
    approvedDaysAgo: 25,
  },
];

/*
|--------------------------------------------------------------------------
| VALIDATE DATASET
|--------------------------------------------------------------------------
*/

function validateDocumentDataset() {
  const expectedCounts = {
    draft: 9,
    'in-review': 10,
    'final-review': 5,
    approved: 13,
  };

  const actualCounts = DOCUMENTS.reduce(
    (result, document) => {
      result[document.status] =
        (result[document.status] || 0) + 1;

      return result;
    },
    {}
  );

  if (DOCUMENTS.length !== 37) {
    throw new Error(
      `Expected 37 documents, but found ${DOCUMENTS.length}.`
    );
  }

  for (const [status, expected] of Object.entries(
    expectedCounts
  )) {
    const actual = actualCounts[status] || 0;

    if (actual !== expected) {
      throw new Error(
        `Expected ${expected} ${status} documents, found ${actual}.`
      );
    }
  }
}

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function escapeRegex(value) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );
}

/*
|--------------------------------------------------------------------------
| FIND EXISTING USERS
|--------------------------------------------------------------------------
*/

async function findLatestUser(prefix) {
  const regex = new RegExp(
    `^${escapeRegex(prefix)}.*@test\\.com$`,
    'i'
  );

  const user = await User.findOne({
    email: regex,
  }).sort({
    _id: -1,
  });

  if (!user) {
    throw new Error(
      `Could not find existing test user with prefix: ${prefix}`
    );
  }

  return user;
}

async function getExistingTestUsers() {
  const users = {};

  for (const [key, prefix] of Object.entries(
    USER_PREFIXES
  )) {
    users[key] =
      await findLatestUser(prefix);
  }

  return users;
}

/*
|--------------------------------------------------------------------------
| FIND EXISTING WORKSPACE
|--------------------------------------------------------------------------
*/

async function getExistingTestWorkspace(ownerId) {
  const regex = new RegExp(
    `^${escapeRegex(WORKSPACE_PREFIX)}`,
    'i'
  );

  const workspace =
    await Workspace.findOne({
      owner: ownerId,
      name: regex,
    }).sort({
      _id: -1,
    });

  if (!workspace) {
    throw new Error(
      'Existing Workflow Test Workspace was not found. ' +
        'Run seedtestmembers.js first.'
    );
  }

  return workspace;
}

/*
|--------------------------------------------------------------------------
| VERIFY MEMBERS
|--------------------------------------------------------------------------
*/

function verifyWorkspaceMembers(
  workspace,
  users
) {
  const missing = [];

  for (const [key, user] of Object.entries(
    users
  )) {
    const member =
      workspace.members?.find(
        (item) =>
          item.user &&
          item.user.toString() ===
            user._id.toString()
      );

    if (!member) {
      missing.push(
        `${key} (${user.email})`
      );
    }
  }

  if (missing.length) {
    throw new Error(
      `These users are not members of "${workspace.name}":\n` +
        missing.join('\n')
    );
  }
}

/*
|--------------------------------------------------------------------------
| GRIDFS
|--------------------------------------------------------------------------
*/

let gfsBucket = null;

function getGridFS() {
  if (!gfsBucket) {
    gfsBucket =
      new mongoose.mongo.GridFSBucket(
        mongoose.connection.db,
        {
          bucketName: 'uploads',
        }
      );
  }

  return gfsBucket;
}

function getContentType(name) {
  const extension = name
    .split('.')
    .pop()
    .toLowerCase();

  if (extension === 'csv') {
    return 'text/csv';
  }

  if (extension === 'txt') {
    return 'text/plain';
  }

  return 'application/pdf';
}

async function writeDummyFile(
  name,
  ownerId
) {
  const contentType =
    getContentType(name);

  const content = Buffer.from(
    [
      `Dashboard UI test document: ${name}`,
      `Generated by seed-workflow-dashboard.js.`,
      `Owner: ${ownerId}`,
    ].join('\n'),
    'utf8'
  );

  const fileId =
    new mongoose.Types.ObjectId();

  const uploadStream =
    getGridFS().openUploadStreamWithId(
      fileId,
      name,
      {
        contentType,
        metadata: {
          originalName: name,
          ownerId: ownerId.toString(),
          seeded: true,
          seedType: 'workflow-dashboard',
        },
      }
    );

  await new Promise(
    (resolve, reject) => {
      uploadStream.on(
        'finish',
        resolve
      );

      uploadStream.on(
        'error',
        reject
      );

      uploadStream.end(content);
    }
  );

  return {
    fileId,
    size: content.length,
    contentType,
  };
}

/*
|--------------------------------------------------------------------------
| DELETE EXISTING TEST DOCUMENTS
|--------------------------------------------------------------------------
*/

async function clearExistingDocuments(
  workspaceId
) {
  const existing =
    await Document.find({
      workspace: workspaceId,
    });

  console.log(
    `Existing documents: ${existing.length}`
  );

  if (!existing.length) {
    return;
  }

  const bucket = getGridFS();

  for (const document of existing) {
    if (document.path) {
      try {
        await bucket.delete(
          new mongoose.Types.ObjectId(
            document.path.toString()
          )
        );
      } catch (error) {
        console.warn(
          `Could not remove GridFS file for ${document.name}: ${error.message}`
        );
      }
    }

    await Document.deleteOne({
      _id: document._id,
    });
  }

  console.log(
    `Removed ${existing.length} existing document(s).`
  );
}

/*
|--------------------------------------------------------------------------
| CREATE DOCUMENT
|--------------------------------------------------------------------------
*/

async function createDocument(
  definition,
  users,
  workspace
) {
  const file =
    await writeDummyFile(
      definition.name,
      users.uploader._id
    );

  const document = {
    name: definition.name,

    originalName: definition.name,

    path: file.fileId.toString(),

    size: file.size,

    type: file.contentType,

    owner: users.uploader._id,

    uploadedBy: users.uploader._id,

    workspace: workspace._id,

    status: definition.status,

    workflow: {
      reviewer: definition.reviewer
        ? users[
            definition.reviewer
          ]._id
        : null,

      approver: definition.approver
        ? users[
            definition.approver
          ]._id
        : null,
    },

    permissions: [],
  };

  if (definition.dueDate) {
    document.dueDate =
      definition.dueDate;
  }

  if (
    definition.status === 'approved'
  ) {
    document.approvedAt =
      daysFromNow(
        -(definition.approvedDaysAgo || 1)
      );

    document.approvedBy =
      definition.approver
        ? users[
            definition.approver
          ]._id
        : users.workflowManager._id;
  }

  return Document.create(
    document
  );
}

/*
|--------------------------------------------------------------------------
| SUMMARY
|--------------------------------------------------------------------------
*/

function printSummary(
  documents,
  users,
  workspace
) {
  const counts = {
    draft: 0,
    'in-review': 0,
    'final-review': 0,
    approved: 0,
  };

  let reviewerWorkload = 0;
  let approverWorkload = 0;

  let overdue = 0;

  const now = Date.now();

  for (const document of documents) {
    counts[document.status]++;

    if (
      document.status ===
        'in-review' &&
      document.workflow?.reviewer
    ) {
      reviewerWorkload++;
    }

    if (
      document.status ===
        'final-review' &&
      document.workflow?.approver
    ) {
      approverWorkload++;
    }

    if (
      document.dueDate &&
      new Date(
        document.dueDate
      ).getTime() < now
    ) {
      overdue++;
    }
  }

  console.log('');
  console.log(
    '============================================================'
  );
  console.log(
    'WORKFLOW DASHBOARD TEST DATA READY'
  );
  console.log(
    '============================================================'
  );

  console.log(
    `Workspace: ${workspace.name}`
  );

  console.log(
    `Workspace ID: ${workspace._id}`
  );

  console.log('');
  console.log('Members: 8');

  for (const [key, user] of Object.entries(
    users
  )) {
    console.log(
      `  ${key.padEnd(16)} ${user.name || 'Unnamed'} | ${user.email}`
    );
  }

  console.log('');
  console.log('Pipeline:');

  console.log(
    `  Draft:        ${counts.draft}`
  );

  console.log(
    `  In Review:    ${counts['in-review']}`
  );

  console.log(
    `  Final Review: ${counts['final-review']}`
  );

  console.log(
    `  Approved:     ${counts.approved}`
  );

  console.log(
    `  Total:        ${documents.length}`
  );

  console.log('');
  console.log('Current workflow workload:');

  console.log(
    `  Reviewer (${users.reviewer.name}): ${reviewerWorkload}`
  );

  console.log(
    `  Approver (${users.approver.name}): ${approverWorkload}`
  );

  console.log('');
  console.log(
    `Overdue documents: ${overdue}`
  );

  console.log(
    '============================================================'
  );
}

/*
|--------------------------------------------------------------------------
| MAIN SEED
|--------------------------------------------------------------------------
*/

async function seed() {
  validateDocumentDataset();

  const dbUri =
    process.env.MONGO_URI ||
    process.env.DB_URI ||
    process.env.MONGODB_URI;

  if (!dbUri) {
    throw new Error(
      'Missing MongoDB environment variable. ' +
        'Expected MONGO_URI, DB_URI or MONGODB_URI.'
    );
  }

  await mongoose.connect(dbUri);

  console.log('Connected to DB.');

  try {
    // ------------------------------------------------------------------------
    // EXISTING USERS
    // ------------------------------------------------------------------------

    console.log(
      '\n--- Finding existing test users ---'
    );

    const users =
      await getExistingTestUsers();

    for (const [key, user] of Object.entries(
      users
    )) {
      console.log(
        `  ${key}: ${user.email} -> ${user._id}`
      );
    }

    // ------------------------------------------------------------------------
    // EXISTING WORKSPACE
    // ------------------------------------------------------------------------

    console.log(
      '\n--- Finding existing test workspace ---'
    );

    const workspace =
      await getExistingTestWorkspace(
        users.owner._id
      );

    console.log(
      `  Workspace: ${workspace.name}`
    );

    console.log(
      `  workspaceId: ${workspace._id}`
    );

    // ------------------------------------------------------------------------
    // MEMBERSHIP
    // ------------------------------------------------------------------------

    console.log(
      '\n--- Verifying workspace members ---'
    );

    verifyWorkspaceMembers(
      workspace,
      users
    );

    console.log(
      '  All 8 test users are members.'
    );

    // ------------------------------------------------------------------------
    // RESET ONLY DOCUMENTS
    // ------------------------------------------------------------------------

    console.log(
      '\n--- Resetting documents ---'
    );

    await clearExistingDocuments(
      workspace._id
    );

    // ------------------------------------------------------------------------
    // CREATE DOCUMENTS
    // ------------------------------------------------------------------------

    console.log(
      '\n--- Creating workflow dashboard documents ---'
    );

    const createdDocuments = [];

    for (const definition of DOCUMENTS) {
      const document =
        await createDocument(
          definition,
          users,
          workspace
        );

      createdDocuments.push(
        document
      );

      let holder = '';

      if (
        definition.status ===
          'in-review' &&
        definition.reviewer
      ) {
        holder =
          ` → ${users.reviewer.name || users.reviewer.email}`;
      }

      if (
        definition.status ===
          'final-review' &&
        definition.approver
      ) {
        holder =
          ` → ${users.approver.name || users.approver.email}`;
      }

      console.log(
        `  ✓ ${definition.name} | ${definition.status}${holder}`
      );
    }

    // ------------------------------------------------------------------------
    // DATABASE VERIFICATION
    // ------------------------------------------------------------------------

    const databaseCount =
      await Document.countDocuments({
        workspace: workspace._id,
      });

    if (
      databaseCount !==
      DOCUMENTS.length
    ) {
      throw new Error(
        `Database verification failed. Expected ${DOCUMENTS.length} documents, ` +
          `found ${databaseCount}.`
      );
    }

    // ------------------------------------------------------------------------
    // FINAL SUMMARY
    // ------------------------------------------------------------------------

    printSummary(
      createdDocuments,
      users,
      workspace
    );
  } catch (error) {
    console.error(
      '\nDashboard test data seed failed:'
    );

    console.error(error);

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();