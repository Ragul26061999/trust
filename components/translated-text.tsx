'use client';

import React from 'react';
import { Typography, TypographyProps } from '@mui/material';

interface TranslatedTextProps extends Omit<TypographyProps, 'children'> {
  text: string;
}

export const TranslatedText: React.FC<TranslatedTextProps> = ({ 
  text, 
  variant = 'body1',
  noWrap = false,
  component: Component = 'span',
  className,
  sx,
  ...rest
}) => {
  return (
    <Typography component={Component} className={className} sx={sx} variant={variant} noWrap={noWrap} {...rest}>
      {text}
    </Typography>
  );
};

export default TranslatedText;
