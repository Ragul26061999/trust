'use client';

import { createContext, useContext, ReactNode } from 'react';

interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (languageCode: string) => void;
  availableLanguages: any[];
  isLoading: boolean;
  autoTranslate: (text: string) => Promise<string>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const value: LanguageContextType = {
    currentLanguage: 'en',
    setLanguage: () => {},
    availableLanguages: [{ code: 'en', name: 'English' }],
    isLoading: false,
    autoTranslate: async (text: string) => text,
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
