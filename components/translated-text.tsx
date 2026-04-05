'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../lib/language-context';
import { Skeleton, Typography, TypographyProps } from '@mui/material';
import { translationService } from '../lib/translation-service';

interface TranslatedTextProps extends Omit<TypographyProps, 'children'> {
  text: string;
}

/**
 * A component that automatically translates its text content 
 * to the currently selected language using the auto-translate service.
 */
export const TranslatedText: React.FC<TranslatedTextProps> = ({ 
  text, 
  variant = 'body1',
  noWrap = false,
  component: Component = 'span',
  className,
  sx,
  ...rest
}) => {
  const { currentLanguage, autoTranslate } = useLanguage();
  const [translatedText, setTranslatedText] = useState(() => {
    // Synchronous initial check to avoid flickering
    const cached = translationService.getCached(text, currentLanguage);
    return cached || text;
  });
  const [isTranslating, setIsTranslating] = useState(() => {
    const cached = translationService.getCached(text, currentLanguage);
    return !cached && text && text.trim() !== '' && currentLanguage !== 'en';
  });

  useEffect(() => {
    let isMounted = true;

    const translate = async () => {
      // Don't translate if it's already the same text or if it's empty
      if (!text || text.trim() === '') return;
      
      // If language is English, we only translate if the original text ISN'T English
      // But for simplicity, we let the service decide
      
      setIsTranslating(true);
      try {
        const result = await autoTranslate(text);
        if (isMounted) {
          setTranslatedText(result);
        }
      } catch (error) {
        console.error('Translation failed:', error);
      } finally {
        if (isMounted) {
          setIsTranslating(false);
        }
      }
    };

    translate();

    return () => {
      isMounted = false;
    };
  }, [text, currentLanguage, autoTranslate]);

  if (isTranslating) {
    return (
      <Skeleton 
        variant="text" 
        width="100%" 
        animation="wave" 
        sx={{ display: 'inline-block', ...sx }} 
      />
    );
  }

  return (
    <Typography component={Component} className={className} sx={sx} variant={variant} noWrap={noWrap} {...rest}>
      {translatedText}
    </Typography>
  );
};

export default TranslatedText;
