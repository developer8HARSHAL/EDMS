import React, { useState } from 'react';
import { 
  Users, 
  Crown, 
  Shield, 
  Edit, 
  Eye, 
  MoreVertical, 
  UserMinus, 
  UserPlus,
  Mail,
  Calendar,
  Search,
  Filter,
  Settings
} from 'lucide-react';

const MemberList = ({ 
  members = [], 
  currentUserId,
  currentUserRole,
  onUpdateMemberRole,
  onRemoveMember,
  onInviteMembers,
  isLoading = false,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showDropdown, setShowDropdown] = useState(null);

  // Determine if current user can perform admin actions
  const canManageMembers = currentUserRole === 'admin' || currentUserRole === 'owner';
  const canRemoveMembers = currentUserRole === 'owner';

  // Role configurations
  const roleConfig = {
    owner: {
      label: 'Owner',
      icon: Crown,
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      description: 'Full control over workspace'
    },
    admin: {
      label: 'Admin',
      icon: Shield,
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      description: 'Can manage members and settings'
    },
    editor: {
      label: 'Editor',
      icon: Edit,
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      description: 'Can edit and upload documents'
    },
    viewer: {
      label: 'Viewer',
      icon: Eye,
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
      description: 'Can view and download documents'
    }
  };

  // Filter members based on search and role
  const filteredMembers = members.filter(member => {
    const matchesSearch = !searchTerm || 
      member.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Get member's initials for avatar
  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle role change
// Handle role change
const handleRoleChange = async (memberId, newRole) => {
  try {
    // ✅ Find the member to get their user ID
    const member = members.find(m => m._id === memberId);
    const userId = member?.user?._id || member?.user;
    
    console.log('🔄 Role change:', { 
      memberRecordId: memberId, 
      userId, 
      newRole 
    });
    
    if (!userId) {
      throw new Error('Could not find user ID for member');
    }
    
    await onUpdateMemberRole(userId, { role: newRole });
    setShowDropdown(null);
  } catch (error) {
    console.error('Failed to update member role:', error);
  }
};

  // Handle member removal
// Handle member removal
const handleRemoveMember = async (memberId) => {
  if (window.confirm('Are you sure you want to remove this member from the workspace?')) {
    try {
      // ✅ Find the member to get their user ID
      const member = members.find(m => m._id === memberId);
      const userId = member?.user?._id || member?.user;
      
      console.log('🗑️ Member removal:', { 
        memberRecordId: memberId, 
        userId 
      });
      
      if (!userId) {
        throw new Error('Could not find user ID for member');
      }
      
      await onRemoveMember(userId);
      setShowDropdown(null);
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  }
};

  // Handle dropdown click
  const handleDropdownClick = (e, memberId) => {
    e.stopPropagation();
    setShowDropdown(showDropdown === memberId ? null : memberId);
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-gray-700" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Members ({members.length})
              </h2>
              <p className="text-sm text-gray-600">
                Manage workspace members and their permissions
              </p>
            </div>
          </div>

          {canManageMembers && (
            <button
              onClick={onInviteMembers}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={isLoading}
            >
              <UserPlus className="w-4 h-4" />
              Invite Members
            </button>
          )}
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search members..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="owner">Owners</option>
              <option value="admin">Admins</option>
              <option value="editor">Editors</option>
              <option value="viewer">Viewers</option>
            </select>
            <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Member List */}
      <div className="divide-y divide-gray-200">
        {filteredMembers.length > 0 ? (
          filteredMembers.map((member) => {
            const roleInfo = roleConfig[member.role] || roleConfig.viewer;
            const IconComponent = roleInfo.icon;
            const isCurrentUser = member.user?._id === currentUserId || member.user === currentUserId;
            const canEditThisMember = canManageMembers && !isCurrentUser && member.role !== 'owner';
            const canRemoveThisMember = canRemoveMembers && !isCurrentUser && member.role !== 'owner';

            return (
              <div key={member._id || member.user?._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {getInitials(member.user?.name)}
                    </div>

                    {/* Member Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {member.user?.name || 'Unknown User'}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-blue-600 font-normal">(You)</span>
                          )}
                        </h3>
                        
                        {/* Role Badge */}
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${roleInfo.bgColor} ${roleInfo.textColor}`}>
                          <IconComponent className="w-3 h-3" />
                          {roleInfo.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{member.user?.email || 'No email'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Joined {formatDate(member.joinedAt || member.createdAt)}</span>
                        </div>
                      </div>

                      <p className="text-xs text-gray-600 mt-1">
                        {roleInfo.description}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  {(canEditThisMember || canRemoveThisMember) && (
                    <div className="relative">
                      <button
                        onClick={(e) => handleDropdownClick(e, member._id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={isLoading}
                      >
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </button>

                      {showDropdown === member._id && (
                        <>
                          {/* Backdrop */}
                          <div 
                            className="fixed inset-0 z-10"
                            onClick={() => setShowDropdown(null)}
                          />
                          
                          {/* Dropdown Menu */}
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                            {canEditThisMember && (
                              <>
                                <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                  Change Role
                                </div>
                                {Object.entries(roleConfig).map(([roleKey, roleData]) => {
                                  if (roleKey === 'owner') return null; // Can't assign owner role
                                  const RoleIcon = roleData.icon;
                                  
                                  return (
                                    <button
                                      key={roleKey}
                                      onClick={() => handleRoleChange(member._id, roleKey)}
                                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 ${
                                        member.role === roleKey ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                                      }`}
                                      disabled={isLoading}
                                    >
                                      <RoleIcon className="w-4 h-4" />
                                      {roleData.label}
                                    </button>
                                  );
                                })}
                              </>
                            )}

                            {canRemoveThisMember && (
                              <>
                                <hr className="my-2" />
                                <button
                                  onClick={() => handleRemoveMember(member._id)}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                                  disabled={isLoading}
                                >
                                  <UserMinus className="w-4 h-4" />
                                  Remove Member
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center text-gray-500">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || roleFilter !== 'all' ? 'No members found' : 'No members yet'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {searchTerm || roleFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Start by inviting team members to collaborate'
              }
            </p>
            {canManageMembers && !searchTerm && roleFilter === 'all' && (
              <button
                onClick={onInviteMembers}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Invite Members
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberList;