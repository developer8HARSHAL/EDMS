// utils/guestSeed.js
// Idempotently ensures a shared "guest" demo account exists, along with a
// demo workspace and a few sample documents, so "Continue as Guest" always
// has something to show — no separate manual seed script/migration needed.
const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('../models/userModel');
const Workspace = require('../models/workspaceModel');
const Document = require('../models/documentModel');

const GUEST_EMAIL = process.env.GUEST_EMAIL || 'guest@edmsdemo.com';
const GUEST_WORKSPACE_NAME = 'Guest Demo Workspace';

const SAMPLE_FILES = [
  {
    name: 'Welcome.txt',
    contentType: 'text/plain',
    content:
      'Welcome to the guest demo workspace!\n\n' +
      'This workspace, and everything in it, is shared by every guest visitor. ' +
      'Feel free to upload, edit, or delete documents — changes made here are ' +
      'visible to other guests too, so treat it as a public sandbox rather than ' +
      'a private account.\n'
  },
  {
    name: 'Project Notes.txt',
    contentType: 'text/plain',
    content:
      'Project Notes (sample document)\n' +
      '--------------------------------\n' +
      '- This is an example of a document already sitting in a workspace.\n' +
      '- Try renaming it, sharing it, or marking it as a favorite.\n'
  }
];

let gfsGuest;
const getGridFSForSeed = () => {
  if (!gfsGuest) {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB connection not ready. Cannot seed guest data.');
    }
    gfsGuest = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'uploads'
    });
  }
  return gfsGuest;
};

async function writeSampleFileToGridFS(gridFS, fileName, contentType, contentString, ownerId) {
  const fileId = new mongoose.Types.ObjectId();
  const buffer = Buffer.from(contentString, 'utf-8');

  const writeStream = gridFS.openUploadStreamWithId(fileId, fileName, {
    contentType,
    metadata: { originalName: fileName, ownerId: ownerId.toString(), seeded: true }
  });

  writeStream.write(buffer);
  writeStream.end();

  await new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });

  return { fileId, size: buffer.length };
}

/**
 * Finds (or creates on first call) the shared guest user, their demo
 * workspace, and a couple of sample documents. Safe to call on every
 * guest-login request — it's a no-op after the first successful run.
 */
async function ensureGuestData() {
  let guestUser = await User.findOne({ email: GUEST_EMAIL });

  if (!guestUser) {
    // Random password: nobody logs in with it, guest-login never checks it.
    const randomPassword = crypto.randomBytes(24).toString('hex');
    guestUser = await User.create({
      name: 'Guest',
      email: GUEST_EMAIL,
      password: randomPassword,
      role: 'user',
      isGuest: true
    });
  }

  let guestWorkspace = await Workspace.findOne({
    owner: guestUser._id,
    name: GUEST_WORKSPACE_NAME
  });

  if (!guestWorkspace) {
    guestWorkspace = await Workspace.create({
      name: GUEST_WORKSPACE_NAME,
      description: 'A shared sandbox workspace for guest visitors.',
      owner: guestUser._id,
      members: [],
      settings: { isPublic: false, allowMemberInvites: false }
    });
  }

  const existingDocCount = await Document.countDocuments({ workspace: guestWorkspace._id });

  if (existingDocCount === 0) {
    const gridFS = getGridFSForSeed();

    for (const sample of SAMPLE_FILES) {
      const { fileId, size } = await writeSampleFileToGridFS(
        gridFS,
        sample.name,
        sample.contentType,
        sample.content,
        guestUser._id
      );

      await Document.create({
        name: sample.name,
        originalName: sample.name,
        path: fileId.toString(),
        size,
        type: sample.contentType,
        owner: guestUser._id,
        uploadedBy: guestUser._id,
        workspace: guestWorkspace._id,
        permissions: [] // workspace-scoped doc, no legacy per-user grants needed
      });
    }
  }

  return guestUser;
}

module.exports = { ensureGuestData, GUEST_EMAIL };
