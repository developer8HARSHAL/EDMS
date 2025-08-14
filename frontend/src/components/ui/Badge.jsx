import React from 'react';
import { X, Check, Clock, AlertTriangle, Info, Shield, Edit3, Eye, User } from 'lucide-react';

const Badge = ({
  children,
  variant = 'default',
  size = 'default',
  className = '',
  icon,
  iconPosition = 'left',
  removable = false,
  onRemove,
  disabled = false,
  animated = false,
  outline = false,
  rounded = true,
  uppercase = false,
  onClick,
  href,
  target,
  // Status-specific props
  status,
  role,
  count,
  max = 99,
  showZero = false,
  // Accessibility
  ariaLabel,
  title
}) => {
  // Variant color classes
  const getVariantClasses = () => {
    const baseClasses = outline 
      ? 'border-2 bg-transparent' 
      : 'border border-transparent';
    
    switch (variant) {
      case 'primary':
        return outline
          ? `${baseClasses} border-blue-500 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-900/20`
          : `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300`;
      case 'secondary':
        return outline
          ? `${baseClasses} border-gray-500 text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:border-gray-400 dark:hover:bg-gray-800`
          : `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300`;
      case 'success':
        return outline
          ? `${baseClasses} border-green-500 text-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-900/20`
          : `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300`;
      case 'warning':
        return outline
          ? `${baseClasses} border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:border-yellow-400 dark:hover:bg-yellow-900/20`
          : `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300`;
      case 'danger':
        return outline
          ? `${baseClasses} border-red-500 text-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-900/20`
          : `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300`;
      case 'info':
        return outline
          ? `${baseClasses} border-cyan-500 text-cyan-600 hover:bg-cyan-50 dark:text-cyan-400 dark:border-cyan-400 dark:hover:bg-cyan-900/20`
          : `${baseClasses} bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-300`;
      case 'purple':
        return outline
          ? `${baseClasses} border-purple-500 text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-400 dark:hover:bg-purple-900/20`
          : `${baseClasses} bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300`;
      case 'pink':
        return outline
          ? `${baseClasses} border-pink-500 text-pink-600 hover:bg-pink-50 dark:text-pink-400 dark:border-pink-400 dark:hover:bg-pink-900/20`
          : `${baseClasses} bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300`;
      case 'indigo':
        return outline
          ? `${baseClasses} border-indigo-500 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:border-indigo-400 dark:hover:bg-indigo-900/20`
          : `${baseClasses} bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300`;
      case 'gray':
        return outline
          ? `${baseClasses} border-gray-400 text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:border-gray-500 dark:hover:bg-gray-800`
          : `${baseClasses} bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300`;
      case 'black':
        return outline
          ? `${baseClasses} border-black text-black hover:bg-gray-50 dark:border-white dark:text-white dark:hover:bg-gray-800`
          : `${baseClasses} bg-black text-white dark:bg-white dark:text-black`;
      case 'white':
        return outline
          ? `${baseClasses} border-white text-white hover:bg-white/10`
          : `${baseClasses} bg-white text-gray-900 dark:bg-gray-900 dark:text-white`;
      default:
        return outline
          ? `${baseClasses} border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800`
          : `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300`;
    }
  };

  // Size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'xs':
        return 'px-1.5 py-0.5 text-xs';
      case 'sm':
        return 'px-2 py-0.5 text-xs';
      case 'lg':
        return 'px-3 py-1 text-sm';
      case 'xl':
        return 'px-4 py-1.5 text-base';
      default:
        return 'px-2.5 py-1 text-sm';
    }
  };

  // Status badge
  const getStatusIcon = (statusType) => {
    switch (statusType) {
      case 'active':
      case 'online':
      case 'success':
        return <Check className="w-3 h-3" />;
      case 'pending':
      case 'processing':
        return <Clock className="w-3 h-3" />;
      case 'warning':
        return <AlertTriangle className="w-3 h-3" />;
      case 'error':
      case 'failed':
        return <X className="w-3 h-3" />;
      case 'info':
        return <Info className="w-3 h-3" />;
      default:
        return null;
    }
  };

  // Role badge
  const getRoleIcon = (roleType) => {
    switch (roleType) {
      case 'owner':
        return <Shield className="w-3 h-3" />;
      case 'admin':
        return <Shield className="w-3 h-3" />;
      case 'editor':
        return <Edit3 className="w-3 h-3" />;
      case 'viewer':
        return <Eye className="w-3 h-3" />;
      default:
        return <User className="w-3 h-3" />;
    }
  };

  const getRoleVariant = (roleType) => {
    switch (roleType) {
      case 'owner':
        return 'warning';
      case 'admin':
        return 'danger';
      case 'editor':
        return 'primary';
      case 'viewer':
        return 'gray';
      default:
        return 'gray';
    }
  };

  // Count badge (notification style)
  const renderCount = () => {
    if (typeof count !== 'number') return null;
    if (count === 0 && !showZero) return null;
    
    const displayCount = count > max ? `${max}+` : count.toString();
    
    return (
      <span className="ml-1 font-semibold">
        {displayCount}
      </span>
    );
  };

  // Icon rendering
  const renderIcon = () => {
    let iconElement = null;
    
    if (status) {
      iconElement = getStatusIcon(status);
    } else if (role) {
      iconElement = getRoleIcon(role);
    } else if (icon) {
      iconElement = React.isValidElement(icon) ? icon : <icon className="w-3 h-3" />;
    }
    
    if (!iconElement) return null;
    
    return (
      <span className={iconPosition === 'right' ? 'ml-1' : 'mr-1'}>
        {iconElement}
      </span>
    );
  };

  // Remove button
  const renderRemoveButton = () => {
    if (!removable) return null;
    
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove?.(e);
        }}
        className="ml-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 transition-colors"
        aria-label="Remove"
      >
        <X className="w-3 h-3" />
      </button>
    );
  };

  // Determine variant based on status or role
  const finalVariant = status && !variant ? status === 'active' || status === 'online' || status === 'success' ? 'success' : 
                     status === 'pending' || status === 'processing' ? 'warning' :
                     status === 'error' || status === 'failed' ? 'danger' :
                     status === 'info' ? 'info' : variant :
                     role && !variant ? getRoleVariant(role) : variant;

  // Common classes
  const baseClasses = `
    inline-flex items-center font-medium leading-none
    ${rounded ? 'rounded-full' : 'rounded-md'}
    ${getSizeClasses()}
    ${getVariantClasses()}
    ${animated ? 'transition-all duration-200' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${onClick || href ? 'cursor-pointer hover:shadow-sm' : ''}
    ${uppercase ? 'uppercase' : ''}
    ${className}
  `;

  // Content
  const content = (
    <>
      {iconPosition === 'left' && renderIcon()}
      <span className="truncate">
        {children}
        {renderCount()}
      </span>
      {iconPosition === 'right' && renderIcon()}
      {renderRemoveButton()}
    </>
  );

  // Render as link
  if (href) {
    return (
      <a
        href={href}
        target={target}
        className={baseClasses}
        aria-label={ariaLabel}
        title={title}
      >
        {content}
      </a>
    );
  }

  // Render as button
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={baseClasses}
        aria-label={ariaLabel}
        title={title}
      >
        {content}
      </button>
    );
  }

  // Render as span
  return (
    <span
      className={baseClasses}
      aria-label={ariaLabel}
      title={title}
    >
      {content}
    </span>
  );
};

// Specialized Badge Components
export const StatusBadge = ({ status, children, ...props }) => (
  <Badge status={status} variant={status} {...props}>
    {children || status}
  </Badge>
);

export const RoleBadge = ({ role, ...props }) => (
  <Badge role={role} {...props}>
    {role}
  </Badge>
);

export const CountBadge = ({ count, max = 99, showZero = false, ...props }) => {
  if (typeof count !== 'number' || (count === 0 && !showZero)) {
    return null;
  }
  
  const displayCount = count > max ? `${max}+` : count.toString();
  
  return (
    <Badge variant="danger" size="xs" {...props}>
      {displayCount}
    </Badge>
  );
};

export const DotBadge = ({ variant = 'default', size = 'default', className = '', ...props }) => {
  const getDotSize = () => {
    switch (size) {
      case 'xs':
        return 'w-1.5 h-1.5';
      case 'sm':
        return 'w-2 h-2';
      case 'lg':
        return 'w-3 h-3';
      case 'xl':
        return 'w-4 h-4';
      default:
        return 'w-2.5 h-2.5';
    }
  };

  return (
    <Badge
      variant={variant}
      className={`p-0 ${getDotSize()} ${className}`}
      {...props}
    >
      <span className="sr-only">{props.children || 'Status indicator'}</span>
    </Badge>
  );
};

export const TagBadge = ({ onRemove, ...props }) => (
  <Badge
    variant="gray"
    size="sm"
    removable={!!onRemove}
    onRemove={onRemove}
    rounded={true}
    {...props}
  />
);

export const NotificationBadge = ({ count, max = 99, className = '', ...props }) => {
  if (typeof count !== 'number' || count === 0) {
    return null;
  }
  
  const displayCount = count > max ? `${max}+` : count.toString();
  
  return (
    <Badge
      variant="danger"
      size="xs"
      className={`absolute -top-1 -right-1 min-w-[1.25rem] h-5 flex items-center justify-center text-xs font-bold ${className}`}
      {...props}
    >
      {displayCount}
    </Badge>
  );
};

export default Badge;