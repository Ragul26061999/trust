'use client';

import { useAuth } from '../../lib/auth-context';
import ProtectedLayout from '../protected-layout';
import { Box, Container, AppBar, Toolbar, Typography, Button, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';

const ProfessionalPageContent = () => {
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
      {/* Top App Bar inside main content */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'secondary.main', borderRadius: 2, mb: 3 }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={handleGoBack} aria-label="back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Professional Section
          </Typography>
          <Button color="inherit" onClick={handleLogout} sx={{ textTransform: 'none' }}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg">
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'secondary.main' }}>
          Professional Section
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          This is the Professional section where you can organize your professional tasks and goals.
        </Typography>

        {/* Placeholder for content */}
        <Box sx={{ mt: 4, p: 3, border: '1px dashed grey', borderRadius: 2, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Your professional dashboard content will appear here.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default function ProfessionalPage() {
  return (
    <ProtectedLayout>
      <ProfessionalPageContent />
    </ProtectedLayout>
  );
}