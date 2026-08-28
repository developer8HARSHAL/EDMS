const mongoose = require('mongoose');

const DocumentHistorySchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },

    action: {
      type: String,
      enum: ['workflow_assigned', 'submitted', 'changes_requested', 'review_passed', 'approved', 'overridden'],
      required: true,
    },

    fromStatus: {
      type: String,
    },

    toStatus: {
      type: String,
      required: true,
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    actingRole: {
      type: String,
      enum: ['editor', 'reviewer', 'approver', 'owner-override', 'workflow-manager'],
      required: true,
    },

    performedAt: {
      type: Date,
      default: Date.now,
    },

    comment: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: false,
  }
);

DocumentHistorySchema.index({
  document: 1,
  performedAt: -1,
});

module.exports = mongoose.model('DocumentHistory', DocumentHistorySchema);