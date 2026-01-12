'use client';

import { useAuth } from '../../lib/auth-context';
import ProtectedLayout from '../protected-layout';
import { Box, Container, AppBar, Toolbar, Typography, Button, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';

const CalendarPageContent = () => {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'secondary.main', borderRadius: 2, mb: 3 }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={handleGoBack} aria-label="back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Calendar
          </Typography>
          <Button color="inherit" onClick={handleLogout} sx={{ textTransform: 'none' }}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg">
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'secondary.main' }}>
          Calendar Section
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          This is the Calendar section where you can manage your appointments and events.
        </Typography>
        <Box sx={{ mt: 4, p: 3, border: '1px dashed grey', borderRadius: 2, textAlign: 'center' }}>
          <Typography color="text.secondary">Calendar view will appear here.</Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default function CalendarPage() {
  return (
    <ProtectedLayout>
      <CalendarPageContent />
    </ProtectedLayout>
  );
}