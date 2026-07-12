'use client';

import { useEffect } from 'react';
import { ensureThemeApplied } from '../lib/user-preferences';

const ThemeInitializer = () => {
  useEffect(() => {
    // Apply theme once on component mount
    ensureThemeApplied();
  }, []);
  
  // Listen for route changes and re-apply theme
  useEffect(() => {
    const handleRouteChange = () => {
      ensureThemeApplied();
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

