'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Typography,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  NoteAlt as NoteIcon,
  AccessTime as ClockIcon,
  Analytics as AnalyticsIcon,
  CalendarToday as CalendarIcon,
  Business as ProfessionalIcon,
  Person as PersonalIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';

export const drawerWidth = 280;

const Sidebar = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    setMobileOpen(false); // Close drawer after navigation on mobile
  };

  const handleSignOut = () => {
    logout();
    router.push('/login');
  };

  const navItems = [
    { text: 'Note Taking', icon: <NoteIcon />, path: '/note-taking' },
    { text: 'User Clock', icon: <ClockIcon />, path: '/user-clock' },
    { text: 'Analytical', icon: <AnalyticsIcon />, path: '/analytical' },
    { text: 'Calendar', icon: <CalendarIcon />, path: '/calendar' },
    { text: 'Professional', icon: <ProfessionalIcon />, path: '/professional' },
    { text: 'Personal', icon: <PersonalIcon />, path: '/personal' },
  ];

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ textAlign: 'center', p: 2, borderBottom: '1px solid #e0e0e0' }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: '#6750A4' }}>
          Time OS
        </Typography>
      </Box>
      <Divider />
      <List sx={{ flexGrow: 1 }}>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton onClick={() => handleNavigation(item.path)}>
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Button
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleSignOut}
          fullWidth
        >
          Sign Out
        </Button>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile menu button */}
      <Box sx={{ display: { xs: 'block', md: 'none' }, position: 'fixed', zIndex: 1300 }}>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ m: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
        >
          <MenuIcon />
        </IconButton>
      </Box>

      {/* Desktop drawer container */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 }, display: { xs: 'none', md: 'block' } }}
      >
        <Drawer
          variant="permanent"
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid #e0e0e0',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Mobile drawer */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
    </>
  );
};

export default Sidebar;