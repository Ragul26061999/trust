'use client';

import { useAuth } from '../lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import Sidebar from '../components/sidebar';
import { Box } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { ThemeProvider as AppThemeProvider } from '../lib/theme-context';
import { ThemeProvider as MuiThemeProvider } from '../components/mui-theme-provider';
import { getUserPreferencesFromDB } from '../lib/user-preferences-db';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // State to hold user theme preferences
  const [userTheme, setUserTheme] = useState({
    primaryColor: '#6750A4',
    secondaryColor: '#625B71',
    backgroundColor: '#FEF7FF',
    textColor: '#1C1B1F',
    backgroundImage: null,
  });
  
  // Determine if sidebar should be shown based on current path
  // Pages that should not have sidebar: add-on, and any other pages as needed
  const pagesWithoutSidebar = ['/add-on']; // Add other paths that should not have sidebar
  const showSidebar = !pagesWithoutSidebar.some(page => pathname === page || pathname.startsWith(page + '/') || pathname.startsWith(page + '?'));
  
  // Fetch user preferences after user is loaded
  useEffect(() => {
    if (user && !loading) {
      const loadUserPreferences = async () => {
        try {
          const preferences = await getUserPreferencesFromDB(user.id);
          if (preferences) {
            // Preferences are now handled by the theme context
            console.log('User preferences loaded:', preferences);
          }
        } catch (error) {
          console.error('Error fetching user preferences:', error);
        }
      };
      
      loadUserPreferences();
    }
  }, [user, loading]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <AppThemeProvider>
        <MuiThemeProvider>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            bgcolor: 'background.default'
          }}>
            <Box>Loading...</Box>
          </Box>
        </MuiThemeProvider>
      </AppThemeProvider>
    );
  }

  if (!user) {
    return (
      <AppThemeProvider>
        <MuiThemeProvider>
          <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
            <Box 
              component="main" 
              sx={{ 
                flexGrow: 1, 
                p: 3,
                overflow: 'auto',
                bgcolor: 'background.default'
              }}
            >
              {children}
            </Box>
          </Box>
        </MuiThemeProvider>
      </AppThemeProvider>
    );
  }

  // Dynamic theme based on fetched user preferences using useMemo to prevent hooks order issues
  const muiTheme = useMemo(() => createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: userTheme.primaryColor || '#6750A4',
        light: userTheme.primaryColor ? `${userTheme.primaryColor}20` : '#EADDFF',
        dark: userTheme.primaryColor ? `${userTheme.primaryColor}CC` : '#6200EA',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: userTheme.secondaryColor || '#625B71',
        light: userTheme.secondaryColor ? `${userTheme.secondaryColor}20` : '#E8DEF8',
        dark: userTheme.secondaryColor ? `${userTheme.secondaryColor}CC` : '#4A4458',
        contrastText: '#FFFFFF',
      },
      background: {
        default: userTheme.backgroundColor || '#FEF7FF',
        paper: '#FFFFFF',
      },
      text: {
        primary: userTheme.textColor || '#1C1B1F',
        secondary: '#5F5D6B',
      },
      grey: {
        50: '#FAF9FE',
        100: '#F3F2F8',
        200: '#EBEAEE',
        300: '#E0DFE4',
        400: '#C8C6CD',
        500: '#A2A0A9',
        600: '#797781',
        700: '#5F5D6B',
        800: '#474654',
        900: '#302F3D',
      },
    },
    shape: {
      borderRadius: 12, // Material 3 rounded corners
    },
    typography: {
      fontFamily: [
        'Poppins',
        'Inter',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      h4: {
        fontWeight: 600,
        letterSpacing: '-0.02em',
      },
      h6: {
        fontWeight: 600,
        letterSpacing: '0.01em',
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
            },
          },
        },
      },
    },
  }), [userTheme]);

  // Render the protected content with or without sidebar based on path
  return (
    <AppThemeProvider>
      <MuiThemeProvider>
        <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
          {showSidebar && <Sidebar />}
          <Box 
            component="main" 
            sx={{ 
              flexGrow: 1, 
              p: 3,
              overflow: 'auto',
              bgcolor: 'background.default'
            }}
          >
            {children}
          </Box>
        </Box>
      </MuiThemeProvider>
    </AppThemeProvider>
  );
}