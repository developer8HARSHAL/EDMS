const Workspace = require('../models/workspaceModel');
const { ObjectId } = require('mongoose').Types;

/**
 * Middleware to check if user has access to a workspace
 * Usage: checkWorkspaceAccess(['canView']) or checkWorkspaceAccess(['canEdit', 'canAdd'])
 */
const checkWorkspaceAccess = (requiredPermissions = ['canView']) => {
  return async (req, res, next) => {
    try {
      const { workspaceId, id } = req.params;
      const userId = req.user.id;
      
      // Use workspaceId from params, or 'id' if it's a workspace route
      const targetWorkspaceId = workspaceId || id;
      
      if (!targetWorkspaceId) {
        return res.status(400).json({
          success: false,
          message: 'Workspace ID is required'
        });
      }

      // Validate ObjectId format
      if (!ObjectId.isValid(targetWorkspaceId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid workspace ID format'
        });
      }

      // Find workspace and check if user is a member
      const workspace = await Workspace.findById(targetWorkspaceId);
      
      if (!workspace) {
        return res.status(404).json({
          success: false,
          message: 'Workspace not found'
        });
      }

      // Check if user is owner (owners have all permissions)
      if (workspace.owner.toString() === userId) {
        req.workspace = workspace;
        req.userMembership = { 
          role: 'owner',
          permissions: {
            canView: true,
            canEdit: true,
            canAdd: true,
            canDelete: true,
            canInvite: true
          }
        };
        return next();
      }

      // Find user's membership in workspace
      const membership = workspace.members.find(
        member => member.user.toString() === userId
      );

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not a member of this workspace'
        });
      }

      // Check if user has required permissions
      const hasPermission = requiredPermissions.some(permission => {
        return membership.permissions[permission] === true;
      });

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Access denied: Insufficient permissions. Required: ${requiredPermissions.join(' or ')}`
        });
      }

      // Add workspace and user membership to request object
      req.workspace = workspace;
      req.userMembership = membership;
      
      next();
    } catch (error) {
      console.error('Workspace auth middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during permission check'
      });
    }
  };
};

/**
 * Middleware to check if user is workspace owner
 */
const checkWorkspaceOwner = async (req, res, next) => {
  try {
    const { workspaceId, id } = req.params;
    const userId = req.user.id;
    
    const targetWorkspaceId = workspaceId || id;
    
    if (!targetWorkspaceId || !ObjectId.isValid(targetWorkspaceId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid workspace ID is required'
      });
    }

    const workspace = await Workspace.findById(targetWorkspaceId);
    
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    if (workspace.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only workspace owner can perform this action'
      });
    }

    req.workspace = workspace;
    next();
  } catch (error) {
    console.error('Workspace owner check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during owner verification'
    });
  }
};

/**
 * Middleware to check if user is workspace admin
 */
const checkWorkspaceAdmin = async (req, res, next) => {
  try {
    const { workspaceId, id } = req.params;
    const userId = req.user.id;
    
    const targetWorkspaceId = workspaceId || id;
    
    if (!targetWorkspaceId || !ObjectId.isValid(targetWorkspaceId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid workspace ID is required'
      });
    }

    const workspace = await Workspace.findById(targetWorkspaceId);
    
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Check if user is owner
    if (workspace.owner.toString() === userId) {
      req.workspace = workspace;
      req.userMembership = { role: 'owner' };
      return next();
    }

    // Check if user is admin member
    const membership = workspace.members.find(
      member => member.user.toString() === userId
    );

    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Admin privileges required'
      });
    }

    req.workspace = workspace;
    req.userMembership = membership;
    next();
  } catch (error) {
    console.error('Workspace admin check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin verification'
    });
  }
};

/**
 * Utility function to check document access within workspace context
 * For use in document controllers
 */
const checkDocumentWorkspaceAccess = async (userId, documentId, requiredPermissions = ['canView']) => {
  try {
    const Document = require('../models/documentModel');
    
    const document = await Document.findById(documentId).populate('workspace');
    
    if (!document) {
      throw new Error('Document not found');
    }

    if (!document.workspace) {
      throw new Error('Document workspace not found');
    }

    const workspace = document.workspace;
    
    // Check if user is owner (owners have all permissions)
    if (workspace.owner.toString() === userId) {
      return { 
        document, 
        workspace, 
        membership: { 
          role: 'owner',
          permissions: {
            canView: true,
            canEdit: true,
            canAdd: true,
            canDelete: true,
            canInvite: true
          }
        }
      };
    }

    // Find user's membership
    const membership = workspace.members.find(
      member => member.user.toString() === userId
    );

    if (!membership) {
      throw new Error('Access denied: Not a workspace member');
    }

    // Check permissions
    const hasPermission = requiredPermissions.some(permission => {
      return membership.permissions[permission] === true;
    });

    if (!hasPermission) {
      throw new Error(`Insufficient permissions: ${requiredPermissions.join(' or ')} required`);
    }

    return { document, workspace, membership };
  } catch (error) {
    throw error;
  }
};

/**
 * Express middleware version of document workspace access check
 */
const checkDocumentAccess = (requiredPermissions = ['canView']) => {
  return async (req, res, next) => {
    try {
      const { id: documentId } = req.params;
      const userId = req.user.id;

      if (!documentId || !ObjectId.isValid(documentId)) {
        return res.status(400).json({
          success: false,
          message: 'Valid document ID is required'
        });
      }

      const result = await checkDocumentWorkspaceAccess(userId, documentId, requiredPermissions);
      
      req.document = result.document;
      req.workspace = result.workspace;
      req.userMembership = result.membership;
      
      next();
    } catch (error) {
      console.error('Document workspace access error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('Access denied') || error.message.includes('Insufficient permissions')) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Server error during document access check'
      });
    }
  };
};

module.exports = {
  checkWorkspaceAccess,
  checkWorkspaceOwner,
  checkWorkspaceAdmin,
  checkDocumentAccess,
  checkDocumentWorkspaceAccess
};