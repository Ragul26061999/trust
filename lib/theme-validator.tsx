'use client';

import { getUserPreferences, ensureThemeApplied } from './user-preferences';

/**
 * Theme validation utility to ensure consistent theme application
 */
export class ThemeValidator {
  private static validationInterval: NodeJS.Timeout | null = null;
  
  /**
   * Start continuous theme validation
   */
  static startValidation() {
    if (typeof window === 'undefined') return;
    
    // Clear any existing interval
    this.stopValidation();
    
    // Validate theme every 2 seconds
    this.validationInterval = setInterval(() => {
      this.validateAndFixTheme();
    }, 2000);
  }
  
  /**
   * Stop theme validation
   */
  static stopValidation() {
    if (this.validationInterval) {
      clearInterval(this.validationInterval);
      this.validationInterval = null;
    }
  }
  
  /**
   * Validate and fix theme if needed
   */
  static validateAndFixTheme() {
    if (typeof window === 'undefined') return;
    
    const preferences = getUserPreferences();
    const root = document.documentElement;
    const body = document.body;
    
    // Check if correct theme classes are applied
    const hasDarkMode = root.classList.contains('dark-mode');
    const hasLightMode = root.classList.contains('light-mode');
    const bodyHasDarkMode = body.classList.contains('dark-mode');
    const bodyHasLightMode = body.classList.contains('light-mode');
    
    let needsFix = false;
    
    // Validate root element
    if (preferences.themeMode === 'dark' && !hasDarkMode) {
      needsFix = true;
    } else if (preferences.themeMode === 'light' && !hasLightMode) {
      needsFix = true;
    }
    
    // Validate body element
    if (preferences.themeMode === 'dark' && !bodyHasDarkMode) {
      needsFix = true;
    } else if (preferences.themeMode === 'light' && !bodyHasLightMode) {
      needsFix = true;
    }
    
    // Check for conflicting classes
    if (hasDarkMode && hasLightMode) {
      needsFix = true;
    }
    if (bodyHasDarkMode && bodyHasLightMode) {
      needsFix = true;
    }
    
    // Fix theme if needed
    if (needsFix) {
      console.log('ThemeValidator: Fixing theme inconsistency');
      ensureThemeApplied();
    }
  }
  
  /**
   * Get current theme status
   */
  static getThemeStatus() {
    if (typeof window === 'undefined') return null;
    
    const preferences = getUserPreferences();
    const root = document.documentElement;
    const body = document.body;
    
    return {
      preferences: preferences.themeMode,
      rootClasses: {
        darkMode: root.classList.contains('dark-mode'),
        lightMode: root.classList.contains('light-mode'),
      },
      bodyClasses: {
        darkMode: body.classList.contains('dark-mode'),
        lightMode: body.classList.contains('light-mode'),
      },
      isConsistent: this.isThemeConsistent(preferences.themeMode),
    };
  }
  
  /**
   * Check if theme is consistent
   */
  static isThemeConsistent(expectedMode?: string) {
    if (typeof window === 'undefined') return true;
    
    const preferences = getUserPreferences();
    const mode = expectedMode || preferences.themeMode;
    const root = document.documentElement;
    const body = document.body;
    
    const rootCorrect = mode === 'dark' ? 
      root.classList.contains('dark-mode') && !root.classList.contains('light-mode') :
      root.classList.contains('light-mode') && !root.classList.contains('dark-mode');
      
    const bodyCorrect = mode === 'dark' ? 
      body.classList.contains('dark-mode') && !body.classList.contains('light-mode') :
      body.classList.contains('light-mode') && !body.classList.contains('dark-mode');
    
    return rootCorrect && bodyCorrect;
  }
}
