// Utility functions to handle user preferences for dashboard customization

// Define theme mode type
export type ThemeMode = 'light' | 'dark' | 'auto';

// Default theme settings
export const DEFAULT_THEME = {
  primaryColor: '#3B82F6',
  secondaryColor: '#64748B',
  backgroundColor: '#F8FAFC',
  textColor: '#0F172A',
  accentColor: '#38BDF8',
  backgroundImage: null,
  themeMode: 'light' as ThemeMode, // 'light', 'dark', or 'auto'
};

// Get user preferences from localStorage
export const getUserPreferences = () => {
  if (typeof window !== 'undefined') {
    const savedPreferences = localStorage.getItem('dashboardPreferences');
    if (savedPreferences) {
      return JSON.parse(savedPreferences);
    }
  }
  return DEFAULT_THEME;
};

// Save user preferences to localStorage
export const saveUserPreferences = (preferences: any) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('dashboardPreferences', JSON.stringify(preferences));
  }
};

// Apply theme to document root
export const applyTheme = (theme: any) => {
  if (typeof window !== 'undefined') {
    const root = document.documentElement;
    
    // Handle theme mode
    const themeMode = theme.themeMode || 'light';
    
    if (themeMode === 'auto') {
      // Auto mode - detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark-mode');
        root.classList.remove('light-mode');
      } else {
        root.classList.add('light-mode');
        root.classList.remove('dark-mode');
      }
    } else if (themeMode === 'dark') {
      root.classList.add('dark-mode');
      root.classList.remove('light-mode');
    } else {
      root.classList.add('light-mode');
      root.classList.remove('dark-mode');
    }
    
    // Apply custom colors
    root.style.setProperty('--primary-color', theme.primaryColor || DEFAULT_THEME.primaryColor);
    root.style.setProperty('--secondary-color', theme.secondaryColor || DEFAULT_THEME.secondaryColor);
    root.style.setProperty('--background-color', theme.backgroundColor || DEFAULT_THEME.backgroundColor);
    root.style.setProperty('--text-color', theme.textColor || DEFAULT_THEME.textColor);
    root.style.setProperty('--accent-color', theme.accentColor || DEFAULT_THEME.accentColor);
    
    // Apply background image if provided
    if (theme.backgroundImage) {
      root.style.setProperty('--background-image', `url(${theme.backgroundImage})`);
      root.style.backgroundImage = `url(${theme.backgroundImage})`;
      root.style.backgroundSize = 'cover';
      root.style.backgroundPosition = 'center';
    } else {
      root.style.setProperty('--background-image', 'none');
      root.style.backgroundImage = 'none';
    }
  }
};

// Get appropriate greeting based on time of day
export const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return 'Good Morning';
  } else if (hour >= 12 && hour < 18) {
    return 'Good Afternoon';
  } else {
    return 'Good Evening';
  }
};

// Auto-detect brightness and suggest theme mode
export const detectAmbientBrightness = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    // Check system preference first
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    // Fallback to time-based detection
    const hour = new Date().getHours();
    // Assume darker hours (7PM - 7AM) prefer dark mode
    if (hour >= 19 || hour < 7) {
      return 'dark';
    }
  }
  return 'light';
};

// Ensure theme is applied to document
export const ensureThemeApplied = () => {
  if (typeof window !== 'undefined') {
    const preferences = getUserPreferences();
    applyTheme(preferences);
    
    // Force re-application if needed
    setTimeout(() => {
      const isDarkMode = document.documentElement.classList.contains('dark-mode');
      if (!isDarkMode && preferences.themeMode === 'dark') {
        document.documentElement.classList.add('dark-mode');
        document.documentElement.classList.remove('light-mode');
      } else if (isDarkMode && preferences.themeMode === 'light') {
        document.documentElement.classList.add('light-mode');
        document.documentElement.classList.remove('dark-mode');
      }
      
      // Also apply to body for extra safety
      if (preferences.themeMode === 'dark') {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
      } else {
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
      }
    }, 100);
    
    // Final check and force application
    setTimeout(() => {
      const root = document.documentElement;
      const body = document.body;
      
      // Remove any conflicting classes first
      root.classList.remove('light-mode', 'dark-mode');
      body.classList.remove('light-mode', 'dark-mode');
      
      // Apply correct classes
      if (preferences.themeMode === 'dark') {
        root.classList.add('dark-mode');
        body.classList.add('dark-mode');
      } else {
        root.classList.add('light-mode');
        body.classList.add('light-mode');
      }
      
      // Apply CSS variables
      root.style.setProperty('--primary-color', preferences.primaryColor || DEFAULT_THEME.primaryColor);
      root.style.setProperty('--secondary-color', preferences.secondaryColor || DEFAULT_THEME.secondaryColor);
      root.style.setProperty('--background-color', preferences.backgroundColor || DEFAULT_THEME.backgroundColor);
      root.style.setProperty('--text-color', preferences.textColor || DEFAULT_THEME.textColor);
      root.style.setProperty('--accent-color', preferences.accentColor || DEFAULT_THEME.accentColor);
    }, 200);
  }
};