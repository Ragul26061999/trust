'use client';

import { useState, useEffect } from 'react';

interface TranslationData {
  [key: string]: any;
}

const useTranslations = (namespace: string = 'common') => {
  const [translations, setTranslations] = useState<TranslationData>({});
  const [isLoading, setIsLoading] = useState(true);
  const currentLanguage = 'en';

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        setIsLoading(true);
        let translationData: TranslationData = {};
        
        try {
          const fallbackModule = await import(`../public/locales/en/${namespace}.json`);
          translationData = fallbackModule.default;
        } catch (fallbackError) {
          console.error(`Fallback translation file not found for en/${namespace}`);
          translationData = {};
        }
        
        setTranslations(translationData);
      } catch (error) {
        setTranslations({});
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, [namespace]);

  const t = (key: string, fallback?: string): string => {
    if (isLoading) return fallback || key;
    
    const keys = key.split('.');
    let value = translations;
    let found = true;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        found = false;
        break;
      }
    }
    
    if (found && typeof value === 'string') return value;
    return fallback || key;
  };

  const ut = async (text: string): Promise<string> => {
    const translated = t(text);
    return translated !== text ? translated : text;
  };

  return { t, ut, isLoading, currentLanguage };
};

export default useTranslations;
