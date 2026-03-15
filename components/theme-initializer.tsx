'use client';

import { useEffect } from 'react';
import { ensureThemeApplied } from '../lib/user-preferences';
import { ThemeValidator } from '../lib/theme-validator';

const ThemeInitializer = () => {
  useEffect(() => {
    // Apply theme immediately on component mount
    ensureThemeApplied();
    
    // Start theme validation
    ThemeValidator.startValidation();
    
    // Also apply theme after a short delay to ensure it's applied
    const timeoutId = setTimeout(() => {
      ensureThemeApplied();
    }, 50);
    
    // And again after a longer delay for safety
    const timeoutId2 = setTimeout(() => {
      ensureThemeApplied();
    }, 200);
    
    // And one more time after page is fully loaded
    const timeoutId3 = setTimeout(() => {
      ensureThemeApplied();
    }, 500);
    
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
      ThemeValidator.stopValidation();
    };
  }, []);
  
  // Listen for route changes and re-apply theme
  useEffect(() => {
    const handleRouteChange = () => {
      // Apply theme immediately when route changes
      ensureThemeApplied();
      
      // And again after a short delay
      setTimeout(() => {
        ensureThemeApplied();
      }, 100);
    };
    
    // Listen for navigation events
    window.addEventListener('popstate', handleRouteChange);
    
    // Also listen for pushstate/replacestate (for programmatic navigation)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      setTimeout(handleRouteChange, 0);
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      setTimeout(handleRouteChange, 0);
    };
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);
  
  // Listen for storage changes (for theme changes from other tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'dashboardPreferences') {
        ensureThemeApplied();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // Listen for custom theme change events
  useEffect(() => {
    const handleThemeChange = () => {
      ensureThemeApplied();
    };
    
    window.addEventListener('themeChanged', handleThemeChange);
    
    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
    };
  }, []);
  
  return null; // This component doesn't render anything
};

export default ThemeInitializer;
