'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import { ThemeProvider as AppThemeProvider, useTheme as useCustomTheme } from '../../lib/theme-context';
import ProtectedRoute from '../../lib/protected-route';
import ProtectedLayout from '../protected-layout';
import { Box, Container, AppBar, Toolbar, Typography, Button, CssBaseline, IconButton } from '@mui/material';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';

// Dynamic theme based on user preferences
const DynamicTheme = () => {
  const { theme } = useCustomTheme();

  return createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: theme.primaryColor || '#6750A4',
      },
      secondary: {
        main: theme.secondaryColor || '#625B71',
      },
      background: {
        default: theme.backgroundColor || '#FEF7FF',
        paper: '#FFFFFF',
      },
      text: {
        primary: theme.textColor || '#1C1B1F',
      },
    },
    typography: {
      fontFamily: [
        'Inter',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
    },
  });
};

const NoteTakingPageContent = () => {
  const { theme } = useCustomTheme();
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
      }}
    >
      {/* Top App Bar inside main content */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'primary.main', borderRadius: 2, mb: 3 }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleGoBack}
            aria-label="back"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Note Taking
          </Typography>
          <Button
            color="inherit"
            onClick={handleLogout}
            sx={{ textTransform: 'none' }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg">
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
          Note Taking Section
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          This is the Note Taking section where you can capture ideas and important information anytime.
        </Typography>

        {/* Placeholder for content */}
        <Box sx={{ mt: 4, p: 3, border: '1px dashed grey', borderRadius: 2, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Your notes will appear here.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default function NoteTakingPage() {
  return (
    <ProtectedLayout>
      <NoteTakingPageContent />
    </ProtectedLayout>
  );
}