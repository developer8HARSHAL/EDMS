const { ObjectId } = require('mongoose').Types;

/**
 * Middleware to validate MongoDB ObjectId format
 * Returns 400 Bad Request if ID is invalid
 */
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: `${paramName} parameter is required`
      });
    }
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format. Must be a valid MongoDB ObjectId.`
      });
    }
    
    next();
  };
};

/**
 * Validate multiple ObjectId parameters
 */
const validateMultipleObjectIds = (paramNames) => {
  return (req, res, next) => {
    const errors = [];
    
    paramNames.forEach(paramName => {
      const id = req.params[paramName];
      if (id && !ObjectId.isValid(id)) {
        errors.push(`Invalid ${paramName} format`);
      }
    });
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parameter format(s)',
        errors
      });
    }
    
    next();
  };
};

module.exports = {
  validateObjectId,
  validateMultipleObjectIds
};



