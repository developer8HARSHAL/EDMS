// src/context/ThemeContext.jsx - Complete Theme Management
import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    // Check if we're in the browser
    if (typeof window !== 'undefined') {
      // First check localStorage
      const saved = localStorage.getItem('theme');
      if (saved) {
        return saved === 'dark';
      }
      // If no saved preference, use system preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    // Default to light mode during SSR
    return false;
  });

  // Apply theme to document when isDark changes
  useEffect(() => {
    const root = window.document.documentElement;
    
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Save preference to localStorage
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      // Only update if user hasn't set a manual preference
      const savedTheme = localStorage.getItem('theme');
      if (!savedTheme) {
        setIsDark(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  const setTheme = (theme) => {
    if (theme === 'dark' || theme === 'light') {
      setIsDark(theme === 'dark');
    }
  };

  const value = {
    isDark,
    toggleTheme,
    setTheme,
    theme: isDark ? 'dark' : 'light'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};