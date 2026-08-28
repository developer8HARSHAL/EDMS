// ✅ CRITICAL FIX: Permission property mapping utility
// This addresses the mismatch between frontend and backend permission properties

/**
 * Frontend uses: read, write, delete, manage, invite
 * Backend uses: canView, canEdit, canAdd, canDelete, canInvite
 */

const mapFrontendToBackend = (frontendPermissions) => {
  if (!frontendPermissions || typeof frontendPermissions !== 'object') {
    return null;
  }

  const permissionMap = {
    read: 'canView',
    write: 'canEdit',
    delete: 'canDelete',
    manage: 'canAdd', 
    invite: 'canInvite'
  };

  const backendPermissions = {};

  Object.keys(frontendPermissions).forEach(frontendKey => {
    const backendKey = permissionMap[frontendKey];
    if (backendKey) {
      backendPermissions[backendKey] = frontendPermissions[frontendKey];
    }
  });

  const allBackendPermissions = {
    canView: backendPermissions.canView || false,
    canEdit: backendPermissions.canEdit || false,
    canAdd: backendPermissions.canAdd || false,
    canDelete: backendPermissions.canDelete || false,
    canInvite: backendPermissions.canInvite || false
  };

  return allBackendPermissions;
};

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

  Object.keys(backendPermissions).forEach(backendKey => {
    const frontendKey = permissionMap[backendKey];
    if (frontendKey) {
      frontendPermissions[frontendKey] = backendPermissions[backendKey];
    }
  });

  return frontendPermissions;
};

const getDefaultPermissionsForRole = (role) => {
  
  const rolePermissions = {
    owner: {
      canView: true,
      canEdit: true,
      canAdd: true,
      canDelete: true,
      canInvite: true,
      canManage: true,
      canManageWorkflow: false
    },
    admin: {
      canView: true,
      canEdit: true,
      canAdd: true,
      canDelete: true,
      canInvite: true,
      canManageWorkflow: false
    },
    editor: {
      canView: true,
      canEdit: true,
      canAdd: true,
      canDelete: false,
      canInvite: false,
      canManageWorkflow: false
    },
    viewer: {
      canView: true,
      canEdit: false,
      canAdd: false,
      canDelete: false,
      canInvite: false,
      canManageWorkflow: false
    }
  };
  return rolePermissions[role] || rolePermissions.viewer;
};

const getDefaultFrontendPermissionsForRole = (role) => {
  const backendPermissions = getDefaultPermissionsForRole(role);
  return mapBackendToFrontend(backendPermissions);
};

const validateBackendPermissions = (permissions) => {
  if (!permissions || typeof permissions !== 'object') {
    return { isValid: false, errors: ['Permissions must be an object'] };
  }

  const validPermissions = ['canView', 'canEdit', 'canAdd', 'canDelete', 'canInvite','canManageWorkflow'];
  const errors = [];

  const providedKeys = Object.keys(permissions);
  const invalidKeys = providedKeys.filter(key => !validPermissions.includes(key));
  
  if (invalidKeys.length > 0) {
    errors.push(`Invalid permission keys: ${invalidKeys.join(', ')}`);
  }

  providedKeys.forEach(key => {
    if (typeof permissions[key] !== 'boolean') {
      errors.push(`Permission '${key}' must be a boolean value`);
    }
  });

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

const validateFrontendPermissions = (permissions) => {
  if (!permissions || typeof permissions !== 'object') {
    return { isValid: false, errors: ['Permissions must be an object'] };
  }

  const validPermissions = ['read', 'write', 'delete', 'manage', 'invite'];
  const errors = [];

  const providedKeys = Object.keys(permissions);
  const invalidKeys = providedKeys.filter(key => !validPermissions.includes(key));
  
  if (invalidKeys.length > 0) {
    errors.push(`Invalid permission keys: ${invalidKeys.join(', ')}`);
  }

  providedKeys.forEach(key => {
    if (typeof permissions[key] !== 'boolean') {
      errors.push(`Permission '${key}' must be a boolean value`);
    }
  });

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

const transformPermissionsMiddleware = (req, res, next) => {
  if (req.body.permissions) {
    // Check if permissions are in frontend format
    const frontendKeys = ['read', 'write', 'delete', 'manage', 'invite'];
    const hasFrontendKeys = Object.keys(req.body.permissions).some(key => 
      frontendKeys.includes(key)
    );

    if (hasFrontendKeys) {
      req.body.permissions = mapFrontendToBackend(req.body.permissions);
    }
  }

  next();
};

const transformResponsePermissions = (data) => {
  if (!data) return data;

  // Handle single workspace object
  if (data.userPermissions) {
    data.userPermissions = {
      ...data.userPermissions,
      frontend: mapBackendToFrontend(data.userPermissions)
    };
  }

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

const hasPermission = (userPermissions, requiredPermission, format = 'backend') => {
  if (!userPermissions) return false;

  if (format === 'frontend') {
    const backendPermissions = mapFrontendToBackend(userPermissions);
    return backendPermissions && backendPermissions[requiredPermission] === true;
  }

  return userPermissions[requiredPermission] === true;
};

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