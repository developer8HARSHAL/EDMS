import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';

export const Dropdown = ({ trigger, children, className, fullWidth = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  const handleItemClick = () => {
    setIsOpen(false);
  };

  return (
    <div
      className={clsx('relative text-left', fullWidth ? 'block w-full' : 'inline-block')}
      ref={dropdownRef}
    >
      {/* Trigger */}
      <div onClick={toggleDropdown}>
        {trigger}
      </div>

      {isOpen && (
        <div
          className={clsx(
            'absolute mt-2 divide-y divide-border rounded-xl border border-border bg-surface shadow-panel',
            'focus:outline-none z-50 max-h-64 overflow-y-auto animate-fade-in',
            fullWidth ? 'left-0 right-0 origin-top' : 'right-0 w-56 origin-top-right',
            className
          )}
        >
          <div className="px-1 py-1" onClick={handleItemClick}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export const DropdownItem = ({ children, onClick, className, ...props }) => {
  const handleClick = (event) => {
    if (onClick) onClick(event);
  };

  return (
    <button
      className={clsx(
        'text-ink hover:bg-surface-hover',
        'group flex w-full items-center rounded-lg px-2 py-2 text-sm transition-colors duration-150',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
};