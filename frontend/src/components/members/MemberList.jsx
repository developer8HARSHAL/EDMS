import React, { useState } from 'react';
import { Shield, Edit, Eye, MoreVertical, UserMinus, UserPlus, Mail, Calendar, Search, Filter, Users } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import dropdown from '../ui/Dropdown';

// Only the three roles that actually exist on members[] (owner is workspace.owner, tracked separately)
const ROLE_ICONS = { admin: Shield, editor: Edit, viewer: Eye };
const ROLE_DESCRIPTIONS = {
  admin: 'Can manage members and settings',
  editor: 'Can edit and upload documents',
  viewer: 'Can view and download documents',
};

const getInitialsFallback = (name) => (name ? name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2) : '??');

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown';
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const MemberList = ({
  members = [],
  currentUserId,
  currentUserRole,
  onUpdateMemberRole,
  onRemoveMember,
  onInviteMembers,
  isLoading = false,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showDropdown, setShowDropdown] = useState(null);

  const canManageMembers = currentUserRole === 'admin' || currentUserRole === 'owner';
  const canRemoveMembers = currentUserRole === 'owner';

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      !searchTerm ||
      member.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = async (memberId, newRole) => {
    const member = members.find((m) => m._id === memberId);
    const userId = member?.user?._id || member?.user;
    if (!userId) return;
    await onUpdateMemberRole(userId, { role: newRole });
    setShowDropdown(null);
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove this member from the workspace?')) return;
    const member = members.find((m) => m._id === memberId);
    const userId = member?.user?._id || member?.user;
    if (!userId) return;
    await onRemoveMember(userId);
    setShowDropdown(null);
  };

  const handleDropdownClick = (e, memberId) => {
    e.stopPropagation();
    setShowDropdown(showDropdown === memberId ? null : memberId);
  };

  return (
    <Card padding={false} className={className}>
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-ink-muted">Manage workspace members and their permissions</p>
          </div>
        
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search members..."
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className=" appearance-none bg-surface border border-border text-ink text-sm rounded-xl pl-4 pr-9 py-2.5 shadow-xs focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All roles</option>
              <option value="admin">Admins</option>
              <option value="editor">Editors</option>
              <option value="viewer">Viewers</option>
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-muted pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="divide-y divide-border">
        {filteredMembers.length > 0 ? (
          filteredMembers.map((member) => {
            const isCurrentUser = member.user?._id === currentUserId || member.user === currentUserId;
            const canEditThisMember = canManageMembers && !isCurrentUser && member.role !== 'owner';
            const canRemoveThisMember = canRemoveMembers && !isCurrentUser && member.role !== 'owner';

            return (
              <div key={member._id || member.user?._id} className="px-4 py-3.5 hover:bg-surface-2 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar user={member.user} name={member.user?.name || getInitialsFallback(member.user?.name)} size="md" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-ink truncate">{member.user?.name || 'Unknown user'}</p>
                        {isCurrentUser && <span className="text-xs text-primary-600 dark:text-primary-400">(You)</span>}
                        <Badge variant="primary" size="sm" className="capitalize">
                          {member.role}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-ink-muted mt-0.5">
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="h-3 w-3 shrink-0" />
                          {member.user?.email || 'No email'}
                        </span>
                        <span className="flex items-center gap-1 shrink-0">
                          <Calendar className="h-3 w-3" />
                          Joined {formatDate(member.joinedAt || member.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted mt-0.5">{ROLE_DESCRIPTIONS[member.role]}</p>
                    </div>
                  </div>

                  {(canEditThisMember || canRemoveThisMember) && (
                    <div className="relative shrink-0">
                      <button
                        onClick={(e) => handleDropdownClick(e, member._id)}
                        className="p-1.5 text-ink-muted hover:text-ink hover:bg-surface rounded-md transition-colors"
                        disabled={isLoading}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {showDropdown === member._id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(null)} />
                          <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-border rounded-lg shadow-panel py-2 z-20">
                            {canEditThisMember && (
                              <>
                                <div className="px-4 py-1.5 text-xs font-medium text-ink-muted uppercase tracking-wide">Change role</div>
                                {Object.entries(ROLE_ICONS).map(([roleKey, RoleIcon]) => (
                                  <button
                                    key={roleKey}
                                    onClick={() => handleRoleChange(member._id, roleKey)}
                                    className={`w-full px-4 py-2 text-left text-sm hover:bg-surface-2 flex items-center gap-3 capitalize ${
                                      member.role === roleKey ? 'text-primary-700 bg-primary-50 dark:bg-primary-950/40 dark:text-primary-300' : 'text-ink'
                                    }`}
                                    disabled={isLoading}
                                  >
                                    <RoleIcon className="h-4 w-4" />
                                    {roleKey}
                                  </button>
                                ))}
                              </>
                            )}
                            {canRemoveThisMember && (
                              <>
                                <hr className="my-2 border-border" />
                                <button
                                  onClick={() => handleRemoveMember(member._id)}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-3"
                                  disabled={isLoading}
                                >
                                  <UserMinus className="h-4 w-4" />
                                  Remove member
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
          <div className="py-12 text-center">
            <Users className="h-8 w-8 text-ink-muted mx-auto mb-3" />
            <p className="text-sm font-medium text-ink">{searchTerm || roleFilter !== 'all' ? 'No members found' : 'No members yet'}</p>
            <p className="text-sm text-ink-muted mt-1 mb-4">
              {searchTerm || roleFilter !== 'all' ? 'Try adjusting your search or filter.' : 'Start by inviting team members to collaborate.'}
            </p>
            {canManageMembers && !searchTerm && roleFilter === 'all' && (
              <Button size="sm" onClick={onInviteMembers} leftIcon={<UserPlus className="h-4 w-4" />}>
                Invite members
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default MemberList;