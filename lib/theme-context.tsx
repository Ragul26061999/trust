'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { DEFAULT_THEME, getUserPreferences, saveUserPreferences, applyTheme } from './user-preferences';
import { getUserPreferencesFromDB, saveUserPreferencesToDB } from './user-preferences-db';
import { useAuth } from './auth-context';

// Define the theme context type
interface ThemeContextType {
  theme: any;
  updateTheme: (newTheme: any) => void;
  resetTheme: () => void;
  saveThemeToDB: () => Promise<boolean>;
  loadThemeFromDB: () => Promise<void>;
}

// Create the context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme provider component
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const { user } = useAuth();

  // Load theme preferences on initial render
  useEffect(() => {
    if (user?.id) {  // Only load from DB if user is authenticated
      const loadTheme = async () => {
        const savedTheme = getUserPreferences();
        setTheme(savedTheme);
        applyTheme(savedTheme);
        
        await loadThemeFromDB();
      };
      
      loadTheme();
    } else {
      // Just load from local storage if not authenticated
      const savedTheme = getUserPreferences();
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, [user?.id]);

  // Function to update theme
  const updateTheme = (newTheme: any) => {
    const updatedTheme = { ...theme, ...newTheme };
    setTheme(updatedTheme);
    saveUserPreferences(updatedTheme);
    applyTheme(updatedTheme);
  };

  // Function to reset theme to default
  const resetTheme = () => {
    setTheme(DEFAULT_THEME);
    saveUserPreferences(DEFAULT_THEME);
    applyTheme(DEFAULT_THEME);
  };
  
  // Function to save theme to database
  const saveThemeToDB = async () => {
    if (!user?.id) {
      console.warn('User not authenticated, saving to local storage only');
      return false;
    }
    
    return await saveUserPreferencesToDB(user.id, theme);
  };
  
  // Function to load theme from database
  const loadThemeFromDB = async () => {
    if (!user?.id) {
      console.warn('User not authenticated, using local storage only');
      return;
    }
    
    const dbTheme = await getUserPreferencesFromDB(user.id);
    if (dbTheme) {
      // Merge DB theme with local theme (prioritizing DB values)
      const mergedTheme = { ...theme, ...dbTheme };
      setTheme(mergedTheme);
      saveUserPreferences(mergedTheme); // Also save to local storage
      applyTheme(mergedTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, resetTheme, saveThemeToDB, loadThemeFromDB }}>
      {children}
    </ThemeContext.Provider>
  );
};