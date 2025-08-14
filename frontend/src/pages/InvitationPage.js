import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import  Avatar  from '../components/ui/Avatar';
import { Alert } from '../components/ui/Alert';
import { useInvitations } from '../hooks/useInvitations';
import { useAuth } from '../hooks/useAuth';
import {
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ShieldCheckIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon as CheckCircleIconSolid,
  XCircleIcon as XCircleIconSolid
} from '@heroicons/react/24/solid';

const InvitationPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const {
    invitationDetails,
    isLoading,
    error,
    fetchInvitationDetails,
    acceptInvitation,
    rejectInvitation
  } = useInvitations();

  // Local state
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [actionResult, setActionResult] = useState(null); // 'accepted', 'rejected', 'error'
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Load invitation details on component mount
  useEffect(() => {
    if (token) {
      fetchInvitationDetails(token);
    }
  }, [token]);

  // Check if user needs to login
  useEffect(() => {
    if (invitationDetails && !isAuthenticated) {
      setShowLoginPrompt(true);
    }
  }, [invitationDetails, isAuthenticated]);

  // Handle invitation acceptance
  const handleAcceptInvitation = async () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }

    setIsAccepting(true);
    try {
      await acceptInvitation(token);
      setActionResult('accepted');
      
      // Redirect to workspace after a short delay
      setTimeout(() => {
        navigate(`/workspaces/${invitationDetails.workspace._id}`);
      }, 3000);
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      setActionResult('error');
    } finally {
      setIsAccepting(false);
    }
  };

  // Handle invitation rejection
  const handleRejectInvitation = async () => {
    setIsRejecting(true);
    try {
      await rejectInvitation(token);
      setActionResult('rejected');
    } catch (error) {
      console.error('Failed to reject invitation:', error);
      setActionResult('error');
    } finally {
      setIsRejecting(false);
    }
  };

  // Format date helper
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get role permissions description
  const getRolePermissions = (role) => {
    const permissions = {
      owner: {
        icon: ShieldCheckIcon,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        permissions: [
          'Full workspace access',
          'Manage all members and settings',
          'Upload, edit, and delete any documents',
          'Invite and remove members',
          'Delete workspace'
        ]
      },
      admin: {
        icon: ShieldCheckIcon,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        permissions: [
          'Manage workspace settings',
          'Invite and remove members',
          'Upload, edit, and delete documents',
          'Manage member roles',
          'View workspace analytics'
        ]
      },
      editor: {
        icon: PencilIcon,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        permissions: [
          'Upload and edit documents',
          'Create folders and organize files',
          'Comment on documents',
          'Download documents',
          'View workspace activity'
        ]
      },
      viewer: {
        icon: EyeIcon,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        permissions: [
          'View and download documents',
          'Comment on documents',
          'View workspace activity',
          'Search documents',
          'Basic workspace access'
        ]
      }
    };

    return permissions[role] || permissions.viewer;
  };

  // Check if invitation is expired
  const isExpired = invitationDetails && new Date(invitationDetails.expiresAt) < new Date();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading invitation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !invitationDetails) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center p-8">
          <div className="text-red-600 mb-4">
            <XCircleIconSolid className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Invalid Invitation
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {error || "This invitation link is invalid or has expired."}
          </p>
          <div className="space-y-3">
            {isAuthenticated ? (
              <Button onClick={() => navigate('/dashboard')} className="w-full">
                Go to Dashboard
              </Button>
            ) : (
              <Button onClick={() => navigate('/login')} className="w-full">
                Sign In
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => navigate('/')} 
              className="w-full"
            >
              Go Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Success/Rejection result states
  if (actionResult === 'accepted') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center p-8">
          <div className="text-green-600 mb-4">
            <CheckCircleIconSolid className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Welcome to the team!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You've successfully joined "{invitationDetails.workspace.name}". 
            Redirecting you to the workspace...
          </p>
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm text-gray-500">Redirecting...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (actionResult === 'rejected') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center p-8">
          <div className="text-gray-500 mb-4">
            <XCircleIconSolid className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Invitation Declined
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You've declined the invitation to join "{invitationDetails.workspace.name}".
          </p>
          <div className="space-y-3">
            {isAuthenticated ? (
              <Button onClick={() => navigate('/dashboard')} className="w-full">
                Go to Dashboard
              </Button>
            ) : (
              <Button onClick={() => navigate('/login')} className="w-full">
                Sign In
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => navigate('/')} 
              className="w-full"
            >
              Go Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (actionResult === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center p-8">
          <div className="text-red-600 mb-4">
            <ExclamationTriangleIcon className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Something Went Wrong
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            We couldn't process your invitation response. Please try again.
          </p>
          <Button onClick={() => setActionResult(null)} className="w-full">
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  const roleInfo = getRolePermissions(invitationDetails.role);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
            <EnvelopeIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Workspace Invitation
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            You've been invited to collaborate
          </p>
        </div>

        {/* Login Prompt Alert */}
        {showLoginPrompt && !isAuthenticated && (
          <Alert variant="info" className="mb-6">
            <UserPlusIcon className="h-4 w-4" />
            <div>
              <p className="font-medium">Sign in required</p>
              <p className="text-sm mt-1">
                You need to be signed in to accept this invitation.{' '}
                <Link to="/login" className="underline hover:no-underline">
                  Sign in now
                </Link>{' '}
                or{' '}
                <Link to="/register" className="underline hover:no-underline">
                  create an account
                </Link>.
              </p>
            </div>
          </Alert>
        )}

        {/* Expiration Warning */}
        {isExpired && (
          <Alert variant="warning" className="mb-6">
            <ClockIcon className="h-4 w-4" />
            <div>
              <p className="font-medium">Invitation Expired</p>
              <p className="text-sm mt-1">
                This invitation expired on {formatDate(invitationDetails.expiresAt)}. 
                Please contact the workspace owner for a new invitation.
              </p>
            </div>
          </Alert>
        )}

        {/* Main Invitation Card */}
        <Card className="p-8 mb-6">
          {/* Workspace Info */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <BuildingOfficeIcon className="h-12 w-12 text-gray-400 mr-3" />
              <div className="text-left">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {invitationDetails.workspace.name}
                </h2>
                {invitationDetails.workspace.description && (
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    {invitationDetails.workspace.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <UserGroupIcon className="h-4 w-4 mr-1" />
                {invitationDetails.workspace.memberCount || 0} members
              </div>
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1" />
                Created {new Date(invitationDetails.workspace.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Invitation Details */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Avatar user={invitationDetails.invitedBy} size="sm" className="mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {invitationDetails.invitedBy?.name || 'Someone'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    invited you to join
                  </p>
                </div>
              </div>
              <Badge variant="primary" className="capitalize">
                {invitationDetails.role}
              </Badge>
            </div>

            {invitationDetails.customMessage && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                  "{invitationDetails.customMessage}"
                </p>
              </div>
            )}

            <div className="text-xs text-gray-500 dark:text-gray-400">
              <p>Invited on {formatDate(invitationDetails.createdAt)}</p>
              <p>Expires on {formatDate(invitationDetails.expiresAt)}</p>
            </div>
          </div>

          {/* Role Permissions */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <roleInfo.icon className={`h-5 w-5 mr-2 ${roleInfo.color}`} />
              Your Role: {invitationDetails.role}
            </h3>
            <div className={`${roleInfo.bgColor} dark:opacity-20 rounded-lg p-4`}>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                As a {invitationDetails.role}, you will be able to:
              </p>
              <ul className="space-y-2">
                {roleInfo.permissions.map((permission, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <CheckCircleIcon className={`h-4 w-4 mr-2 ${roleInfo.color}`} />
                    {permission}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          {!isExpired && (
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleAcceptInvitation}
                disabled={isAccepting || isRejecting || (!isAuthenticated && showLoginPrompt)}
                className="flex-1 flex items-center justify-center"
                size="lg"
              >
                {isAccepting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Accepting...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Accept Invitation
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleRejectInvitation}
                disabled={isAccepting || isRejecting}
                className="flex-1 flex items-center justify-center"
                size="lg"
              >
                {isRejecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Declining...
                  </>
                ) : (
                  <>
                    <XCircleIcon className="h-5 w-5 mr-2" />
                    Decline
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Authentication Required Notice */}
          {!isAuthenticated && !showLoginPrompt && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                To accept this invitation, you need to:
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/login"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-center hover:bg-blue-700 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="flex-1 border border-gray-300 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Create Account
                </Link>
              </div>
            </div>
          )}
        </Card>

        {/* Additional Info */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          <p>
            This invitation was sent to {invitationDetails.email}. 
            If you have any questions, please contact the workspace owner.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvitationPage;