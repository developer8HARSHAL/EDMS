// documentController.js - Updated for GridFS storage
const mongoose = require('mongoose');
const Document = require('../models/documentModel');
const User = require('../models/userModel');
const Workspace = require('../models/workspaceModel');
const path = require('path');
const { ObjectId } = mongoose.Types;

// Set up GridFS bucket
let gfs;
mongoose.connection.once('open', () => {
  gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads'
  });
  console.log('GridFS initialized successfully');
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

    // Create writable stream to GridFS
    const writeStream = gfs.openUploadStreamWithId(fileId, fileName, {
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

    res.status(200).json({
      success: true,
      count: allDocuments.length,
      data: allDocuments
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

    // Get ALL documents in the workspace
    const documents = await Document.find({ workspace: workspaceId })
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

      return {
        ...doc.toObject(),
        userPermission,
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
    console.log("✅ getDashboardData called");
    console.log("🔍 DEBUG: User ID:", req.user?.id);

    // Get user workspaces
    const userWorkspaces = await Workspace.find({
      $or: [
        { owner: req.user.id },
        { "members.user": req.user.id }
      ]
    }).select("_id name").lean();

    console.log("--------DEBUG: User workspaces:", userWorkspaces);

    const workspaceIds = userWorkspaces.map(ws => ws._id);
    console.log("🔍 DEBUG: Workspace IDs:", workspaceIds);

    // Step 1: Owned documents
    const ownedDocs = await Document.find({ owner: req.user.id })
      .select("name workspace")
      .lean();
    console.log("🔍 DEBUG: Owned documents:", ownedDocs);

    // Step 2: Shared documents
    const sharedDocs = await Document.find({ "permissions.user": req.user.id })
      .select("name workspace")
      .lean();
    console.log("🔍 DEBUG: Shared documents:", sharedDocs);

    // Step 3: Workspace documents
    const workspaceDocs = await Document.find({ workspace: { $in: workspaceIds } })
      .select("name workspace owner")
      .lean();
    console.log("🔍 DEBUG: All workspace documents:", workspaceDocs);

    // Step 4: All accessible documents
    const allAccessibleDocs = await Document.find({
      $or: [
        { owner: req.user.id },
        { "permissions.user": req.user.id },
        { workspace: { $in: workspaceIds } }
      ]
    }).select("name workspace owner").lean();

    console.log("🔍 DEBUG: All accessible documents:", allAccessibleDocs);

    // Step 5: Recent docs + stats
    const [recentDocs, stats] = await Promise.all([
      Document.find({
        $or: [
          { owner: req.user.id },
          { "permissions.user": req.user.id },
          { workspace: { $in: workspaceIds } }
        ]
      })
        .select("name type uploadDate size workspace")
        .populate("workspace", "name")
        .sort({ uploadDate: -1 })
        .limit(10)
        .lean(),

      Document.aggregate([
        {
          $match: {
            $or: [
              { owner: new mongoose.Types.ObjectId(req.user.id) }, // ✅ FIXED with "new"
              { "permissions.user": new mongoose.Types.ObjectId(req.user.id) },
              { workspace: { $in: workspaceIds } }
            ]
          }
        },
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
            }
          }
        }
      ])
    ]);

    console.log("🔍 DEBUG: Aggregation result:", stats);
    console.log("🔍 DEBUG: Recent docs count:", recentDocs.length);

    // ✅ Final response (prevents hanging request)
    console.log("✅ Sending dashboard data response");
    res.status(200).json({
      success: true,
      data: {
        ownedDocuments: ownedDocs,
        sharedDocuments: sharedDocs,
        workspaceDocuments: workspaceDocs,
        allAccessibleDocuments: allAccessibleDocs,
        recentDocuments: recentDocs,
        stats: stats[0] || { totalDocs: 0, totalSize: 0, thisMonth: 0 }
      }
    });
  } catch (error) {
    console.error("❌ Dashboard data error:", error);
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
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user is authorized to access this document
    const isOwner = document.owner.toString() === req.user.id;
    const hasPermission = document.permissions.some(
      permission => permission.user.toString() === req.user.id
    );

    if (!isOwner && !hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this document'
      });
    }

    res.status(200).json({
      success: true,
      data: document
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

// @desc    Update document
// @route   PUT /api/documents/:id
// @access  Private
exports.updateDocument = async (req, res) => {
  try {
    console.log("------[updateDocument] Params:", req.params);
    console.log("------[updateDocument] Body:", req.body);
    console.log("------[updateDocument] User from token:", req.user);

    const document = await Document.findById(req.params.id);
    if (!document) {
      console.log("------Document not found:", req.params.id);
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // ---- Fetch workspace ----
    const workspace = await Workspace.findById(document.workspace);
    if (!workspace) {
      console.log("------Workspace not found for document:", document._id);
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    // ---- Check if user is a member of the workspace ----
    const member = workspace.members.find(m => m.user.equals(req.user._id));
    if (!member) {
      console.log("------User not a member of workspace:", req.user._id);
      return res.status(403).json({ success: false, message: 'Not a member of this workspace' });
    }

    // ---- Check role-based permission ----
 if (!member.permissions?.canEdit) {
    console.log("------User cannot edit based on permissions:", req.user._id);
    return res.status(403).json({ success: false, message: 'No permission to edit document' });
}



    console.log("------User authorized based on workspace role:", member.role);

    const userId = req.user._id.toString();

    // ---- Update fields ----
    if (req.body.name) document.name = req.body.name;
    if (req.body.description !== undefined) document.description = req.body.description;
    if (req.body.tags) document.tags = req.body.tags;

    // ---- Update content if provided ----
    if (req.body.content && req.body.updateContent === true) {
      const fileId = new ObjectId();
      const fileName = `document_${userId}_${Date.now()}${path.extname(document.originalName)}`;

      const writeStream = gfs.openUploadStreamWithId(fileId, fileName, {
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
        if (document.path) await gfs.delete(new ObjectId(document.path));
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
    // Populate workspace with members to check permissions
    const document = await Document.findById(req.params.id).populate({
      path: 'workspace',
      populate: {
        path: 'members.user',
        select: '_id'
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found"
      });
    }

    console.log("Delete request by user:", req.user.id);
    console.log("Document workspace:", document.workspace?._id);

    // For workspace documents, check role-based permissions
    if (document.workspace) {
      // Check if user is workspace owner
      const isWorkspaceOwner = document.workspace.owner.toString() === req.user.id;
      
      console.log("Is workspace owner?", isWorkspaceOwner);

      // Find member in workspace
      const member = document.workspace.members.find(
        m => {
          const memberId = m.user._id ? m.user._id.toString() : m.user.toString();
          return memberId === req.user.id;
        }
      );

      console.log("Member found:", member);
      console.log("Member permissions:", member?.permissions);
      console.log("Member role:", member?.role);

      // Check permissions
      const canDelete = member?.permissions?.canDelete === true;
      const isAdmin = member?.role === 'admin';

      console.log("Can delete?", canDelete);
      console.log("Is admin?", isAdmin);

      if (!isWorkspaceOwner && !canDelete && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to delete this document"
        });
      }
    } else {
      // For non-workspace documents, check ownership
      if (document.owner.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to delete this document"
        });
      }
    }

    // Delete file from GridFS
    try {
      if (document.path) {
        const fileId = new ObjectId(document.path);
        await gfs.delete(fileId);
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
// @desc    Get document content for preview
// @route   GET /api/documents/:id/preview
// @access  Private
exports.previewDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user is authorized to access this document
    const isOwner = document.owner.toString() === req.user.id;
    const hasPermission = document.permissions.some(
      permission => permission.user.toString() === req.user.id
    );

    if (!isOwner && !hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this document'
      });
    }

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
      
      // Create download stream
      const downloadStream = gfs.openDownloadStream(fileId);
      
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

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents
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
    const originalDoc = await Document.findById(req.params.id);
    if (!originalDoc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check access permissions
    const isOwner = originalDoc.owner.toString() === req.user.id;
    const hasPermission = originalDoc.permissions.some(
      permission => permission.user.toString() === req.user.id
    );

    if (!isOwner && !hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to duplicate this document'
      });
    }

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
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check access permissions
    const isOwner = document.owner.toString() === req.user.id;
    const hasPermission = document.permissions.some(
      permission => permission.user.toString() === req.user.id
    );

    if (!isOwner && !hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access document versions'
      });
    }

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
    for (const doc of documents) {
      try {
        const fileId = new ObjectId(doc.path);
        await gfs.delete(fileId);
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