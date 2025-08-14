const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const WorkspaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a workspace name'],
    trim: true,
    maxlength: [100, 'Workspace name cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Workspace must have an owner']
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'editor', 'viewer'],
      default: 'viewer'
    },
    permissions: {
      canView: {
        type: Boolean,
        default: true
      },
      canEdit: {
        type: Boolean,
        default: false
      },
      canAdd: {
        type: Boolean,
        default: false
      },
      canDelete: {
        type: Boolean,
        default: false
      },
      canInvite: {
        type: Boolean,
        default: false
      }
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  settings: {
    isPublic: {
      type: Boolean,
      default: false
    },
    allowMemberInvites: {
      type: Boolean,
      default: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
WorkspaceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Ensure owner is automatically added as admin member
WorkspaceSchema.pre('save', function(next) {
  // Only add owner to members if this is a new workspace
  if (this.isNew) {
    // Check if owner is not already in members array
    const ownerExists = this.members.some(member => 
      member.user.toString() === this.owner.toString()
    );
    
    if (!ownerExists) {
      this.members.push({
        user: this.owner,
        role: 'admin',
        permissions: {
          canView: true,
          canEdit: true,
          canAdd: true,
          canDelete: true,
          canInvite: true
        },
        joinedAt: new Date()
      });
    }
  }
  next();
});

// Create indexes for better query performance
WorkspaceSchema.index({ name: 'text', description: 'text' });
WorkspaceSchema.index({ owner: 1 });
WorkspaceSchema.index({ 'members.user': 1 });
WorkspaceSchema.index({ createdAt: -1 });

// Instance method to check if user is member
WorkspaceSchema.methods.isMember = function(userId) {
  return this.members.some(member => 
    member.user.toString() === userId.toString()
  );
};

// Instance method to get user's role in workspace
WorkspaceSchema.methods.getUserRole = function(userId) {
  const member = this.members.find(member => 
    member.user.toString() === userId.toString()
  );
  return member ? member.role : null;
};

// Instance method to get user's permissions in workspace
WorkspaceSchema.methods.getUserPermissions = function(userId) {
  const member = this.members.find(member => 
    member.user.toString() === userId.toString()
  );
  return member ? member.permissions : null;
};

// Instance method to check if user has specific permission
WorkspaceSchema.methods.hasPermission = function(userId, permission) {
  const userPermissions = this.getUserPermissions(userId);
  return userPermissions ? userPermissions[permission] : false;
};

// Static method to find workspaces for a user
WorkspaceSchema.statics.findUserWorkspaces = function(userId) {
  return this.find({
    $or: [
      { owner: userId },
      { 'members.user': userId }
    ]
  }).populate('owner', 'name email')
    .populate('members.user', 'name email')
    .sort({ updatedAt: -1 });
};

// Static method to find public workspaces
WorkspaceSchema.statics.findPublicWorkspaces = function() {
  return this.find({ 'settings.isPublic': true })
    .populate('owner', 'name email')
    .sort({ createdAt: -1 });
};

// Virtual for member count
WorkspaceSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Virtual for document count (will be populated when documents are linked)
WorkspaceSchema.virtual('documentCount', {
  ref: 'Document',
  localField: '_id',
  foreignField: 'workspace',
  count: true
});

// Ensure virtuals are included in JSON output
WorkspaceSchema.set('toJSON', { virtuals: true });
WorkspaceSchema.set('toObject', { virtuals: true });
WorkspaceSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Workspace', WorkspaceSchema);