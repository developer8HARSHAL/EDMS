import React, { useState, useEffect } from 'react';
import { User, Camera } from 'lucide-react';
import { DEFAULT_PROFILE_AVATAR, PROFILE_AVATARS } from '../../constants/profileAvatars';

const Avatar = ({
  src,
  avatar,
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
  statusPosition = 'bottom-right',
  statusSize = 'default',
  isGroup = false,
  groupMembers = [],
  maxGroupDisplay = 3,
  role = 'img',
  ariaLabel,
  tabIndex,
  backgroundColor,
  textColor,
  fontSize
}) => {
  const resolveAvatarSrc = (avatarKey) => (
    avatarKey && PROFILE_AVATARS[avatarKey] ? PROFILE_AVATARS[avatarKey] : null
  );

  const resolvedSrc = resolveAvatarSrc(avatar) || src;
  const [imageSrc, setImageSrc] = useState(resolvedSrc);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setImageSrc(resolveAvatarSrc(avatar) || src);
    setImageError(false);
  }, [avatar, src]);

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
      gray: 'border-border',
      blue: 'border-primary-500',
      green: 'border-success',
      red: 'border-danger',
      yellow: 'border-warning',
      // No purple lane in this design system (monochrome-blue + danger/
      // success/warning trio only) — falls back to border-border rather
      // than introducing an unregistered hue.
      purple: 'border-border',
      // Literal white is an intentional exception here, not a token miss:
      // this option exists for avatars sitting on a solid-color surface
      // (e.g. ProfileCard) where the ring must read as white regardless
      // of theme, the same way ProfileCard's own text is fixed white.
      white: 'border-white'
    };
    
    return `border-2 ${borderColors[borderColor] || borderColors.gray}`;
  };

  // Generate initials from name
const getInitials = (fullName) => {
  if (!fullName) return '';
  if (typeof fullName !== 'string') {
    console.warn('Avatar received a non-string name:', fullName);
    return '';
  }
  return fullName
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

  // Hash-based per-person color, distinct-looking without leaving the
  // primary token scale — each stop is a registered Tailwind color with a
  // paired text tone for contrast (light stops get dark text, dark stops
  // get white text) instead of one hardcoded white applied to every hue.
  const INITIALS_PALETTE = [
    { bg: 'bg-primary-300', text: 'text-primary-900' },
    { bg: 'bg-primary-400', text: 'text-white' },
    { bg: 'bg-primary-500', text: 'text-white' },
    { bg: 'bg-primary-600', text: 'text-white' },
    { bg: 'bg-primary-700', text: 'text-white' },
 
  ];
  const INITIALS_FALLBACK = { bg: 'bg-surface-2', text: 'text-ink-muted' };

  const getInitialsColors = (fullName) => {
    if (backgroundColor) return { bg: '', text: textColor ? '' : 'text-white' };
    if (!fullName || typeof fullName !== 'string') return INITIALS_FALLBACK;

    const hash = fullName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return INITIALS_PALETTE[hash % INITIALS_PALETTE.length];
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
          ${isOnline ? 'bg-success' : 'bg-ink-muted'}
          rounded-full border-2 border-surface
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
              className="ring-2 ring-surface"
              showOnlineStatus={false}
            />
          ))}
          {remainingCount > 0 && (
            <div className={`
              flex items-center justify-center
              ${getSizeClasses()}
              ${getVariantClasses()}
              bg-surface-2 text-ink-muted
              ring-2 ring-surface font-medium
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
    <div className="absolute inset-0 flex items-center justify-center bg-surface-2 rounded-full">
      <div className="animate-spin rounded-full h-1/2 w-1/2 border-b-2 border-primary-600"></div>
    </div>
  );

  // Edit overlay
  const EditOverlay = () => {
    if (!editable) return null;
    
    return (
      <div className={`
        absolute inset-0 flex items-center justify-center
        bg-overlay/50 rounded-full opacity-0 transition-opacity
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
            font-medium select-none
            ${getInitialsColors(name).bg} ${getInitialsColors(name).text}
            w-full h-full flex items-center justify-center
            ${getVariantClasses()}
          `}
        >
          {getInitials(name)}
        </span>
      ) : (
        <div className={`
          bg-surface-2 text-ink-muted
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
    avatar={user?.avatar}
    src={user?.profilePicture}
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
          className="ring-2 ring-surface"
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
          bg-surface-2 text-ink-muted
          rounded-full ring-2 ring-surface font-medium
        `}>
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

export default Avatar;