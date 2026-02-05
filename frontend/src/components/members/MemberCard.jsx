import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Trash2, Edit3, Shield, User, Mail, Calendar, MoreVertical } from 'lucide-react';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import RoleSelector from './RoleSelector';
import { useWorkspaces } from '../../hooks/useWorkspaces';

const MemberCard = ({ 
  member, 
  workspaceId, 
  currentUserRole,
  onRemove,
  onRoleUpdate,
  isCurrentUser = false,
  compact = false,
  showActions = true 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { removeMember, updateMemberRole } = useWorkspaces();
  const { user: currentUser } = useSelector(state => state.auth);

  // Permission checks
  const canEditRole = currentUserRole === 'admin' && !isCurrentUser && member.role !== 'owner';
  const canRemove = currentUserRole === 'admin' && !isCurrentUser && member.role !== 'owner';
  const isOwner = member.role === 'owner';

  const handleRoleChange = async (newRole) => {
    if (newRole === member.role) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      await updateMemberRole(workspaceId, member.userId, { role: newRole });
      onRoleUpdate?.(member.userId, newRole);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update member role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!confirm(`Remove ${member.name} from this workspace?`)) return;
    
    setIsLoading(true);
    try {
      await removeMember(workspaceId, member.userId);
      onRemove?.(member.userId);
    } catch (error) {
      console.error('Failed to remove member:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatJoinDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner': return <Shield className="w-4 h-4 text-yellow-500" />;
      case 'admin': return <Shield className="w-4 h-4 text-red-500" />;
      case 'editor': return <Edit3 className="w-4 h-4 text-blue-500" />;
      case 'viewer': return <User className="w-4 h-4 text-gray-500" />;
      default: return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'owner': return 'yellow';
      case 'admin': return 'red';
      case 'editor': return 'blue';
      case 'viewer': return 'gray';
      default: return 'gray';
    }
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
        <div className="flex items-center space-x-3">
          <Avatar 
            src={member.avatar} 
            name={member.name} 
            size="sm"
            className="flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {member.name}
              {isCurrentUser && <span className="text-xs text-gray-500 ml-2">(You)</span>}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {member.email}
            </p>
          </div>
        </div>
        <Badge variant={getRoleColor(member.role)} size="sm">
          {member.role}
        </Badge>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <Avatar 
            src={member.avatar} 
            name={member.name} 
            size="lg"
            className="flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {member.name}
              </h3>
              {isCurrentUser && (
                <Badge variant="green" size="sm">You</Badge>
              )}
              {isOwner && (
                <Badge variant="yellow" size="sm">
                  <Shield className="w-3 h-3 mr-1" />
                  Owner
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <Mail className="w-4 h-4 text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                {member.email}
              </p>
            </div>
          </div>
        </div>

        {/* Actions Dropdown */}
        {showActions && (canEditRole || canRemove) && (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              disabled={isLoading}
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                {canEditRole && (
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setShowDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Change Role</span>
                  </button>
                )}
                {canRemove && (
                  <button
                    onClick={() => {
                      handleRemoveMember();
                      setShowDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Remove Member</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Role Section */}
      <div className="mb-4">
        {isEditing ? (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Change Role
            </label>
            <RoleSelector
              currentRole={member.role}
              onRoleChange={handleRoleChange}
              disabled={isLoading}
              excludeOwner={true}
            />
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            {getRoleIcon(member.role)}
            <Badge variant={getRoleColor(member.role)}>
              {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
            </Badge>
          </div>
        )}
      </div>

      {/* Member Info */}
      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>Joined {formatJoinDate(member.joinedAt)}</span>
        </div>
        
        {member.lastActive && (
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              new Date() - new Date(member.lastActive) < 5 * 60 * 1000 
                ? 'bg-green-500' 
                : 'bg-gray-400'
            }`} />
            <span>
              Last active {new Date(member.lastActive).toLocaleDateString()}
            </span>
          </div>
        )}

        {member.permissions && member.permissions.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Permissions
            </p>
            <div className="flex flex-wrap gap-1">
              {member.permissions.map((permission) => (
                <Badge key={permission} variant="gray" size="sm">
                  {permission}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

export default MemberCard;