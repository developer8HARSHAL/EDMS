// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is required');
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Connection pool & timeout settings for production resilience
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Create indexes after successful connection
    await createIndexes();

    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);

    if (error.name === 'MongooseServerSelectionError') {
      console.error('Could not reach MongoDB Atlas. Check network/credentials.');
    }

    // Throw instead of process.exit — let the caller (server.js) handle retry
    throw error;
  }
};

async function createIndexes() {
  try {
    const Workspace = require('../models/workspaceModel');

    await Workspace.collection.createIndexes([
      { key: { owner: 1 } },
      { key: { 'members.user': 1 } },
      { key: { name: 'text', description: 'text' } },
      { key: { createdAt: -1 } }
    ]);

    console.log('Database indexes created');
  } catch (error) {
    // Non-fatal: indexes may already exist
    console.warn('Index creation skipped:', error.message);
  }
}

module.exports = connectDB;
