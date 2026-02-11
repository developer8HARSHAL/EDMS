// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log("=== DATABASE CONNECTION ===");
    console.log("Environment:", process.env.NODE_ENV);
    
    // ✅ FIXED: Validate MONGO_URI exists
    if (!process.env.MONGO_URI) {
      const error = new Error('MONGO_URI environment variable is required');
      console.error('❌ DATABASE CONNECTION ERROR:', error.message);
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
      throw error;
    }
    
    // Log partial connection string for debugging (hiding credentials)
    const connectionString = process.env.MONGO_URI;
    const redactedString = connectionString.includes('@') 
      ? connectionString.substring(0, connectionString.indexOf('://') + 3) + 
        '***:***@' + 
        connectionString.substring(connectionString.indexOf('@') + 1) 
      : 'Invalid connection string format';
    
    console.log("MongoDB URI:", redactedString);
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Call createIndexes after successful connection
    await createIndexes();

    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error}`);
    
    // Print more detailed error information
    if (error.name === "MongooseServerSelectionError") {
      console.error("Connection details:", JSON.stringify(error.reason, null, 2));
    }

    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }

    throw error;
  }
};

// Add to backend/config/db.js or create separate script
async function createIndexes() {
  const Workspace = require('../models/workspaceModel');
  
  await Workspace.collection.createIndexes([
    { key: { owner: 1 } },
    { key: { 'members.user': 1 } },
    { key: { name: 'text', description: 'text' } },
    { key: { createdAt: -1 } }
  ]);

  console.log('✅ Database indexes created');
}

module.exports = connectDB;
