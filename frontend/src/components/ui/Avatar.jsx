import React, { useState, useEffect } from 'react';
import { User, Camera, Upload } from 'lucide-react';

const Avatar = ({
  src,
  alt,
  name,
  size = 'default',
  variant = 'circle',
  fallback,
  showInitials = true,
  showOnlineStatus = false,
  isOnline = false,
  className = '',
  onClick,
  editable = false,
  onImageChange,
  onImageError,
  loading = false,
  border = false,
  borderColor = 'gray',
  // Status indicator
  statusPosition = 'bottom-right',
  statusSize = 'default',
  // Group avatar
  isGroup = false,
  groupMembers = [],
  maxGroupDisplay = 3,
  // Accessibility
  role = 'img',
  ariaLabel,
  tabIndex,
  // Style customization
  backgroundColor,
  textColor,
  fontSize
}) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setImageSrc(src);
    setImageError(false);
  }, [src]);

  // Size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'xs':
        return 'w-6 h-6 text-xs';
      case 'sm':
        return 'w-8 h-8 text-sm';
      case 'lg':
        return 'w-12 h-12 text-lg';
      case 'xl':
        return 'w-16 h-16 text-xl';
      case '2xl':
        return 'w-20 h-20 text-2xl';
      case '3xl':
        return 'w-24 h-24 text-3xl';
      default:
        return 'w-10 h-10 text-base';
    }
  };

  // Variant classes
  const getVariantClasses = () => {
    switch (variant) {
      case 'square':
        return 'rounded-lg';
      case 'rounded':
        return 'rounded-xl';
      default:
        return 'rounded-full';
    }
  };

  // Border classes
  const getBorderClasses = () => {
    if (!border) return '';
    
    const borderColors = {
      gray: 'border-gray-300 dark:border-gray-600',
      blue: 'border-blue-500',
      green: 'border-green-500',
      red: 'border-red-500',
      yellow: 'border-yellow-500',
      purple: 'border-purple-500',
      white: 'border-white'
    };
    
    return `border-2 ${borderColors[borderColor] || borderColors.gray}`;
  };

  // Generate initials from name
  const getInitials = (fullName) => {
    if (!fullName) return '';
    return fullName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Generate background color from name
  const getBackgroundColor = (fullName) => {
    if (backgroundColor) return backgroundColor;
    if (!fullName) return 'bg-gray-500';
    
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-cyan-500',
      'bg-orange-500', 'bg-lime-500', 'bg-emerald-500', 'bg-teal-500'
    ];
    
    const hash = fullName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Handle image error
  const handleImageError = () => {
    setImageError(true);
    setImageSrc(null);
    onImageError?.();
  };

  // Handle image upload
  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target?.result);
        onImageChange?.(file, e.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Status indicator
  const StatusIndicator = () => {
    if (!showOnlineStatus) return null;
    
    const statusSizes = {
      xs: 'w-1.5 h-1.5',
      sm: 'w-2 h-2',
      default: 'w-2.5 h-2.5',
      lg: 'w-3 h-3'
    };
    
    const positions = {
      'top-right': 'top-0 right-0',
      'top-left': 'top-0 left-0',
      'bottom-right': 'bottom-0 right-0',
      'bottom-left': 'bottom-0 left-0'
    };
    
    return (
      <div className={`absolute ${positions[statusPosition]} transform translate-x-1/4 -translate-y-1/4`}>
        <div className={`
          ${statusSizes[statusSize] || statusSizes.default}
          ${isOnline ? 'bg-green-500' : 'bg-gray-400'}
          rounded-full border-2 border-white dark:border-gray-800
        `} />
      </div>
    );
  };

  // Group avatar display
  const GroupAvatar = () => {
    const displayMembers = groupMembers.slice(0, maxGroupDisplay);
    const remainingCount = groupMembers.length - maxGroupDisplay;
    
    return (
      <div className="relative">
        <div className="flex -space-x-2">
          {displayMembers.map((member, index) => (
            <Avatar
              key={member.id || index}
              src={member.avatar}
              name={member.name}
              size={size}
              variant={variant}
              className="ring-2 ring-white dark:ring-gray-800"
              showOnlineStatus={false}
            />
          ))}
          {remainingCount > 0 && (
            <div className={`
              flex items-center justify-center
              ${getSizeClasses()}
              ${getVariantClasses()}
              bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300
              ring-2 ring-white dark:ring-gray-800 font-medium
            `}>
              +{remainingCount}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Loading spinner
  const LoadingSpinner = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full">
      <div className="animate-spin rounded-full h-1/2 w-1/2 border-b-2 border-gray-500"></div>
    </div>
  );

  // Edit overlay
  const EditOverlay = () => {
    if (!editable) return null;
    
    return (
      <div className={`
        absolute inset-0 flex items-center justify-center
        bg-black bg-opacity-50 rounded-full opacity-0 transition-opacity
        ${isHovered ? 'opacity-100' : ''}
      `}>
        <Camera className="w-1/3 h-1/3 text-white" />
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Upload avatar image"
        />
      </div>
    );
  };

  if (isGroup) {
    return <GroupAvatar />;
  }

  const baseClasses = `
    relative inline-flex items-center justify-center flex-shrink-0
    ${getSizeClasses()}
    ${getVariantClasses()}
    ${getBorderClasses()}
    ${onClick ? 'cursor-pointer hover:opacity-80' : ''}
    ${editable ? 'cursor-pointer' : ''}
    transition-all duration-200
    ${className}
  `;

  return (
    <div
      className={baseClasses}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role={role}
      aria-label={ariaLabel || `Avatar for ${name || 'user'}`}
      tabIndex={tabIndex}
      style={{
        backgroundColor: backgroundColor,
        color: textColor,
        fontSize: fontSize
      }}
    >
      {loading ? (
        <LoadingSpinner />
      ) : imageSrc && !imageError ? (
        <img
          src={imageSrc}
          alt={alt || name || 'Avatar'}
          className={`w-full h-full object-cover ${getVariantClasses()}`}
          onError={handleImageError}
          loading="lazy"
        />
      ) : fallback ? (
        fallback
      ) : showInitials && name ? (
        <span 
          className={`
            font-medium text-white select-none
            ${getBackgroundColor(name)}
            w-full h-full flex items-center justify-center
            ${getVariantClasses()}
          `}
        >
          {getInitials(name)}
        </span>
      ) : (
        <div className={`
          bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400
          w-full h-full flex items-center justify-center
          ${getVariantClasses()}
        `}>
          <User className="w-1/2 h-1/2" />
        </div>
      )}
      
      <StatusIndicator />
      <EditOverlay />
    </div>
  );
};

// Specialized Avatar Components
export const UserAvatar = ({ user, ...props }) => (
  <Avatar
    src={user?.avatar || user?.profilePicture}
    name={user?.name || user?.fullName || user?.username}
    alt={`${user?.name || 'User'} avatar`}
    {...props}
  />
);

export const GroupAvatar = ({ members, ...props }) => (
  <Avatar
    isGroup={true}
    groupMembers={members}
    {...props}
  />
);

export const EditableAvatar = ({ onUpload, ...props }) => (
  <Avatar
    editable={true}
    onImageChange={onUpload}
    {...props}
  />
);

export const AvatarWithStatus = ({ isOnline, lastSeen, ...props }) => {
  const isRecentlyOnline = lastSeen && 
    new Date() - new Date(lastSeen) < 5 * 60 * 1000; // 5 minutes
  
  return (
    <Avatar
      showOnlineStatus={true}
      isOnline={isOnline || isRecentlyOnline}
      {...props}
    />
  );
};

export const AvatarStack = ({ 
  avatars = [], 
  max = 3, 
  size = 'default',
  spacing = 'normal',
  showCount = true,
  className = ''
}) => {
  const displayAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;
  
  const getSpacing = () => {
    switch (spacing) {
      case 'tight':
        return '-space-x-1';
      case 'loose':
        return '-space-x-3';
      default:
        return '-space-x-2';
    }
  };
  
  return (
    <div className={`flex ${getSpacing()} ${className}`}>
      {displayAvatars.map((avatar, index) => (
        <Avatar
          key={avatar.id || index}
          src={avatar.src || avatar.avatar}
          name={avatar.name}
          size={size}
          className="ring-2 ring-white dark:ring-gray-800"
          {...avatar}
        />
      ))}
      {showCount && remainingCount > 0 && (
        <div className={`
          flex items-center justify-center
          ${size === 'xs' ? 'w-6 h-6 text-xs' :
            size === 'sm' ? 'w-8 h-8 text-sm' :
            size === 'lg' ? 'w-12 h-12 text-lg' :
            size === 'xl' ? 'w-16 h-16 text-xl' :
            'w-10 h-10 text-base'
          }
          bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300
          rounded-full ring-2 ring-white dark:ring-gray-800 font-medium
        `}>
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

export default Avatar;