const sgMail = require('@sendgrid/mail');

/**
 * Email Service for Workspace Invitations (SendGrid)
 * Handles sending invitation emails with beautiful HTML templates
 */
class EmailService {
  constructor() {
    this.initialized = false;
  }

  /**
   * Lazy initialization method
   */
  ensureInitialized() {
    if (!this.initialized) {
      this.initializeSendGrid();
      this.initialized = true;
    }
  }

  /**
   * Initialize SendGrid
   */
  initializeSendGrid() {
    try {
      const apiKey = process.env.SENDGRID_API_KEY?.trim();
      const fromEmail = process.env.EMAIL_USER?.trim();
      
      console.log('📧 SendGrid Service Debug:', {
        API_KEY_EXISTS: !!apiKey,
        API_KEY_LENGTH: apiKey ? apiKey.length : 0,
        API_KEY_PREFIX: apiKey ? apiKey.substring(0, 7) + '***' : 'MISSING',
        EMAIL_USER: fromEmail || 'MISSING',
        ENVIRONMENT: process.env.NODE_ENV || 'development'
      });

      if (!apiKey || apiKey.length === 0) {
        console.error('❌ SENDGRID_API_KEY is missing or empty');
        console.error('Please set SENDGRID_API_KEY in your environment variables');
        return;
      }

      if (!fromEmail || fromEmail.length === 0) {
        console.error('❌ EMAIL_USER is missing or empty');
        console.error('Please set EMAIL_USER in your environment variables');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(fromEmail)) {
        console.error('❌ EMAIL_USER is not a valid email format:', fromEmail);
        return;
      }

      // Set SendGrid API key
      sgMail.setApiKey(apiKey);
      
      console.log('✅ SendGrid initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize SendGrid:', error);
      console.error('Stack trace:', error.stack);
    }
  }

  /**
   * Generate HTML email template for workspace invitation
   */
  generateInvitationEmailTemplate(invitationData) {
    const {
      inviterName,
      workspaceName,
      workspaceDescription,
      role,
      permissions,
      acceptUrl,
      rejectUrl,
      expiresAt,
      customMessage
    } = invitationData;

    // Format permissions for display
    const permissionsList = [
      permissions.read && 'View documents',
      permissions.write && 'Upload & edit documents',
      permissions.delete && 'Delete documents'
    ].filter(Boolean);

    const roleDisplayName = {
      'admin': 'Administrator',
      'editor': 'Editor',
      'viewer': 'Viewer'
    }[role] || role;

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Workspace Invitation</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #f8fafc;
          color: #334155;
          line-height: 1.6;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .header p {
          font-size: 16px;
          opacity: 0.9;
        }
        .content {
          padding: 40px 30px;
        }
        .workspace-info {
          background: #f1f5f9;
          border-radius: 8px;
          padding: 24px;
          margin: 24px 0;
          border-left: 4px solid #667eea;
        }
        .workspace-name {
          font-size: 20px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 8px;
        }
        .workspace-description {
          color: #64748b;
          margin-bottom: 16px;
        }
        .role-badge {
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
        }
        .permissions {
          margin-top: 20px;
        }
        .permissions h4 {
          color: #1e293b;
          margin-bottom: 12px;
          font-size: 16px;
        }
        .permissions ul {
          list-style: none;
          padding: 0;
        }
        .permissions li {
          color: #64748b;
          padding: 4px 0;
          padding-left: 20px;
          position: relative;
        }
        .permissions li:before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #10b981;
          font-weight: bold;
        }
        .custom-message {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 16px;
          margin: 24px 0;
        }
        .custom-message h4 {
          color: #92400e;
          margin-bottom: 8px;
        }
        .custom-message p {
          color: #a16207;
          margin: 0;
        }
        .buttons {
          text-align: center;
          margin: 32px 0;
        }
        .btn {
          display: inline-block;
          padding: 14px 28px;
          margin: 0 8px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.2s;
        }
        .btn-accept {
          background: #10b981;
          color: white;
        }
        .btn-accept:hover {
          background: #059669;
        }
        .btn-reject {
          background: #f3f4f6;
          color: #6b7280;
          border: 1px solid #d1d5db;
        }
        .btn-reject:hover {
          background: #e5e7eb;
        }
        .footer {
          background: #f8fafc;
          padding: 24px 30px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          color: #64748b;
          font-size: 14px;
        }
        .expires {
          color: #ef4444;
          font-weight: 500;
          margin-top: 16px;
        }
        @media (max-width: 600px) {
          .container { margin: 20px; }
          .header, .content { padding: 24px 20px; }
          .btn { display: block; margin: 8px 0; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 You're Invited!</h1>
          <p>Join a collaborative workspace</p>
        </div>
        
        <div class="content">
          <p>Hi there!</p>
          <p><strong>${inviterName}</strong> has invited you to join the <strong>${workspaceName}</strong> workspace.</p>
          
          <div class="workspace-info">
            <div class="workspace-name">${workspaceName}</div>
            ${workspaceDescription ? `<div class="workspace-description">${workspaceDescription}</div>` : ''}
            <div>
              <span class="role-badge">${roleDisplayName}</span>
            </div>
            
            <div class="permissions">
              <h4>Your permissions will include:</h4>
              <ul>
                ${permissionsList.map(permission => `<li>${permission}</li>`).join('')}
              </ul>
            </div>
          </div>
          
          ${customMessage ? `
          <div class="custom-message">
            <h4>Personal Message:</h4>
            <p>${customMessage}</p>
          </div>
          ` : ''}
          
          <div class="buttons">
            <a href="${acceptUrl}" class="btn btn-accept">Accept Invitation</a>
            <a href="${rejectUrl}" class="btn btn-reject">Decline</a>
          </div>
          
          <p class="expires">⏰ This invitation expires on ${new Date(expiresAt).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </div>
        
        <div class="footer">
          <p>This invitation was sent by ${process.env.APP_NAME || 'Document Management System'}</p>
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Send workspace invitation email
   */
  async sendInvitationEmail(invitationData) {
    try {
      this.ensureInitialized();

      if (!process.env.SENDGRID_API_KEY) {
        throw new Error(
          'SendGrid not configured - check your SENDGRID_API_KEY environment variable'
        );
      }

      const { recipientEmail, inviterName, workspaceName, token } = invitationData;

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const acceptUrl = `${frontendUrl}/invitation/${token}?action=accept`;
      const rejectUrl = `${frontendUrl}/invitation/${token}?action=reject`;

      const emailData = {
        ...invitationData,
        acceptUrl,
        rejectUrl
      };

      const htmlContent = this.generateInvitationEmailTemplate(emailData);

      const msg = {
        to: recipientEmail,
        from: {
          email: process.env.EMAIL_USER,
          name: `${process.env.APP_NAME || 'Document Management'} - ${inviterName}`
        },
        subject: ` You're invited to join "${workspaceName}" workspace`,
        html: htmlContent,
        text: `
Hi there!

${inviterName} has invited you to join the "${workspaceName}" workspace.

Your role: ${invitationData.role}

To accept this invitation, visit: ${acceptUrl}
To decline this invitation, visit: ${rejectUrl}

This invitation expires on ${new Date(invitationData.expiresAt).toLocaleDateString()}.

Best regards,
${process.env.APP_NAME || 'Document Management System'}
        `.trim()
      };

      console.log('📧 Sending email via SendGrid to:', recipientEmail);

      // Send email with timeout
      const sendWithTimeout = Promise.race([
        sgMail.send(msg),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email send timeout after 30s')), 30000)
        )
      ]);

      const result = await sendWithTimeout;

      console.log('✅ Email sent successfully via SendGrid:', {
        statusCode: result[0].statusCode,
        recipient: recipientEmail,
        messageId: result[0].headers['x-message-id']
      });

      return {
        success: true,
        messageId: result[0].headers['x-message-id'],
        statusCode: result[0].statusCode
      };

    } catch (error) {
      console.error('❌ SENDGRID EMAIL SEND ERROR:');
      console.error('Error Message:', error.message);
      console.error('Error Code:', error.code);
      console.error('Response Body:', error.response?.body);
      console.error('Stack:', error.stack);
      
      throw new Error(`SendGrid email failed: ${error.message}`);
    }
  }

  /**
   * Send invitation reminder email
   */
  async sendReminderEmail(invitationData) {
    try {
      this.ensureInitialized();
      
      const modifiedData = {
        ...invitationData,
        isReminder: true
      };

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const acceptUrl = `${frontendUrl}/invitation/${invitationData.token}?action=accept`;
      const rejectUrl = `${frontendUrl}/invitation/${invitationData.token}?action=reject`;

      const emailData = {
        ...modifiedData,
        acceptUrl,
        rejectUrl
      };

      const htmlContent = this.generateInvitationEmailTemplate(emailData);

      const msg = {
        to: invitationData.recipientEmail,
        from: {
          email: process.env.EMAIL_USER,
          name: `${process.env.APP_NAME || 'Document Management'} - ${invitationData.inviterName}`
        },
        subject: `🔔 Reminder: You're invited to join "${invitationData.workspaceName}" workspace`,
        html: htmlContent,
        text: `
Reminder: ${invitationData.inviterName} has invited you to join the "${invitationData.workspaceName}" workspace.

To accept: ${acceptUrl}
To decline: ${rejectUrl}

This invitation expires on ${new Date(invitationData.expiresAt).toLocaleDateString()}.
        `.trim()
      };

      const result = await sgMail.send(msg);
      
      return {
        success: true,
        messageId: result[0].headers['x-message-id'],
        statusCode: result[0].statusCode
      };
    } catch (error) {
      console.error('❌ Failed to send reminder email:', error);
      throw error;
    }
  }

  /**
   * Test SendGrid connection
   */
  async testConnection() {
    try {
      this.ensureInitialized();
      
      if (!process.env.SENDGRID_API_KEY) {
        throw new Error('SendGrid not configured - check your SENDGRID_API_KEY environment variable');
      }

      // SendGrid doesn't have a verify method, so we just check if API key is set
      console.log('✅ SendGrid API key is configured');
      
      return { 
        success: true, 
        message: 'SendGrid API key is configured. Send a test email to verify.' 
      };
    } catch (error) {
      console.error('❌ SendGrid test failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create and export singleton instance
const emailService = new EmailService();

module.exports = emailService;