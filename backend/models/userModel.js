const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Define User Schema
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
  },
  // Add to userModel.js
workspaces: [{
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'editor', 'viewer'],
    required: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
}],
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ],
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false, // Don't return password in queries by default
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  // Predefined profile avatar key. The frontend maps this key to a bundled asset.
  avatar: {
    type: String,
    enum: ['avatar-01', 'avatar-02', 'avatar-03', 'avatar-04', 'avatar-05','avatar-06','avatar-07','avatar-08'],
    default: 'avatar-01'
  },
  // Marks the single shared demo/guest account used by "Continue as Guest"
  isGuest: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password before saving
UserSchema.pre('save', async function(next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    // Hash password with salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  // ✅ FIXED: Validate JWT_SECRET exists
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured. Cannot generate token.');
  }
  
  return jwt.sign(
    { 
      id: this._id,
      name: this.name,
      email: this.email,
      role: this.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '30d'
    }
  );
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);