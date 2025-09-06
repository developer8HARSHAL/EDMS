const mongoose = require('mongoose');
const crypto = require('crypto');

const WorkspaceInvitationSchema = new mongoose.Schema({
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: [true, 'Invitation must be associated with a workspace']
  },
  inviter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Invitation must have an inviter']
  },
  inviteeEmail: {
    type: String,
    required: [true, 'Invitee email is required'],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ],
    lowercase: true
  },
  inviteeUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Will be populated if user exists
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
  // FIXED: Remove required:true and let pre-save middleware handle generation
  token: {
    type: String,
    unique: true,
    // Generate default token immediately
    default: () => crypto.randomBytes(32).toString('hex')
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired'],
    default: 'pending'
  },
  message: {
    type: String,
    trim: true,
    maxlength: [500, 'Invitation message cannot be more than 500 characters']
  },
  // FIXED: Remove required:true and set default expiration
  expiresAt: {
    type: Date,
    // Generate default expiration immediately (7 days from now)
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  },
  acceptedAt: {
    type: Date,
    default: null
  },
  rejectedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware (now just for permissions and backup token/expiry generation)
WorkspaceInvitationSchema.pre('save', function(next) {
  // Backup token generation if somehow not set
  if (!this.token) {
    this.token = crypto.randomBytes(32).toString('hex');
  }
  
  // Backup expiration date if somehow not set
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  }
  
  // Set permissions based on role if not explicitly set
  if (this.isNew || this.isModified('role')) {
    switch (this.role) {
      case 'admin':
        this.permissions = {
          canView: true,
          canEdit: true,
          canAdd: true,
          canDelete: true,
          canInvite: true
        };
        break;
      case 'editor':
        this.permissions = {
          canView: true,
          canEdit: true,
          canAdd: true,
          canDelete: false,
          canInvite: false
        };
        break;
      case 'viewer':
      default:
        this.permissions = {
          canView: true,
          canEdit: false,
          canAdd: false,
          canDelete: false,
          canInvite: false
        };
        break;
    }
  }
  
  next();
});

// Create indexes for better query performance
WorkspaceInvitationSchema.index({ workspace: 1 });
WorkspaceInvitationSchema.index({ inviteeEmail: 1 });
WorkspaceInvitationSchema.index({ inviteeUser: 1 });
WorkspaceInvitationSchema.index({ token: 1 }, { unique: true });
WorkspaceInvitationSchema.index({ status: 1 });
WorkspaceInvitationSchema.index({ expiresAt: 1 });
WorkspaceInvitationSchema.index({ createdAt: -1 });

// Compound index for checking existing invitations
WorkspaceInvitationSchema.index({ workspace: 1, inviteeEmail: 1, status: 1 });

// Instance method to check if invitation is valid
WorkspaceInvitationSchema.methods.isValid = function() {
  return this.status === 'pending' && this.expiresAt > new Date();
};

// Instance method to check if invitation is expired
WorkspaceInvitationSchema.methods.isExpired = function() {
  return this.expiresAt <= new Date();
};

// Instance method to accept invitation
WorkspaceInvitationSchema.methods.accept = function() {
  if (!this.isValid()) {
    throw new Error('Cannot accept expired or invalid invitation');
  }
  
  this.status = 'accepted';
  this.acceptedAt = new Date();
  return this.save();
};

// Instance method to reject invitation
WorkspaceInvitationSchema.methods.reject = function() {
  if (!this.isValid()) {
    throw new Error('Cannot reject expired or invalid invitation');
  }
  
  this.status = 'rejected';
  this.rejectedAt = new Date();
  return this.save();
};

// Static method to find pending invitations for a user
WorkspaceInvitationSchema.statics.findPendingForUser = function(email) {
  return this.find({
    inviteeEmail: email,
    status: 'pending',
    expiresAt: { $gt: new Date() }
  }).populate('workspace', 'name description')
    .populate('inviter', 'name email')
    .sort({ createdAt: -1 });
};

// Static method to find invitations for a workspace
WorkspaceInvitationSchema.statics.findForWorkspace = function(workspaceId, status = null) {
  const query = { workspace: workspaceId };
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('inviter', 'name email')
    .populate('inviteeUser', 'name email')
    .sort({ createdAt: -1 });
};

// Static method to check if invitation already exists
WorkspaceInvitationSchema.statics.existsPending = function(workspaceId, email) {
  return this.findOne({
    workspace: workspaceId,
    inviteeEmail: email,
    status: 'pending',
    expiresAt: { $gt: new Date() }
  });
};

// Static method to expire old invitations
WorkspaceInvitationSchema.statics.expireOldInvitations = function() {
  return this.updateMany(
    {
      status: 'pending',
      expiresAt: { $lte: new Date() }
    },
    {
      $set: { status: 'expired' }
    }
  );
};

// Static method to clean up old invitations (older than 30 days)
WorkspaceInvitationSchema.statics.cleanupOldInvitations = function() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return this.deleteMany({
    $or: [
      { status: 'expired', createdAt: { $lt: thirtyDaysAgo } },
      { status: 'rejected', createdAt: { $lt: thirtyDaysAgo } }
    ]
  });
};

// Virtual for invitation URL
WorkspaceInvitationSchema.virtual('invitationUrl').get(function() {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${baseUrl}/invitation/${this.token}`;
});

// Ensure virtuals are included in JSON output
WorkspaceInvitationSchema.set('toJSON', { virtuals: true });
WorkspaceInvitationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('WorkspaceInvitation', WorkspaceInvitationSchema);