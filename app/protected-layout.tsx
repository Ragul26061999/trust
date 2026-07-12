'use client';

import { useAuth } from '../lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from '../components/sidebar';
import { Box } from '@mui/material';
import ProtectedRoute from '../lib/protected-route';

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
  const showSidebar = pathname && !pagesWithoutSidebar.some(page => pathname === page || pathname.startsWith(page + '/') || pathname.startsWith(page + '?'));
  
  // User preferences are loaded by ThemeProvider, no need to duplicate here

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);


  if (!user) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
      {showSidebar && <Sidebar />}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 0,
          overflow: 'auto',
          bgcolor: 'background.default'
        }}
      >
        <ProtectedRoute>
          {children}
        </ProtectedRoute>
      </Box>
    </Box>
  );
}
