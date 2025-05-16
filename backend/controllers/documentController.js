// documentController.js - Updated for GridFS storage
const mongoose = require('mongoose');
const Document = require('../models/documentModel');
const User = require('../models/userModel');
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
      path: fileId.toString(), // Store the GridFS file ID as the path
      size: file.size,
      type: file.mimetype,
      owner: req.user.id,
      // Add the owner to the permissions array with write access
      permissions: [
        {
          user: req.user.id,
          access: 'write'
        }
      ]
    });

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
    // Find documents user has access to (either owner or in permissions)
    const documents = await Document.find({
      $or: [
        { owner: req.user.id },
        { 'permissions.user': req.user.id }
      ]
    }).select('-__v');

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents
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
    let document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user is owner or has write permission
    const isOwner = document.owner.toString() === req.user.id;
    const hasWritePermission = document.permissions.some(
      permission => 
        permission.user.toString() === req.user.id && 
        permission.access === 'write'
    );

    if (!isOwner && !hasWritePermission) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this document'
      });
    }

    // Update only allowed fields
    if (req.body.name) {
      document.name = req.body.name;
    }

    await document.save();

    res.status(200).json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({
      success: false,
      message: 'Could not update document',
      error: error.message
    });
  }
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
exports.deleteDocument = async (req, res) => {
  try {
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
        message: 'Not authorized to delete this document'
      });
    }

    // Delete file from GridFS
    try {
      // The document.path contains the GridFS file ID
      const fileId = new ObjectId(document.path);
      await gfs.delete(fileId);
    } catch (fileError) {
      console.error('Error deleting file from GridFS:', fileError);
      // Continue with document deletion even if file deletion fails
    }

    // Remove document from database
    await Document.deleteOne({ _id: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      message: 'Could not delete document',
      error: error.message
    });
  }
};

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

      // Set appropriate content type
      res.setHeader('Content-Type', document.type);
      
      // Set content disposition to inline for browser preview
      res.setHeader('Content-Disposition', `inline; filename="${document.originalName || document.name}"`);
      
      // Stream the file from GridFS
      const downloadStream = gfs.openDownloadStream(fileId);
      downloadStream.pipe(res);
      
      // Handle errors in the stream
      downloadStream.on('error', (err) => {
        console.error('Error streaming file:', err);
        res.status(500).json({
          success: false,
          message: 'Error streaming file'
        });
      });
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