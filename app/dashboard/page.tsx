'use client';

import { useState } from 'react';
import { useAuth } from '../../lib/auth-context';
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
} from '@mui/material';
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  NoteAlt as NoteIcon,
  AccessTime as ClockIcon,
  Analytics as AnalyticsIcon,
  CalendarToday as CalendarIcon,
  Business as ProfessionalIcon,
  Person as PersonalIcon,
  ArrowForward as ArrowForwardIcon,
  GridView as DashboardIcon,
} from '@mui/icons-material';

const DashboardContent = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  if (!user) return null;

  const categories = [
    {
      text: 'Note Taking',
      icon: <NoteIcon sx={{ fontSize: 32 }} />,
      path: '/note-taking',
      color: '#6750A4',
      desc: 'Capture ideas and organize your thoughts.',
      count: '12 Notes'
    },
    {
      text: 'User Clock',
      icon: <ClockIcon sx={{ fontSize: 32 }} />,
      path: '/user-clock',
      color: '#E91E63',
      desc: 'Track your time and daily productivity.',
      count: 'Active'
    },
    {
      text: 'Analytical',
      icon: <AnalyticsIcon sx={{ fontSize: 32 }} />,
      path: '/analytical',
      color: '#2196F3',
      desc: 'Deep dive into your project metrics.',
      count: '3 Reports'
    },
    {
      text: 'Calendar',
      icon: <CalendarIcon sx={{ fontSize: 32 }} />,
      path: '/calendar',
      color: '#4CAF50',
      desc: 'Schedule and manage your events.',
      count: '5 Events'
    },
    {
      text: 'Professional',
      icon: <ProfessionalIcon sx={{ fontSize: 32 }} />,
      path: '/professional',
      color: '#FF9800',
      desc: 'Manage your work projects and tasks.',
      count: '8 Tasks'
    },
    {
      text: 'Personal',
      icon: <PersonalIcon sx={{ fontSize: 32 }} />,
      path: '/personal',
      color: '#9C27B0',
      desc: 'Keep track of your personal milestones.',
      count: '4 Goals'
    },
  ];

  const filteredCategories = categories.filter(cat =>
    cat.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const progressData = [
    { label: 'Weekly Goal', value: 3, total: 8, color: '#6750A4' },
    { label: 'Focus Score', value: 7, total: 10, color: '#4CAF50' },
    { label: 'Completion Rate', value: 2, total: 5, color: '#2196F3' },
  ];

  const activities = [
    { id: 1, user: 'System', action: 'Note "Weekly Plan" updated', time: '2m ago', icon: '📝', color: '#6750A4' },
    { id: 2, user: 'Calendar', action: 'Meeting starts in 15m', time: '15m ago', icon: '⏰', color: '#FF9800' },
    { id: 3, user: 'Stats', action: 'New report generated', time: '1h ago', icon: '📊', color: '#2196F3' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header */}
      <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', mb: 0.5 }}>
            Welcome back, {user.email?.split('@')[0]}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
            Here is what's happening in your workspace today.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search OS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                </InputAdornment>
              ),
              sx: {
                borderRadius: 4,
                bgcolor: 'background.paper',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                '& fieldset': { border: 'none' },
                '&:hover': { bgcolor: 'grey.50' }
              }
            }}
            sx={{ width: 280 }}
          />
          <Tooltip title="Notifications">
            <IconButton sx={{ bgcolor: 'background.paper', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', border: '1px solid', borderColor: 'divider' }}>
              <NotificationsIcon color="action" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={4}>
        {/* Dynamic Navigation Cards */}
        <Grid size={{ xs: 12, lg: 9 }}>
          {filteredCategories.length > 0 ? (
            <Grid container spacing={3}>
              {filteredCategories.map((category) => (
                <Grid key={category.text} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card
                    onClick={() => router.push(category.path)}
                    sx={{
                      borderRadius: 5,
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: '1px solid transparent',
                      height: '100%',
                      bgcolor: 'background.paper',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: `0 20px 40px ${category.color}15`,
                        borderColor: `${category.color}40`,
                      }
                    }}
                  >
                    <CardContent sx={{ p: 4 }}>
                      <Box sx={{
                        width: 60,
                        height: 60,
                        borderRadius: 4,
                        bgcolor: `${category.color}10`,
                        color: category.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 3
                      }}>
                        {category.icon}
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
                        {category.text}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.6, minHeight: 40 }}>
                        {category.desc}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{
                          fontWeight: 800,
                          color: category.color,
                          bgcolor: `${category.color}10`,
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 2
                        }}>
                          {category.count}
                        </Typography>
                        <ArrowForwardIcon sx={{ fontSize: 18, color: 'divider' }} />
                      </Box>
                    </CardContent>
                  </Card>
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
            <Card sx={{ borderRadius: 6, position: 'relative', overflow: 'hidden' }}>
              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, bgcolor: 'primary.main' }} />
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ mb: 4, fontWeight: 800, color: 'grey.800' }}>Live Updates</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                  {progressData.map((item) => (
                    <Box key={item.label}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: 'grey.600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {item.label}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: 'grey.900' }}>
                          {Math.round((item.value / item.total) * 100)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(item.value / item.total) * 100}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: 'grey.50',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            backgroundImage: `linear-gradient(90deg, ${item.color} 0%, ${item.color}CC 100%)`
                          }
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>

            {/* Quick Activity */}
            <Card sx={{ borderRadius: 6, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ mb: 4, fontWeight: 800, color: 'grey.800' }}>Recent Logs</Typography>
                <List disablePadding>
                  {activities.map((activity, idx) => (
                    <Box key={activity.id}>
                      <ListItem alignItems="flex-start" sx={{ px: 0, py: 2.5 }}>
                        <ListItemAvatar sx={{ minWidth: 52 }}>
                          <Avatar sx={{
                            bgcolor: `${activity.color}10`,
                            color: activity.color,
                            borderRadius: 3,
                            width: 40,
                            height: 40,
                            fontSize: '1.2rem'
                          }}>
                            {activity.icon}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'grey.900' }}>
                              {activity.user} <span style={{ fontWeight: 500, color: '#797781' }}>{activity.action}</span>
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontWeight: 700, color: 'grey.400', textTransform: 'uppercase', letterSpacing: 1 }}>
                              {activity.time}
                            </Typography>
                          }
                        />
                      </ListItem>
                      {idx < activities.length - 1 && <Divider component="li" sx={{ my: 0.5, opacity: 0.3 }} />}
                    </Box>
                  ))}
                </List>
                <Button fullWidth variant="text" sx={{ mt: 2, fontWeight: 800, color: 'primary.main', py: 1.5, borderRadius: 3 }}>
                  View All Logs
                </Button>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E0DFE4;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #C8C6CD;
        }
      `}</style>
    </Box>
  );
};

export default function Dashboard() {
  return (
    <ProtectedLayout>
      <DashboardContent />
    </ProtectedLayout>
  );
}