import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus, Search, Users, FileText, Globe, Lock, Crown } from 'lucide-react';

const WorkspaceSelector = ({ 
  workspaces = [], 
  selectedWorkspace, 
  onWorkspaceSelect = () => {}, // Default empty function
  onCreateWorkspace = () => {}, // Default empty function
  className = '',
  showCreateOption = true,
  placeholder = "Select workspace"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Filter workspaces based on search term
  const filteredWorkspaces = workspaces.filter(workspace =>
    workspace.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workspace.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get current user ID with multiple fallbacks
  const getCurrentUserId = () => {
    // Try multiple sources for user ID
    const userId = localStorage.getItem('userId') || 
                   localStorage.getItem('user_id') ||
                   sessionStorage.getItem('userId') ||
                   sessionStorage.getItem('user_id');
    
    // You might also get it from Redux state if available
    // const currentUser = useSelector(state => state.auth.user);
    // return currentUser?.id || currentUser?._id || userId;
    
    return userId;
  };

  // Get user role in workspace
  const getUserRole = (workspace) => {
    if (!workspace) return 'viewer';
    
    const currentUserId = getCurrentUserId();
    if (!currentUserId) return 'viewer';
    
    // Check if the current user is the owner
    const ownerId = workspace.owner?._id || workspace.owner;
    if (ownerId === currentUserId) {
      return 'owner';
    }
    
    // Find user in members array
    const member = workspace.members?.find(m => {
      const memberId = m.user?._id || m.user?.id || m.user;
      return memberId === currentUserId;
    });
    
    return member?.role || 'viewer';
  };

  // Handle workspace selection with error handling
  const handleWorkspaceSelect = (workspace) => {
    try {
      if (typeof onWorkspaceSelect === 'function') {
        onWorkspaceSelect(workspace);
      } else {
        console.warn('onWorkspaceSelect is not a function');
      }
      setIsOpen(false);
      setSearchTerm('');
    } catch (error) {
      console.error('Error selecting workspace:', error);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  // Handle create new workspace with error handling
  const handleCreateWorkspace = () => {
    try {
      if (typeof onCreateWorkspace === 'function') {
        onCreateWorkspace();
      } else {
        console.warn('onCreateWorkspace is not a function');
      }
      setIsOpen(false);
      setSearchTerm('');
    } catch (error) {
      console.error('Error creating workspace:', error);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  // Format member count
  const formatCount = (count, singular, plural) => {
    if (count === undefined || count === null) return `0 ${plural}`;
    return count === 1 ? `1 ${singular}` : `${count} ${plural}`;
  };

  // Safe property access helper
  const safeGet = (obj, path, defaultValue = 0) => {
    try {
      return path.split('.').reduce((current, key) => current?.[key], obj) ?? defaultValue;
    } catch {
      return defaultValue;
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {selectedWorkspace ? (
            <>
              {/* Workspace Icon */}
              <div className="flex-shrink-0">
                {selectedWorkspace.isPublic ? (
                  <Globe className="w-5 h-5 text-green-500" />
                ) : (
                  <Lock className="w-5 h-5 text-gray-500" />
                )}
              </div>
              
              {/* Workspace Info */}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 truncate">
                    {selectedWorkspace.name || 'Unnamed Workspace'}
                  </span>
                  {getUserRole(selectedWorkspace) === 'owner' && (
                    <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {formatCount(
                      safeGet(selectedWorkspace, 'memberCount') || 
                      safeGet(selectedWorkspace, 'members.length'), 
                      'member', 
                      'members'
                    )}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {formatCount(safeGet(selectedWorkspace, 'documentCount'), 'doc', 'docs')}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          {/* Search */}
          {workspaces.length > 5 && (
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search workspaces..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>
          )}

          {/* Workspace List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredWorkspaces.length > 0 ? (
              filteredWorkspaces.map((workspace) => {
                const isSelected = selectedWorkspace?._id === workspace._id;
                const userRole = getUserRole(workspace);
                
                return (
                  <button
                    key={workspace._id || workspace.id || Math.random()}
                    onClick={() => handleWorkspaceSelect(workspace)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors"
                  >
                    {/* Selection Indicator */}
                    <div className="w-5 h-5 flex items-center justify-center">
                      {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                    </div>
                    
                    {/* Workspace Icon */}
                    <div className="flex-shrink-0">
                      {workspace.isPublic ? (
                        <Globe className="w-5 h-5 text-green-500" />
                      ) : (
                        <Lock className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    
                    {/* Workspace Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-medium truncate ${isSelected ? 'text-blue-600' : 'text-gray-900'}`}>
                          {workspace.name || 'Unnamed Workspace'}
                        </span>
                        {userRole === 'owner' && (
                          <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                          userRole === 'owner' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : userRole === 'admin'
                            ? 'bg-blue-100 text-blue-800'
                            : userRole === 'editor'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {userRole}
                        </span>
                      </div>
                      
                      {workspace.description && (
                        <p className="text-xs text-gray-600 truncate mb-1">
                          {workspace.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {formatCount(
                            safeGet(workspace, 'memberCount') || 
                            safeGet(workspace, 'members.length'), 
                            'member', 
                            'members'
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {formatCount(safeGet(workspace, 'documentCount'), 'doc', 'docs')}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                {searchTerm ? 'No workspaces found' : 'No workspaces available'}
              </div>
            )}
          </div>

          {/* Create New Workspace Option */}
          {showCreateOption && (
            <>
              <div className="border-t border-gray-100" />
              <button
                onClick={handleCreateWorkspace}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                    <Plus className="w-3 h-3 text-blue-600" />
                  </div>
                </div>
                <span className="font-medium text-blue-600">Create New Workspace</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkspaceSelector;