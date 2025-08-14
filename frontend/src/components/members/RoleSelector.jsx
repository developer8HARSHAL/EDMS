import React, { useState } from 'react';
import { ChevronDown, Shield, Edit3, User, Eye, Check, Info } from 'lucide-react';

const RoleSelector = ({
  currentRole = 'viewer',
  onRoleChange,
  disabled = false,
  excludeOwner = false,
  showPermissions = true,
  size = 'default',
  variant = 'default'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(currentRole);

  const roles = [
    {
      value: 'owner',
      label: 'Owner',
      icon: Shield,
      color: 'text-yellow-600 bg-yellow-50',
      description: 'Full control over workspace and all settings',
      permissions: [
        'Manage workspace settings',
        'Add/remove members',
        'Change member roles',
        'Delete workspace',
        'Full document access'
      ]
    },
    {
      value: 'admin',
      label: 'Admin',
      icon: Shield,
      color: 'text-red-600 bg-red-50',
      description: 'Manage members and workspace settings',
      permissions: [
        'Add/remove members',
        'Change member roles',
        'Manage workspace settings',
        'Full document access',
        'Manage invitations'
      ]
    },
    {
      value: 'editor',
      label: 'Editor',
      icon: Edit3,
      color: 'text-blue-600 bg-blue-50',
      description: 'Create, edit, and manage documents',
      permissions: [
        'Create documents',
        'Edit all documents',
        'Delete own documents',
        'Upload files',
        'Comment on documents'
      ]
    },
    {
      value: 'viewer',
      label: 'Viewer',
      icon: Eye,
      color: 'text-gray-600 bg-gray-50',
      description: 'View and download documents only',
      permissions: [
        'View documents',
        'Download documents',
        'Comment on documents',
        'View workspace members'
      ]
    }
  ];

  const availableRoles = excludeOwner 
    ? roles.filter(role => role.value !== 'owner')
    : roles;

  const currentRoleData = roles.find(role => role.value === selectedRole);

  const handleRoleSelect = (roleValue) => {
    setSelectedRole(roleValue);
    setIsOpen(false);
    onRoleChange?.(roleValue);
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2 text-sm';
      case 'lg':
        return 'px-4 py-3 text-base';
      default:
        return 'px-4 py-2 text-sm';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'outline':
        return 'border-2 border-gray-300 bg-white hover:border-gray-400';
      case 'filled':
        return 'border border-gray-300 bg-gray-50 hover:bg-gray-100';
      default:
        return 'border border-gray-300 bg-white hover:bg-gray-50';
    }
  };

  if (!currentRoleData) return null;

  return (
    <div className="relative">
      {/* Role Selector Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between rounded-lg transition-colors
          ${getSizeClasses()}
          ${getVariantClasses()}
          ${disabled 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'text-gray-900 hover:shadow-sm cursor-pointer'
          }
          dark:bg-gray-800 dark:border-gray-600 dark:text-white
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        `}
      >
        <div className="flex items-center space-x-3">
          <div className={`p-1.5 rounded-md ${currentRoleData.color} dark:bg-gray-700`}>
            <currentRoleData.icon className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="font-medium">{currentRoleData.label}</div>
            {size === 'lg' && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {currentRoleData.description}
              </div>
            )}
          </div>
        </div>
        <ChevronDown 
          className={`w-5 h-5 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {availableRoles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.value;
            
            return (
              <div key={role.value}>
                <button
                  onClick={() => handleRoleSelect(role.value)}
                  className={`
                    w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 
                    flex items-start space-x-3 transition-colors
                    ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                  `}
                >
                  <div className={`p-1.5 rounded-md ${role.color} dark:bg-gray-700 flex-shrink-0 mt-0.5`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {role.label}
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {role.description}
                    </div>
                    
                    {showPermissions && (
                      <div className="mt-2">
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                          Key Permissions:
                        </div>
                        <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                          {role.permissions.slice(0, 3).map((permission, index) => (
                            <li key={index} className="flex items-center space-x-1">
                              <div className="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                              <span>{permission}</span>
                            </li>
                          ))}
                          {role.permissions.length > 3 && (
                            <li className="text-blue-600 dark:text-blue-400">
                              +{role.permissions.length - 3} more...
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </button>
                
                {role.value !== availableRoles[availableRoles.length - 1].value && (
                  <div className="border-t border-gray-100 dark:border-gray-700" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Role Information Tooltip */}
      {showPermissions && size !== 'lg' && (
        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-blue-900 dark:text-blue-300">
                {currentRoleData.label} Permissions
              </div>
              <ul className="text-xs text-blue-700 dark:text-blue-400 mt-1 space-y-0.5">
                {currentRoleData.permissions.map((permission, index) => (
                  <li key={index} className="flex items-center space-x-1">
                    <div className="w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400 flex-shrink-0" />
                    <span>{permission}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleSelector;