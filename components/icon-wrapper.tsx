import React from 'react';
import { Box, BoxProps } from '@mui/material';

interface LucideIconProps extends BoxProps {
  icon: React.ComponentType<{ size?: number }>;
  size?: number;
}

const LucideIcon = ({ icon: Icon, size = 20, sx, ...props }: LucideIconProps) => (
  <Box sx={{ display: 'flex', alignItems: 'center', ...sx }} {...props}>
    <Icon size={size} />
  </Box>
);

export default LucideIcon;
