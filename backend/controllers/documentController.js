// documentController.js - Updated for GridFS storage
const mongoose = require('mongoose');
const Document = require('../models/documentModel');
const User = require('../models/userModel');
const Workspace = require('../models/workspaceModel');
const DocumentHistory = require('../models/documentHistoryModel');
const path = require('path');
const { ObjectId } = mongoose.Types;

// Set up GridFS bucket
let gfs;

// ✅ FIXED: Initialize GridFS safely with connection check
const getGridFS = () => {
  if (!gfs) {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB connection not ready. Cannot initialize GridFS.');
    }
    gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'uploads'
    });
    console.log('GridFS initialized successfully');
  }
  return gfs;
};

// Initialize on connection open
mongoose.connection.once('open', () => {
  try {
    getGridFS();
  } catch (error) {
    console.error('Failed to initialize GridFS:', error);
  }
});

// @desc    Upload new document
// @route   POST /api/documents
// @access  Private
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    const file = req.files.file;

    // Check file size (limit to 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'File size cannot exceed 50MB'
      });
    }

    // Create a unique filename
    const fileId = new ObjectId();
    const fileName = `document_${req.user.id}_${Date.now()}${path.extname(file.name)}`;

    // ✅ FIXED: Get GridFS instance safely
    const gridFS = getGridFS();

    // Create writable stream to GridFS
    const writeStream = gridFS.openUploadStreamWithId(fileId, fileName, {
      contentType: file.mimetype,
      metadata: {
        originalName: file.name,
        ownerId: req.user.id
      }
    });

    // Write file buffer to GridFS
    writeStream.write(file.data);
    writeStream.end();

    // Wait for the upload to complete
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // Create document record in database
    const document = await Document.create({
      name: req.body.name || file.name,
      originalName: file.name,
      path: fileId.toString(),
      size: file.size,
      type: file.mimetype,
      owner: req.user.id,
      uploadedBy: req.user.id,
      workspace: req.body.workspaceId, // Make sure this is being passed
      description: req.body.description,
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
      // For workspace documents, don't add individual permissions
      permissions: req.body.workspaceId ? [] : [{
        user: req.user.id,
        access: 'write'
      }]
    });

    // Populate the response
    await document.populate([
      { path: 'owner', select: 'name email' },
      { path: 'workspace', select: 'name' },
      { path: 'uploadedBy', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({
      success: false,
      message: 'Could not upload document',
      error: error.message
    });
  }
};

// @desc    Get all documents
// @route   GET /api/documents
// @access  Private
exports.getDocuments = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required - no user found'
      });
    }

    // ✅ PERFORMANCE FIX: Parallel queries instead of sequential
    const [userWorkspaces, documents] = await Promise.all([
      // Get user workspaces with minimal fields
      Workspace.find({
        $or: [
          { owner: req.user.id },
          { 'members.user': req.user.id }
        ]
      }).select('_id').lean(), // ✅ Use lean() for better performance

      // Get documents with optimized query
      Document.find({
        $or: [
          { owner: req.user.id },
          { 'permissions.user': req.user.id }
        ]
      })
        .populate('owner', 'name email')
        .populate('workspace', 'name')
        .select('-__v -permissions') // ✅ Exclude heavy fields
        .lean() // ✅ Return plain objects for faster processing
        .sort({ uploadDate: -1 }) // ✅ Use indexed field
        .limit(50) // ✅ Limit results for dashboard
    ]);

    const workspaceIds = userWorkspaces.map(ws => ws._id);

    // ✅ Get workspace documents separately to avoid $in query overhead
    const workspaceDocuments = await Document.find({
      workspace: { $in: workspaceIds },
      owner: { $ne: req.user.id } // Exclude own documents (already fetched)
    })
      .populate('owner', 'name email')
      .populate('workspace', 'name')
      .select('-__v -permissions')
      .lean()
      .sort({ uploadDate: -1 })
      .limit(50);

    // ✅ Combine and deduplicate results
    const allDocuments = [
      ...documents,
      ...workspaceDocuments.filter(doc =>
        !documents.some(existingDoc => existingDoc._id.toString() === doc._id.toString())
      )
    ];

    // ✅ Sort final results
    allDocuments.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

    // Attach current user's favorite status (favoritedBy excluded above via projection is not the case here,
    // it's still on the lean object since it wasn't excluded)
    const allDocumentsWithFavorite = allDocuments.map(doc => ({
      ...doc,
      isFavorite: Array.isArray(doc.favoritedBy) &&
        doc.favoritedBy.some(favUserId => favUserId.toString() === req.user.id)
    }));

    res.status(200).json({
      success: true,
      count: allDocumentsWithFavorite.length,
      data: allDocumentsWithFavorite
    });
  } catch (error) {
    console.error('Error getting documents:', error);
    res.status(500).json({
      success: false,
      message: 'Could not retrieve documents',
      error: error.message
    });
  }
};


// @desc    Get workspace documents
// @route   GET /api/documents/workspace/:workspaceId
// @access  Private
exports.getWorkspaceDocuments = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    // Verify user has access to this workspace
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Check if user is owner or member
    const isOwner = workspace.owner.toString() === req.user.id;
    const isMember = workspace.members.some(
      member => member.user.toString() === req.user.id
    );

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not a member of this workspace'
      });
    }

    // Get documents in the workspace, optionally filtered by due-date range
    // (for the calendar view — e.g. ?dueDateFrom=2026-08-01&dueDateTo=2026-08-31).
    // Built as a fresh object per request, never mutated in place, to avoid
    // repeating the self-referencing $and bug fixed earlier in workspaceController.
    const { dueDateFrom, dueDateTo } = req.query;
    const documentQuery = { workspace: workspaceId };

    if (dueDateFrom || dueDateTo) {
      documentQuery.dueDate = {};
      if (dueDateFrom) documentQuery.dueDate.$gte = new Date(dueDateFrom);
      if (dueDateTo) documentQuery.dueDate.$lte = new Date(dueDateTo);
    }

    const documents = await Document.find(documentQuery)
      .populate('owner', 'name email')
      .populate('uploadedBy', 'name email')
      .select('-__v')
      .sort({ createdAt: -1 });

    // Attach current user's permission per document
    const documentsWithPermissions = documents.map(doc => {
      let userPermission = { access: 'none' };

      // Owner of document can write
      if (doc.owner._id.toString() === req.user.id) {
        userPermission.access = 'write';
      } else {
        // Check explicit permissions
        const perm = doc.permissions.find(
          p => p.user.toString() === req.user.id
        );
        if (perm) userPermission.access = perm.access; // 'read' or 'write'
      }

      const isFavorite = doc.favoritedBy.some(
        favUserId => favUserId.toString() === req.user.id
      );

      return {
        ...doc.toObject(),
        userPermission,
        isFavorite,
      };
    });

    res.status(200).json({
      success: true,
      count: documentsWithPermissions.length,
      data: documentsWithPermissions
    });

  } catch (error) {
    console.error('Error getting workspace documents:', error);
    res.status(500).json({
      success: false,
      message: 'Could not retrieve workspace documents',
      error: error.message
    });
  }
};
console.log("✅ documentController.js loaded");

exports.getDashboardData = async (req, res) => {
  try {
    // Get user workspaces
    const userWorkspaces = await Workspace.find({
      $or: [
        { owner: req.user.id },
        { "members.user": req.user.id }
      ]
    }).select("_id name").lean();

    const workspaceIds = userWorkspaces.map(ws => ws._id);
    const userObjectId = new mongoose.Types.ObjectId(req.user.id);

    const accessFilter = {
      $or: [
        { owner: userObjectId },
        { "permissions.user": userObjectId },
        { workspace: { $in: workspaceIds } }
      ]
    };

    // Upcoming deadlines window: today through 7 days out.
    const now = new Date();
    const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Combined query: recent docs + stats + reviewer queue + approver queue +
    // upcoming deadlines (5 DB calls in parallel, not sequential).
    const [recentDocs, stats, reviewerQueue, approverQueue, upcomingDeadlines] = await Promise.all([
      Document.find(accessFilter)
        // status/dueDate/workflow added so the "needs my attention" UI can show
        // assigned reviewer/approver on the recent-documents list too, not just
        // in the two dedicated sections below.
        .select("name type uploadDate size workspace status dueDate workflow")
        .populate("workspace", "name")
        .populate("uploadedBy", "name email")
        .populate("workflow.reviewer", "name email")
        .populate("workflow.approver", "name email")
        .sort({ uploadDate: -1 })
        .limit(10)
        .lean(),

      Document.aggregate([
        { $match: accessFilter },
        {
          $group: {
            _id: null,
            totalDocs: { $sum: 1 },
            totalSize: { $sum: "$size" },
            thisMonth: {
              $sum: {
                $cond: [
                  { $gte: ["$uploadDate", new Date(new Date().getFullYear(), new Date().getMonth(), 1)] },
                  1, 0
                ]
              }
            },
            draftCount: { $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] } },
            inReviewCount: { $sum: { $cond: [{ $eq: ["$status", "in-review"] }, 1, 0] } },
            approvedCount: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] } }
          }
        }
      ]),

      // Documents in-review where the current user is the assigned reviewer —
      // supersedes the old `reviewers: userObjectId` array check (design_plan.md
      // Phase 3 replaced reviewers[] with workflow.reviewer/workflow.approver).
      Document.find({
        status: 'in-review',
        'workflow.reviewer': userObjectId
      })
        .select("name workspace status dueDate uploadedBy workflow")
        .populate("workspace", "name")
        .populate("uploadedBy", "name email")
        .populate("workflow.reviewer", "name email")
        .populate("workflow.approver", "name email")
        .sort({ lastModified: -1 })
        .limit(10)
        .lean(),

      // Documents in final-review where the current user is the assigned
      // approver — this queue didn't exist before; the old query only ever
      // matched status:'in-review', so an approver's documents never
      // surfaced in "needs my attention" at all.
      Document.find({
        status: 'final-review',
        'workflow.approver': userObjectId
      })
        .select("name workspace status dueDate uploadedBy workflow")
        .populate("workspace", "name")
        .populate("uploadedBy", "name email")
        .populate("workflow.reviewer", "name email")
        .populate("workflow.approver", "name email")
        .sort({ lastModified: -1 })
        .limit(10)
        .lean(),

      // Documents with a dueDate in the next 7 days, across everything the
      // user can access — feeds the calendar/deadlines widget.
      Document.find({
        ...accessFilter,
        dueDate: { $gte: now, $lte: sevenDaysOut }
      })
        .select("name workspace status dueDate")
        .populate("workspace", "name")
        .sort({ dueDate: 1 })
        .limit(10)
        .lean()
    ]);

    // attentionRole/attentionAction distinguish why an item is in the queue —
    // reviewer entries need "review" acted on them, approver entries need
    // "approve" — since the two are now genuinely different queries merged
    // into one list, not variations of the same one.
    const pendingReview = [
      ...reviewerQueue.map(doc => ({ ...doc, attentionRole: 'reviewer', attentionAction: 'review' })),
      ...approverQueue.map(doc => ({ ...doc, attentionRole: 'approver', attentionAction: 'approve' }))
    ].slice(0, 10);

    res.status(200).json({
      success: true,
      data: {
        recentDocuments: recentDocs,
        stats: stats[0] || {
          totalDocs: 0, totalSize: 0, thisMonth: 0,
          draftCount: 0, inReviewCount: 0, approvedCount: 0
        },
        pendingReview,
        upcomingDeadlines
      }
    });
  } catch (error) {
    console.error("Dashboard data error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};




// @desc    Get document statistics for workspace
// @route   GET /api/documents/workspace/:workspaceId/stats
// @access  Private
exports.getDocumentStats = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    // Aggregate document statistics
    const stats = await Document.aggregate([
      {
        $match: {
          workspace: new ObjectId(workspaceId),
          $or: [
            { owner: new ObjectId(req.user.id) },
            { 'permissions.user': new ObjectId(req.user.id) }
          ]
        }
      },
      {
        $group: {
          _id: null,
          totalDocuments: { $sum: 1 },
          totalSize: { $sum: '$size' },
          avgSize: { $avg: '$size' },
          documentsThisMonth: {
            $sum: {
              $cond: [
                {
                  $gte: [
                    '$createdAt',
                    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                  ]
                },
                1,
                0
              ]
            }
          },
          documentsThisWeek: {
            $sum: {
              $cond: [
                {
                  $gte: [
                    '$createdAt',
                    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalDocuments: 0,
      totalSize: 0,
      avgSize: 0,
      documentsThisMonth: 0,
      documentsThisWeek: 0
    };

    // Get document type breakdown
    const typeBreakdown = await Document.aggregate([
      {
        $match: {
          workspace: new ObjectId(workspaceId),
          $or: [
            { owner: new ObjectId(req.user.id) },
            { 'permissions.user': new ObjectId(req.user.id) }
          ]
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalSize: { $sum: '$size' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...result,
        typeBreakdown
      }
    });
  } catch (error) {
    console.error('Error getting document stats:', error);
    res.status(500).json({
      success: false,
      message: 'Could not retrieve document statistics',
      error: error.message
    });
  }
};

// @desc    Get single document
// @route   GET /api/documents/:id
// @access  Private
exports.getDocument = async (req, res) => {
  try {
    // Access already verified and document fetched by checkDocumentAccess middleware
    res.status(200).json({
      success: true,
      data: req.document
    });
  } catch (error) {
    console.error('Error getting document:', error);
    res.status(500).json({
      success: false,
      message: 'Could not retrieve document',
      error: error.message
    });
  }
};

// @desc    Toggle favorite status of a document for the current user
// @route   PUT /api/documents/:id/favorite
// @access  Private
exports.toggleFavorite = async (req, res) => {
  try {
    // Access already verified (membership + legacy share + ownership) and
    // document fetched by checkDocumentAccess(['canView']) middleware — see
    // documentRoutes.js. No re-lookup or re-check needed here.
    const document = req.document;
    const userId = req.user.id;
    const alreadyFavorited = document.favoritedBy.some(
      favUserId => favUserId.toString() === userId
    );

    if (alreadyFavorited) {
      document.favoritedBy = document.favoritedBy.filter(
        favUserId => favUserId.toString() !== userId
      );
    } else {
      document.favoritedBy.push(userId);
    }

    await document.save();

    res.status(200).json({
      success: true,
      data: {
        _id: document._id,
        isFavorite: !alreadyFavorited
      }
    });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({
      success: false,
      message: 'Could not toggle favorite',
      error: error.message
    });
  }
};

// @desc    Get all documents favorited by the current user
// @route   GET /api/documents/favorites
// @access  Private
exports.getFavoriteDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ favoritedBy: req.user.id })
      .sort({ lastModified: -1 });

    const documentsWithFlag = documents.map(doc => {
      const docObj = doc.toObject();
      docObj.isFavorite = true;
      return docObj;
    });

    res.status(200).json({
      success: true,
      count: documentsWithFlag.length,
      data: documentsWithFlag
    });
  } catch (error) {
    console.error('Error getting favorite documents:', error);
    res.status(500).json({
      success: false,
      message: 'Could not retrieve favorite documents',
      error: error.message
    });
  }
};

const STATUS_VALUES = [
  'draft',
  'in-review',
  'final-review',
  'approved'
];

// @desc    Update document lifecycle status
// @route   PATCH /api/documents/:id/status
// @access  Private
exports.updateDocumentStatus = async (req, res) => {
  try {
    const { status: newStatus, comment } = req.body;

    // ----------------------------------------------------------
    // 1. Validate requested status
    // ----------------------------------------------------------
    if (!STATUS_VALUES.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${STATUS_VALUES.join(', ')}`
      });
    }

    // ----------------------------------------------------------
    // 2. Get document
    // ----------------------------------------------------------
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // ----------------------------------------------------------
    // 3. Get workspace
    // ----------------------------------------------------------
    const workspace = await Workspace.findById(document.workspace);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    const userId = req.user._id.toString();

    // ----------------------------------------------------------
    // 4. Check workspace membership
    // ----------------------------------------------------------
    const member = workspace.members.find(
      member => member.user.toString() === userId
    );

    const isOwner =
      workspace.owner.toString() === userId;

    if (!member && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not a member of this workspace'
      });
    }

    // ----------------------------------------------------------
    // 5. Get workflow assignments
    // ----------------------------------------------------------
    const reviewerId =
      document.workflow?.reviewer?.toString() || null;

    const approverId =
      document.workflow?.approver?.toString() || null;

    const isAssignedReviewer =
      reviewerId === userId;

    const isAssignedApprover =
      approverId === userId;

    const currentStatus = document.status;

    // Captured per-branch below, written to DocumentHistory after a successful
    // save. No Mongoose session/transaction is used anywhere in this file, so
    // this is "same request lifecycle," not a true atomic DB transaction — if
    // document.save() succeeds but DocumentHistory.create() fails, the status
    // change persists without a matching history record. Logged loudly if so.
    let historyAction = null;
    let historyActingRole = null;

    // ----------------------------------------------------------
    // 6. Validate workflow assignments
    // ----------------------------------------------------------

    // Uploader cannot be reviewer
    if (
      reviewerId &&
      reviewerId === document.uploadedBy.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: 'The document uploader cannot be the assigned reviewer'
      });
    }

    // Reviewer and approver cannot be the same person
    if (
      reviewerId &&
      approverId &&
      reviewerId === approverId
    ) {
      return res.status(400).json({
        success: false,
        message: 'The reviewer and approver must be different users'
      });
    }

    // ----------------------------------------------------------
    // 7. DRAFT → IN-REVIEW
    // ----------------------------------------------------------
    if (
      currentStatus === 'draft' &&
      newStatus === 'in-review'
    ) {
      // Workflow must be configured before submission
      if (!reviewerId || !approverId) {
        return res.status(400).json({
          success: false,
          message:
            'A reviewer and final approver must be assigned before submitting the document for review'
        });
      }

      // Reviewer must belong to workspace
      const reviewerIsMember = workspace.members.some(
        member => member.user.toString() === reviewerId
      );

      const reviewerIsOwner =
        workspace.owner.toString() === reviewerId;

      if (!reviewerIsMember && !reviewerIsOwner) {
        return res.status(400).json({
          success: false,
          message: 'Assigned reviewer must belong to this workspace'
        });
      }

      // Approver must belong to workspace
      const approverIsMember = workspace.members.some(
        member => member.user.toString() === approverId
      );

      const approverIsOwner =
        workspace.owner.toString() === approverId;

      if (!approverIsMember && !approverIsOwner) {
        return res.status(400).json({
          success: false,
          message: 'Assigned approver must belong to this workspace'
        });
      }

      // User submitting the document needs edit permission
      const canEdit =
        isOwner || member?.permissions?.canEdit === true;

      if (!canEdit) {
        return res.status(403).json({
          success: false,
          message:
            'You do not have permission to submit this document for review'
        });
      }

      document.status = 'in-review';
      historyAction = 'submitted';
      historyActingRole = 'editor';
    }
    // ----------------------------------------------------------
    // 8. IN-REVIEW → DRAFT
    // Reviewer requests changes
    // ----------------------------------------------------------
    else if (
      currentStatus === 'in-review' &&
      newStatus === 'draft'
    ) {
      if (!isAssignedReviewer) {
        return res.status(403).json({
          success: false,
          message:
            'Only the assigned reviewer can request changes'
        });
      }

      if (!comment || !comment.trim()) {
        return res.status(400).json({
          success: false,
          message:
            'A comment is required when requesting changes'
        });
      }

      document.status = 'draft';
      historyAction = 'changes_requested';
      historyActingRole = 'reviewer';
    }

    // ----------------------------------------------------------
    // 9. IN-REVIEW → FINAL-REVIEW
    // Reviewer passes document
    // ----------------------------------------------------------
    else if (
      currentStatus === 'in-review' &&
      newStatus === 'final-review'
    ) {
      if (!isAssignedReviewer) {
        return res.status(403).json({
          success: false,
          message:
            'Only the assigned reviewer can pass the document to final review'
        });
      }

      document.status = 'final-review';
      historyAction = 'review_passed';
      historyActingRole = 'reviewer';
    }

    // ----------------------------------------------------------
    // 10. FINAL-REVIEW → IN-REVIEW
    // Final approver requests changes
    // ----------------------------------------------------------
    else if (
      currentStatus === 'final-review' &&
      newStatus === 'in-review'
    ) {
      if (!isAssignedApprover) {
        return res.status(403).json({
          success: false,
          message:
            'Only the assigned final approver can request changes'
        });
      }

      if (!comment || !comment.trim()) {
        return res.status(400).json({
          success: false,
          message:
            'A comment is required when requesting changes'
        });
      }

      document.status = 'in-review';
      historyAction = 'changes_requested';
      historyActingRole = 'approver';
    }
    // ----------------------------------------------------------
    // 11. FINAL-REVIEW → APPROVED
    // Final approver approves document
    // ----------------------------------------------------------
    else if (
      currentStatus === 'final-review' &&
      newStatus === 'approved'
    ) {
      if (!isAssignedApprover) {
        return res.status(403).json({
          success: false,
          message:
            'Only the assigned final approver can approve this document'
        });
      }

      document.status = 'approved';
      document.approvedAt = new Date();
      document.approvedBy = req.user._id;
      historyAction = 'approved';
      historyActingRole = 'approver';
    }

    // ----------------------------------------------------------
    // 12. APPROVED → IN-REVIEW
    // Workspace owner override
    // ----------------------------------------------------------
    else if (
      currentStatus === 'approved' &&
      newStatus === 'in-review'
    ) {
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message:
            'Only the workspace owner can reopen an approved document'
        });
      }

      if (!comment || !comment.trim()) {
        return res.status(400).json({
          success: false,
          message:
            'A comment is required when reopening an approved document'
        });
      }

      document.status = 'in-review';

      // The document is no longer currently approved.
      // The historical approval will later be preserved
      // through DocumentHistory.
      document.approvedAt = undefined;
      document.approvedBy = undefined;
      historyAction = 'overridden';
      historyActingRole = 'owner-override';
    }

    // ----------------------------------------------------------
    // 13. Prevent every other transition
    // ----------------------------------------------------------
    else {
      return res.status(403).json({
        success: false,
        message:
          `Invalid workflow transition from '${currentStatus}' to '${newStatus}'`
      });
    }

    // ----------------------------------------------------------
    // 14. Update modification information
    // ----------------------------------------------------------
    document.lastModifiedBy = req.user._id;

    await document.save();

    // ----------------------------------------------------------
    // 14b. Write audit trail — see design_plan.md Phase 7. Not part of the
    // same DB transaction as the save above (no session used anywhere in
    // this file); if this throws, the status change above has already
    // persisted. Logged loudly rather than silently swallowed so a gap in
    // the audit trail is visible in server logs, not just invisible in the UI.
    // ----------------------------------------------------------
    try {
      await DocumentHistory.create({
        document: document._id,
        action: historyAction,
        fromStatus: currentStatus,
        toStatus: document.status,
        performedBy: req.user._id,
        actingRole: historyActingRole,
        comment: comment && comment.trim() ? comment.trim() : undefined
      });
    } catch (historyError) {
      console.error(
        `DocumentHistory write failed for document ${document._id} (status change to '${document.status}' already persisted):`,
        historyError
      );
    }

    // ----------------------------------------------------------
    // 15. Return updated document workflow
    // ----------------------------------------------------------
    return res.status(200).json({
      success: true,
      data: {
        _id: document._id,
        status: document.status,
        workflow: document.workflow,
        approvedAt: document.approvedAt,
        approvedBy: document.approvedBy,
        lastModifiedBy: document.lastModifiedBy
      }
    });

  } catch (error) {
    console.error('Error updating document status:', error);

    return res.status(500).json({
      success: false,
      message: 'Could not update document status',
      error: error.message
    });
  }
};



// @desc    Assign reviewer and final approver to a document
// @route   PATCH /api/documents/:id/workflow
// @access  Private (workspace owner or workflow manager)
exports.assignWorkflow = async (req, res) => {
  try {
    const { reviewerId, approverId } = req.body;

    // ----------------------------------------------------------
    // 1. Validate IDs
    // ----------------------------------------------------------
    if (!reviewerId || !approverId) {
      return res.status(400).json({
        success: false,
        message: 'Both reviewerId and approverId are required'
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(reviewerId) ||
      !mongoose.Types.ObjectId.isValid(approverId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reviewer or approver ID'
      });
    }

    // ----------------------------------------------------------
    // 2. Reviewer and approver must be different
    // ----------------------------------------------------------
    if (reviewerId === approverId) {
      return res.status(400).json({
        success: false,
        message: 'Reviewer and approver must be different users'
      });
    }

    // ----------------------------------------------------------
    // 3. Get document
    // ----------------------------------------------------------
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // ----------------------------------------------------------
    // 4. Get workspace
    // ----------------------------------------------------------
    const workspace = await Workspace.findById(document.workspace);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    const userId = req.user._id.toString();

    const isOwner =
      workspace.owner.toString() === userId;

    const member = workspace.members.find(
      member => member.user.toString() === userId
    );

    const canManageWorkflow =
      isOwner ||
      member?.permissions?.canManageWorkflow === true;

    if (!canManageWorkflow) {
      return res.status(403).json({
        success: false,
        message:
          'You do not have permission to manage this document workflow'
      });
    }

    // ----------------------------------------------------------
    // 5. Both users must belong to workspace
    // ----------------------------------------------------------
    const reviewerIsMember = workspace.members.some(
      member => member.user.toString() === reviewerId
    );

    const reviewerIsOwner =
      workspace.owner.toString() === reviewerId;

    const approverIsMember = workspace.members.some(
      member => member.user.toString() === approverId
    );

    const approverIsOwner =
      workspace.owner.toString() === approverId;

    if (!reviewerIsMember && !reviewerIsOwner) {
      return res.status(400).json({
        success: false,
        message: 'Reviewer must be a member of this workspace'
      });
    }

    if (!approverIsMember && !approverIsOwner) {
      return res.status(400).json({
        success: false,
        message: 'Approver must be a member of this workspace'
      });
    }

    // ----------------------------------------------------------
    // 6. Uploader cannot review their own document
    // ----------------------------------------------------------
    if (
      document.uploadedBy.toString() === reviewerId
    ) {
      return res.status(400).json({
        success: false,
        message:
          'The document uploader cannot be assigned as reviewer'
      });
    }

    // ----------------------------------------------------------
    // 7. Assign workflow
    // ----------------------------------------------------------
    document.workflow = {
      reviewer: reviewerId,
      approver: approverId
    };

    document.lastModifiedBy = req.user._id;

    await document.save();

    // ----------------------------------------------------------
    // 7b. Write audit trail — see design_plan.md Phase 7. Same caveat as
    // updateDocumentStatus above: no session/transaction, so this is
    // same-request-lifecycle, not atomic with the save above. A failure here
    // is logged loudly rather than silently swallowed or failing the request,
    // since the workflow assignment itself already succeeded.
    // ----------------------------------------------------------
    try {
      await DocumentHistory.create({
        document: document._id,
        action: 'workflow_assigned',
        fromStatus: document.status,
        toStatus: document.status,
        performedBy: req.user._id,
        actingRole: 'workflow-manager'
      });
    } catch (historyError) {
      console.error(
        `DocumentHistory write failed for document ${document._id} (workflow assignment already persisted):`,
        historyError
      );
    }

    // ----------------------------------------------------------
    // 8. Return populated workflow
    // ----------------------------------------------------------
    await document.populate([
      {
        path: 'workflow.reviewer',
        select: 'name email'
      },
      {
        path: 'workflow.approver',
        select: 'name email'
      }
    ]);

    return res.status(200).json({
      success: true,
      data: {
        _id: document._id,
        workflow: document.workflow
      }
    });

  } catch (error) {
    console.error('Error assigning document workflow:', error);

    return res.status(500).json({
      success: false,
      message: 'Could not assign document workflow',
      error: error.message
    });
  }
};

// @desc    Assign or replace the reviewer list for a document
// @route   PATCH /api/documents/:id/reviewers
// @access  Private (workspace admin or document owner only)
exports.assignReviewers = async (req, res) => {
  try {
    const { reviewerIds } = req.body;

    if (!Array.isArray(reviewerIds)) {
      return res.status(400).json({ success: false, message: 'reviewerIds must be an array of user IDs' });
    }

    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const workspace = await Workspace.findById(document.workspace);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    const userId = req.user._id.toString();
    const isOwner = workspace.owner.toString() === userId;
    const member = workspace.members.find(m => m.user.equals(req.user._id));
    const isAdmin = isOwner || member?.role === 'admin';
    const isDocOwner = document.owner.toString() === userId;

    if (!isAdmin && !isDocOwner) {
      return res.status(403).json({
        success: false,
        message: 'Only a workspace admin or the document owner can assign reviewers'
      });
    }

    // Reviewers must actually be members of the workspace.
    const workspaceMemberIds = new Set(workspace.members.map(m => m.user.toString()));
    const invalidIds = reviewerIds.filter(id => !workspaceMemberIds.has(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'All reviewers must be members of this workspace',
        invalidIds
      });
    }

    document.reviewers = reviewerIds;
    document.lastModifiedBy = req.user._id;
    await document.save();

    res.status(200).json({
      success: true,
      data: {
        _id: document._id,
        reviewers: document.reviewers
      }
    });
  } catch (error) {
    console.error('Error assigning reviewers:', error);
    res.status(500).json({
      success: false,
      message: 'Could not assign reviewers',
      error: error.message
    });
  }
};

// @desc    Update document
// @route   PUT /api/documents/:id
// @access  Private
exports.updateDocument = async (req, res) => {
  try {
    // Access already verified (membership + legacy share + ownership) and
    // document fetched by checkDocumentAccess(['canEdit']) middleware — see
    // documentRoutes.js. This is the fix for the gap where a legacy
    // (outside-workspace) 'write' share could view/favorite a document but
    // got a 403 here because this endpoint used to check workspace
    // membership only, ignoring document.permissions[] entirely.
    const document = req.document;

    // ---- Approved documents are locked from edits ----
    // Must go through PATCH /:id/status to move it back to draft/in-review first.
    // This is a lifecycle rule, not an access-control check, so it stays here
    // rather than moving into the middleware.
    if (document.status === 'approved') {
      return res.status(403).json({
        success: false,
        message: 'This document is approved and locked. Change its status before editing.'
      });
    }

    const userId = req.user._id.toString();

    // ---- Update fields ----
    if (req.body.name) document.name = req.body.name;
    if (req.body.description !== undefined) document.description = req.body.description;
    if (req.body.tags) document.tags = req.body.tags;
    if (req.body.dueDate !== undefined) {
      document.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : undefined;
    }
    if (req.body.expiryDate !== undefined) {
      document.expiryDate = req.body.expiryDate ? new Date(req.body.expiryDate) : undefined;
    }

    // ---- Update content if provided ----
    if (req.body.content && req.body.updateContent === true) {
      const fileId = new ObjectId();
      const fileName = `document_${userId}_${Date.now()}${path.extname(document.originalName)}`;

      const gridFS = getGridFS();
      const writeStream = gridFS.openUploadStreamWithId(fileId, fileName, {
        contentType: document.type,
        metadata: { originalName: document.originalName, ownerId: userId }
      });

      writeStream.write(Buffer.from(req.body.content));
      writeStream.end();

      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      try {
        if (document.path) {
          const gridFS = getGridFS();
          await gridFS.delete(new ObjectId(document.path));
        }
      } catch (err) {
        console.error('------Error deleting old file:', err);
      }

      document.path = fileId.toString();
      document.size = Buffer.byteLength(req.body.content);
    }

    document.lastModifiedBy = userId;
    await document.save();

    console.log("------Document updated successfully:", document._id);
    res.status(200).json({ success: true, data: document });

  } catch (error) {
    console.error('------Error updating document:', error);
    res.status(500).json({ success: false, message: 'Could not update document' });
  }
};




// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
exports.deleteDocument = async (req, res) => {
  try {
    // Access already verified (membership + legacy share + ownership) and
    // document fetched by checkDocumentAccess(['canDelete']) middleware —
    // see documentRoutes.js. This replaces the previous inline check, which
    // (a) never consulted document.permissions[], so a legacy external
    // 'write' share could never delete a document it was granted write
    // access to, and (b) duplicated logic that already existed correctly
    // in checkDocumentWorkspaceAccess (workspaceAuth.js).
    const document = req.document;

    // Delete file from GridFS
    try {
      if (document.path) {
        const fileId = new ObjectId(document.path);
        const gridFS = getGridFS();
        await gridFS.delete(fileId);
        console.log("File deleted from GridFS");
      }
    } catch (fileError) {
      console.error("Error deleting file from GridFS:", fileError);
    }

    await Document.deleteOne({ _id: req.params.id });
    console.log("Document deleted from database");

    res.status(200).json({
      success: true,
      message: "Document deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({
      success: false,
      message: "Could not delete document",
      error: error.message
    });
  }
};



// @desc    Get document content for preview
// @route   GET /api/documents/:id/preview
// @access  Private
exports.previewDocument = async (req, res) => {
  try {
    // Access already verified and document fetched by checkDocumentAccess middleware
    const document = req.document;

    // Get the file from GridFS
    try {
      const fileId = new ObjectId(document.path);

      // Check if file exists in GridFS
      const files = await mongoose.connection.db.collection('uploads.files').findOne({ _id: fileId });

      if (!files) {
        return res.status(404).json({
          success: false,
          message: 'File not found on server'
        });
      }

      // Set appropriate headers BEFORE streaming
      res.setHeader('Content-Type', document.type || 'application/octet-stream');
      res.setHeader('Content-Length', files.length);
      res.setHeader('Content-Disposition', `inline; filename="${document.originalName || document.name}"`);

      // ✅ FIXED: Get GridFS instance safely
      const gridFS = getGridFS();

      // Create download stream
      const downloadStream = gridFS.openDownloadStream(fileId);

      // Handle stream errors properly
      downloadStream.on('error', (err) => {
        console.error('GridFS stream error:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error streaming file'
          });
        }
      });

      // Handle successful stream end
      downloadStream.on('end', () => {
        console.log('File streamed successfully');
      });

      // Pipe the stream to response
      downloadStream.pipe(res);

    } catch (error) {
      console.error('Error accessing file in GridFS:', error);
      res.status(500).json({
        success: false,
        message: 'Could not access file',
        error: error.message
      });
    }
  } catch (error) {
    console.error('Error previewing document:', error);
    res.status(500).json({
      success: false,
      message: 'Could not preview document',
      error: error.message
    });
  }
};

// @desc    Get documents shared with the user (not owned by user)
// @route   GET /api/documents/shared
// @access  Private
exports.getSharedDocuments = async (req, res) => {
  try {
    // Find documents where user has permissions but is not the owner
    const documents = await Document.find({
      owner: { $ne: req.user.id }, // Not owned by the user
      'permissions.user': req.user.id // User has permissions
    }).select('-__v');

    const documentsWithFavorite = documents.map(doc => {
      const docObj = doc.toObject();
      docObj.isFavorite = doc.favoritedBy.some(
        favUserId => favUserId.toString() === req.user.id
      );
      return docObj;
    });

    res.status(200).json({
      success: true,
      count: documentsWithFavorite.length,
      data: documentsWithFavorite
    });
  } catch (error) {
    console.error('Error getting shared documents:', error);
    res.status(500).json({
      success: false,
      message: 'Could not retrieve shared documents',
      error: error.message
    });
  }
};

// @desc    Share document with another user
// @route   POST /api/documents/:id/share
// @access  Private
exports.shareDocument = async (req, res) => {
  try {
    const { userId, access } = req.body;

    if (!userId || !access) {
      return res.status(400).json({
        success: false,
        message: 'Please provide userId and access level (read/write)'
      });
    }

    if (!['read', 'write'].includes(access)) {
      return res.status(400).json({
        success: false,
        message: 'Access level must be either read or write'
      });
    }

    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user is owner
    if (document.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to share this document'
      });
    }

    // Check if permission already exists for this user
    const existingPermIndex = document.permissions.findIndex(
      perm => perm.user.toString() === userId
    );

    if (existingPermIndex >= 0) {
      // Update existing permission
      document.permissions[existingPermIndex].access = access;
    } else {
      // Add new permission
      document.permissions.push({
        user: userId,
        access
      });
    }

    await document.save();

    res.status(200).json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Error sharing document:', error);
    res.status(500).json({
      success: false,
      message: 'Could not share document',
      error: error.message
    });
  }
};

// @desc    Move document to different workspace
// @route   POST /api/documents/:id/move
// @access  Private
exports.moveDocument = async (req, res) => {
  try {
    const { workspaceId } = req.body;

    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide target workspace ID'
      });
    }

    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user is owner
    if (document.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to move this document'
      });
    }

    // Update workspace
    document.workspace = workspaceId;
    await document.save();

    res.status(200).json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Error moving document:', error);
    res.status(500).json({
      success: false,
      message: 'Could not move document',
      error: error.message
    });
  }
};

// @desc    Duplicate document
// @route   POST /api/documents/:id/duplicate
// @access  Private
exports.duplicateDocument = async (req, res) => {
  try {
    // Access already verified and document fetched by checkDocumentAccess middleware
    const originalDoc = req.document;

    // Create duplicate with new name
    const duplicateDoc = await Document.create({
      name: `${originalDoc.name} (Copy)`,
      originalName: originalDoc.originalName,
      path: originalDoc.path, // Same file in GridFS
      size: originalDoc.size,
      type: originalDoc.type,
      owner: req.user.id,
      workspace: req.body.workspaceId || originalDoc.workspace,
      permissions: [
        {
          user: req.user.id,
          access: 'write'
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: duplicateDoc
    });
  } catch (error) {
    console.error('Error duplicating document:', error);
    res.status(500).json({
      success: false,
      message: 'Could not duplicate document',
      error: error.message
    });
  }
};

// @desc    Get document versions/history
// @route   GET /api/documents/:id/versions
// @access  Private
exports.getDocumentVersions = async (req, res) => {
  try {
    // Access already verified and document fetched by checkDocumentAccess middleware
    const document = req.document;

    // For now, return the document itself as the only version
    // In a full implementation, you'd track version history
    res.status(200).json({
      success: true,
      data: [
        {
          id: document._id,
          version: '1.0',
          createdAt: document.createdAt,
          createdBy: document.owner,
          size: document.size,
          isCurrent: true
        }
      ]
    });
  } catch (error) {
    console.error('Error getting document versions:', error);
    res.status(500).json({
      success: false,
      message: 'Could not retrieve document versions',
      error: error.message
    });
  }
};

// @desc    Bulk delete documents
// @route   POST /api/documents/workspace/:workspaceId/bulk-delete
// @access  Private
exports.bulkDeleteDocuments = async (req, res) => {
  try {
    const { documentIds } = req.body;
    const { workspaceId } = req.params;

    if (!documentIds || !Array.isArray(documentIds)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of document IDs'
      });
    }

    // Find documents to delete
    const documents = await Document.find({
      _id: { $in: documentIds },
      workspace: workspaceId,
      owner: req.user.id // Only owner can bulk delete
    });

    if (documents.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No documents found or not authorized'
      });
    }

    // Delete files from GridFS
    const gridFS = getGridFS();
    for (const doc of documents) {
      try {
        const fileId = new ObjectId(doc.path);
        await gridFS.delete(fileId);
      } catch (fileError) {
        console.error(`Error deleting file ${doc.path} from GridFS:`, fileError);
      }
    }

    // Delete documents from database
    const result = await Document.deleteMany({
      _id: { $in: documentIds },
      workspace: workspaceId,
      owner: req.user.id
    });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} documents deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error bulk deleting documents:', error);
    res.status(500).json({
      success: false,
      message: 'Could not delete documents',
      error: error.message
    });
  }
};

// @desc    Export documents
// @route   GET /api/documents/workspace/:workspaceId/export
// @access  Private
exports.exportDocuments = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { format = 'json' } = req.query;

    // Get documents from workspace
    const documents = await Document.find({
      workspace: workspaceId,
      $or: [
        { owner: req.user.id },
        { 'permissions.user': req.user.id }
      ]
    })
      .populate('owner', 'name email')
      .select('-__v');

    if (format === 'csv') {
      // Export as CSV
      const csv = documents.map(doc => ({
        name: doc.name,
        originalName: doc.originalName,
        size: doc.size,
        type: doc.type,
        owner: doc.owner.name,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      }));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="workspace-${workspaceId}-documents.csv"`);

      // Simple CSV conversion (in production, use a proper CSV library)
      const csvString = [
        Object.keys(csv[0] || {}).join(','),
        ...csv.map(row => Object.values(row).join(','))
      ].join('\n');

      res.send(csvString);
    } else {
      // Export as JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="workspace-${workspaceId}-documents.json"`);

      res.status(200).json({
        success: true,
        workspace: workspaceId,
        exportedAt: new Date(),
        count: documents.length,
        data: documents
      });
    }
  } catch (error) {
    console.error('Error exporting documents:', error);
    res.status(500).json({
      success: false,
      message: 'Could not export documents',
      error: error.message
    });
  }
};