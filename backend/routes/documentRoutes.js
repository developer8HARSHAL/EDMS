const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  uploadDocument,
  getDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  shareDocument,
  previewDocument,
  getWorkspaceDocuments,
  getDocumentStats,
  moveDocument,
  duplicateDocument,
  getDocumentVersions,
  bulkDeleteDocuments,
  getDashboardData,
  exportDocuments
} = require('../controllers/documentController');

// Base route: /api/documents

// General document routes (all user's documents across workspaces)
router.get('/', protect, getDocuments);
router.post('/', protect, uploadDocument);

// FIXED: Dashboard route - place before /:id routes
router.get('/dashboard-data', protect, getDashboardData);

// Workspace-specific document routes
router.get('/workspace/:workspaceId', protect, getWorkspaceDocuments);
router.get('/workspace/:workspaceId/stats', protect, getDocumentStats);
router.post('/workspace/:workspaceId/bulk-delete', protect, bulkDeleteDocuments);
router.get('/workspace/:workspaceId/export', protect, exportDocuments);

// Individual document operations
router.get('/:id', protect, getDocument);
router.put('/:id', protect, updateDocument);
router.delete('/:id', protect, deleteDocument);

// Document preview and sharing
router.get('/:id/preview', protect, previewDocument);
router.post('/:id/share', protect, shareDocument);

// Advanced document operations
router.post('/:id/move', protect, moveDocument);
router.post('/:id/duplicate', protect, duplicateDocument);
router.get('/:id/versions', protect, getDocumentVersions);

module.exports = router;