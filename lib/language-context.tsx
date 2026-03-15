'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Language, languages, getLanguageByCode } from './languages';

interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (languageCode: string) => void;
  availableLanguages: Language[];
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Load language from localStorage or browser preference
    const loadLanguage = () => {
      try {
        // Check if language is saved in localStorage
        const savedLanguage = localStorage.getItem('preferred-language');
        
        if (savedLanguage && getLanguageByCode(savedLanguage)) {
          setCurrentLanguage(savedLanguage);
        } else {
          // Fallback to browser language detection
          const browserLang = navigator.language.split('-')[0];
          const supportedLang = getLanguageByCode(browserLang);
          
          if (supportedLang) {
            setCurrentLanguage(browserLang);
          }
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguage();
  }, []);

  const setLanguage = (languageCode: string) => {
    try {
      const language = getLanguageByCode(languageCode);
      if (language) {
        setCurrentLanguage(languageCode);
        localStorage.setItem('preferred-language', languageCode);
        
        // Reload the page to apply the new language
        router.refresh();
      }
    } catch (error) {
      console.error('Error setting language:', error);
    }
  };

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    availableLanguages: languages,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
