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
  Avatar,
  Badge,
} from '@mui/material';
import {
  LayoutDashboard as DashboardIcon,
  FileText as NoteIcon,
  Clock as ClockIcon,
  BarChart3 as AnalyticsIcon,
  Calendar as CalendarIcon,
  Briefcase as ProfessionalIcon,
  User as PersonalIcon,
  LogOut as LogoutIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Lock as LockIcon,
} from 'lucide-react';

// Create icon wrapper components for Lucide icons to work with MUI
const LucideIcon = ({ icon: Icon, size = 20, sx, ...props }: any) => (
  <Box sx={{ display: 'flex', alignItems: 'center', ...sx }} {...props}>
    <Icon size={size} />
  </Box>
);

// Lock icon wrapper
const LockIconWrapper = ({ size = 20, sx }: any) => (
  <Box sx={{ display: 'flex', alignItems: 'center', ...sx }}>
    <LockIcon size={size} />
  </Box>
);

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
    { text: 'Dashboard', icon: <LucideIcon icon={DashboardIcon} />, path: '/dashboard', color: '#667eea', locked: false },
    { text: 'Analytical', icon: <LucideIcon icon={AnalyticsIcon} />, path: '/analytical', color: '#2196F3', locked: false },
    { text: 'Professional', icon: <LucideIcon icon={ProfessionalIcon} />, path: '/professional', color: '#FF9800', locked: false },
    { text: 'Personal', icon: <LucideIcon icon={PersonalIcon} />, path: '/personal', color: '#9C27B0', locked: false },
    { text: 'Note Taking', icon: <LucideIcon icon={NoteIcon} />, path: '/note-taking', color: '#6750A4', locked: false },
    { text: 'Calendar', icon: <LucideIcon icon={CalendarIcon} />, path: '/calendar', color: '#4CAF50', locked: true },
    { text: 'User Clock', icon: <LucideIcon icon={ClockIcon} />, path: '/user-clock', color: '#E91E63', locked: true },
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
        p: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        mb: 3,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          <Box sx={{
            minWidth: 44,
            height: 44,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
            flexShrink: 0
          }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 900 }}>T</Typography>
          </Box>
          {!isCollapsed && (
            <Box>
              <Typography variant="h6" sx={{
                fontWeight: 800,
                letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                whiteSpace: 'nowrap',
                lineHeight: 1.2
              }}>
                Time OS
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                Productivity Suite
              </Typography>
            </Box>
          )}
        </Box>

        {!isCollapsed && (
          <IconButton 
            onClick={handleCollapseToggle} 
            size="small" 
            sx={{ 
              color: 'text.secondary',
              bgcolor: 'action.hover',
              '&:hover': {
                bgcolor: 'action.selected',
                color: 'text.primary'
              }
            }}
          >
            <LucideIcon icon={ChevronLeftIcon} size={20} />
          </IconButton>
        )}
      </Box>

      {isCollapsed && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <IconButton 
            onClick={handleCollapseToggle} 
            size="small" 
            sx={{ 
              color: 'primary.main', 
              bgcolor: 'primary.light',
              '&:hover': {
                bgcolor: 'primary.dark',
              }
            }}
          >
            <LucideIcon icon={ChevronRightIcon} size={20} />
          </IconButton>
        </Box>
      )}

      {/* Navigation List */}
      <List sx={{ px: isCollapsed ? 1.5 : 2, flexGrow: 1 }}>
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const itemContent = (
            <ListItemButton
              onClick={() => !item.locked && handleNavigation(item.path)}
              sx={{
                borderRadius: 3,
                py: 2,
                px: isCollapsed ? 0 : 2.5,
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                bgcolor: isActive ? `${item.color}15` : 'transparent',
                position: 'relative',
                opacity: item.locked ? 0.6 : 1,
                cursor: item.locked ? 'not-allowed' : 'pointer',
                '&:hover': !item.locked ? {
                  bgcolor: isActive ? `${item.color}25` : 'action.hover',
                  transform: 'translateX(4px)'
                } : {
                  bgcolor: 'transparent',
                  transform: 'none'
                },
              }}
            >
              <ListItemIcon sx={{
                minWidth: isCollapsed ? 0 : 48,
                justifyContent: 'center',
                position: 'relative'
              }}>
                <Box sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 3,
                  bgcolor: isActive ? `${item.color}20` : item.locked ? 'action.disabled' : `${item.color}10`,
                  color: isActive ? item.color : item.locked ? 'text.disabled' : item.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: isActive ? `0 4px 12px ${item.color}30` : 'none'
                }}>
                  {item.icon}
                  {item.locked && (
                    <Box sx={{
                      position: 'absolute',
                      top: -2,
                      right: -2,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      bgcolor: 'error.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <LockIconWrapper size={10} sx={{ fontSize: 10, color: 'white' }} />
                    </Box>
                  )}
                </Box>
              </ListItemIcon>
              {!isCollapsed && (
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 700 : 600,
                    fontSize: '0.875rem',
                    color: isActive ? item.color : item.locked ? 'text.disabled' : 'text.primary',
                    noWrap: true
                  }}
                  secondary={item.locked ? 'Coming Soon' : ''}
                  secondaryTypographyProps={{
                    fontSize: '0.75rem',
                    color: 'text.secondary',
                    fontWeight: 500
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
      <Box sx={{ p: 2.5, mt: 'auto', borderTop: '1px solid', borderColor: 'divider' }}>
        <Tooltip title={isCollapsed ? "Logout" : ""} placement="right">
          <Button
            variant="text"
            color="inherit"
            startIcon={<LucideIcon icon={LogoutIcon} />}
            onClick={handleSignOut}
            fullWidth
            sx={{
              py: 2,
              borderRadius: 3,
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              px: isCollapsed ? 0 : 2.5,
              color: 'text.secondary',
              fontWeight: 600,
              minWidth: 0,
              transition: 'all 0.3s ease',
              '& .MuiButton-startIcon': {
                margin: isCollapsed ? 0 : '',
              },
              '&:hover': {
                bgcolor: 'error.light',
                color: 'error.main',
                transform: 'translateX(4px)'
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
            '&:hover': { bgcolor: 'action.hover' }
          }}
        >
          <LucideIcon icon={MenuIcon} size={24} />
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