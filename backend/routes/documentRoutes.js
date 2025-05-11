const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  uploadDocument,
  getDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  shareDocument
} = require('../controllers/documentController');

// Base route: /api/documents

// Upload document
router.post('/', protect, uploadDocument);

// Get all documents (that user has access to)
router.get('/', protect, getDocuments);

// Get, update, delete single document
router.get('/:id', protect, getDocument);
router.put('/:id', protect, updateDocument);
router.delete('/:id', protect, deleteDocument);

// Share document with another user
router.post('/:id/share', protect, shareDocument);

module.exports = router;