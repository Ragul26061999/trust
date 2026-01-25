'use client';

import { useAuth } from '../lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from '../components/sidebar';
import { Box } from '@mui/material';
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
    return null;
  }

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
