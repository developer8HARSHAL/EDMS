import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  Calendar, 
  MoreVertical, 
  Settings, 
  Trash2, 
  UserPlus, 
  Eye,
  Lock,
  Globe,
  Crown,
  Edit
} from 'lucide-react';

const WorkspaceCard = ({ 
  workspace, 
  userRole, 
  onEdit, 
  onDelete, 
  onInviteMembers,
  onViewMembers,
  className = '' 
}) => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  // Determine if user can perform admin actions
  const canEdit = userRole === 'admin' || userRole === 'owner' || userRole === 'editor';
  const canDelete = userRole === 'owner'|| userRole === 'admin';
  const canInvite = userRole === 'admin' || userRole === 'owner';

  // Format member count
  const formatMemberCount = (count) => {
    return count === 1 ? '1 member' : `${count} members`;
  };

  // Format document count
  const formatDocumentCount = (count) => {
    return count === 1 ? '1 document' : `${count} documents`;
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle card click to navigate to workspace
  const handleCardClick = (e) => {
    // Don't navigate if clicking on dropdown or action buttons
    if (e.target.closest('.dropdown-container') || 
        e.target.closest('.action-button') ||
        e.target.closest('.dropdown-menu')) {
      return;
    }
    navigate(`/workspaces/${workspace._id}`);
  };

  // Handle dropdown actions - FIXED VERSION
  const handleAction = (action, e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDropdown(false);
    
    // Use setTimeout to ensure state updates before navigation/actions
    setTimeout(() => {
      switch (action) {
        case 'edit':
          if (onEdit) onEdit(workspace);
          navigate(`/workspaces/${workspace._id}`);
          
          

          break;
        case 'delete':
          if (onDelete) onDelete(workspace);
          break;
        case 'invite':
          if (onInviteMembers) onInviteMembers(workspace);
          break;
        case 'members':
          if (onViewMembers) onViewMembers(workspace);
          break;
        case 'settings':
          console.log('Navigating to settings:', `/workspaces/${workspace._id}/settings`);
          navigate(`/workspaces/${workspace._id}/settings`);
          break;
        default:
          break;
      }
    }, 0);
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200 hover:border-blue-300 ${className}`}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {workspace.name}
              </h3>
              
              {/* Workspace Type Badge */}
              <div className="flex items-center gap-1">
                {workspace.isPublic ? (
                  <Globe className="w-4 h-4 text-green-500" title="Public workspace" />
                ) : (
                  <Lock className="w-4 h-4 text-gray-500" title="Private workspace" />
                )}
                
                {/* Owner Crown */}
                {userRole === 'owner' && (
                  <Crown className="w-4 h-4 text-yellow-500" title="You own this workspace" />
                )}
              </div>
            </div>
            
            {/* Description */}
            {workspace.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {workspace.description}
              </p>
            )}
          </div>

          {/* Dropdown Menu */}
          <div className="dropdown-container relative">
            <button
              className="action-button p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>

            {showDropdown && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(false);
                  }}
                />
                
                {/* Dropdown Menu */}
                <div className="dropdown-menu absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  <button
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                    onClick={(e) => handleAction('members', e)}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <Eye className="w-4 h-4" />
                    View Members
                  </button>

                  {canInvite && (
                    <button
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                      onClick={(e) => handleAction('invite', e)}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <UserPlus className="w-4 h-4" />
                      Invite Members
                    </button>
                  )}

                  {canEdit && (
                    <>
                      <hr className="my-2" />
                      <button
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                        onClick={(e) => handleAction('edit', e)}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <Edit className="w-4 h-4" />
                        Edit Workspace
                      </button>
                      
                      <button
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                        onClick={(e) => handleAction('settings', e)}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                    </>
                  )}

                  {canDelete && (
                    <>
                      <hr className="my-2" />
                      <button
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                        onClick={(e) => handleAction('delete', e)}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Workspace
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>{formatMemberCount(workspace.memberCount || workspace.members?.length || 0)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>{formatDocumentCount(workspace.documentCount || 0)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Created {formatDate(workspace.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 rounded-b-lg border-t border-gray-100">
        <div className="flex items-center justify-between">
          {/* User Role Badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Your role:</span>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              userRole === 'owner' 
                ? 'bg-yellow-100 text-yellow-800' 
                : userRole === 'admin'
                ? 'bg-blue-100 text-blue-800'
                : userRole === 'editor'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {userRole?.charAt(0).toUpperCase() + userRole?.slice(1)}
            </span>
          </div>

          {/* Last Activity */}
          {workspace.lastActivity && (
            <div className="text-xs text-gray-500">
              Last activity: {formatDate(workspace.lastActivity)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkspaceCard;