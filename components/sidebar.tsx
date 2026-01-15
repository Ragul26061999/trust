'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  useTheme,
  alpha,
  Tooltip,
} from '@mui/material';
import {
  GridView as DashboardIcon,
  NoteAlt as NoteIcon,
  AccessTime as ClockIcon,
  Analytics as AnalyticsIcon,
  CalendarToday as CalendarIcon,
  Business as ProfessionalIcon,
  Person as PersonalIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';

export const drawerWidth = 280;
export const collapsedWidth = 88;

const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleCollapseToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    setMobileOpen(false);
  };

  const handleSignOut = () => {
    logout();
    router.push('/login');
  };

  const navItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', color: '#6750A4' },
    { text: 'Note Taking', icon: <NoteIcon />, path: '/note-taking', color: '#E91E63' },
    { text: 'User Clock', icon: <ClockIcon />, path: '/user-clock', color: '#2196F3' },
    { text: 'Analytical', icon: <AnalyticsIcon />, path: '/analytical', color: '#4CAF50' },
    { text: 'Calendar', icon: <CalendarIcon />, path: '/calendar', color: '#FF9800' },
    { text: 'Professional', icon: <ProfessionalIcon />, path: '/professional', color: '#9C27B0' },
    { text: 'Personal', icon: <PersonalIcon />, path: '/personal', color: '#00BCD4' },
  ];

  const currentWidth = isCollapsed ? collapsedWidth : drawerWidth;

  const drawer = (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.paper',
      transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      width: currentWidth,
      overflowX: 'hidden',
    }}>
      {/* Brand Header */}
      <Box sx={{
        p: 2.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        mb: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            minWidth: 40,
            height: 40,
            borderRadius: 3,
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(103, 80, 164, 0.25)',
            flexShrink: 0
          }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 900 }}>T</Typography>
          </Box>
          {!isCollapsed && (
            <Typography variant="h6" sx={{
              fontWeight: 800,
              letterSpacing: '-0.02em',
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              whiteSpace: 'nowrap'
            }}>
              Time OS
            </Typography>
          )}
        </Box>

        {!isCollapsed && (
          <IconButton onClick={handleCollapseToggle} size="small" sx={{ color: 'grey.400' }}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>

      {isCollapsed && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <IconButton onClick={handleCollapseToggle} size="small" sx={{ color: 'primary.main', bgcolor: 'primary.light' }}>
            <ChevronRightIcon />
          </IconButton>
        </Box>
      )}

      {/* Navigation List */}
      <List sx={{ px: isCollapsed ? 1.5 : 2, flexGrow: 1 }}>
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const itemContent = (
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: 4,
                py: 1.5,
                px: isCollapsed ? 0 : 2,
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                transition: 'all 0.2s',
                bgcolor: isActive ? `${item.color}15` : 'transparent',
                '&:hover': {
                  bgcolor: isActive ? `${item.color}25` : 'action.hover',
                },
              }}
            >
              <ListItemIcon sx={{
                minWidth: isCollapsed ? 0 : 44,
                justifyContent: 'center',
                color: isActive ? item.color : 'grey.500',
                transition: 'color 0.2s'
              }}>
                {item.icon}
              </ListItemIcon>
              {!isCollapsed && (
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.875rem',
                    color: isActive ? item.color : 'text.primary',
                    noWrap: true
                  }}
                />
              )}
            </ListItemButton>
          );

          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              {isCollapsed ? (
                <Tooltip title={item.text} placement="right">
                  {itemContent}
                </Tooltip>
              ) : itemContent}
            </ListItem>
          );
        })}
      </List>

      {/* Footer Area */}
      <Box sx={{ p: 2, mt: 'auto' }}>
        <Divider sx={{ mb: 2, opacity: 0.6 }} />
        <Tooltip title={isCollapsed ? "Logout" : ""} placement="right">
          <Button
            variant="text"
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={handleSignOut}
            fullWidth
            sx={{
              py: 1.5,
              borderRadius: 4,
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              px: isCollapsed ? 0 : 2,
              color: 'text.secondary',
              fontWeight: 600,
              minWidth: 0,
              '& .MuiButton-startIcon': {
                margin: isCollapsed ? 0 : '',
              },
              '&:hover': {
                bgcolor: 'error.lighter',
                color: 'error.main',
              }
            }}
          >
            {!isCollapsed && "Logout"}
          </Button>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile control */}
      <Box sx={{ display: { xs: 'block', md: 'none' }, position: 'fixed', top: 16, left: 16, zIndex: 1100 }}>
        <IconButton
          onClick={handleDrawerToggle}
          sx={{
            bgcolor: 'background.paper',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            '&:hover': { bgcolor: 'grey.100' }
          }}
        >
          <MenuIcon />
        </IconButton>
      </Box>

      {/* Desktop Drawer */}
      <Box
        component="nav"
        sx={{
          width: { md: currentWidth },
          flexShrink: { md: 0 },
          display: { xs: 'none', md: 'block' },
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <Drawer
          variant="permanent"
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: currentWidth,
              border: 'none',
              transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              overflowX: 'hidden',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth, // Mobile always full width
            border: 'none',
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Sidebar;