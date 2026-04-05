'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from './language-context';
import { translationService } from './translation-service';

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
    
    // 1. Try JSON translations first
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

    // 2. If not in JSON, check the global persistent auto-translation cache
    const cached = translationService.getCached(fallback || key, currentLanguage);
    if (cached) return cached;
    
    return fallback || key;
  };

  const ut = async (text: string): Promise<string> => {
    // If it's a key in the translation file, use it
    const translated = t(text);
    if (translated !== text) return translated;

    // Otherwise, try to auto-translate the text itself
    try {
      const result = await translationService.translate(text, currentLanguage);
      return result;
    } catch (error) {
      return text;
    }
  };

  return { t, ut, isLoading, currentLanguage };
};

export default useTranslations;
