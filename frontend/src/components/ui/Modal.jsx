import React, { useEffect, useRef } from 'react';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';
import {Button} from './Button';

const Modal = ({
  isOpen = false,
  onClose,
  title,
  children,
  size = 'default',
  variant = 'default',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  preventClose = false,
  className = '',
  overlayClassName = '',
  contentClassName = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  // Footer props
  footer,
  showFooter = false,
  primaryAction,
  secondaryAction,
  cancelAction,
  // Loading and states
  isLoading = false,
  loadingText = 'Processing...',
  // Accessibility
  ariaLabel,
  ariaDescribedBy,
  // Animation
  animationDuration = 200,
  // Icon variants
  icon,
  iconColor = 'blue'
}) => {
  const modalRef = useRef(null);
  const overlayRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements?.length > 0) {
        focusableElements[0].focus();
      }
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && closeOnEscape && !preventClose) {
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, closeOnEscape, preventClose, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current && closeOnOverlayClick && !preventClose) {
      onClose?.();
    }
  };

  const handleClose = () => {
    if (!preventClose && !isLoading) {
      onClose?.();
    }
  };

  // Size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'xs':
        return 'max-w-xs';
      case 'sm':
        return 'max-w-sm';
      case 'md':
        return 'max-w-md';
      case 'lg':
        return 'max-w-lg';
      case 'xl':
        return 'max-w-xl';
      case '2xl':
        return 'max-w-2xl';
      case '3xl':
        return 'max-w-3xl';
      case '4xl':
        return 'max-w-4xl';
      case '5xl':
        return 'max-w-5xl';
      case 'full':
        return 'max-w-full mx-4';
      default:
        return 'max-w-lg';
    }
  };

  // Variant classes
  const getVariantClasses = () => {
    switch (variant) {
      case 'danger':
        return 'border-red-200 dark:border-red-800';
      case 'warning':
        return 'border-yellow-200 dark:border-yellow-800';
      case 'success':
        return 'border-green-200 dark:border-green-800';
      case 'info':
        return 'border-blue-200 dark:border-blue-800';
      default:
        return 'border-gray-200 dark:border-gray-700';
    }
  };

  // Icon component
  const ModalIcon = () => {
    if (!icon) return null;

    const getIconComponent = () => {
      if (React.isValidElement(icon)) return icon;
      
      switch (icon) {
        case 'warning':
          return <AlertTriangle className="w-6 h-6" />;
        case 'danger':
          return <AlertCircle className="w-6 h-6" />;
        case 'success':
          return <CheckCircle className="w-6 h-6" />;
        case 'info':
          return <Info className="w-6 h-6" />;
        default:
          return icon;
      }
    };

    const getIconColorClasses = () => {
      switch (iconColor) {
        case 'red':
          return 'text-red-600 bg-red-100 dark:bg-red-900/20';
        case 'yellow':
          return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
        case 'green':
          return 'text-green-600 bg-green-100 dark:bg-green-900/20';
        case 'blue':
          return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
        default:
          return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
      }
    };

    return (
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${getIconColorClasses()}`}>
        {getIconComponent()}
      </div>
    );
  };

  // Default footer
  const DefaultFooter = () => {
    if (!showFooter && !primaryAction && !secondaryAction && !cancelAction) {
      return null;
    }

    return (
      <div className={`flex items-center justify-end space-x-3 px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-b-lg ${footerClassName}`}>
        {cancelAction && (
          <Button
            variant="outline"
            onClick={cancelAction.onClick || handleClose}
            disabled={isLoading || cancelAction.disabled}
            className={cancelAction.className}
          >
            {cancelAction.label || 'Cancel'}
          </Button>
        )}
        {secondaryAction && (
          <Button
            variant="outline"
            onClick={secondaryAction.onClick}
            disabled={isLoading || secondaryAction.disabled}
            className={secondaryAction.className}
          >
            {secondaryAction.label}
          </Button>
        )}
        {primaryAction && (
          <Button
            variant={primaryAction.variant || 'primary'}
            onClick={primaryAction.onClick}
            disabled={isLoading || primaryAction.disabled}
            isLoading={isLoading}
            loadingText={loadingText}
            className={primaryAction.className}
          >
            {primaryAction.label}
          </Button>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 overflow-y-auto ${className}`}
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={ariaDescribedBy}
      aria-label={ariaLabel}
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay */}
      <div
        ref={overlayRef}
        className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-${animationDuration} ${overlayClassName}`}
        onClick={handleOverlayClick}
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={modalRef}
          className={`
            relative w-full bg-white dark:bg-gray-900 rounded-lg shadow-xl
            transform transition-all duration-${animationDuration}
            ${getSizeClasses()}
            ${getVariantClasses()}
            border
            ${contentClassName}
          `}
          style={{
            animation: isOpen ? `modalSlideIn ${animationDuration}ms ease-out` : undefined
          }}
        >
          {/* Header */}
          {(title || showCloseButton || icon) && (
            <div className={`flex items-start justify-between p-6 ${headerClassName}`}>
              <div className="flex-1">
                <ModalIcon />
                {title && (
                  <h3 
                    id="modal-title"
                    className="text-lg font-semibold text-gray-900 dark:text-white leading-6"
                  >
                    {title}
                  </h3>
                )}
              </div>
              
              {showCloseButton && (
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={preventClose || isLoading}
                  className={`
                    ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                    focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1
                    transition-colors duration-150
                    ${(preventClose || isLoading) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}
                  `}
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Body */}
          <div className={`px-6 ${title || showCloseButton || icon ? 'pb-6' : 'py-6'} ${bodyClassName}`}>
            {children}
          </div>

          {/* Footer */}
          {footer || <DefaultFooter />}

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">{loadingText}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

// Specialized Modal Components
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
  ...props
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    variant={variant}
    icon={variant}
    iconColor={variant === 'danger' ? 'red' : 'yellow'}
    size="sm"
    primaryAction={{
      label: confirmText,
      onClick: onConfirm,
      variant: variant === 'danger' ? 'danger' : 'primary'
    }}
    cancelAction={{
      label: cancelText
    }}
    isLoading={isLoading}
    closeOnOverlayClick={!isLoading}
    preventClose={isLoading}
    {...props}
  >
    {message && (
      <p className="text-gray-600 dark:text-gray-300">
        {message}
      </p>
    )}
  </Modal>
);

export const AlertModal = ({
  isOpen,
  onClose,
  title,
  message,
  variant = 'info',
  buttonText = 'OK',
  ...props
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    variant={variant}
    icon={variant}
    iconColor={variant === 'danger' ? 'red' : variant === 'warning' ? 'yellow' : variant === 'success' ? 'green' : 'blue'}
    size="sm"
    primaryAction={{
      label: buttonText,
      onClick: onClose,
      variant: 'primary'
    }}
    {...props}
  >
    {message && (
      <p className="text-gray-600 dark:text-gray-300">
        {message}
      </p>
    )}
  </Modal>
);

export const FormModal = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  children,
  submitText = 'Submit',
  cancelText = 'Cancel',
  isLoading = false,
  submitDisabled = false,
  ...props
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(e);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      isLoading={isLoading}
      preventClose={isLoading}
      closeOnOverlayClick={!isLoading}
      {...props}
    >
      <form onSubmit={handleSubmit}>
        {children}
        <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || submitDisabled}
            isLoading={isLoading}
          >
            {submitText}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default Modal;