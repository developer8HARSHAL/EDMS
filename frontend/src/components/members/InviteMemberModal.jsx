import React, { useState } from 'react';
import { X, Mail, UserPlus, AlertCircle, Loader, Plus, Trash2, Users, Eye, Edit, Settings } from 'lucide-react';

const InviteMemberModal = ({ 
  isOpen, 
  onClose, 
  onSendInvitation,
  workspace,
  isLoading = false 
}) => {
  const [invitations, setInvitations] = useState([
    { email: '', role: 'viewer', customMessage: '' }
  ]);
  const [errors, setErrors] = useState({});
  // const [bulkInvite, setBulkInvite] = useState(false);

  // Available roles with descriptions
  const roles = [
    {
      value: 'viewer',
      label: 'Viewer',
      icon: Eye,
      description: 'Can view and download documents',
      permissions: ['View documents', 'Download documents', 'View workspace info']
    },
    {
      value: 'editor',
      label: 'Editor', 
      icon: Edit,
      description: 'Can view, upload, and edit documents',
      permissions: ['All viewer permissions', 'Upload documents', 'Edit documents', 'Delete own documents']
    },
    {
      value: 'admin',
      label: 'Admin',
      icon: Settings,
      description: 'Can manage workspace and members',
      permissions: ['All editor permissions', 'Invite members', 'Manage member roles', 'Delete any document', 'Workspace settings']
    }
  ];

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setInvitations([{ email: '', role: 'viewer', customMessage: '' }]);
      setErrors({});
      // setBulkInvite(false);
    }
  }, [isOpen]);

  // Handle input changes
  const handleInvitationChange = (index, field, value) => {
    const newInvitations = [...invitations];
    newInvitations[index] = {
      ...newInvitations[index],
      [field]: value
    };
    setInvitations(newInvitations);

    // Clear errors for this field
    const errorKey = `${index}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: ''
      }));
    }
  };

  // Add new invitation row
  const addInvitation = () => {
    setInvitations(prev => [
      ...prev,
      { email: '', role: 'viewer', customMessage: '' }
    ]);
  };

  // Remove invitation row
  const removeInvitation = (index) => {
    if (invitations.length > 1) {
      setInvitations(prev => prev.filter((_, i) => i !== index));
      
      // Clean up errors for removed invitation
      const newErrors = { ...errors };
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith(`${index}_`)) {
          delete newErrors[key];
        }
      });
      setErrors(newErrors);
    }
  };

  // Validate email
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    invitations.forEach((invitation, index) => {
      // Email validation
      if (!invitation.email.trim()) {
        newErrors[`${index}_email`] = 'Email is required';
      } else if (!isValidEmail(invitation.email.trim())) {
        newErrors[`${index}_email`] = 'Please enter a valid email address';
      }

      // Custom message validation (optional but has limits)
      if (invitation.customMessage && invitation.customMessage.length > 300) {
        newErrors[`${index}_customMessage`] = 'Message must be less than 300 characters';
      }
    });

    // Check for duplicate emails
    const emails = invitations.map(inv => inv.email.trim().toLowerCase());
    const duplicates = emails.filter((email, index) => emails.indexOf(email) !== index);
    
    if (duplicates.length > 0) {
      invitations.forEach((invitation, index) => {
        if (duplicates.includes(invitation.email.trim().toLowerCase())) {
          newErrors[`${index}_email`] = 'Duplicate email address';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

// In your InviteMemberModal.jsx, replace the handleSubmit function:

const handleSubmit = async () => {
  if (!validateForm()) {
    return;
  }

  // ✅ FIX: Access the nested workspace object
  const workspaceData = workspace?.workspace || workspace;
  
  console.log('🏢 MODAL: Extracted workspace data:', workspaceData);
  console.log('🎯 MODAL: workspaceData._id:', workspaceData?._id);
  
  if (!workspaceData) {
    console.error('❌ MODAL: No workspace data found!');
    return;
  }
  
  if (!workspaceData._id) {
    console.error('❌ MODAL: workspace has no _id field!');
    console.error('❌ MODAL: Available fields:', Object.keys(workspaceData));
    return;
  }

  try {
    const validInvitations = invitations
      .filter(inv => inv.email.trim())
      .map(inv => ({
        email: inv.email.trim(),
        role: inv.role,
        customMessage: inv.customMessage.trim()
      }));

    if (validInvitations.length === 1) {
      // Single invitation
      const invitationPayload = {
        workspaceId: workspaceData._id,  // ✅ FIX: Use workspaceData._id
        inviteeEmail: validInvitations[0].email,
        role: validInvitations[0].role,
        message: validInvitations[0].customMessage
      };
      
      console.log('📤 MODAL: Single invitation payload:', JSON.stringify(invitationPayload, null, 2));
      console.log('🔍 MODAL: workspaceId in payload:', invitationPayload.workspaceId);
      
      if (!invitationPayload.workspaceId) {
        console.error('❌ MODAL: workspaceId is still undefined!');
        throw new Error('WorkspaceId is missing');
      }
      
      await onSendInvitation(invitationPayload);
    } else {
      // Bulk invitations
      const bulkPayload = {
        bulk: true,
        workspaceId: workspaceData._id,  // ✅ FIX: Use workspaceData._id
        invitations: validInvitations
      };
      
      console.log('📤 MODAL: Bulk invitation payload:', JSON.stringify(bulkPayload, null, 2));
      await onSendInvitation(bulkPayload);
    }

    onClose();
  } catch (error) {
    console.error('❌ MODAL: Failed to send invitations:', error);
    if (error.response?.data?.message) {
      setErrors({ submit: error.response.data.message });
    } else {
      setErrors({ submit: 'Failed to send invitations. Please try again.' });
    }
  }
};

  // Handle modal backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-auto max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Invite Members
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Invite people to collaborate in "{workspace?.name}"
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-200px)] overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Invitations */}
            <div className="space-y-4">
              {invitations.map((invitation, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 space-y-4">
                      {/* Email Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="email"
                            value={invitation.email}
                            onChange={(e) => handleInvitationChange(index, 'email', e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                              errors[`${index}_email`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                            placeholder="colleague@example.com"
                            disabled={isLoading}
                          />
                        </div>
                        {errors[`${index}_email`] && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                            <AlertCircle className="w-4 h-4" />
                            {errors[`${index}_email`]}
                          </div>
                        )}
                      </div>

                      {/* Role Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Role
                        </label>
                        <div className="space-y-2">
                          {roles.map((role) => {
                            const IconComponent = role.icon;
                            return (
                              <label
                                key={role.value}
                                className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                              >
                                <input
                                  type="radio"
                                  name={`role_${index}`}
                                  value={role.value}
                                  checked={invitation.role === role.value}
                                  onChange={(e) => handleInvitationChange(index, 'role', e.target.value)}
                                  className="mt-1 text-blue-600 focus:ring-blue-500"
                                  disabled={isLoading}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <IconComponent className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm font-medium text-gray-900">
                                      {role.label}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-600 mb-2">
                                    {role.description}
                                  </p>
                                  <div className="text-xs text-gray-500">
                                    <strong>Permissions:</strong> {role.permissions.join(', ')}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Custom Message */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Personal Message (Optional)
                        </label>
                        <textarea
                          value={invitation.customMessage}
                          onChange={(e) => handleInvitationChange(index, 'customMessage', e.target.value)}
                          rows={3}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none ${
                            errors[`${index}_customMessage`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                          placeholder="Add a personal message to your invitation..."
                          disabled={isLoading}
                          maxLength={300}
                        />
                        {errors[`${index}_customMessage`] && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                            <AlertCircle className="w-4 h-4" />
                            {errors[`${index}_customMessage`]}
                          </div>
                        )}
                        <div className="mt-1 text-xs text-gray-500">
                          {invitation.customMessage.length}/300 characters
                        </div>
                      </div>
                    </div>

                    {/* Remove Button */}
                    {invitations.length > 1 && (
                      <button
                        onClick={() => removeInvitation(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        disabled={isLoading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Another Invitation */}
            <button
              onClick={addInvitation}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
              disabled={isLoading}
            >
              <Plus className="w-4 h-4" />
              Add Another Person
            </button>

            {/* Submit Error */}
            {errors.submit && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                {errors.submit}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>
              {invitations.filter(inv => inv.email.trim()).length} invitation{invitations.filter(inv => inv.email.trim()).length !== 1 ? 's' : ''} to send
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              disabled={isLoading || !invitations.some(inv => inv.email.trim())}
            >
              {isLoading && <Loader className="w-4 h-4 animate-spin" />}
              <UserPlus className="w-4 h-4" />
              {isLoading ? 'Sending...' : `Send Invitation${invitations.filter(inv => inv.email.trim()).length > 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteMemberModal;