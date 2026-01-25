'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import { useTheme } from '../../lib/theme-context';
import { getTimeBasedGreeting, ThemeMode } from '../../lib/user-preferences';
import { useRouter } from 'next/navigation';
import ProtectedLayout from '../protected-layout';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Avatar,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Button,
  TextField,
  InputAdornment,
  Grid,
  Tooltip,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Fade,
  Grow,
  Paper,
  Container,
} from '@mui/material';
import {
  Search as SearchIcon,
  Bell as NotificationsIcon,
  FileText as NoteIcon,
  Clock as ClockIcon,
  BarChart3 as AnalyticsIcon,
  Calendar as CalendarIcon,
  Briefcase as ProfessionalIcon,
  User as PersonalIcon,
  ArrowRight as ArrowForwardIcon,
  LayoutDashboard as DashboardIcon,
  Lock as LockIconMui,
  Moon as DarkModeIcon,
  Sun as LightModeIcon,
  Monitor as AutoModeIcon,
  Sun as SunIcon,
  Moon as MoonIcon,
  TrendingUp,
  Activity,
  Target,
  Zap,
  Sparkles,
  ChevronRight,
  BarChart3,
  Briefcase,
  User,
  FileText,
  Calendar,
  Clock,
  Bell,
  Monitor,
} from 'lucide-react';

// Create icon wrapper components for Lucide icons to work with MUI
const LucideIcon = ({ icon: Icon, size, sx, ...props }: any) => (
  <Box sx={{ display: 'flex', alignItems: 'center', ...sx }} {...props}>
    <Icon size={size} />
  </Box>
);

// Lock icon wrapper
const LockIcon = ({ size }: any) => (
  <Box sx={{ display: 'flex', alignItems: 'center' }}>
    <LockIconMui size={size} />
  </Box>
);

const DashboardContent = () => {
  const { user } = useAuth();
  const { theme, setThemeMode } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [greeting, setGreeting] = useState(getTimeBasedGreeting());
  const [themeMenuAnchor, setThemeMenuAnchor] = useState<null | HTMLElement>(null);
  const [realTimeData, setRealTimeData] = useState({
    totalTasks: 0,
    completedTasks: 0,
    totalNotes: 0,
    totalEvents: 0,
    recentActivities: [] as Array<{
      id: number;
      user: string;
      action: string;
      time: string;
      icon: string;
      color: string;
    }>
  });

  // Update greeting based on time
  useEffect(() => {
    const updateGreeting = () => {
      setGreeting(getTimeBasedGreeting());
    };

    // Update greeting immediately
    updateGreeting();

    // Set up interval to check time changes (every minute)
    const interval = setInterval(updateGreeting, 60000);

    return () => clearInterval(interval);
  }, []);

  // Fetch real-time data
  useEffect(() => {
    const fetchRealTimeData = async () => {
      try {
        // This would fetch actual data from your database
        // For now, I'll simulate with realistic data based on the unlocked cards
        const data = {
          totalTasks: 8, // From Professional card
          completedTasks: 5, // Simulated completion
          totalNotes: 0, // Note Taking is locked
          totalEvents: 0, // Calendar is locked
          recentActivities: [
            { id: 1, user: 'Professional', action: 'Task "Project Review" completed', time: '2m ago', icon: '✓', color: '#FF9800' },
            { id: 2, user: 'Analytical', action: 'New analytics report generated', time: '15m ago', icon: '📊', color: '#2196F3' },
            { id: 3, user: 'Personal', action: 'New goal added to personal tracker', time: '1h ago', icon: '🎯', color: '#9C27B0' },
          ]
        };
        setRealTimeData(data);
      } catch (error) {
        console.error('Error fetching real-time data:', error);
      }
    };

    fetchRealTimeData();
    // Set up interval for real-time updates
    const interval = setInterval(fetchRealTimeData, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const handleThemeMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setThemeMenuAnchor(event.currentTarget);
  };

  const handleThemeMenuClose = () => {
    setThemeMenuAnchor(null);
  };

  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
    handleThemeMenuClose();
  };

  const getThemeIcon = () => {
    switch (theme.themeMode) {
      case 'dark':
        return <DarkModeIcon />;
      case 'auto':
        return <AutoModeIcon />;
      default:
        return <LightModeIcon />;
    }
  };

  const getThemeTooltip = () => {
    switch (theme.themeMode) {
      case 'dark':
        return 'Dark Mode';
      case 'auto':
        return 'Auto Mode';
      default:
        return 'Light Mode';
    }
  };

  if (!user) return null;

  const categories = [
    {
      text: 'Analytical',
      icon: <BarChart3 size={32} />,
      path: '/analytical',
      color: '#2196F3',
      desc: 'Advanced analytics and data insights for your projects.',
      count: '3 Reports',
      locked: false,
      gradient: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)'
    },
    {
      text: 'Professional',
      icon: <Briefcase size={32} />,
      path: '/professional',
      color: '#FF9800',
      desc: 'Manage work projects, tasks, and professional goals.',
      count: '8 Tasks',
      locked: false,
      gradient: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)'
    },
    {
      text: 'Personal',
      icon: <User size={32} />,
      path: '/personal',
      color: '#9C27B0',
      desc: 'Track personal goals, habits, and life milestones.',
      count: '4 Goals',
      locked: false,
      gradient: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)'
    },
    {
      text: 'Note Taking',
      icon: <FileText size={32} />,
      path: '/note-taking',
      color: '#6750A4',
      desc: 'Capture ideas, organize thoughts, and boost creativity.',
      count: '0 Notes',
      locked: false,
      gradient: 'linear-gradient(135deg, #6750A4 0%, #512DA8 100%)'
    },
    {
      text: 'Calendar',
      icon: <Calendar size={32} />,
      path: '/calendar',
      color: '#4CAF50',
      desc: 'Schedule events and manage your time efficiently.',
      count: 'Coming Soon',
      locked: true,
      gradient: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)'
    },
    {
      text: 'User Clock',
      icon: <Clock size={32} />,
      path: '/user-clock',
      color: '#E91E63',
      desc: 'Track time, productivity patterns, and work-life balance.',
      count: 'Coming Soon',
      locked: true,
      gradient: 'linear-gradient(135deg, #E91E63 0%, #C2185B 100%)'
    },
  ];

  const filteredCategories = categories.filter(cat =>
    cat.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const progressData = [
    { 
      label: 'Task Completion', 
      value: realTimeData.completedTasks, 
      total: realTimeData.totalTasks || 1, 
      color: '#FF9800' 
    },
    { 
      label: 'Active Modules', 
      value: 3, // Analytical, Professional, Personal are unlocked
      total: 6, 
      color: '#2196F3' 
    },
    { 
      label: 'Productivity Score', 
      value: realTimeData.totalTasks > 0 ? Math.round((realTimeData.completedTasks / realTimeData.totalTasks) * 10) : 0, 
      total: 10, 
      color: '#4CAF50' 
    },
  ];

  const activities = realTimeData.recentActivities;

  return (
    <Fade in timeout={600}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Modern Header */}
          <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography 
                variant="h3" 
                sx={{ 
                  fontWeight: 800, 
                  color: 'text.primary', 
                  letterSpacing: '-0.02em', 
                  mb: 1,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontSize: { xs: '2rem', md: '2.5rem' }
                }}
              >
                {greeting}, {user.email?.split('@')[0]}
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500, opacity: 0.8 }}>
                Welcome back! Here's your workspace overview for today.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                size="medium"
                placeholder="Search workspace..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SearchIcon size={20} />
                      </Box>
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: 3,
                    bgcolor: 'background.paper',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    border: '1px solid',
                    borderColor: 'divider',
                    '& fieldset': { border: 'none' },
                    '&:hover': { 
                      boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                      borderColor: 'primary.main'
                    },
                    '&:focus-within': {
                      boxShadow: '0 8px 30px rgba(102, 126, 234, 0.15)',
                      borderColor: 'primary.main'
                    }
                  }
                }}
                sx={{ width: { xs: 200, md: 320 } }}
              />
              <Tooltip title={getThemeTooltip()}>
                <IconButton 
                  onClick={handleThemeMenuOpen}
                  sx={{ 
                    bgcolor: 'background.paper', 
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)', 
                    border: '1px solid', 
                    borderColor: 'divider',
                    borderRadius: '50%',
                    width: 48,
                    height: 48,
                    '&:hover': {
                      boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                      bgcolor: 'primary.main',
                      color: 'white',
                      transform: 'scale(1.05)'
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  {getThemeIcon()}
                </IconButton>
              </Tooltip>
              <Tooltip title="Notifications">
                <IconButton 
                  sx={{ 
                    bgcolor: 'background.paper', 
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)', 
                    border: '1px solid', 
                    borderColor: 'divider',
                    borderRadius: '50%',
                    width: 48,
                    height: 48,
                    position: 'relative',
                    '&:hover': {
                      boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                      bgcolor: 'primary.main',
                      color: 'white',
                      transform: 'scale(1.05)'
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Bell size={20} />
                  </Box>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: 'error.main',
                      border: '2px solid',
                      borderColor: 'background.paper'
                    }}
                  />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Grid container spacing={4}>
            {/* Dynamic Navigation Cards */}
            <Grid size={{ xs: 12, lg: 9 }}>
              {filteredCategories.length > 0 ? (
                <Grid container spacing={3}>
                  {filteredCategories.map((category, index) => (
                    <Grid key={category.text} size={{ xs: 12, sm: 6, md: 4 }}>
                      <Grow in timeout={index * 100}>
                        <Card
                          onClick={() => !category.locked && router.push(category.path)}
                          sx={{
                            borderRadius: 4,
                            cursor: category.locked ? 'not-allowed' : 'pointer',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            border: '1px solid',
                            borderColor: 'divider',
                            height: '100%',
                            bgcolor: 'background.paper',
                            position: 'relative',
                            overflow: 'hidden',
                            '&:hover': !category.locked ? {
                              transform: 'translateY(-12px) scale(1.02)',
                              boxShadow: `0 25px 50px ${category.color}25`,
                              borderColor: category.color,
                              '& .card-icon': {
                                transform: 'scale(1.1) rotate(5deg)',
                                background: category.gradient,
                                color: 'white'
                              },
                              '& .card-arrow': {
                                transform: 'translateX(4px)',
                                color: category.color
                              },
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: 4,
                                background: category.gradient,
                                transform: 'scaleX(1)',
                                transition: 'transform 0.3s ease'
                              }
                            } : {
                              transform: 'none',
                              boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                            },
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              height: 4,
                              background: category.gradient,
                              transform: 'scaleX(0)',
                              transition: 'transform 0.3s ease'
                            }
                          }}
                        >
                          {category.locked && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 16,
                                right: 16,
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                bgcolor: 'action.disabled',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 2,
                                backdropFilter: 'blur(10px)'
                              }}
                            >
                              <LockIcon size={18} />
                            </Box>
                          )}
                          <CardContent sx={{ p: 4 }}>
                            <Box 
                              className="card-icon"
                              sx={{
                                width: 64,
                                height: 64,
                                borderRadius: 4,
                                bgcolor: `${category.color}10`,
                                color: category.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 3,
                                position: 'relative',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: `0 8px 20px ${category.color}20`
                              }}
                            >
                              {category.icon}
                              {category.locked && (
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    bgcolor: 'rgba(255,255,255,0.9)',
                                    borderRadius: 4,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backdropFilter: 'blur(5px)'
                                  }}
                                >
                                  <LockIcon size={24} />
                                </Box>
                              )}
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, color: 'text.primary', fontSize: '1.1rem' }}>
                              {category.text}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.6, minHeight: 44, opacity: 0.9 }}>
                              {category.desc}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="caption" sx={{
                                fontWeight: 700,
                                color: category.locked ? 'text.secondary' : category.color,
                                bgcolor: category.locked ? 'action.disabled' : `${category.color}10`,
                                px: 2,
                                py: 1,
                                borderRadius: 2,
                                fontSize: '0.75rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                              }}>
                                {category.locked ? 'Coming Soon' : category.count}
                              </Typography>
                              {!category.locked && (
                                <Box 
                                  className="card-arrow"
                                  sx={{ 
                                    color: 'divider',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                  }}
                                >
                                  <ChevronRight size={20} />
                                </Box>
                              )}
                            </Box>
                          </CardContent>
                        </Card>
                      </Grow>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center', py: 10 }}>
                  <Typography variant="h6" color="text.secondary">No matching categories found.</Typography>
                </Box>
              )}
            </Grid>

        {/* Info Sidebar */}
            <Grid size={{ xs: 12, lg: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* Real-time Metrics */}
                <Grow in timeout={800}>
                  <Card sx={{ 
                    borderRadius: 4, 
                    position: 'relative', 
                    overflow: 'hidden',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
                      transform: 'translateY(-4px)'
                    }
                  }}>
                    <Box sx={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      right: 0, 
                      height: 4, 
                      background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)' 
                    }} />
                    <CardContent sx={{ p: 4 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                          <TrendingUp size={24} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>Performance Metrics</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {progressData.map((item, index) => (
                          <Grow in timeout={900 + index * 100} key={item.label}>
                            <Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ 
                                  fontWeight: 700, 
                                  color: 'text.secondary', 
                                  fontSize: '0.75rem', 
                                  textTransform: 'uppercase', 
                                  letterSpacing: '0.05em',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1
                                }}>
                                  {item.label === 'Task Completion' && <Target size={14} />}
                                  {item.label === 'Active Modules' && <Activity size={14} />}
                                  {item.label === 'Productivity Score' && <Zap size={14} />}
                                  {item.label}
                                </Typography>
                                <Typography variant="body2" sx={{ 
                                  fontWeight: 800, 
                                  color: item.color,
                                  fontSize: '0.875rem'
                                }}>
                                  {Math.round((item.value / item.total) * 100)}%
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={(item.value / item.total) * 100}
                                sx={{
                                  height: 10,
                                  borderRadius: 5,
                                  bgcolor: 'action.hover',
                                  '& .MuiLinearProgress-bar': {
                                    borderRadius: 5,
                                    backgroundImage: `linear-gradient(90deg, ${item.color} 0%, ${item.color}CC 100%)`,
                                    boxShadow: `0 2px 8px ${item.color}40`,
                                    transition: 'all 0.3s ease'
                                  }
                                }}
                              />
                            </Box>
                          </Grow>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grow>

                {/* Recent Activity */}
                <Grow in timeout={1000}>
                  <Card sx={{ 
                    borderRadius: 4, 
                    border: '1px solid', 
                    borderColor: 'divider', 
                    boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
                      transform: 'translateY(-4px)'
                    }
                  }}>
                    <CardContent sx={{ p: 4 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                          <Activity size={24} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>Recent Activity</Typography>
                      </Box>
                      <List disablePadding>
                        {activities.map((activity, idx) => (
                          <Grow in timeout={1100 + idx * 100} key={activity.id}>
                            <Box>
                              <ListItem alignItems="flex-start" sx={{ px: 0, py: 2.5, transition: 'all 0.2s ease', '&:hover': { bgcolor: 'action.hover', borderRadius: 2 } }}>
                                <ListItemAvatar sx={{ minWidth: 52 }}>
                                  <Avatar sx={{
                                    bgcolor: `${activity.color}10`,
                                    color: activity.color,
                                    borderRadius: 3,
                                    width: 40,
                                    height: 40,
                                    fontSize: '1.2rem',
                                    fontWeight: 600,
                                    boxShadow: `0 4px 12px ${activity.color}20`
                                  }}>
                                    {activity.icon}
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                  primary={
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
                                      <span style={{ color: activity.color, fontWeight: 700 }}>{activity.user}</span>
                                      <span style={{ fontWeight: 500, color: 'text.secondary', marginLeft: 4 }}>{activity.action}</span>
                                    </Typography>
                                  }
                                  secondary={
                                    <Typography variant="caption" sx={{ 
                                      display: 'block', 
                                      mt: 0.5, 
                                      fontWeight: 600, 
                                      color: 'text.disabled', 
                                      textTransform: 'uppercase', 
                                      letterSpacing: 0.5,
                                      fontSize: '0.7rem'
                                    }}>
                                      {activity.time}
                                    </Typography>
                                  }
                                />
                              </ListItem>
                              {idx < activities.length - 1 && <Divider component="li" sx={{ my: 0.5, opacity: 0.2 }} />}
                            </Box>
                          </Grow>
                        ))}
                      </List>
                      <Button 
                        fullWidth 
                        variant="text" 
                        sx={{ 
                          mt: 2, 
                          fontWeight: 700, 
                          color: 'primary.main', 
                          py: 1.5, 
                          borderRadius: 3,
                          textTransform: 'none',
                          '&:hover': {
                            bgcolor: 'primary.main',
                            color: 'white',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)'
                          },
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      >
                        View All Activity
                      </Button>
                    </CardContent>
                  </Card>
                </Grow>
              </Box>
            </Grid>
          </Grid>

          {/* Theme Selection Menu */}
          <Menu
            anchorEl={themeMenuAnchor}
            open={Boolean(themeMenuAnchor)}
            onClose={handleThemeMenuClose}
            PaperProps={{
              elevation: 8,
              sx: {
                borderRadius: 3,
                mt: 1,
                minWidth: 220,
                boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                border: '1px solid',
                borderColor: 'divider'
              }
            }}
          >
            <MenuItem 
              onClick={() => handleThemeChange('light')}
              selected={theme.themeMode === 'light'}
              sx={{ transition: 'all 0.2s ease' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    color: theme.themeMode === 'light' ? 'primary.main' : 'text.secondary'
                  }}>
                    <SunIcon size={20} />
                  </Box>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: theme.themeMode === 'light' ? 600 : 400 }}>
                    Light Mode
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Bright and clean interface
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
            <MenuItem 
              onClick={() => handleThemeChange('dark')}
              selected={theme.themeMode === 'dark'}
              sx={{ transition: 'all 0.2s ease' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    color: theme.themeMode === 'dark' ? 'primary.main' : 'text.secondary'
                  }}>
                    <MoonIcon size={20} />
                  </Box>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: theme.themeMode === 'dark' ? 600 : 400 }}>
                    Dark Mode
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Easy on the eyes at night
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
            <MenuItem 
              onClick={() => handleThemeChange('auto')}
              selected={theme.themeMode === 'auto'}
              sx={{ transition: 'all 0.2s ease' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    color: theme.themeMode === 'auto' ? 'primary.main' : 'text.secondary'
                  }}>
                    <Monitor size={20} />
                  </Box>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: theme.themeMode === 'auto' ? 600 : 400 }}>
                    Auto Mode
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Adapts to your environment
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
          </Menu>
        </Box>
      </Container>
    </Fade>
  );
};

export default function Dashboard() {
  return (
    <ProtectedLayout>
      <DashboardContent />
    </ProtectedLayout>
  );
}