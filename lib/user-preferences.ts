// Utility functions to handle user preferences for dashboard customization

// Default theme settings
export const DEFAULT_THEME = {
  primaryColor: '#6750A4',
  secondaryColor: '#625B71',
  backgroundColor: '#FEF7FF',
  textColor: '#1C1B1F',
  accentColor: '#FF7D95',
  backgroundImage: null,
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