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
  status,
  role,
  count,
  max = 99,
  showZero = false,
  dot = false,
  ariaLabel,
  title
}) => {

  const getVariantClasses = () => {
    const baseClasses = outline 
      ? 'border-2 bg-transparent' 
      : 'border border-transparent';

    const monochrome = outline
      ? `${baseClasses} border-primary-500 text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:border-primary-400 dark:hover:bg-primary-950/40`
      : `${baseClasses} bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300`;
    
    switch (finalVariant) {
      case 'primary':
      case 'success':
      case 'warning':
      case 'danger':
        return monochrome;
      case 'info':
        return outline
          ? `${baseClasses} border-cyan-500 text-cyan-600 hover:bg-cyan-50 dark:text-cyan-400 dark:border-cyan-400 dark:hover:bg-cyan-950/40`
          : `${baseClasses} bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300`;
      case 'purple':
        return outline
          ? `${baseClasses} border-purple-500 text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-400 dark:hover:bg-purple-950/40`
          : `${baseClasses} bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300`;
      case 'pink':
        return outline
          ? `${baseClasses} border-pink-500 text-pink-600 hover:bg-pink-50 dark:text-pink-400 dark:border-pink-400 dark:hover:bg-pink-950/40`
          : `${baseClasses} bg-pink-100 text-pink-800 dark:bg-pink-950/60 dark:text-pink-300`;
      case 'indigo':
        return outline
          ? `${baseClasses} border-indigo-500 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:border-indigo-400 dark:hover:bg-indigo-950/40`
          : `${baseClasses} bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300`;
      case 'gray':
        return outline
          ? `${baseClasses} border-border text-ink-muted hover:bg-surface-hover dark:hover:bg-surface-hover`
          : `${baseClasses} bg-surface-2 text-ink-muted`;
      case 'black':
        return outline
          ? `${baseClasses} border-black text-black hover:bg-surface-hover dark:border-white dark:text-white dark:hover:bg-surface-hover`
          : `${baseClasses} bg-black text-white dark:bg-white dark:text-black`;
      case 'white':
        return outline
          ? `${baseClasses} border-white text-white hover:bg-white/10`
          : `${baseClasses} bg-white text-gray-900 dark:bg-gray-900 dark:text-white`;
      default:
        return outline
          ? `${baseClasses} border-border text-ink-muted hover:bg-surface-hover dark:hover:bg-surface-hover`
          : `${baseClasses} bg-surface-2 text-ink-muted`;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'xs':
        return 'px-1.5 py-0.5 text-xs';
      case 'sm':
        return 'px-2 py-0.5 text-xs';
      case 'lg':
        return 'px-3 py-1.5 text-sm';
      case 'xl':
        return 'px-4 py-1.5 text-base';
      default:
        return 'px-2.5 py-1.5 text-sm';
    }
  };

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

  const renderDot = () => {
    if (!dot) return null;

    return (
      <span
        className={iconPosition === 'right' ? 'ml-1.5' : 'mr-1.5'}
        aria-hidden="true"
      >
        <span className="block h-1.5 w-1.5 rounded-full bg-current" />
      </span>
    );
  };

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
        className="ml-1 hover:bg-surface-hover dark:hover:bg-surface-hover rounded-full p-0.5 transition-colors"
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

  const baseClasses = `
    inline-flex items-center font-medium leading-none tracking-tight
    ${rounded ? 'rounded-full' : 'rounded-md'}
    ${getSizeClasses()}
    ${getVariantClasses()}
    ${animated ? 'transition-all duration-200' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${onClick || href ? 'cursor-pointer hover:shadow-xs' : ''}
    ${uppercase ? 'uppercase' : ''}
    ${className}
  `;

  // Content
  const content = (
    <>
      {iconPosition === 'left' && renderDot()}
      {iconPosition === 'left' && renderIcon()}
      <span className="truncate">
        {children}
        {renderCount()}
      </span>
      {iconPosition === 'right' && renderIcon()}
      {iconPosition === 'right' && renderDot()}
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