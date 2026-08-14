/**
 * seedCalendarTestData.js
 *
 * PURPOSE:
 *   Add temporary due/expiry dates to existing documents so the
 *   frontend Calendar can be visually tested with realistic data.
 *
 * SAFE SCOPE:
 *   - Dev/local database only.
 *   - Does NOT change backend code, models, routes, or business logic.
 *   - Only updates dueDate and expiryDate on selected documents.
 *
 * RUN:
 *   node scripts/seedCalendarTestData.js
 *
 * RESET:
 *   node scripts/seedCalendarTestData.js reset
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI =
  `mongodb+srv://harshal:harshal2003@edms-cluster.ctqybsg.mongodb.net/?retryWrites=true&w=majority&appName=edms-cluster` || 'mongodb://localhost:27017/edms';

const WORKSPACE_ID = '6a755807e5984e7b8b2b5e33';

// Your existing documents in this workspace.
const TEST_DOCUMENTS = [
  {
    id: '6a755834e5984e7b8b2b5e95',
    name: 'HarshalPinge.pdf',
    dueDate: '2026-08-15T00:00:00.000Z',
    expiryDate: '2026-08-22T00:00:00.000Z',
  },
  {
    id: '6a7a9c89faaac9b15966dea2',
    name: 'LLM_Comparison.csv',
    dueDate: '2026-08-13T00:00:00.000Z',
    expiryDate: '2026-08-29T00:00:00.000Z',
  },
];

async function run() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();

    const db = client.db();
    const documents = db.collection('documents');

    // ------------------------------------------------------------
    // RESET
    // ------------------------------------------------------------
    if (process.argv[2] === 'reset') {
      console.log('Resetting calendar test dates...');

      for (const item of TEST_DOCUMENTS) {
        const result = await documents.updateOne(
          {
            _id: new ObjectId(item.id),
            workspace: new ObjectId(WORKSPACE_ID),
          },
          {
            $unset: {
              dueDate: '',
              expiryDate: '',
            },
          }
        );

        console.log(
          `↩️ ${item.name}: matched=${result.matchedCount}, modified=${result.modifiedCount}`
        );
      }

      console.log('\n✅ Calendar test dates removed.');
      return;
    }

    // ------------------------------------------------------------
    // SEED
    // ------------------------------------------------------------
    console.log('Seeding calendar test dates...\n');

    for (const item of TEST_DOCUMENTS) {
      const result = await documents.updateOne(
        {
          _id: new ObjectId(item.id),
          workspace: new ObjectId(WORKSPACE_ID),
        },
        {
          $set: {
            dueDate: new Date(item.dueDate),
            expiryDate: new Date(item.expiryDate),
          },
        }
      );

      if (result.matchedCount === 0) {
        console.log(`⚠️ Not found: ${item.name} (${item.id})`);
        continue;
      }

      console.log(`✅ ${item.name}`);
      console.log(`   Due:    ${item.dueDate}`);
      console.log(`   Expiry: ${item.expiryDate}`);
    }

    console.log('\n✅ Calendar test data seeded.');
    console.log(
      'Open http://localhost:3000/calendar and check August 2026.'
    );
    console.log(
      '\nTo remove the test dates later: node scripts/seedCalendarTestData.js reset'
    );
  } catch (error) {
    console.error('❌ Calendar seed failed:', error);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

run();