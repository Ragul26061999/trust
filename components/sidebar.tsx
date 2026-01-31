'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import ProfileModal from './profile-modal';
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
  Menu,
  MenuItem,
  ListItemAvatar,
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
  Settings as SettingsIcon,
  UserCircle as ProfileIcon,
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

// UserAvatar component to display profile photo
const UserAvatar: React.FC<{ user: any; size: number }> = ({ user, size }) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;

      try {
        if (isSupabaseConfigured() && supabase) {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('avatar_url, full_name')
            .eq('user_id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') {
            console.error('Error loading user profile:', error);
          } else if (data) {
            setProfile(data);
          }
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [user]);

  if (loading) {
    return (
      <Avatar
        sx={{ 
          width: size, 
          height: size, 
          bgcolor: 'primary.main',
          fontSize: size * 0.4,
          fontWeight: 600,
        }}
      >
        {user?.email?.charAt(0)?.toUpperCase() || 'U'}
      </Avatar>
    );
  }

  return (
    <Avatar
      src={profile?.avatar_url}
      sx={{ 
        width: size, 
        height: size, 
        bgcolor: 'primary.main',
        fontSize: size * 0.4,
        fontWeight: 600,
      }}
    >
      {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
    </Avatar>
  );
};

const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const { logout, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

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
    setSettingsAnchorEl(null);
  };

  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };

  const handleProfileClick = () => {
    setProfileModalOpen(true);
    handleSettingsClose();
  };

  const handleProfileModalClose = () => {
    setProfileModalOpen(false);
  };

  const navItems = [
    { text: 'Dashboard', icon: <LucideIcon icon={DashboardIcon} />, path: '/dashboard', color: '#667eea', locked: false },
    { text: 'Analytical', icon: <LucideIcon icon={AnalyticsIcon} />, path: '/analytical', color: '#2196F3', locked: false },
    { text: 'Professional', icon: <LucideIcon icon={ProfessionalIcon} />, path: '/professional', color: '#FF9800', locked: false },
    { text: 'Personal', icon: <LucideIcon icon={PersonalIcon} />, path: '/personal', color: '#9C27B0', locked: false },
    { text: 'Note Taking', icon: <LucideIcon icon={NoteIcon} />, path: '/note-taking', color: '#6750A4', locked: false },
    { text: 'Calendar', icon: <LucideIcon icon={CalendarIcon} />, path: '/calendar', color: '#4CAF50', locked: true },
    { text: 'User Clock', icon: <LucideIcon icon={ClockIcon} />, path: '/user-clock', color: '#E91E63', locked: false },
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
        <Tooltip title={isCollapsed ? "Settings" : ""} placement="right">
          <Button
            variant="text"
            color="inherit"
            startIcon={<LucideIcon icon={SettingsIcon} />}
            onClick={handleSettingsClick}
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
                bgcolor: 'primary.light',
                color: 'primary.main',
                transform: 'translateX(4px)'
              }
            }}
          >
            {!isCollapsed && "Settings"}
          </Button>
        </Tooltip>

        {/* Settings Dropdown Menu */}
        <Menu
          anchorEl={settingsAnchorEl}
          open={Boolean(settingsAnchorEl)}
          onClose={handleSettingsClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              mt: -8, // Position above the button
              minWidth: 280, // Increased width
              borderRadius: 3,
              boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
              overflow: 'visible',
            }
          }}
        >
          {/* User Profile Section */}
          {user && (
            <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <UserAvatar user={user} size={40} />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary', lineHeight: 1.2 }}>
                    {user.email?.split('@')[0]}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                    {user.email}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 500 }}>
                    User Account
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          {/* Profile Menu Item */}
          <MenuItem onClick={handleProfileClick} sx={{ py: 2, px: 3 }}>
            <ListItemIcon sx={{ minWidth: 48 }}>
              <LucideIcon icon={ProfileIcon} size={24} />
            </ListItemIcon>
            <ListItemText 
              primary="Profile" 
              primaryTypographyProps={{ 
                fontSize: '0.9rem',
                fontWeight: 600 
              }} 
            />
          </MenuItem>

          {/* Logout Menu Item */}
          <MenuItem onClick={handleSignOut} sx={{ py: 2, px: 3, color: 'error.main' }}>
            <ListItemIcon sx={{ minWidth: 48 }}>
              <LucideIcon icon={LogoutIcon} size={20} sx={{ color: 'error.main' }} />
            </ListItemIcon>
            <ListItemText 
              primary="Logout" 
              primaryTypographyProps={{ 
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'error.main'
              }} 
            />
          </MenuItem>
        </Menu>
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

      {/* Profile Modal */}
      <ProfileModal 
        open={profileModalOpen} 
        onClose={handleProfileModalClose}
        isFirstTime={false}
      />
    </>
  );
};

export default Sidebar;