const express = require('express');
const {
  sendInvitation,
  handleBulkInvitation,
  getWorkspaceInvitations,
  getPendingInvitations,
  acceptInvitation,
  rejectInvitation,
  cancelInvitation,
  resendInvitation,
  getInvitationDetails,
  cleanupExpiredInvitations,
  testEmailService 
} = require('../controllers/invitationController');

const { protect } = require('../middleware/auth');

const router = express.Router();

// Core invitation management (PROTECTED ROUTES) - Most specific first
router.post('/send', protect, sendInvitation);               // POST /api/invitations/send
router.post('/bulk', protect, handleBulkInvitation);         // POST /api/invitations/bulk
router.get('/pending', protect, getPendingInvitations);      // GET /api/invitations/pending
router.get('/test-email', protect, testEmailService);        // GET /api/invitations/test-email
router.post('/cleanup', protect, cleanupExpiredInvitations); // POST /api/invitations/cleanup

// Workspace-specific invitation management (PROTECTED)
router.get('/workspace/:workspaceId', protect, getWorkspaceInvitations); // GET /api/invitations/workspace/:workspaceId

// Individual invitation management with invitationId (PROTECTED)
router.delete('/:invitationId', protect, cancelInvitation);              // DELETE /api/invitations/:invitationId
router.post('/:invitationId/resend', protect, resendInvitation);         // POST /api/invitations/:invitationId/resend

// Public routes (NO AUTHENTICATION) - These come LAST to avoid conflicts
router.get('/:token', getInvitationDetails);        // GET /api/invitations/:token
router.post('/:token/accept', acceptInvitation);    // POST /api/invitations/:token/accept
router.post('/:token/reject', rejectInvitation);    // POST /api/invitations/:token/reject

module.exports = router;