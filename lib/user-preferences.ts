// Utility functions to handle user preferences for dashboard customization

// Define theme mode type
export type ThemeMode = 'light' | 'dark' | 'auto';

// Default theme settings
export const DEFAULT_THEME = {
  primaryColor: '#6750A4',
  secondaryColor: '#625B71',
  backgroundColor: '#FEF7FF',
  textColor: '#1C1B1F',
  accentColor: '#FF7D95',
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