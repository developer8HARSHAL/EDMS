// ✅ CRITICAL FIX: Permission property mapping utility
// This addresses the mismatch between frontend and backend permission properties

/**
 * Frontend uses: read, write, delete, manage, invite
 * Backend uses: canView, canEdit, canAdd, canDelete, canInvite
 */

// ✅ Map frontend permissions to backend permissions
const mapFrontendToBackend = (frontendPermissions) => {
  if (!frontendPermissions || typeof frontendPermissions !== 'object') {
    return null;
  }

  const permissionMap = {
    read: 'canView',
    write: 'canEdit',
    delete: 'canDelete',
    manage: 'canAdd', // 'manage' typically includes adding new items
    invite: 'canInvite'
  };

  const backendPermissions = {};

  // Map each frontend permission to backend equivalent
  Object.keys(frontendPermissions).forEach(frontendKey => {
    const backendKey = permissionMap[frontendKey];
    if (backendKey) {
      backendPermissions[backendKey] = frontendPermissions[frontendKey];
    }
  });

  // Ensure all backend permissions are present with defaults
  const allBackendPermissions = {
    canView: backendPermissions.canView || false,
    canEdit: backendPermissions.canEdit || false,
    canAdd: backendPermissions.canAdd || false,
    canDelete: backendPermissions.canDelete || false,
    canInvite: backendPermissions.canInvite || false
  };

  return allBackendPermissions;
};

// ✅ Map backend permissions to frontend permissions
const mapBackendToFrontend = (backendPermissions) => {
  if (!backendPermissions || typeof backendPermissions !== 'object') {
    return null;
  }
const permissionMap = {
  'read': 'canView',
  'write': 'canEdit',
  'delete': 'canDelete',
  'manage': 'canAdd',
  'invite': 'canInvite'
};
  const frontendPermissions = {};

  // Map each backend permission to frontend equivalent
  Object.keys(backendPermissions).forEach(backendKey => {
    const frontendKey = permissionMap[backendKey];
    if (frontendKey) {
      frontendPermissions[frontendKey] = backendPermissions[backendKey];
    }
  });

  return frontendPermissions;
};
// const getRolePermissions = getDefaultPermissionsForRole;

// ✅ Get default permissions for a role (backend format)
const getDefaultPermissionsForRole = (role) => {
  
  const rolePermissions = {
    owner: {
      canView: true,
      canEdit: true,
      canAdd: true,
      canDelete: true,
      canInvite: true,
      canManage: true
    },
    admin: {
      canView: true,
      canEdit: true,
      canAdd: true,
      canDelete: true,
      canInvite: true
    },
    editor: {
      canView: true,
      canEdit: true,
      canAdd: true,
      canDelete: false,
      canInvite: false
    },
    viewer: {
      canView: true,
      canEdit: false,
      canAdd: false,
      canDelete: false,
      canInvite: false
    }
  };
  return rolePermissions[role] || rolePermissions.viewer;
};

// ✅ Get default permissions for a role (frontend format)
const getDefaultFrontendPermissionsForRole = (role) => {
  const backendPermissions = getDefaultPermissionsForRole(role);
  return mapBackendToFrontend(backendPermissions);
};

// ✅ Validate permission object (backend format)
const validateBackendPermissions = (permissions) => {
  if (!permissions || typeof permissions !== 'object') {
    return { isValid: false, errors: ['Permissions must be an object'] };
  }

  const validPermissions = ['canView', 'canEdit', 'canAdd', 'canDelete', 'canInvite'];
  const errors = [];

  // Check for invalid permission keys
  const providedKeys = Object.keys(permissions);
  const invalidKeys = providedKeys.filter(key => !validPermissions.includes(key));
  
  if (invalidKeys.length > 0) {
    errors.push(`Invalid permission keys: ${invalidKeys.join(', ')}`);
  }

  // Check for invalid permission values
  providedKeys.forEach(key => {
    if (typeof permissions[key] !== 'boolean') {
      errors.push(`Permission '${key}' must be a boolean value`);
    }
  });

  // Business logic validation
  if (permissions.canEdit && !permissions.canView) {
    errors.push('Cannot have edit permission without view permission');
  }

  if (permissions.canDelete && !permissions.canEdit) {
    errors.push('Cannot have delete permission without edit permission');
  }

  if (permissions.canAdd && !permissions.canView) {
    errors.push('Cannot have add permission without view permission');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// ✅ Validate permission object (frontend format)
const validateFrontendPermissions = (permissions) => {
  if (!permissions || typeof permissions !== 'object') {
    return { isValid: false, errors: ['Permissions must be an object'] };
  }

  const validPermissions = ['read', 'write', 'delete', 'manage', 'invite'];
  const errors = [];

  // Check for invalid permission keys
  const providedKeys = Object.keys(permissions);
  const invalidKeys = providedKeys.filter(key => !validPermissions.includes(key));
  
  if (invalidKeys.length > 0) {
    errors.push(`Invalid permission keys: ${invalidKeys.join(', ')}`);
  }

  // Check for invalid permission values
  providedKeys.forEach(key => {
    if (typeof permissions[key] !== 'boolean') {
      errors.push(`Permission '${key}' must be a boolean value`);
    }
  });

  // Business logic validation
  if (permissions.write && !permissions.read) {
    errors.push('Cannot have write permission without read permission');
  }

  if (permissions.delete && !permissions.write) {
    errors.push('Cannot have delete permission without write permission');
  }

  if (permissions.manage && !permissions.read) {
    errors.push('Cannot have manage permission without read permission');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// ✅ Middleware to transform frontend permissions to backend format
const transformPermissionsMiddleware = (req, res, next) => {
  if (req.body.permissions) {
    // Check if permissions are in frontend format
    const frontendKeys = ['read', 'write', 'delete', 'manage', 'invite'];
    const hasFrontendKeys = Object.keys(req.body.permissions).some(key => 
      frontendKeys.includes(key)
    );

    if (hasFrontendKeys) {
      // Transform to backend format
      req.body.permissions = mapFrontendToBackend(req.body.permissions);
    }
  }

  next();
};

// ✅ Response transformer to convert backend permissions to frontend format
const transformResponsePermissions = (data) => {
  if (!data) return data;

  // Handle single workspace object
  if (data.userPermissions) {
    data.userPermissions = {
      ...data.userPermissions,
      frontend: mapBackendToFrontend(data.userPermissions)
    };
  }

  // Handle array of workspaces
  if (Array.isArray(data.workspaces)) {
    data.workspaces = data.workspaces.map(workspace => {
      if (workspace.userPermissions) {
        workspace.userPermissions = {
          ...workspace.userPermissions,
          frontend: mapBackendToFrontend(workspace.userPermissions)
        };
      }
      return workspace;
    });
  }

  // Handle members array
  if (data.members && Array.isArray(data.members)) {
    data.members = data.members.map(member => {
      if (member.permissions) {
        member.permissions = {
          ...member.permissions,
          frontend: mapBackendToFrontend(member.permissions)
        };
      }
      return member;
    });
  }

  return data;
};

// ✅ Utility to check if user has specific permission
const hasPermission = (userPermissions, requiredPermission, format = 'backend') => {
  if (!userPermissions) return false;

  if (format === 'frontend') {
    const backendPermissions = mapFrontendToBackend(userPermissions);
    return backendPermissions && backendPermissions[requiredPermission] === true;
  }

  return userPermissions[requiredPermission] === true;
};

// ✅ Express middleware to add permission helpers to response
const addPermissionHelpers = (req, res, next) => {
  // Add helper methods to response
  res.transformPermissions = (data) => transformResponsePermissions(data);
  
  res.sendWithTransformedPermissions = function(statusCode, message, data = null) {
    const response = {
      success: statusCode < 400,
      message
    };
    
    if (data) {
      response.data = transformResponsePermissions(data);
    }
    
    return this.status(statusCode).json(response);
  };

  next();
};

module.exports = {
  mapFrontendToBackend,
  mapBackendToFrontend,
  getDefaultPermissionsForRole,
  getDefaultFrontendPermissionsForRole,
  validateBackendPermissions,
  validateFrontendPermissions,
  transformPermissionsMiddleware,
  transformResponsePermissions,
  hasPermission,
  addPermissionHelpers,
  getDefaultPermissionsForRole
};