const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { checkDocumentAccess } = require('../middleware/workspaceAuth');
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
  exportDocuments,
  toggleFavorite,
  getFavoriteDocuments,
  getSharedDocuments,
  updateDocumentStatus,
  assignReviewers,
  assignWorkflow
} = require('../controllers/documentController');

// Base route: /api/documents

// General document routes (all user's documents across workspaces)
router.get('/', protect, getDocuments);
router.post('/', protect, uploadDocument);

// FIXED: Dashboard route - place before /:id routes
router.get('/dashboard-data', protect, getDashboardData);

// Favorites/Shared - must be registered before /:id or it'll be captured as an id param
router.get('/favorites', protect, getFavoriteDocuments);
router.get('/shared', protect, getSharedDocuments);

// Workspace-specific document routes
router.get('/workspace/:workspaceId', protect, getWorkspaceDocuments);
router.get('/workspace/:workspaceId/stats', protect, getDocumentStats);
router.post('/workspace/:workspaceId/bulk-delete', protect, bulkDeleteDocuments);
router.get('/workspace/:workspaceId/export', protect, exportDocuments);

// Individual document operations
router.get(
  '/:id',
  protect,
  checkDocumentAccess(['canView']),
  getDocument
);

router.put(
  '/:id',
  protect,
  checkDocumentAccess(['canEdit']),
  updateDocument
);

router.delete(
  '/:id',
  protect,
  checkDocumentAccess(['canDelete']),
  deleteDocument
);

// Document preview and sharing
router.get(
  '/:id/preview',
  protect,
  checkDocumentAccess(['canView']),
  previewDocument
);

router.post(
  '/:id/share',
  protect,
  shareDocument
);

router.put(
  '/:id/favorite',
  protect,
  checkDocumentAccess(['canView']),
  toggleFavorite
);


router.patch(
  '/:id/workflow',
  protect,
  assignWorkflow
);

// Lifecycle status and reviewer assignment
router.patch('/:id/status', protect, updateDocumentStatus);
router.patch('/:id/reviewers', protect, assignReviewers);

// Advanced document operations
router.post('/:id/move', protect, moveDocument);
router.post('/:id/duplicate', protect, checkDocumentAccess(['canView']), duplicateDocument);
router.get('/:id/versions', protect, checkDocumentAccess(['canView']), getDocumentVersions);

module.exports = router;