import Image from 'next/image';

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
  Mic as VoiceIcon,
} from 'lucide-react';
import VoiceSchedulerModal from './voice-scheduler-modal';

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openProfileMenu = Boolean(anchorEl);
  
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

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
    { text: 'Home', icon: <LucideIcon icon={HomeIcon} />, path: '/home', color: '#4F46E5', locked: false },
    { text: 'Dashboard', icon: <LucideIcon icon={DashboardIcon} />, path: '/dashboard', color: '#667eea', locked: false },
    { text: 'Analytical', icon: <LucideIcon icon={AnalyticsIcon} />, path: '/analytical', color: '#2196F3', locked: false },
    { text: 'Professional', icon: <LucideIcon icon={ProfessionalIcon} />, path: '/professional', color: '#FF9800', locked: false },
    { text: 'Personal Life', icon: <LucideIcon icon={PersonalIcon} />, path: '/personal', color: '#9C27B0', locked: false },
    { text: 'Note Taking', icon: <LucideIcon icon={NoteIcon} />, path: '/note-taking', color: '#6750A4', locked: false },
    { text: 'Calendar', icon: <LucideIcon icon={CalendarIcon} />, path: '/calendar', color: '#4CAF50', locked: false },
    { text: 'Voice Schedule', icon: <LucideIcon icon={VoiceIcon} />, path: 'voice-action', color: '#f44336', locked: false },
  ];

  const currentWidth = isCollapsed ? collapsedWidth : drawerWidth;

  const drawer = (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: theme.palette.mode === 'dark' ? '#111827' : '#ffffff',
      transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      width: currentWidth,
      position: 'relative',
      overflowX: 'hidden',
      overflowY: 'auto',
      borderRight: '1px solid',
      borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#e2e8f0',
    }}>
      {/* Brand Header */}
      <Box sx={{
        p: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mb: 2,
        borderBottom: '1px solid',
        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f1f5f9'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {!isCollapsed ? (
            <Image
              src="/6-removebg-preview.png"
              alt="Time OS Logo"
              width={120}
              height={20}
              objectFit="contain"
              priority={true}
            />
          ) : (
            <Box sx={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'primary.main' }}>
              T
            </Box>
          )}
        </Box>
      </Box>


      {/* Navigation List */}
      <List sx={{ px: isCollapsed ? 1.5 : 2, flexGrow: 1 }}>
        {navItems.map((item) => {
          const isActive = pathname === item.path || (pathname === '/' && item.path === '/dashboard');
          
          // Modern pill design for active state
          const itemContent = (
            <ListItemButton
              onClick={() => {
                if (item.locked) return;
                if (item.path === 'voice-action') {
                  setIsVoiceModalOpen(true);
                  if (mobileOpen) setMobileOpen(false);
                } else {
                  handleNavigation(item.path);
                }
              }}
              sx={{
                borderRadius: '12px',
                py: 1,
                px: isCollapsed ? 0 : 2,
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                transition: 'all 0.2s ease-in-out',
                bgcolor: isActive ? (theme.palette.mode === 'dark' ? alpha(item.color, 0.15) : alpha(item.color, 0.1)) : 'transparent',
                color: isActive ? item.color : (theme.palette.mode === 'dark' ? '#94a3b8' : '#64748b'),
                position: 'relative',
                opacity: item.locked ? 0.5 : 1,
                cursor: item.locked ? 'not-allowed' : 'pointer',
                mb: 0.5,
                '&:hover': !item.locked ? {
                  bgcolor: isActive ? (theme.palette.mode === 'dark' ? alpha(item.color, 0.2) : alpha(item.color, 0.15)) : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8fafc'),
                  color: isActive ? item.color : (theme.palette.mode === 'dark' ? '#f8fafc' : '#0f172a'),
                } : {},
              }}
            >
              <ListItemIcon sx={{
                minWidth: isCollapsed ? 0 : 40,
                justifyContent: 'center',
                color: 'inherit',
              }}>
                {item.icon}
              </ListItemIcon>
              {!isCollapsed && (
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.9rem',
                    color: 'inherit',
                    letterSpacing: '-0.01em',
                  }}
                  secondary={item.locked ? 'Coming Soon' : ''}
                  secondaryTypographyProps={{
                    fontSize: '0.7rem',
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
      <Box sx={{ p: 2, mt: 'auto', borderTop: '1px solid', borderColor: 'divider' }}>
        {/* Unified Profile Section */}
        {user && (
          <Box>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
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
                  minWidth: 180,
                  borderRadius: 2,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  mt: 1,
                  '& .MuiList-root': {
                    py: 0.5,
                  }
                }
              }}
            >
              <MenuItem dense onClick={() => { handleProfileClick(); handleProfileMenuClose(); }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <LucideIcon icon={ProfileIcon} size={18} />
                </ListItemIcon>
                <ListItemText 
                  primary="Edit Profile" 
                  primaryTypographyProps={{ 
                    fontSize: '0.85rem',
                    fontWeight: 500 
                  }} 
                />
              </MenuItem>
              <Divider sx={{ my: 0.5 }} />
              <MenuItem dense onClick={() => { handleSignOut(); handleProfileMenuClose(); }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <LucideIcon icon={LogoutIcon} size={18} sx={{ color: 'error.main' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Logout" 
                  primaryTypographyProps={{ 
                    fontSize: '0.85rem',
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
              overflow: 'visible',
            },
          }}
          open
        >
          {drawer}
          {/* Center Right Edge Collapse Toggle */}
          <IconButton 
            onClick={handleCollapseToggle} 
            size="small" 
            sx={{ 
              position: 'absolute',
              top: '50%',
              right: -14,
              transform: 'translateY(-50%)',
              zIndex: 10,
              bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              color: theme.palette.mode === 'dark' ? '#94a3b8' : '#64748b',
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark' ? '#334155' : '#f8fafc',
                color: 'primary.main'
              }
            }}
          >
            <LucideIcon icon={isCollapsed ? ChevronRightIcon : ChevronLeftIcon} size={16} />
          </IconButton>
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
      
      {/* Voice Scheduler Modal */}
      {user && (
        <VoiceSchedulerModal 
          open={isVoiceModalOpen} 
          onClose={() => setIsVoiceModalOpen(false)} 
          userId={user.id} 
          onSuccess={() => {
            if (pathname === '/calendar') {
              window.location.reload();
            } else {
              router.push('/calendar');
            }
          }} 
        />
      )}
    </>
  );
};

export default Sidebar;