import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';

export const Dropdown = ({ trigger, children, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const closeTimeout = useRef(null);

  const delayClose = () => {
    closeTimeout.current = setTimeout(() => {
      setIsOpen(false);
    }, 3000); // 3 second delay
  };

  const cancelClose = () => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        delayClose(); // Delay the close
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
        delayClose(); // Delay the close
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
    cancelClose(); // Cancel any pending close
    setIsOpen((prev) => !prev);
  };

  const handleItemClick = () => {
    cancelClose();
    setIsOpen(false); // Immediate close on item click
  };

  return (
    <div
      className="relative inline-block text-left"
      ref={dropdownRef}
      onMouseEnter={cancelClose} // Optional: prevent closing when hovering back in
    >
      {/* Trigger Button */}
      <div onClick={toggleDropdown}>
        {trigger}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={clsx(
            "absolute right-0 mt-2 w-56 origin-top-right divide-y divide-border rounded-xl border border-border bg-surface shadow-panel focus:outline-none z-50",
            "animate-in fade-in-0 zoom-in-95 duration-100",
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
        'text-ink hover:bg-surface-2',
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
