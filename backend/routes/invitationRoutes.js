const express = require('express');
const {
  sendInvitation,
  getWorkspaceInvitations,
  getPendingInvitations,
  acceptInvitation,
  rejectInvitation,
  cancelInvitation,
  resendInvitation,
  getInvitationDetails,
  sendBulkInvitation,
  cleanupExpiredInvitations,
} = require('../controllers/invitationController');

const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes (no authentication required)
router.get('/:token', getInvitationDetails);        // GET /api/invitations/:token - Get invitation details
router.post('/:token/accept', acceptInvitation);    // POST /api/invitations/:token/accept - Accept invitation
router.post('/:token/reject', rejectInvitation);    // POST /api/invitations/:token/reject - Reject invitation

// Protected routes (authentication required)
router.use(protect);

// Core invitation management
router.post('/send', sendInvitation);               // POST /api/invitations/send - Send invitation
router.post('/bulk', sendBulkInvitation);           // POST /api/invitations/bulk - Send bulk invitations
router.get('/pending', getPendingInvitations);      // GET /api/invitations/pending - Get user's pending invitations

// Workspace-specific invitation management
router.get('/workspace/:workspaceId', getWorkspaceInvitations); // GET /api/invitations/workspace/:workspaceId - Get workspace invitations

// Individual invitation management
router.route('/:invitationId')
  .delete(cancelInvitation);                        // DELETE /api/invitations/:invitationId - Cancel invitation

router.post('/:invitationId/resend', resendInvitation); // POST /api/invitations/:invitationId/resend - Resend invitation

// Admin utilities
router.post('/cleanup', cleanupExpiredInvitations); // POST /api/invitations/cleanup - Cleanup expired invitations (Admin only)

module.exports = router;