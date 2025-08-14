const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fileUpload = require('express-fileupload');
const mongoose = require('mongoose'); // ✅ ADDED: Missing import for health check
const connectDB = require('./config/db'); // Import the DB connection function

// Import routes
const userRoutes = require('./routes/userRoutes');
const documentRoutes = require('./routes/documentRoutes');
const workspaceRoutes = require('./routes/workspaceRoutes');
const invitationRoutes = require('./routes/invitationRoutes');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Enhanced CORS configuration for production
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [
      process.env.FRONTEND_URL || 'https://your-edms-app.netlify.app', // Use env variable if available
      'https://edms-document-app.netlify.app' // Add your expected Netlify domain here
    ] 
  : ['http://localhost:3000']; // In development, allow localhost

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB file size limit
  createParentPath: true
}));

// Static directory for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB using our config function
connectDB()
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    // We're not exiting the process here because connectDB already handles that
  });

// Routes - Order matters for middleware
app.use('/api/users', userRoutes);
app.use('/api/workspaces', workspaceRoutes); // ✅ FIXED: Moved before documents for proper middleware order
app.use('/api/documents', documentRoutes);
app.use('/api/invitations', invitationRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('EDMS API Running');
});

// Health check endpoint for monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    env: process.env.NODE_ENV,
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected', // ✅ FIXED: Now mongoose is imported
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Server Error', 
    error: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message 
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`));