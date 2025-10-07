const WorkspaceInvitation = require('../models/workspaceInvitationModel');
const Workspace = require('../models/workspaceModel');
const User = require('../models/userModel');
// 🔥 FIXED: Use the dedicated EmailService instead of inline email code
const emailService = require('../utils/emailService');

// FIXED: sendInvitation function - declare emailSent variable in correct scope
const sendInvitation = async (req, res) => {
  try {
    console.log('📨 Received invitation request:', req.body);
    
    // Handle both single and bulk invitations
    if (req.body.bulk && req.body.invitations) {
      // Bulk invitation handling
      return await handleBulkInvitation(req, res);
    }

    // Single invitation handling
    const { workspaceId, inviteeEmail, role = 'viewer', message } = req.body;
    const inviterId = req.user.id;
    console.log('🔍 Extracted data:', { workspaceId, inviteeEmail, role, message });
    
    // 🔥 FIXED: Declare emailSent variable here, in the correct scope
    let emailSent = false;

    // Validate input
    if (!workspaceId || !inviteeEmail) {
      console.error('❌ Validation failed - missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Workspace ID and invitee email are required'
      });
    }
    console.log('✅ Input validation passed');

    // Find workspace
    console.log('🔍 Looking up workspace with ID:', workspaceId);
    const workspace = await Workspace.findById(workspaceId)
      .populate('owner', 'name email');

    console.log('🔍 Workspace found:', workspace ? 'YES' : 'NO');
    if (workspace) {
      console.log('🔍 Workspace details:', {
        id: workspace._id,
        name: workspace.name,
        owner: workspace.owner
      });
    }

    if (!workspace) {
      console.log('❌ Workspace not found, returning 404');
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    console.log('🔍 Checking permissions for user:', inviterId);
    console.log('🔍 Workspace hasPermission method exists:', typeof workspace.hasPermission === 'function');
    
    // Check if user has permission to invite
    try {
      const hasPermission = workspace.hasPermission(inviterId, 'canInvite');
      console.log('🔍 Permission check result:', hasPermission);
      
      if (!hasPermission) {
        console.log('❌ Permission denied for user:', inviterId);
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have permission to send invitations.'
        });
      }
      console.log('✅ Permission check passed');
    } catch (permissionError) {
      console.error('❌ Permission check error:', permissionError);
      throw permissionError;
    }

    console.log('🔍 Looking up existing user with email:', inviteeEmail.toLowerCase());
    // Check if invitee is already a member
    const existingUser = await User.findOne({ email: inviteeEmail.toLowerCase() });
    console.log('🔍 Existing user found:', existingUser ? 'YES' : 'NO');
    
    if (existingUser) {
      console.log('🔍 Checking if user is already a member');
      const isAlreadyMember = workspace.isMember(existingUser._id);
      console.log('🔍 Is already member:', isAlreadyMember);
      
      if (isAlreadyMember) {
        console.log('❌ User is already a member');
        return res.status(400).json({
          success: false,
          message: 'User is already a member of this workspace'
        });
      }
    }

    console.log('🔍 Checking for existing pending invitation');
    // Check if pending invitation already exists
    const existingInvitation = await WorkspaceInvitation.existsPending(
      workspaceId, 
      inviteeEmail.toLowerCase()
    );
    console.log('🔍 Existing invitation found:', existingInvitation ? 'YES' : 'NO');

    if (existingInvitation) {
      console.log('❌ Pending invitation already exists');
      return res.status(400).json({
        success: false,
        message: 'Pending invitation already exists for this email'
      });
    }

    console.log('✅ Creating invitation with data:', {
      workspace: workspaceId,
      inviter: inviterId,
      inviteeEmail: inviteeEmail.toLowerCase(),
      inviteeUser: existingUser ? existingUser._id : null,
      role: role,
      message: message?.trim()
    });

    // Create and save the invitation
    const invitation = new WorkspaceInvitation({
      workspace: workspaceId,
      inviter: inviterId,
      inviteeEmail: inviteeEmail.toLowerCase(),
      inviteeUser: existingUser ? existingUser._id : null,
      role: role,
      message: message?.trim()
    });

    console.log('🔍 About to save invitation to database');
    // Save the invitation
    await invitation.save();
    console.log('✅ Invitation saved with token:', invitation.token);

    console.log('🔍 About to populate invitation data');
    // Populate invitation for email
    await invitation.populate([
      { path: 'workspace', select: 'name description' },
      { path: 'inviter', select: 'name email' }
    ]);
    console.log('✅ Invitation data populated');

    // 🔥 FIXED: Use EmailService and handle errors properly
    console.log('🔍 About to send email');
    try {
      const emailData = {
        recipientEmail: invitation.inviteeEmail,
        inviterName: invitation.inviter.name,
        workspaceName: invitation.workspace.name,
        workspaceDescription: invitation.workspace.description,
        role: invitation.role,
        permissions: invitation.permissions,
        token: invitation.token,
        expiresAt: invitation.expiresAt,
        customMessage: invitation.message
      };

      console.log('🔍 Email data prepared:', {
        recipientEmail: emailData.recipientEmail,
        inviterName: emailData.inviterName,
        workspaceName: emailData.workspaceName
      });

      const emailResult = await emailService.sendInvitationEmail(emailData);
      console.log('✅ Email sent successfully via EmailService:', emailResult);
      emailSent = true; // 🔥 FIXED: Now emailSent is properly scoped
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      console.error('❌ Full email error:', emailError.stack);
      // Don't fail the invitation creation if email fails
      emailSent = false; // 🔥 FIXED: Set to false on error
    }

    console.log('🔧 Email sending status:', emailSent ? 'SUCCESS' : 'FAILED');

    console.log('🔍 About to send response');
    // Return proper response
    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      data: {
        id: invitation._id,
        workspaceId: workspaceId,
        workspaceName: invitation.workspace.name,
        inviteeEmail: invitation.inviteeEmail,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        emailSent: emailSent 
      }
    });

  } catch (error) {
    console.error('❌ Send invitation error:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: validationErrors.join(', '),
        details: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error sending invitation',
      error: error.message
    });
  }
};

// FIXED: Moved handleBulkInvitation outside and made it a separate function
const handleBulkInvitation = async (req, res) => {
  try {
    const { workspaceId, invitations } = req.body;
    const inviterId = req.user.id;
    
    console.log('📨 Bulk invitation request:', { workspaceId, invitationCount: invitations?.length });
    
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

    // Get inviter info for email
    const inviter = await User.findById(inviterId);

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
        const invitation = new WorkspaceInvitation({
          workspace: workspaceId,
          inviter: inviterId,
          inviteeEmail: inviteeEmail,
          inviteeUser: existingUser ? existingUser._id : null,
          role: role,
          message: inviteData.customMessage?.trim()
        });

        await invitation.save();

        // 🔥 FIXED: Use EmailService for bulk invitations too
        try {
          const emailData = {
            recipientEmail: inviteeEmail,
            inviterName: inviter.name,
            workspaceName: workspace.name,
            workspaceDescription: workspace.description,
            role: role,
            permissions: invitation.permissions,
            token: invitation.token,
            expiresAt: invitation.expiresAt,
            customMessage: inviteData.customMessage?.trim()
          };

          await emailService.sendInvitationEmail(emailData);
        } catch (emailError) {
          console.error('❌ Email sending failed for:', inviteData.email, emailError);
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
        console.error('❌ Error processing invitation for:', inviteData.email, error);
        errors.push({
          email: inviteData.email,
          success: false,
          error: error.message
        });
      }
    }

    console.log(`✅ Bulk invitation completed: ${results.length} sent, ${errors.length} failed`);

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
    console.error('❌ Bulk invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending bulk invitations',
      error: error.message
    });
  }
};

// 🔥 ADDED: Email testing endpoint
const testEmailService = async (req, res) => {
  try {
    const testResult = await emailService.testConnection();
    
    if (testResult.success) {
      res.status(200).json({
        success: true,
        message: 'Email service is working properly',
        data: testResult
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Email service connection failed',
        error: testResult.error
      });
    }
  } catch (error) {
    console.error('❌ Email test error:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing email service',
      error: error.message
    });
  }
};

// All other existing functions remain the same...
const getWorkspaceInvitations = async (req, res) => {
  try {
    const workspaceId = req.params.workspaceId;
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

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

// Enhanced getPendingInvitations function with detailed debugging
const getPendingInvitations = async (req, res) => {
  try {
    // Check if user exists
    if (!req.user) {
      console.log('❌ No user found in request object');
      return res.status(401).json({
        success: false,
        message: 'Authentication required - no user found'
      });
    }

    // Check if user has email
    if (!req.user.email) {
      console.log('❌ User found but no email property');
      return res.status(400).json({
        success: false,
        message: 'User email not found'
      });
    }

    const userEmail = req.user.email;
    console.log('✅ Using email for invitation lookup:', userEmail);
    
    // Import model here to ensure it's loaded
    const WorkspaceInvitation = require('../models/workspaceInvitationModel');
    console.log('📦 WorkspaceInvitation model loaded');
    
    // Check if the model method exists
    if (typeof WorkspaceInvitation.findPendingForUser !== 'function') {
      console.log('❌ findPendingForUser method not found on model');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error - method not found'
      });
    }

    console.log('🔍 Calling WorkspaceInvitation.findPendingForUser with email:', userEmail);
    const invitations = await WorkspaceInvitation.findPendingForUser(userEmail);
    console.log('✅ Found invitations:', invitations?.length || 0);
    console.log('📋 Invitations data:', invitations);

    res.status(200).json({
      success: true,
      data: invitations,
      count: invitations?.length || 0,
      userEmail: userEmail
    });

  } catch (error) {
    console.error('❌ getPendingInvitations error details:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Error fetching pending invitations',
      error: error.message,
      errorType: error.name
    });
  }
};



const acceptInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    console.log("-----[ACCEPT] Received token:", token);

    const invitation = await WorkspaceInvitation.findOne({ token })
      .populate('workspace')
      .populate('inviter', 'name email');

    console.log("-----[ACCEPT] Invitation found in DB:", invitation ? "YES" : "NO");

    if (!invitation) {
      console.log("-----[ACCEPT] No invitation with this token");
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or invalid'
      });
    }

    console.log("-----[ACCEPT] Invitation details:", {
      id: invitation._id,
      email: invitation.inviteeEmail,
      status: invitation.status,
      expiresAt: invitation.expiresAt
    });

    // ✅ Already accepted - return success immediately
    if (invitation.status === 'accepted') {
      console.log("-----[ACCEPT] Invitation already accepted");
      return res.status(200).json({
        success: true,
        message: `You are already a member of ${invitation.workspace.name}`,
        alreadyAccepted: true,
        data: {
          workspace: {
            id: invitation.workspace._id,
            name: invitation.workspace.name
          }
        }
      });
    }

    // ✅ Expired
    if (!invitation.isValid()) {
      console.log("-----[ACCEPT] Invitation expired at:", invitation.expiresAt);
      await WorkspaceInvitation.updateOne(
        { _id: invitation._id },
        { status: 'expired' }
      );
      return res.status(400).json({
        success: false,
        message: 'Invitation has expired'
      });
    }

    // ✅ Get or validate user
    let userId;
    if (req.user) {
      console.log("-----[ACCEPT] Authenticated user:", req.user.email);

      if (req.user.email.toLowerCase() !== invitation.inviteeEmail.toLowerCase()) {
        console.log("-----[ACCEPT] Email mismatch:", {
          expected: invitation.inviteeEmail,
          got: req.user.email
        });
        return res.status(403).json({
          success: false,
          message: 'This invitation is not for your email address'
        });
      }
      userId = req.user.id;
    } else {
      console.log("-----[ACCEPT] No authenticated user, looking up invitee...");
      const user = await User.findOne({ email: invitation.inviteeEmail });
      if (!user) {
        console.log("-----[ACCEPT] Invitee user not registered:", invitation.inviteeEmail);
        return res.status(404).json({
          success: false,
          message: 'User not found, please register first',
          requiresRegistration: true
        });
      }
      console.log("-----[ACCEPT] Found invitee user:", user.email);
      userId = user._id;
    }

    // ✅ Load workspace with proper error handling
    const workspace = await Workspace.findById(invitation.workspace._id);
    if (!workspace) {
      console.log("-----[ACCEPT] Workspace not found");
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }
    
    console.log("-----[ACCEPT] Workspace loaded:", workspace.name);

    // ✅ CRITICAL FIX: Use addMemberSafely (synchronous - no await!)
    console.log("-----[ACCEPT] Checking for existing member and adding safely...");
    const addResult = workspace.addMemberSafely(
      userId,
      invitation.role,
      invitation.permissions
    );
    
    console.log("-----[ACCEPT] Add member result:", addResult);

    // ✅ Handle already existing member case
    if (addResult.alreadyExists && !addResult.added) {
      // Member already exists - just mark invitation as accepted
      if (invitation.status === 'pending') {
        await invitation.accept();
        console.log("-----[ACCEPT] Marked invitation as accepted (user already member)");
      }
      
      return res.status(200).json({
        success: true,
        message: `You are already a member of ${workspace.name}`,
        alreadyMember: true,
        data: {
          workspace: {
            id: workspace._id,
            name: workspace.name
          },
          role: workspace.members.find(m => m.user.toString() === userId.toString())?.role || invitation.role
        }
      });
    }

    // ✅ Save workspace (member was added)
    await workspace.save();
    console.log("-----[ACCEPT] Workspace saved with new member");

    // ✅ Mark invitation as accepted
    await invitation.accept();
    console.log("-----[ACCEPT] Invitation status updated to accepted");

    // ✅ Check for duplicate workspace in user profile
    const user = await User.findById(userId);
    const workspaceExistsInUser = user.workspaces.some(
      ws => ws.workspace.toString() === workspace._id.toString()
    );
    
    console.log("-----[ACCEPT] Workspace in user profile check:", {
      found: workspaceExistsInUser
    });

    if (!workspaceExistsInUser) {
      user.workspaces.push({
        workspace: workspace._id,
        role: invitation.role,
        joinedAt: new Date()
      });
      await user.save();
      console.log("-----[ACCEPT] Workspace added to user profile");
    } else {
      console.log("-----[ACCEPT] Workspace already in user profile, skipping");
    }

    // ✅ Return success with workspace data
    res.status(200).json({
      success: true,
      message: `Successfully joined ${workspace.name}`,
      data: {
        workspace: {
          id: workspace._id,
          name: workspace.name,
          description: workspace.description
        },
        role: invitation.role,
        permissions: invitation.permissions
      }
    });
    
  } catch (err) {
    console.error('-----[ACCEPT] Error accepting invitation:', err);
    res.status(500).json({
      success: false,
      message: 'Error accepting invitation',
      error: err.message
    });
  }
};



const rejectInvitation = async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await WorkspaceInvitation.findOne({ token })
      .populate('workspace', 'name')
      .populate('inviter', 'name email');

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or invalid'
      });
    }

    if (!invitation.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Invitation has expired or is no longer valid'
      });
    }

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

    const workspace = await Workspace.findById(invitation.workspace._id);
    if (!workspace.hasPermission(userId, 'canInvite') && workspace.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to cancel invitations.'
      });
    }

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

    const workspace = await Workspace.findById(invitation.workspace._id);
    if (!workspace.hasPermission(userId, 'canInvite') && workspace.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to resend invitations.'
      });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot resend ${invitation.status} invitation`
      });
    }

    invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await invitation.save();

    // 🔥 FIXED: Use EmailService for resend too
    try {
      const emailData = {
        recipientEmail: invitation.inviteeEmail,
        inviterName: invitation.inviter.name,
        workspaceName: invitation.workspace.name,
        workspaceDescription: invitation.workspace.description,
        role: invitation.role,
        permissions: invitation.permissions,
        token: invitation.token,
        expiresAt: invitation.expiresAt,
        customMessage: invitation.message
      };

      await emailService.sendReminderEmail(emailData);
    } catch (emailError) {
      console.error('❌ Email resending failed:', emailError);
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

// FIXED: getInvitationDetails function in invitationController.js
const getInvitationDetails = async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await WorkspaceInvitation.findOne({ token })
      .populate({
        path: 'workspace',
        select: 'name description settings members',
        options: { virtuals: false }
      })
      .populate('inviter', 'name email')
      .lean(); // plain object

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or invalid'
      });
    }

if (invitation.status === 'accepted') {
  return res.status(200).json({
    success: true,
    alreadyAccepted: true,
    status: 'accepted',
    data: {
      workspace: {
        id: invitation.workspace._id,
        name: invitation.workspace.name,
        description: invitation.workspace.description
      },
      role: invitation.role,
      permissions: invitation.permissions,
      invitedBy: invitation.inviter,
      email: invitation.inviteeEmail  // <- add this line
    }
  });
}

    if (new Date(invitation.expiresAt) <= new Date()) {
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
res.status(200).json({
  success: true,
  data: {
    ...invitation,
    email: invitation.inviteeEmail  // <- add this line
  }
});

  } catch (err) {
    console.error('Get invitation details error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching invitation details',
      error: err.message
    });
  }
};


const cleanupExpiredInvitations = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const expiredResult = await WorkspaceInvitation.expireOldInvitations();
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

// FIXED: Proper module exports
module.exports = {
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
  testEmailService // 🔥 ADDED: Export the test function
};