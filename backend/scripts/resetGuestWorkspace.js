// scripts/resetGuestWorkspace.js
//
// Resets the shared guest/demo workspace back to its originally-seeded state.
// Deletes every document currently in the guest workspace (and their GridFS
// files), then re-runs ensureGuestData() to recreate the original sample
// documents. Does NOT delete the guest user or workspace itself — just its
// contents — so the guest's login token/id stays valid.
//
// Usage:
//   node scripts/resetGuestWorkspace.js
//
// Requires the same environment as the running server (MONGO_URI / DB_URI,
// GUEST_EMAIL if customized) — run it from the backend/ directory with your
// normal .env loaded.

require('dotenv').config();
const mongoose = require('mongoose');
const Document = require('../models/documentModel');
const Workspace = require('../models/workspaceModel');
const User = require('../models/userModel');
const { ensureGuestData, GUEST_EMAIL } = require('../utils/guestSeed');

async function resetGuestWorkspace() {
  const dbUri = process.env.MONGO_URI || process.env.DB_URI || process.env.MONGODB_URI;

  if (!dbUri) {
    console.error('No MONGO_URI / DB_URI / MONGODB_URI found in environment. Aborting.');
    process.exit(1);
  }

  await mongoose.connect(dbUri);
  console.log('Connected to DB.');

  const guestUser = await User.findOne({ email: GUEST_EMAIL });

  if (!guestUser) {
    console.log('No existing guest user found — running ensureGuestData() to create one fresh.');
    await ensureGuestData();
    console.log('Guest account created and seeded.');
    await mongoose.disconnect();
    return;
  }

  const guestWorkspace = await Workspace.findOne({
    owner: guestUser._id,
    name: 'Guest Demo Workspace'
  });

  if (guestWorkspace) {
    const gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
    const existingDocs = await Document.find({ workspace: guestWorkspace._id });

    console.log(`Deleting ${existingDocs.length} existing guest document(s)...`);

    for (const doc of existingDocs) {
      try {
        await gfs.delete(new mongoose.Types.ObjectId(doc.path));
      } catch (err) {
        // File may already be missing/orphaned — not fatal, continue cleanup.
        console.warn(`  Could not delete GridFS file for "${doc.name}": ${err.message}`);
      }
      await Document.deleteOne({ _id: doc._id });
    }

    console.log('Existing guest documents removed.');
  } else {
    console.log('No existing guest workspace found — will be created fresh.');
  }

  console.log('Re-seeding guest workspace with original sample documents...');
  await ensureGuestData();
  console.log('Guest workspace reset complete.');

  await mongoose.disconnect();
}

resetGuestWorkspace().catch(err => {
  console.error('Reset failed:', err);
  process.exit(1);
});
