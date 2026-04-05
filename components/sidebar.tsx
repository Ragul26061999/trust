import Image from 'next/image';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import useTranslations from '../lib/use-translations';
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
  Menu,
  MenuItem,
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
  Home as HomeIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Lock as LockIcon,
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
const UserAvatar: React.FC<{ user: any; size: number; profile?: any }> = ({ user, size, profile }) => {
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use provided profile or load from database
    if (profile) {
      setProfileData(profile);
      setLoading(false);
    } else {
      loadUserProfile();
    }
  }, [user, profile]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('avatar_url, full_name, age')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading user profile:', error);
        } else if (data) {
          setProfileData(data);
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

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
      src={profileData?.avatar_url}
      sx={{ 
        width: size, 
        height: size, 
        bgcolor: 'primary.main',
        fontSize: size * 0.4,
        fontWeight: 600,
      }}
    >
      {profileData?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
    </Avatar>
  );
};

const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const { logout, user } = useAuth();
  const { t } = useTranslations('common');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openProfileMenu = Boolean(anchorEl);

  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        if (isSupabaseConfigured() && supabase) {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') {
            console.error('Error loading user profile:', error);
          } else if (data) {
            setUserProfile(data);
          }
        }
      } catch (err: any) {
        console.error('Error loading user profile:', err);
        // If the error is about date_of_birth column, try loading without it
        if (err.message && err.message.includes('date_of_birth')) {
          try {
            if (isSupabaseConfigured() && supabase) {
              const { data, error } = await supabase
                .from('user_profiles')
                .select('full_name, email, phone, age, bio, avatar_url, is_first_time_login')
                .eq('user_id', user.id)
                .single();

              if (error && error.code !== 'PGRST116') {
                console.error('Error loading user profile (fallback):', error);
              } else if (data) {
                setUserProfile(data);
              }
            }
          } catch (fallbackErr) {
            console.error('Error loading user profile (fallback):', fallbackErr);
          }
        }
      }
    };

    loadProfile();
  }, [user]);

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

  const handleProfileClick = () => {
    setProfileModalOpen(true);
  };

  const handleProfileModalClose = () => {
    setProfileModalOpen(false);
  };

  const handleUserAccountClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const navItems = [
    { text: t('sidebar.home'), icon: <LucideIcon icon={HomeIcon} />, path: '/home', color: '#4F46E5', locked: false },
    { text: t('sidebar.dashboard'), icon: <LucideIcon icon={DashboardIcon} />, path: '/dashboard', color: '#667eea', locked: false },
    { text: t('sidebar.analytical'), icon: <LucideIcon icon={AnalyticsIcon} />, path: '/analytical', color: '#2196F3', locked: false },
    { text: t('sidebar.professional'), icon: <LucideIcon icon={ProfessionalIcon} />, path: '/professional', color: '#FF9800', locked: false },
    { text: t('sidebar.personal'), icon: <LucideIcon icon={PersonalIcon} />, path: '/personal', color: '#9C27B0', locked: false },
    { text: t('sidebar.note_taking'), icon: <LucideIcon icon={NoteIcon} />, path: '/note-taking', color: '#6750A4', locked: false },
    { text: t('sidebar.calendar'), icon: <LucideIcon icon={CalendarIcon} />, path: '/calendar', color: '#4CAF50', locked: true },
    { text: t('sidebar.user_clock'), icon: <LucideIcon icon={ClockIcon} />, path: '/user-clock', color: '#E91E63', locked: false },
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, my: 1 }}>
          <Image
            src="/6-removebg-preview.png"
            alt="Time OS Logo"
            width={120}
            height={20}
            objectFit="contain"
            priority={true}
          />
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

      {/* Footer Area with Unified Profile */}
      <Box sx={{ p: 2.5, mt: 'auto', borderTop: '1px solid', borderColor: 'divider' }}>
        {/* Unified Profile Section */}
        {user && (
          <Box sx={{ mb: 2 }}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                mb: 2, 
                cursor: 'pointer',
                borderRadius: 2,
                padding: 1,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'action.hover',
                }
              }}
              onClick={handleUserAccountClick}
            >
              <UserAvatar user={user} size={48} profile={userProfile} />
              {!isCollapsed && (
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {userProfile?.full_name || user.email?.split('@')[0]}
                  </Typography>
                </Box>
              )}
            </Box>
            
            {/* Profile Popup Menu */}
            <Menu
              anchorEl={anchorEl}
              open={openProfileMenu}
              onClose={handleProfileMenuClose}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              PaperProps={{
                sx: {
                  minWidth: 280,
                  borderRadius: 2,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  mt: 1,
                }
              }}
            >
              <MenuItem onClick={() => { handleProfileClick(); handleProfileMenuClose(); }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <LucideIcon icon={ProfileIcon} size={20} />
                </ListItemIcon>
                <ListItemText 
                  primary={t('sidebar.edit_profile')} 
                  primaryTypographyProps={{ 
                    fontSize: '0.9rem',
                    fontWeight: 500 
                  }} 
                />
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { handleSignOut(); handleProfileMenuClose(); }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <LucideIcon icon={LogoutIcon} size={20} sx={{ color: 'error.main' }} />
                </ListItemIcon>
                <ListItemText 
                  primary={t('sidebar.logout')} 
                  primaryTypographyProps={{ 
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    color: 'error.main'
                  }} 
                />
              </MenuItem>
            </Menu>
          </Box>
        )}

        {/* Collapsed State - Quick Actions */}
        {isCollapsed && user && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
            <Tooltip title="User Account" placement="right">
              <IconButton
                onClick={handleUserAccountClick}
                size="small"
                sx={{ 
                  color: 'primary.main',
                  bgcolor: 'primary.light',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  }
                }}
              >
                {/* Remove UserAvatar from collapsed state to avoid duplicate */}
              </IconButton>
            </Tooltip>
            
            {/* Profile Popup Menu for Collapsed State */}
            <Menu
              anchorEl={anchorEl}
              open={openProfileMenu}
              onClose={handleProfileMenuClose}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              PaperProps={{
                sx: {
                  minWidth: 280,
                  minHeight: 200,
                  borderRadius: 2,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  mt: 1,
                }
              }}
            >
              <MenuItem onClick={() => { handleProfileClick(); handleProfileMenuClose(); }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <LucideIcon icon={ProfileIcon} size={20} />
                </ListItemIcon>
                <ListItemText 
                  primary={t('sidebar.edit_profile')} 
                  primaryTypographyProps={{ 
                    fontSize: '0.9rem',
                    fontWeight: 500 
                  }} 
                />
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { handleSignOut(); handleProfileMenuClose(); }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <LucideIcon icon={LogoutIcon} size={20} sx={{ color: 'error.main' }} />
                </ListItemIcon>
                <ListItemText 
                  primary={t('sidebar.logout')} 
                  primaryTypographyProps={{ 
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    color: 'error.main'
                  }} 
                />
              </MenuItem>
            </Menu>
          </Box>
        )}
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