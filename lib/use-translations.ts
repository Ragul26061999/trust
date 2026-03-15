'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from './language-context';

interface TranslationData {
  [key: string]: any;
}

const useTranslations = (namespace: string = 'common') => {
  const { currentLanguage } = useLanguage();
  const [translations, setTranslations] = useState<TranslationData>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        setIsLoading(true);
        
        // Try to load translations for the current language
        let translationData: TranslationData = {};
        
        try {
          // Dynamic import of translation file
          const translationsModule = await import(`../public/locales/${currentLanguage}/${namespace}.json`);
          translationData = translationsModule.default;
        } catch (error) {
          console.warn(`Translation file not found for ${currentLanguage}/${namespace}, falling back to English`);
          
          // Fallback to English
          try {
            const fallbackModule = await import(`../public/locales/en/${namespace}.json`);
            translationData = fallbackModule.default;
          } catch (fallbackError) {
            console.error(`Fallback translation file not found for en/${namespace}`);
            translationData = {};
          }
        }
        
        setTranslations(translationData);
      } catch (error) {
        console.error('Error loading translations:', error);
        setTranslations({});
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, [currentLanguage, namespace]);

  const t = (key: string, fallback?: string): string => {
    if (isLoading) return fallback || key;
    
    // Split key by dots to access nested properties
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return fallback || key;
      }
    }
    
    return typeof value === 'string' ? value : fallback || key;
  };

  return { t, isLoading, currentLanguage };
};

export default useTranslations;
