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
  UserCircle as ProfileIcon,
  Mic as VoiceIcon,
  Bell as BellIcon,
} from 'lucide-react';
import VoiceSchedulerModal from './voice-scheduler-modal';
import { getUpcomingAlarms } from '../lib/alarm-service';
import { format, parseISO } from 'date-fns';

// Create icon wrapper components for Lucide icons to work with MUI
const LucideIcon = ({ icon: Icon, size = 20, sx, ...props }: any) => (
  <Box sx={{ display: 'flex', alignItems: 'center', ...sx }} {...props}>
    <Icon size={size} />
  </Box>
);

// Lock icon wrapper
// const LockIconWrapper = ({ size = 20, sx }: any) => (
//   <Box sx={{ display: 'flex', alignItems: 'center', ...sx }}>
//     <LockIcon size={size} />
//   </Box>
// );

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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [realNotifications, setRealNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      getUpcomingAlarms(user.id, 48).then(alarms => {
        setRealNotifications(alarms);
      });
    }
  }, [notificationsOpen, user]);

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
    { text: 'Home', icon: <LucideIcon icon={HomeIcon} />, path: '/home', color: '#3B82F6', locked: false },
    // { text: 'Dashboard', icon: <LucideIcon icon={DashboardIcon} />, path: '/dashboard', color: '#3B82F6', locked: false },
    { text: 'Analytical', icon: <LucideIcon icon={AnalyticsIcon} />, path: '/analytical', color: '#3B82F6', locked: false },
    { text: 'Professional', icon: <LucideIcon icon={ProfessionalIcon} />, path: '/professional', color: '#3B82F6', locked: false },
    { text: 'Personal Life', icon: <LucideIcon icon={PersonalIcon} />, path: '/personal', color: '#3B82F6', locked: false },
    { text: 'Note Taking', icon: <LucideIcon icon={NoteIcon} />, path: '/note-taking', color: '#3B82F6', locked: false },
    { text: 'Calendar', icon: <LucideIcon icon={CalendarIcon} />, path: '/calendar', color: '#3B82F6', locked: false },
    { text: 'Voice Schedule', icon: <LucideIcon icon={VoiceIcon} />, path: 'voice-action', color: '#38BDF8', locked: false },
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
              height={30}
              style={{ width: 'auto', height: 'auto' }}
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
          const isActive = pathname === item.path || (pathname === '/' && item.path === '/home');
          
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
      <Box sx={{ p: 2, mt: 'auto', borderTop: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Energetic Notification Button */}
        <Box sx={{ position: 'relative' }}>
          <Button
            fullWidth
            onClick={() => setNotificationsOpen(true)}
            sx={{
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              borderRadius: '16px',
              py: 1.5,
              px: isCollapsed ? 0 : 2,
              background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
              color: '#FFFFFF',
              boxShadow: '0 8px 20px -6px rgba(99, 102, 241, 0.6)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              animation: 'pulse-glow 2.5s infinite',
              '@keyframes pulse-glow': {
                '0%': { boxShadow: '0 0 0 0 rgba(99, 102, 241, 0.5)' },
                '70%': { boxShadow: '0 0 0 15px rgba(99, 102, 241, 0)' },
                '100%': { boxShadow: '0 0 0 0 rgba(99, 102, 241, 0)' },
              },
              '&:hover': {
                background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
                transform: 'translateY(-3px)',
                boxShadow: '0 12px 24px -8px rgba(99, 102, 241, 0.7)',
              }
            }}
          >
            <LucideIcon icon={BellIcon} sx={{ color: '#FFFFFF', mr: isCollapsed ? 0 : 1.5, animation: 'ring 4s infinite ease-in-out', '@keyframes ring': { '0%, 100%': { transform: 'rotate(0deg)' }, '5%, 15%': { transform: 'rotate(15deg)' }, '10%, 20%': { transform: 'rotate(-15deg)' }, '25%': { transform: 'rotate(0deg)' } } }} />
            {!isCollapsed && (
              <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.02em', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                Notifications
              </Typography>
            )}
            {!isCollapsed && realNotifications.length > 0 && (
              <Box sx={{ ml: 'auto', bgcolor: '#FFFFFF', color: '#6366F1', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900 }}>
                {realNotifications.length}
              </Box>
            )}
          </Button>
        </Box>

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
              onClick={() => {
                if (mobileOpen) setMobileOpen(false);
                router.push('/profile');
              }}
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
      
      {/* Global Notifications Drawer */}
      <Drawer
        anchor="right"
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 420 },
            background: '#F8FAFC',
            borderLeft: '1px solid rgba(0,0,0,0.05)',
            boxShadow: '-20px 0 40px rgba(0,0,0,0.05)'
          }
        }}
      >
        <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
             <Typography variant="h5" sx={{ fontWeight: 900, background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>
               Command Center
             </Typography>
             <IconButton onClick={() => setNotificationsOpen(false)} sx={{ bgcolor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
               <LucideIcon icon={ChevronRightIcon} size={20} />
             </IconButton>
          </Box>

          <Typography variant="overline" sx={{ fontWeight: 800, color: '#94A3B8', letterSpacing: '0.1em', mb: 2 }}>Upcoming Tasks</Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
            {realNotifications.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">No upcoming tasks in the next 48 hours. Enjoy your day! 🚀</Typography>
              </Box>
            ) : (
              realNotifications.map(notification => {
                let IconComponent = PersonalIcon;
                let bgColor = 'linear-gradient(135deg, #10B981 0%, #059669 100%)';
                let shadowColor = 'rgba(16,185,129,0.3)';

                if (notification.source_type === 'Professional Task') {
                  IconComponent = ProfessionalIcon;
                  bgColor = 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)';
                  shadowColor = 'rgba(245,158,11,0.3)';
                } else if (notification.source_type === 'Note') {
                  IconComponent = NoteIcon;
                  bgColor = 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)';
                  shadowColor = 'rgba(59,130,246,0.3)';
                }

                return (
                  <Box key={notification.id} sx={{ p: 2.5, bgcolor: '#FFFFFF', borderRadius: 4, border: '1px solid rgba(0,0,0,0.03)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', display: 'flex', gap: 2, transition: 'all 0.2s', cursor: 'pointer', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(0,0,0,0.04)', borderColor: 'rgba(99,102,241,0.2)' } }}>
                    <Box sx={{ width: 44, height: 44, borderRadius: '50%', background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 10px ${shadowColor}` }}>
                        <LucideIcon icon={IconComponent} sx={{ color: '#FFF' }} size={20} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.2, mb: 0.5 }}>{notification.title}</Typography>
                      <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>
                        {notification.source_type} scheduled for {
                          notification.trigger_time_utc && !isNaN(new Date(notification.trigger_time_utc).getTime()) 
                            ? format(new Date(notification.trigger_time_utc), 'h:mm a, MMM d') 
                            : 'Unknown time'
                        }
                      </Typography>
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>
          
          <Box sx={{ mt: 'auto', pt: 4 }}>
            <Button fullWidth variant="outlined" sx={{ borderRadius: 3, py: 1.5, fontWeight: 700, color: '#64748B', borderColor: 'rgba(0,0,0,0.1)' }}>
              Clear All Notifications
            </Button>
          </Box>
        </Box>
      </Drawer>

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