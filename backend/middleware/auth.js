const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Protect routes
// REPLACE the protect function with this enhanced version:
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    // REMOVE or comment out this line to reduce log noise:
    // console.log('No token provided in request');
    
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route - no token provided'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from the token
    const user = await User.findById(decoded.id);
    
    // ADD THIS NULL CHECK
    if (!user) {
      console.log('No user found with provided token');
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not found'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.log('Token verification failed:', err.message);
    return res.status(401).json({
      success: false,
      message: 'Not authorized - token invalid'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};