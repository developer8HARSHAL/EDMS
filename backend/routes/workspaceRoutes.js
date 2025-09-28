const express = require('express');
const {
  createWorkspace,
  getWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  addMember,
  removeMember,
  updateMemberRole,
  leaveWorkspace,
  getWorkspaceStats
} = require('../controllers/workspaceController');

const { protect } = require('../middleware/auth');
const { checkWorkspaceAccess, checkWorkspaceAdmin } = require('../middleware/workspaceAuth');

const router = express.Router();
// Add these imports at the top
const {
  getWorkspaceDocuments
} = require('../controllers/documentController');

// Add these routes after your existing routes, before module.exports
// Workspace document routes
router.get('/:id/documents', 
  checkWorkspaceAccess(['canView']), 
  getWorkspaceDocuments
);


// Apply authentication middleware to all routes
router.use(protect);

// ✅ FIXED: Complete route definitions with proper middleware integration
// Public workspace routes (no workspace-specific middleware needed)
router.route('/')
  .get(getWorkspaces)           // GET /api/workspaces - Get all user workspaces
  .post(createWorkspace);       // POST /api/workspaces - Create new workspace

// Workspace-specific routes (require workspace access)
router.route('/:id')
  .get(checkWorkspaceAccess(['canView']), getWorkspace)        // GET /api/workspaces/:id
  .put(checkWorkspaceAdmin, updateWorkspace)                   // PUT /api/workspaces/:id - Admin only
  .delete(checkWorkspaceAdmin, deleteWorkspace);               // DELETE /api/workspaces/:id - Admin only

// Workspace statistics
router.get('/:id/stats', checkWorkspaceAccess(['canView']), getWorkspaceStats);

// ✅ FIXED: Member management routes with proper permission middleware
router.route('/:id/members')
  .post(checkWorkspaceAccess(['canInvite']), addMember);       // POST /api/workspaces/:id/members - Returns invitation redirect

router.route('/:id/members/:memberId')
  .put(checkWorkspaceAdmin, updateMemberRole)                  // PUT /api/workspaces/:id/members/:memberId - Admin only
  .delete(checkWorkspaceAdmin, removeMember);                  // DELETE /api/workspaces/:id/members/:memberId - Admin only

// Leave workspace (any member can leave)
router.post('/:id/leave', checkWorkspaceAccess(['canView']), leaveWorkspace);

module.exports = router;