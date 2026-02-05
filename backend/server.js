const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fileUpload = require('express-fileupload');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const morgan = require('morgan');

// Import routes
const userRoutes = require('./routes/userRoutes');
const documentRoutes = require('./routes/documentRoutes');
const workspaceRoutes = require('./routes/workspaceRoutes');
const invitationRoutes = require('./routes/invitationRoutes');

// Load environment variables
console.log("EMAIL_USER from env:", process.env.EMAIL_USER);
console.log("EMAIL_PASS exists?", !!process.env.EMAIL_PASS);

// Initialize express app
const app = express();
app.use(morgan('dev'));

// ✅ FIXED: CORS configuration for Vercel deployments
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    // In production, allow Vercel domains
    if (process.env.NODE_ENV === 'production') {
      // Allow specific FRONTEND_URL if set
      if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
        console.log('✅ CORS allowed (FRONTEND_URL):', origin);
        return callback(null, true);
      }
      
      // Allow all Vercel preview URLs (*.vercel.app)
      if (origin.match(/https:\/\/.*\.vercel\.app$/)) {
        console.log('✅ CORS allowed (Vercel):', origin);
        return callback(null, true);
      }
      
      console.log('🚫 CORS blocked origin:', origin);
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    
    // In development, allow localhost
    if (origin === 'http://localhost:3000' || origin === 'http://localhost:3001') {
      return callback(null, true);
    }
    
    return callback(null, true);
  },
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 },
  createParentPath: true
}));

// Static directory for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
connectDB()
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
  });

// Routes
app.use('/api/users', userRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/invitations', invitationRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('EDMS API Running');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    env: process.env.NODE_ENV,
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
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