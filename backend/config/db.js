// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log("=== DATABASE CONNECTION ===");
    console.log("Environment:", process.env.NODE_ENV);
    
    // Log partial connection string for debugging (hiding credentials)
    const connectionString = process.env.MONGO_URI || 'No connection string found';
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
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error}`);
    
    // Print more detailed error information
    if (error.name === "MongooseServerSelectionError") {
      console.error("Connection details:", JSON.stringify(error.reason, null, 2));
    }
    
    // Exit with failure in production, but don't crash in development
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    
    throw error;
  }
};

module.exports = connectDB;