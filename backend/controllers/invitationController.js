const WorkspaceInvitation = require('../models/workspaceInvitationModel');
const Workspace = require('../models/workspaceModel');
const User = require('../models/userModel');
const nodemailer = require('nodemailer');
const { checkWorkspaceAdmin, checkWorkspaceAccess } = require('../middleware/workspaceAuth');

// Configure email transporter
const createEmailTransporter = () => {
  return nodemailer.createTransporter({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// @desc    Send workspace invitation
// @route   POST /api/invitations/send
// @access  Private
const sendInvitation = async (req, res) => {
  try {
    const { workspaceId, inviteeEmail, role = 'viewer', message } = req.body;
    const inviterId = req.user.id;

    // Validate input
    if (!workspaceId || !inviteeEmail) {
      return res.status(400).json({
        success: false,
        message: 'Workspace ID and invitee email are required'
      });
    }

    // Find workspace
    const workspace = await Workspace.findById(workspaceId)
      .populate('owner', 'name email');

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Check if user has permission to invite
    if (!workspace.hasPermission(inviterId, 'canInvite')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to send invitations.'
      });
    }

    // Check if invitee is already a member
    const existingUser = await User.findOne({ email: inviteeEmail.toLowerCase() });
    if (existingUser && workspace.isMember(existingUser._id)) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this workspace'
      });
    }

    // Check if pending invitation already exists
    const existingInvitation = await WorkspaceInvitation.existsPending(
      workspaceId, 
      inviteeEmail.toLowerCase()
    );

    if (existingInvitation) {
      return res.status(400).json({
        success: false,
        message: 'Pending invitation already exists for this email'
      });
    }

    // Create invitation
    const invitation = await WorkspaceInvitation.create({
      workspace: workspaceId,
      inviter: inviterId,
      inviteeEmail: inviteeEmail.toLowerCase(),
      inviteeUser: existingUser ? existingUser._id : null,
      role: role,
      message: message?.trim()
    });

    // Populate invitation for email
    await invitation.populate([
      { path: 'workspace', select: 'name description' },
      { path: 'inviter', select: 'name email' }
    ]);

    // Send email invitation
    try {
      await sendInvitationEmail(invitation);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the invitation creation if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      data: {
        id: invitation._id,
        workspaceName: invitation.workspace.name,
        inviteeEmail: invitation.inviteeEmail,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt
      }
    });

  } catch (error) {
    console.error('Send invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending invitation',
      error: error.message
    });
  }
};

// @desc    Get invitations for workspace
// @route   GET /api/invitations/workspace/:workspaceId
// @access  Private
const getWorkspaceInvitations = async (req, res) => {
  try {
    const workspaceId = req.params.workspaceId;
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    // Find workspace and check permissions
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Check if user has permission to view invitations
    if (!workspace.hasPermission(userId, 'canInvite') && workspace.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to view invitations.'
      });
    }

    const invitations = await WorkspaceInvitation.findForWorkspace(workspaceId, status)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await WorkspaceInvitation.countDocuments({
      workspace: workspaceId,
      ...(status && { status })
    });

    res.status(200).json({
      success: true,
      data: {
        invitations,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      }
    });

  } catch (error) {
    console.error('Get workspace invitations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invitations',
      error: error.message
    });
  }
};

// @desc    Get pending invitations for user
// @route   GET /api/invitations/pending
// @access  Private
const getPendingInvitations = async (req, res) => {
  try {
    const userEmail = req.user.email;

    const invitations = await WorkspaceInvitation.findPendingForUser(userEmail);

    res.status(200).json({
      success: true,
      data: invitations
    });

  } catch (error) {
    console.error('Get pending invitations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending invitations',
      error: error.message
    });
  }
};

// @desc    Accept invitation
// @route   POST /api/invitations/:token/accept
// @access  Public (token-based)
const acceptInvitation = async (req, res) => {
  try {
    const { token } = req.params;

    // Find invitation by token
    const invitation = await WorkspaceInvitation.findOne({ token })
      .populate('workspace')
      .populate('inviter', 'name email');

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or invalid'
      });
    }

    // Check if invitation is valid
    if (!invitation.isValid()) {
      await WorkspaceInvitation.updateOne(
        { _id: invitation._id },
        { status: 'expired' }
      );
      
      return res.status(400).json({
        success: false,
        message: 'Invitation has expired'
      });
    }

    // If user is authenticated, use their ID, otherwise find by email
    let userId;
    if (req.user) {
      userId = req.user.id;
      
      // Verify email matches
      if (req.user.email.toLowerCase() !== invitation.inviteeEmail) {
        return res.status(403).json({
          success: false,
          message: 'This invitation is not for your email address'
        });
      }
    } else {
      // For public access, find user by email
      const user = await User.findOne({ email: invitation.inviteeEmail });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User account not found. Please register first.',
          requiresRegistration: true,
          inviteeEmail: invitation.inviteeEmail,
          workspaceName: invitation.workspace.name
        });
      }
      userId = user._id;
    }

    // Check if user is already a member
    const workspace = await Workspace.findById(invitation.workspace._id);
    if (workspace.isMember(userId)) {
      await invitation.accept();
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this workspace'
      });
    }

    // Add user to workspace
    workspace.members.push({
      user: userId,
      role: invitation.role,
      permissions: invitation.permissions,
      joinedAt: new Date()
    });

    await workspace.save();

    // Accept invitation
    await invitation.accept();

    // Populate workspace with updated members
    await workspace.populate('members.user', 'name email');

    res.status(200).json({
      success: true,
      message: `Successfully joined ${workspace.name}`,
      data: {
        workspace: {
          id: workspace._id,
          name: workspace.name,
          description: workspace.description,
          role: invitation.role,
          permissions: invitation.permissions
        }
      }
    });

  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error accepting invitation',
      error: error.message
    });
  }
};

// @desc    Reject invitation
// @route   POST /api/invitations/:token/reject
// @access  Public (token-based)
const rejectInvitation = async (req, res) => {
  try {
    const { token } = req.params;

    // Find invitation by token
    const invitation = await WorkspaceInvitation.findOne({ token })
      .populate('workspace', 'name')
      .populate('inviter', 'name email');

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or invalid'
      });
    }

    // Check if invitation is valid
    if (!invitation.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Invitation has expired or is no longer valid'
      });
    }

    // Reject invitation
    await invitation.reject();

    res.status(200).json({
      success: true,
      message: `Invitation to ${invitation.workspace.name} has been rejected`
    });

  } catch (error) {
    console.error('Reject invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting invitation',
      error: error.message
    });
  }
};

// @desc    Cancel invitation (by inviter)
// @route   DELETE /api/invitations/:invitationId



// @access  Private
const cancelInvitation = async (req, res) => {
  try {
    const invitationId = req.params.invitationId;
    const userId = req.user.id;

    const invitation = await WorkspaceInvitation.findById(invitationId)
      .populate('workspace');

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }

    // Check if user has permission to cancel invitation
    const workspace = await Workspace.findById(invitation.workspace._id);
    if (!workspace.hasPermission(userId, 'canInvite') && workspace.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to cancel invitations.'
      });
    }

    // Can only cancel pending invitations
    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel ${invitation.status} invitation`
      });
    }

    await WorkspaceInvitation.findByIdAndDelete(invitationId);

    res.status(200).json({
      success: true,
      message: 'Invitation cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling invitation',
      error: error.message
    });
  }
};

// @desc    Resend invitation
// @route   POST /api/invitations/:invitationId/resend
// @access  Private
const resendInvitation = async (req, res) => {
  try {
    const invitationId = req.params.invitationId;
    const userId = req.user.id;

    const invitation = await WorkspaceInvitation.findById(invitationId)
      .populate([
        { path: 'workspace', select: 'name description' },
        { path: 'inviter', select: 'name email' }
      ]);

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }

    // Check if user has permission to resend invitation
    const workspace = await Workspace.findById(invitation.workspace._id);
    if (!workspace.hasPermission(userId, 'canInvite') && workspace.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to resend invitations.'
      });
    }

    // Can only resend pending invitations
    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot resend ${invitation.status} invitation`
      });
    }

    // Update expiration date
    invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    await invitation.save();

    // Resend email
    try {
      await sendInvitationEmail(invitation);
    } catch (emailError) {
      console.error('Email resending failed:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to resend invitation email'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Invitation resent successfully',
      data: {
        expiresAt: invitation.expiresAt
      }
    });

  } catch (error) {
    console.error('Resend invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resending invitation',
      error: error.message
    });
  }
};

// @desc    Get invitation details by token (for invitation page)
// @route   GET /api/invitations/:token
// @access  Public
const getInvitationDetails = async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await WorkspaceInvitation.findOne({ token })
      .populate('workspace', 'name description settings')
      .populate('inviter', 'name email');

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or invalid'
      });
    }

    // Check if invitation is expired
    if (invitation.isExpired()) {
      await WorkspaceInvitation.updateOne(
        { _id: invitation._id },
        { status: 'expired' }
      );
      
      return res.status(400).json({
        success: false,
        message: 'Invitation has expired',
        expired: true
      });
    }

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Invitation has been ${invitation.status}`,
        status: invitation.status
      });
    }

    res.status(200).json({
      success: true,
      data: {
        workspace: {
          name: invitation.workspace.name,
          description: invitation.workspace.description
        },
        inviter: {
          name: invitation.inviter.name,
          email: invitation.inviter.email
        },
        role: invitation.role,
        permissions: invitation.permissions,
        message: invitation.message,
        expiresAt: invitation.expiresAt,
        inviteeEmail: invitation.inviteeEmail
      }
    });

  } catch (error) {
    console.error('Get invitation details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invitation details',
      error: error.message
    });
  }
};

// Add bulk invitation function (FIXED VERSION):
const sendBulkInvitation = async (req, res) => {
  try {
    const { workspaceId, invitations } = req.body;
    const inviterId = req.user.id;
    
    if (!workspaceId || !invitations || !Array.isArray(invitations)) {
      return res.status(400).json({
        success: false,
        message: 'Workspace ID and invitations array are required'
      });
    }

    // Find workspace and check permissions
    const workspace = await Workspace.findById(workspaceId)
      .populate('owner', 'name email');

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    if (!workspace.hasPermission(inviterId, 'canInvite')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to send invitations.'
      });
    }

    const results = [];
    const errors = [];

    // Process each invitation
    for (const inviteData of invitations) {
      try {
        const inviteeEmail = inviteData.email.toLowerCase();
        const role = inviteData.role || 'viewer';

        // Check if invitee is already a member
        const existingUser = await User.findOne({ email: inviteeEmail });
        if (existingUser && workspace.isMember(existingUser._id)) {
          errors.push({
            email: inviteData.email,
            success: false,
            error: 'User is already a member of this workspace'
          });
          continue;
        }

        // Check if pending invitation already exists
        const existingInvitation = await WorkspaceInvitation.existsPending(
          workspaceId, 
          inviteeEmail
        );
        
        if (existingInvitation) {
          errors.push({
            email: inviteData.email,
            success: false,
            error: 'Pending invitation already exists for this email'
          });
          continue;
        }

        // Create invitation
        const invitation = await WorkspaceInvitation.create({
          workspace: workspaceId,
          inviter: inviterId,
          inviteeEmail: inviteeEmail,
          inviteeUser: existingUser ? existingUser._id : null,
          role: role,
          message: inviteData.customMessage?.trim()
        });

        await invitation.populate([
          { path: 'workspace', select: 'name description' },
          { path: 'inviter', select: 'name email' }
        ]);

        // Send email (don't fail bulk operation if one email fails)
        try {
          await sendInvitationEmail(invitation);
        } catch (emailError) {
          console.error('Email sending failed for:', inviteData.email, emailError);
        }

        results.push({
          email: inviteData.email,
          success: true,
          invitationId: invitation._id,
          role: role,
          status: invitation.status,
          expiresAt: invitation.expiresAt
        });
      } catch (error) {
        console.error('Error processing invitation for:', inviteData.email, error);
        errors.push({
          email: inviteData.email,
          success: false,
          error: error.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Bulk invitation completed. ${results.length} sent, ${errors.length} failed.`,
      data: {
        successful: results,
        failed: errors,
        totalSent: results.length,
        totalFailed: errors.length
      }
    });

  } catch (error) {
    console.error('Bulk invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending bulk invitations',
      error: error.message
    });
  }
};
// Update module.exports to include new function:



// Helper function to send invitation email
const sendInvitationEmail = async (invitation) => {
  const transporter = createEmailTransporter();
  
  const invitationUrl = invitation.invitationUrl;
  const workspaceName = invitation.workspace.name;
  const inviterName = invitation.inviter.name;
  const role = invitation.role;
  const customMessage = invitation.message;

  const emailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Workspace Invitation</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .button:hover { background: #3730a3; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .role-badge { background: #e0e7ff; color: #3730a3; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 You're Invited to Join a Workspace!</h1>
            </div>
            <div class="content">
                <p>Hi there!</p>
                
                <p><strong>${inviterName}</strong> has invited you to join the <strong>"${workspaceName}"</strong> workspace as a <span class="role-badge">${role.toUpperCase()}</span>.</p>
                
                ${customMessage ? `<div style="background: white; padding: 15px; border-left: 4px solid #4f46e5; margin: 20px 0;">
                    <p><em>"${customMessage}"</em></p>
                </div>` : ''}
                
                <p>As a <strong>${role}</strong>, you'll be able to:</p>
                <ul>
                    ${invitation.permissions.canView ? '<li>✅ View workspace documents</li>' : ''}
                    ${invitation.permissions.canEdit ? '<li>✅ Edit documents</li>' : ''}
                    ${invitation.permissions.canAdd ? '<li>✅ Add new documents</li>' : ''}
                    ${invitation.permissions.canDelete ? '<li>✅ Delete documents</li>' : ''}
                    ${invitation.permissions.canInvite ? '<li>✅ Invite other members</li>' : ''}
                </ul>
                
                <div style="text-align: center;">
                    <a href="${invitationUrl}" class="button">Accept Invitation</a>
                </div>
                
                <p>Or copy and paste this link in your browser:</p>
                <p style="background: white; padding: 10px; border-radius: 4px; word-break: break-all; font-family: monospace;">
                    ${invitationUrl}
                </p>
                
                <p><strong>⏰ This invitation expires on ${invitation.expiresAt.toLocaleDateString()} at ${invitation.expiresAt.toLocaleTimeString()}</strong></p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                
                <p style="font-size: 14px; color: #6b7280;">
                    If you don't want to join this workspace, you can safely ignore this email or 
                    <a href="${invitationUrl.replace('/accept', '/reject')}" style="color: #dc2626;">decline the invitation</a>.
                </p>
            </div>
            <div class="footer">
                <p>This invitation was sent by ${inviterName} (${invitation.inviter.email})</p>
                <p>If you have any questions, please contact the workspace administrator.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"${process.env.APP_NAME || 'Document Management'}" <${process.env.EMAIL_USER}>`,
    to: invitation.inviteeEmail,
    subject: `You're invited to join "${workspaceName}" workspace`,
    html: emailHTML,
    text: `
      You've been invited to join the "${workspaceName}" workspace by ${inviterName}.
      
      Role: ${role}
      ${customMessage ? `Message: "${customMessage}"` : ''}
      
      Accept the invitation: ${invitationUrl}
      
      This invitation expires on ${invitation.expiresAt.toLocaleDateString()}.
      
      If you don't want to join, you can safely ignore this email.
    `
  };

  return transporter.sendMail(mailOptions);
};

// @desc    Cleanup expired invitations (cron job helper)
// @route   POST /api/invitations/cleanup
// @access  Private (Admin only)
const cleanupExpiredInvitations = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    // Expire old invitations
    const expiredResult = await WorkspaceInvitation.expireOldInvitations();
    
    // Clean up old invitations
    const cleanupResult = await WorkspaceInvitation.cleanupOldInvitations();

    res.status(200).json({
      success: true,
      message: 'Invitation cleanup completed',
      data: {
        expired: expiredResult.modifiedCount,
        cleaned: cleanupResult.deletedCount
      }
    });

  } catch (error) {
    console.error('Cleanup invitations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cleaning up invitations',
      error: error.message
    });
  }
};

module.exports = {
  sendInvitation,
  sendBulkInvitation,
  getWorkspaceInvitations,
  getPendingInvitations,
  acceptInvitation,
  rejectInvitation,
  cancelInvitation,
  resendInvitation,
  getInvitationDetails,
  cleanupExpiredInvitations
};
