'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import { ThemeProvider as AppThemeProvider, useTheme as useCustomTheme } from '../../lib/theme-context';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  AppBar,
  Toolbar,
  Typography,
  Card,
  CardContent,
  IconButton,
  Avatar,
  Fab,
  Menu,
  MenuItem,
  CssBaseline,
} from '@mui/material';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import BusinessIcon from '@mui/icons-material/Business';
import EventIcon from '@mui/icons-material/Event';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import NotesIcon from '@mui/icons-material/Notes';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AddIcon from '@mui/icons-material/Add';

const DashboardContent = () => {
  const { theme } = useCustomTheme();
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogoutClick = () => {
    logout();
    handleClose();
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const navigateToSection = (path: string) => {
    router.push(path);
  };

  const cardsData = [
    {
      id: 1,
      title: 'Note Taking',
      icon: <NotesIcon fontSize="large" />,
      description: 'Capture ideas and important information anytime.',
      backgroundColor: '#E8F5E8',
      iconColor: '#388E3C',
      path: '/note-taking',
    },
    {
      id: 3,
      title: 'User Clock',
      icon: <AccessTimeIcon fontSize="large" />,
      description: 'Track your time and schedule efficiently.',
      backgroundColor: '#FFF3E0',
      iconColor: '#F57C00',
      path: '/user-clock',
    },
    {
      id: 4,
      title: 'Analytical Section',
      icon: <AnalyticsIcon fontSize="large" />,
      description: 'Visualize your data with insightful analytics.',
      backgroundColor: '#F3E5F5',
      iconColor: '#7B1FA2',
      path: '/analytical',
    },
    {
      id: 5,
      title: 'Calendar',
      icon: <EventIcon fontSize="large" />,
      description: 'Manage your appointments and events.',
      backgroundColor: '#EDE7F6',
      iconColor: '#303F9F',
      path: '/calendar',
    },
    {
      id: 6,
      title: 'Professional Section',
      icon: <BusinessIcon fontSize="large" />,
      description: 'Organize your professional tasks and goals.',
      backgroundColor: '#E1F5FE',
      iconColor: '#0097A7',
      path: '/professional',
    },
    {
      id: 7,
      title: 'Personal Section',
      icon: <AccountCircleIcon fontSize="large" />,
      description: 'Focus on personal activities and wellbeing.',
      backgroundColor: '#F1F8E9',
      iconColor: '#689F38',
      path: '/personal',
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'transparent', mb: 3, boxShadow: 'none' }}>
        <Toolbar sx={{ color: 'text.primary' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>T</Avatar>
            <Typography
              variant="h6"
              component="div"
              sx={{ ml: 1, fontWeight: 600, display: { xs: 'none', sm: 'block' }, color: 'text.primary' }}
            >
              Trust Dashboard
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="subtitle1" sx={{ mr: 2, color: 'text.primary' }}>
              {user?.email || 'User'}
            </Typography>
            <IconButton
              color="primary"
              onClick={handleClick}
              sx={{ borderRadius: 2 }}
              aria-controls={open ? 'user-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
            >
              <AccountCircleIcon />
            </IconButton>

            <Menu
              id="user-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              onClick={handleClose}
              PaperProps={{
                elevation: 0,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                  mt: 1.5,
                  '& .MuiAvatar-root': {
                    width: 32,
                    height: 32,
                    ml: -0.5,
                    mr: 1,
                  },
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={handleLogoutClick}>
                <AccountCircleIcon fontSize="small" sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            justifyContent: 'center',
            width: '100%',
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
          {cardsData.map((card) => (
            <Card
              key={card.id}
              onClick={() => navigateToSection(card.path)}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: 'none',
                borderRadius: 3,
                backgroundColor: card.backgroundColor,
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  backgroundColor: card.iconColor,
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                },
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  boxShadow: '0px 12px 30px rgba(0, 0, 0, 0.16)',
                  '&:before': {
                    opacity: 1,
                  },
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', pt: 4, pb: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    mb: 2,
                    color: card.iconColor,
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.1)',
                    },
                  }}
                >
                  {card.icon}
                </Box>
                <Typography variant="h6" component="h3" gutterBottom sx={{ color: 'text.primary', fontWeight: 600, mb: 1 }}>
                  {card.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                  {card.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>

      <Fab
        color="primary"
        aria-label="add"
        onClick={() => router.push('/add-on')}
        sx={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          zIndex: 1000,
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default function Dashboard() {
  return (
    <AppThemeProvider>
      <CssBaseline />
      <DashboardContent />
    </AppThemeProvider>
  );
}