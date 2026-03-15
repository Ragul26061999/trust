'use client';

import { useEffect } from 'react';
import { ensureThemeApplied } from './user-preferences';

/**
 * Hook to ensure theme synchronization across all pages
 * This can be used in any component to guarantee theme consistency
 */
export const useThemeSync = () => {
  useEffect(() => {
    // Apply theme when component mounts
    ensureThemeApplied();
    
    // Re-apply theme when component gets focus (for tab switching)
    const handleFocus = () => {
      ensureThemeApplied();
    };
    
    // Re-apply theme when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        ensureThemeApplied();
      }
    };
    
    // Add event listeners
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also listen for theme changes
    const handleThemeChange = () => {
      ensureThemeApplied();
    };
    
    window.addEventListener('themeChanged', handleThemeChange);
    
    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'dashboardPreferences') {
        ensureThemeApplied();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('themeChanged', handleThemeChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // Function to manually sync theme
  const syncTheme = () => {
    ensureThemeApplied();
  };
  
  return { syncTheme };
};
