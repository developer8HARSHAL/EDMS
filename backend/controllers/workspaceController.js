const Workspace = require('../models/workspaceModel');
const User = require('../models/userModel');
const Document = require('../models/documentModel');
const { getDefaultPermissionsForRole, mapFrontendToBackend } = require('../utils/permissionMapper');


// @desc    Create new workspace
// @route   POST /api/workspaces
// @access  Private
const createWorkspace = async (req, res) => {
  try {
    const { name, description, settings } = req.body;
    const userId = req.user.id;

    // Check if workspace name already exists for this user
    const existingWorkspace = await Workspace.findOne({
      name: name.trim(),
      $or: [
        { owner: userId },
        { 'members.user': userId }
      ]
    });

    if (existingWorkspace) {
      return res.status(400).json({
        success: false,
        message: 'Workspace with this name already exists'
      });
    }

    // Create workspace
    const workspace = await Workspace.create({
      name: name.trim(),
      description: description?.trim(),
      owner: userId,
      settings: settings || {}
    });

    // Populate owner and members for response
    await workspace.populate('owner', 'name email');
    await workspace.populate('members.user', 'name email');

    res.status(201).json({
  success: true,
  message: 'Workspace created successfully',
  data: workspace
});

  } catch (error) {
    console.error('Create workspace error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating workspace',
      error: error.message
    });
  }
};

// @desc    Get all workspaces for authenticated user
// @route   GET /api/workspaces
// @access  Private
// @desc    Get all workspaces for authenticated user
// @route   GET /api/workspaces
// @access  Private
const getWorkspaces = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required - no user found'
      });
    }

    const userId = req.user.id;
    const { page = 1, limit = 10, search, sortBy = 'updatedAt', sortOrder = 'desc' } = req.query;

    let query = {
      $or: [
        { owner: userId },
        { 'members.user': userId }
      ]
    };

    // Add search functionality
    if (search) {
      query.$and = [
        query,
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ]
        }
      ];
    }

    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: sortObj,
      populate: [
        { path: 'owner', select: 'name email' },
        { path: 'members.user', select: 'name email' }
      ]
    };

    // Fetch workspaces
    const workspaces = await Workspace.paginate(query, options);

    // ✅ FIX: Get document counts for all workspaces in one query
    const workspaceIds = workspaces.docs.map(ws => ws._id);
    const documentCounts = await Document.aggregate([
      { $match: { workspace: { $in: workspaceIds } } },
      { $group: { _id: '$workspace', count: { $sum: 1 } } }
    ]);

    // Create a map for quick lookup
    const countMap = documentCounts.reduce((acc, item) => {
      acc[item._id.toString()] = item.count;
      return acc;
    }, {});

    // Add user role, permissions, and document count for each workspace
    const workspacesWithRoles = workspaces.docs.map(workspace => {
      const workspaceObj = workspace.toObject();

      // ✅ FIX: Add actual document count
      workspaceObj.documentCount = countMap[workspace._id.toString()] || 0;

      if (workspace.owner._id.toString() === userId.toString()) {
        workspaceObj.userRole = 'owner';
        workspaceObj.userPermissions = {
          canView: true,
          canEdit: true,
          canAdd: true,
          canDelete: true,
          canInvite: true
        };
      } else {
        workspaceObj.userRole = workspace.getUserRole(userId);
        workspaceObj.userPermissions = workspace.getUserPermissions(userId);
      }

      return workspaceObj;
    });

    res.status(200).json({
      success: true,
      data: {
        workspaces: workspacesWithRoles,
        totalDocs: workspaces.totalDocs,
        totalPages: workspaces.totalPages,
        currentPage: workspaces.page,
        hasNextPage: workspaces.hasNextPage,
        hasPrevPage: workspaces.hasPrevPage
      }
    });

  } catch (error) {
    console.error('Get workspaces error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching workspaces',
      error: error.message
    });
  }
};

// ✅ FIXED: Get single workspace - Middleware handles permission check
// @desc    Get single workspace by ID
// @route   GET /api/workspaces/:id
// @access  Private
const getWorkspace = async (req, res) => {
  try {
    const userId = req.user.id;
    const workspace = req.workspace;

    await workspace.populate('owner', 'name email');
    await workspace.populate('members.user', 'name email');

    const workspaceObj = workspace.toObject();
    
    // ✅ FIX: Add actual document count
    workspaceObj.documentCount = await Document.countDocuments({ workspace: workspace._id });
    
    if (workspace.owner._id.toString() === userId.toString()) {
      workspaceObj.userRole = 'owner';
      workspaceObj.userPermissions = {
        canView: true,
        canEdit: true,
        canAdd: true,
        canDelete: true,
        canInvite: true
      };
    } else {
      workspaceObj.userRole = workspace.getUserRole(userId);
      workspaceObj.userPermissions = workspace.getUserPermissions(userId);
    }

    res.status(200).json({
      success: true,
      data: {
        workspace: workspaceObj
      }
    });
  } catch (error) {
    console.error('Get workspace error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching workspace',
      error: error.message
    });
  }
};


// ✅ FIXED: Update workspace - Middleware handles permission check
// @desc    Update workspace
// @route   PUT /api/workspaces/:id
// @access  Private
const updateWorkspace = async (req, res) => {
  try {
    const { name, description, settings } = req.body;
    const workspace = req.workspace;

    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    if (name && name.trim() !== workspace.name) {
      const existingWorkspace = await Workspace.findOne({
        name: name.trim(),
        _id: { $ne: workspace._id },
        $or: [
          { owner: req.user.id },
          { 'members.user': req.user.id }
        ]
      });

      if (existingWorkspace) {
        return res.status(400).json({
          success: false,
          message: 'Workspace with this name already exists'
        });
      }
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim();
    if (settings) updateData.settings = { ...workspace.settings, ...settings };

const updatedWorkspace = await Workspace.findByIdAndUpdate(
  workspace._id,
  updateData,
  { new: true, runValidators: true }
)
  .populate({
    path: 'owner',
    select: 'name email',
    options: { strictPopulate: false }
  })
  .populate({
    path: 'members.user',
    select: 'name email',
    options: { strictPopulate: false }
  })
   // <-- converts to plain JS object, avoids circular refs

    if (!updatedWorkspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found after update' });
    }

    res.status(200).json({
      success: true,
      message: 'Workspace updated successfully',
      data: { workspace: updatedWorkspace }
    });

  } catch (error) {
    console.error('❌ Update workspace error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating workspace',
      error: error.message
    });
  }
};


// ✅ FIXED: Delete workspace - Middleware handles admin check
// @desc    Delete workspace
// @route   DELETE /api/workspaces/:id
// @access  Private
const deleteWorkspace = async (req, res) => {
  try {
    // Workspace is already attached by middleware and admin permission checked
    const workspace = req.workspace;

    // Check if workspace has documents
    const documentCount = await Document.countDocuments({ workspace: workspace._id });
    
    if (documentCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete workspace. It contains ${documentCount} document(s). Please remove all documents first.`
      });
    }

    await Workspace.findByIdAndDelete(workspace._id);

    res.status(200).json({
      success: true,
      message: 'Workspace deleted successfully'
    });

  } catch (error) {
    console.error('Delete workspace error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting workspace',
      error: error.message
    });
  }
};

// ✅ FIXED: Add member - Now forces invitation system
// @desc    Add member to workspace (REDIRECTS TO INVITATION SYSTEM)
// @route   POST /api/workspaces/:id/members
// @access  Private
const addMember = async (req, res) => {
  // ✅ CRITICAL: Force invitation-only flow
  return res.status(400).json({
    success: false,
    message: 'Direct member addition is disabled. Please use the invitation system.',
    redirectTo: {
      endpoint: '/api/invitations/send',
      method: 'POST',
      requiredData: {
        workspaceId: req.params.id,
        inviteeEmail: 'user@example.com',
        role: 'viewer|editor|admin',
        customMessage: 'Optional custom message'
      }
    },
    example: {
      method: 'POST',
      url: '/api/invitations/send',
      body: {
        workspaceId: req.params.id,
        inviteeEmail: 'newuser@example.com',
        role: 'editor',
        customMessage: 'Welcome to our workspace!'
      }
    }
  });
};

// ✅ FIXED: Remove member - Middleware handles permission check
// @desc    Remove member from workspace
// @route   DELETE /api/workspaces/:id/members/:memberId
// @access  Private
const removeMember = async (req, res) => {
  try {
    const memberId = req.params.memberId;
    // Workspace is already attached by middleware and permission checked
    const workspace = req.workspace;

    // Cannot remove workspace owner
    if (workspace.owner.toString() === memberId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove workspace owner'
      });
    }

    // Remove member
    workspace.members = workspace.members.filter(
      member => member.user.toString() !== memberId
    );

    await workspace.save();

    res.status(200).json({
      success: true,
      message: 'Member removed successfully'
    });

  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing member',
      error: error.message
    });
  }
};


// ✅ FIXED: Update member role - Middleware handles permission check
// @desc    Update member role/permissions
// @route   PUT /api/workspaces/:id/members/:memberId
// @access  Private
const updateMemberRole = async (req, res) => {
 

  try {
     console.log("-----updateMemberRole Debug:");
console.log("- workspace:", req.workspace ? req.workspace._id : "undefined");
console.log("- memberId:", req.params.memberId);
console.log("- role:", req.body.role);
console.log("- workspace members:", req.workspace?.members);
    const memberId = req.params.memberId;
    const { role, permissions } = req.body;
    // Workspace is already attached by middleware and permission checked
    const workspace = req.workspace;

    // Cannot update workspace owner role
    if (workspace.owner.toString() === memberId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update workspace owner role'
      });
    }

    // Find and update member
    const memberIndex = workspace.members.findIndex(
      member => member.user.toString() === memberId
    );

    if (memberIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in workspace'
      });
    }

    // Update role and permissions
    if (role) {
      workspace.members[memberIndex].role = role;
      
      // ✅ FIXED: Auto-update permissions when role changes
      if (!permissions) {
        workspace.members[memberIndex].permissions = getDefaultPermissionsForRole(role);

      }
    }

    if (permissions) {
      // ✅ FIXED: Normalize permissions to backend format
      // Check if permissions are in frontend format and convert if needed
      const frontendKeys = ['read', 'write', 'delete', 'manage', 'invite'];
      const hasFrontendKeys = Object.keys(permissions).some(key => frontendKeys.includes(key));
      
      if (hasFrontendKeys) {
        workspace.members[memberIndex].permissions = mapFrontendToBackend(permissions);
      } else {
        // Already in backend format, validate and use directly
        workspace.members[memberIndex].permissions = {
          canView: permissions.canView ?? false,
          canEdit: permissions.canEdit ?? false,
          canAdd: permissions.canAdd ?? false,
          canDelete: permissions.canDelete ?? false,
          canInvite: permissions.canInvite ?? false
        };
      }
    }

    await workspace.save();
    await workspace.populate('members.user', 'name email');

   res.status(200).json({
  success: true,
  message: 'Member role updated successfully',
  data: {
    workspace: workspace
  }
});

  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating member role',
      error: error.message
    });
  }
};

// ✅ FIXED: Leave workspace - Middleware handles permission check
// @desc    Leave workspace
// @route   POST /api/workspaces/:id/leave
// @access  Private
const leaveWorkspace = async (req, res) => {
  try {
    const userId = req.user.id;
    // Workspace is already attached by middleware
    const workspace = req.workspace;

    // Owner cannot leave workspace
    if (workspace.owner.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Workspace owner cannot leave. Transfer ownership or delete workspace instead.'
      });
    }

    // Remove user from members
    workspace.members = workspace.members.filter(
      member => member.user.toString() !== userId
    );

    await workspace.save();

    res.status(200).json({
      success: true,
      message: 'Successfully left workspace'
    });

  } catch (error) {
    console.error('Leave workspace error:', error);
    res.status(500).json({
      success: false,
      message: 'Error leaving workspace',
      error: error.message
    });
  }
};

// ✅ FIXED: Get workspace stats - Middleware handles permission check
// @desc    Get workspace statistics
// @route   GET /api/workspaces/:id/stats
// @access  Private
const getWorkspaceStats = async (req, res) => {
  try {
    // Workspace is already attached by middleware and permission checked
    const workspace = req.workspace;

    // Get document statistics
    const documentStats = await Document.aggregate([
      { $match: { workspace: workspace._id } },
      {
        $group: {
          _id: null,
          totalDocuments: { $sum: 1 },
          totalSize: { $sum: '$size' },
          avgSize: { $avg: '$size' },
          typeBreakdown: { $push: '$type' },
          recentUploads: {
            $sum: {
              $cond: [
                { $gte: ['$uploadDate', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const stats = documentStats[0] || {
      totalDocuments: 0,
      totalSize: 0,
      avgSize: 0,
      typeBreakdown: [],
      recentUploads: 0
    };

    // Process type breakdown
    const typeStats = stats.typeBreakdown.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // ✅ FIXED: Correct member count calculation
    // The members array already includes the owner (added by pre-save hook)
    // So we just count the members array length
    const totalMembers = workspace.members.length;
    
    // ✅ FIXED: Correct role breakdown
    // Count roles from members array only (owner is already in there)
    const roleBreakdown = workspace.members.reduce((acc, member) => {
      acc[member.role] = (acc[member.role] || 0) + 1;
      return acc;
    }, {});

    console.log('📊 Stats Calculation Debug:', {
      workspaceName: workspace.name,
      membersArrayLength: workspace.members.length,
      totalMembers: totalMembers,
      roleBreakdown: roleBreakdown,
      ownerId: workspace.owner.toString(),
      memberIds: workspace.members.map(m => ({
        id: m.user.toString(),
        role: m.role
      }))
    });

    const response = {
      workspace: {
        id: workspace._id,
        name: workspace.name,
        memberCount: totalMembers,  // ✅ FIXED: Just the members array length
        createdAt: workspace.createdAt,
        lastActivity: workspace.updatedAt
      },
      documents: {
        total: stats.totalDocuments,
        totalSize: stats.totalSize,
        averageSize: Math.round(stats.avgSize || 0),
        recentUploads: stats.recentUploads,
        typeBreakdown: typeStats
      },
      members: {
        total: totalMembers,  // ✅ FIXED: Correct total
        byRole: roleBreakdown  // ✅ FIXED: No double counting
      }
    };

    console.log('✅ Final stats response:', response);

    res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('❌ Get workspace stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching workspace statistics',
      error: error.message
    });
  }
};

module.exports = {
  createWorkspace,
  getWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  addMember,
  removeMember,
  updateMemberRole,
  leaveWorkspace,
  getWorkspaceStats
};