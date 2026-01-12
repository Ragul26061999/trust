'use client';

import { useAuth } from '../../lib/auth-context';
import ProtectedLayout from '../protected-layout';
import { Box, Container, AppBar, Toolbar, Typography, Button, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';

const UserClockPageContent = () => {
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
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'primary.main', borderRadius: 2, mb: 3 }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={handleGoBack} aria-label="back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            User Clock
          </Typography>
          <Button color="inherit" onClick={handleLogout} sx={{ textTransform: 'none' }}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg">
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
          User Clock Section
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          This is the User Clock section where you can track your time and schedule efficiently.
        </Typography>
        <Box sx={{ mt: 4, p: 3, border: '1px dashed grey', borderRadius: 2, textAlign: 'center' }}>
          <Typography color="text.secondary">Clock and timer widgets will appear here.</Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default function UserClockPage() {
  return (
    <ProtectedLayout>
      <UserClockPageContent />
    </ProtectedLayout>
  );
}