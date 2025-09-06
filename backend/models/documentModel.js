const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a document name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  originalName: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: [true, 'File path is required']
  },
  size: {
    type: Number,
    required: [true, 'File size is required']
  },
  type: {
    type: String,
    required: [true, 'File type is required']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: [true, 'Document must belong to a workspace']
  },
  // Keep individual permissions for backward compatibility and additional granular control
  permissions: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      access: {
        type: String,
        enum: ['read', 'write'],
        default: 'read'
      }
    }
  ],
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot be more than 50 characters']
  }],
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  version: {
    type: Number,
    default: 1
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  uploadedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: true
},
  lastModified: {
    type: Date,
    default: Date.now
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Update lastModified timestamp before saving
DocumentSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastModified = Date.now();
  }
  next();
});

// Create indexes for better query performance
DocumentSchema.index({ name: 'text', description: 'text', tags: 'text' });
DocumentSchema.index({ owner: 1 });
DocumentSchema.index({ workspace: 1 });
DocumentSchema.index({ 'permissions.user': 1 });
DocumentSchema.index({ uploadDate: -1 });
DocumentSchema.index({ lastModified: -1 });
DocumentSchema.index({ type: 1 });
DocumentSchema.index({ tags: 1 });

// Compound indexes for common queries
DocumentSchema.index({ workspace: 1, owner: 1 });
DocumentSchema.index({ workspace: 1, uploadDate: -1 });
DocumentSchema.index({ workspace: 1, type: 1 });

// Instance method to check if user has access to document
DocumentSchema.methods.hasUserAccess = function(userId, accessType = 'read') {
  // Owner always has full access
  if (this.owner.toString() === userId.toString()) {
    return true;
  }

  // Check individual permissions
  const permission = this.permissions.find(
    perm => perm.user.toString() === userId.toString()
  );

  if (permission) {
    if (accessType === 'read') {
      return true; // Any permission grants read access
    }
    return permission.access === 'write';
  }

  return false;
};

// Instance method to add user permission
DocumentSchema.methods.addUserPermission = function(userId, access = 'read') {
  // Don't add permission for owner
  if (this.owner.toString() === userId.toString()) {
    return this;
  }

  // Check if permission already exists
  const existingPermission = this.permissions.find(
    perm => perm.user.toString() === userId.toString()
  );

  if (existingPermission) {
    existingPermission.access = access;
  } else {
    this.permissions.push({
      user: userId,
      access: access
    });
  }

  return this;
};

// Instance method to remove user permission
DocumentSchema.methods.removeUserPermission = function(userId) {
  this.permissions = this.permissions.filter(
    perm => perm.user.toString() !== userId.toString()
  );
  return this;
};

// Static method to find documents user can access
DocumentSchema.statics.findUserAccessible = function(userId, workspaceId = null) {
  const query = {
    $or: [
      { owner: userId },
      { 'permissions.user': userId },
      { isPublic: true }
    ]
  };

  if (workspaceId) {
    query.workspace = workspaceId;
  }

  return this.find(query)
    .populate('owner', 'name email')
    .populate('workspace', 'name')
    .populate('permissions.user', 'name email')
    .populate('lastModifiedBy', 'name email')
    .sort({ lastModified: -1 });
};

// Static method to find documents in workspace
DocumentSchema.statics.findByWorkspace = function(workspaceId, options = {}) {
  const {
    page = 1,
    limit = 10,
    sortBy = 'lastModified',
    sortOrder = -1,
    search = '',
    type = '',
    tags = []
  } = options;

  let query = { workspace: workspaceId };

  // Add search filter
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  // Add type filter
  if (type) {
    query.type = type;
  }

  // Add tags filter
  if (tags.length > 0) {
    query.tags = { $in: tags };
  }

  const sortObj = {};
  sortObj[sortBy] = sortOrder;

  return this.find(query)
    .populate('owner', 'name email')
    .populate('workspace', 'name')
    .populate('permissions.user', 'name email')
    .populate('lastModifiedBy', 'name email')
    .sort(sortObj)
    .limit(limit * 1)
    .skip((page - 1) * limit);
};

// Static method to get document statistics for workspace
DocumentSchema.statics.getWorkspaceStats = function(workspaceId) {
  return this.aggregate([
    { $match: { workspace: mongoose.Types.ObjectId(workspaceId) } },
    {
      $group: {
        _id: null,
        totalDocuments: { $sum: 1 },
        totalSize: { $sum: '$size' },
        typeBreakdown: {
          $push: '$type'
        },
        avgSize: { $avg: '$size' },
        latestUpload: { $max: '$uploadDate' },
        oldestUpload: { $min: '$uploadDate' }
      }
    },
    {
      $project: {
        _id: 0,
        totalDocuments: 1,
        totalSize: 1,
        avgSize: { $round: ['$avgSize', 2] },
        latestUpload: 1,
        oldestUpload: 1,
        typeBreakdown: {
          $reduce: {
            input: '$typeBreakdown',
            initialValue: {},
            in: {
              $mergeObjects: [
                '$$value',
                {
                  $arrayToObject: [
                    [
                      {
                        k: '$$this',
                        v: {
                          $add: [
                            { $ifNull: [{ $getField: { input: '$$value', field: '$$this' } }, 0] },
                            1
                          ]
                        }
                      }
                    ]
                  ]
                }
              ]
            }
          }
        }
      }
    }
  ]);
};

// Virtual for file size in human readable format
DocumentSchema.virtual('humanReadableSize').get(function() {
  const bytes = this.size;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// Virtual for file extension
DocumentSchema.virtual('extension').get(function() {
  return this.originalName.split('.').pop().toLowerCase();
});

// Ensure virtuals are included in JSON output
DocumentSchema.set('toJSON', { virtuals: true });
DocumentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Document', DocumentSchema);