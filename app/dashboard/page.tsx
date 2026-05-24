'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../lib/auth-context';
import { useTheme } from '../../lib/theme-context';
import { useThemeSync } from '../../lib/use-theme-sync';
import { useLanguage } from '../../lib/language-context';
import useTranslations from '../../lib/use-translations';
import { getTimeBasedGreetingByLanguage } from '../../lib/language-greetings';
import { useRouter } from 'next/navigation';
import ProtectedLayout from '../protected-layout';
import FirstTimeLoginChecker from '../../components/first-time-login-checker';
import TranslatedText from '../../components/translated-text';
import { ThemeMode } from '../../lib/user-preferences';
import { getProfessionalTasks } from '../../lib/professional-db';
import { getCalendarEntries } from '../../lib/personal-calendar-db';
import { getNotes } from '../../lib/notes-db';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Avatar,
  LinearProgress,
  Divider,
  Button,
  TextField,
  InputAdornment,
  Grid,
  Tooltip,
  Menu,
  MenuItem,
  Fade,
  Grow,
  Container,
  alpha,
  Chip,
} from '@mui/material';
import {
  Search as SearchIcon,
  FileText as NoteIcon,
  Clock as ClockIcon,
  BarChart3 as AnalyticsIcon,
  Calendar as CalendarIcon,
  Briefcase as ProfessionalIcon,
  User as PersonalIcon,
  ArrowRight as ArrowForwardIcon,
  Lock as LockIconMui,
  Moon as MoonIcon,
  Sun as SunIcon,
  TrendingUp,
  Activity,
  Target,
  Zap,
  Sparkles,
  ChevronRight,
  Monitor,
  Bell,
  PieChart as PieIcon,
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Lock icon wrapper
const LockIcon = ({ size }: any) => (
  <Box sx={{ display: 'flex', alignItems: 'center' }}>
    <LockIconMui size={size} />
  </Box>
);

const DashboardContent = () => {
  const { user } = useAuth();
  const { theme, setThemeMode } = useTheme();
  const { syncTheme } = useThemeSync();
  const { currentLanguage, setLanguage, availableLanguages } = useLanguage();
  const { t } = useTranslations('common');
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [greeting, setGreeting] = useState(getTimeBasedGreetingByLanguage(currentLanguage));
  const [themeMenuAnchor, setThemeMenuAnchor] = useState<null | HTMLElement>(null);
  
  const [tasks, setTasks] = useState<any[]>([]);
  const [personalEntries, setPersonalEntries] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateGreeting = () => setGreeting(getTimeBasedGreetingByLanguage(currentLanguage));
    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, [currentLanguage]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const startDate = thirtyDaysAgo.toISOString().split('T')[0];
        
        const thirtyDaysAhead = new Date();
        thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);
        const endDate = thirtyDaysAhead.toISOString().split('T')[0];

        const [profTasks, calendarEntries, userNotes] = await Promise.all([
          getProfessionalTasks(user.id, { startDate, limit: 100 }),
          getCalendarEntries(user.id, { startDate, limit: 100 }),
          getNotes(user.id, 20)
        ]);

        setTasks(profTasks || []);
        setPersonalEntries(calendarEntries || []);
        setNotes(userNotes || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user?.id]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      activeTasks: tasks.filter(t => t.status !== 'completed').length,
      todayEvents: personalEntries.filter(e => e.entry_date?.startsWith(today)).length,
      totalNotes: notes.length,
      completionRate: tasks.length ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0
    };
  }, [tasks, personalEntries, notes]);

  const chartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { 
        day: days[d.getDay()], 
        date: d.toISOString().split('T')[0], 
        prof: 0, 
        pers: 0, 
        notes: 0 
      };
    });

    tasks.forEach(task => {
      const dayData = last7Days.find(d => d.date === task.task_date);
      if (dayData) dayData.prof += 1;
    });

    personalEntries.forEach(entry => {
      const dayData = last7Days.find(d => d.date === entry.entry_date?.split('T')[0]);
      if (dayData) dayData.pers += 1;
    });

    notes.forEach(note => {
      const dayData = last7Days.find(d => d.date === note.created_at?.split('T')[0]);
      if (dayData) dayData.notes += 1;
    });

    return last7Days;
  }, [tasks, personalEntries, notes]);

  const distributionData = useMemo(() => {
    const total = tasks.length + personalEntries.length + notes.length || 1;
    const data = [
      { name: 'Professional', value: tasks.length || 1, color: '#FF9800' },
      { name: 'Personal', value: personalEntries.length || 1, color: '#9C27B0' },
      { name: 'Notes', value: notes.length || 1, color: '#6750A4' },
    ];
    return { 
      data, 
      score: stats.completionRate,
      efficiency: Math.round((stats.completionRate * 0.95)) || 0
    };
  }, [tasks, personalEntries, notes, stats]);

  const categories = [
    {
      text: t('dashboard.categories.analytical'),
      icon: <AnalyticsIcon size={28} />,
      path: '/analytical',
      color: '#00D2FF',
      desc: t('dashboard.descriptions.analytical'),
      count: '3 Reports',
      locked: false,
      bgImage: '/images/dashboard/analytical.png',
      gradient: 'linear-gradient(180deg, rgba(0, 210, 255, 0.1) 0%, rgba(0, 210, 255, 0.95) 100%)'
    },
    {
      text: t('dashboard.categories.professional'),
      icon: <ProfessionalIcon size={28} />,
      path: '/professional',
      color: '#FF9800',
      desc: t('dashboard.descriptions.professional'),
      count: `${tasks.length} Tasks`,
      locked: false,
      bgImage: '/images/dashboard/professional.png',
      gradient: 'linear-gradient(180deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 152, 0, 0.95) 100%)'
    },
    {
      text: t('dashboard.categories.personal'),
      icon: <PersonalIcon size={28} />,
      path: '/personal',
      color: '#9C27B0',
      desc: t('dashboard.descriptions.personal'),
      count: '4 Goals',
      locked: false,
      bgImage: '/images/dashboard/personal.png',
      gradient: 'linear-gradient(180deg, rgba(156, 39, 176, 0.1) 0%, rgba(156, 39, 176, 0.95) 100%)'
    },
    {
      text: t('dashboard.categories.note_taking'),
      icon: <NoteIcon size={28} />,
      path: '/note-taking',
      color: '#6750A4',
      desc: t('dashboard.descriptions.note_taking'),
      count: '12 Notes',
      locked: false,
      bgImage: '/images/dashboard/notes.png',
      gradient: 'linear-gradient(180deg, rgba(103, 80, 164, 0.1) 0%, rgba(103, 80, 164, 0.95) 100%)'
    },
    {
      text: t('dashboard.categories.calendar'),
      icon: <CalendarIcon size={28} />,
      path: '/calendar',
      color: '#4CAF50',
      desc: t('dashboard.descriptions.calendar'),
      count: '2 Events',
      locked: true,
      bgImage: '/images/dashboard/calendar.png',
      gradient: 'linear-gradient(180deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.95) 100%)'
    },
  ];

  const filteredCategories = categories.filter(cat =>
    cat.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleThemeMenuOpen = (e: React.MouseEvent<HTMLElement>) => setThemeMenuAnchor(e.currentTarget);
  const handleThemeMenuClose = () => setThemeMenuAnchor(null);
  const handleThemeChange = (mode: ThemeMode) => { setThemeMode(mode); syncTheme(); handleThemeMenuClose(); };

  if (!user) return null;

  return (
    <>
      <FirstTimeLoginChecker />
      <Fade in timeout={800}>
        <Box sx={{ 
          minHeight: '100vh',
          width: '100%',
          bgcolor: theme.themeMode === 'dark' ? '#0f172a' : '#f4f7fe',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Container maxWidth={false} sx={{ 
            py: { xs: 3, md: 5 },
            px: { xs: 2, md: 4, lg: 6 },
            position: 'relative',
            flexGrow: 1
          }}>
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            {/* Header Section */}
            <Box sx={{ mb: 6, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 3 }}>
              <Box>
                <TranslatedText 
                  text={`${greeting}, ${user.email?.split('@')[0]}`}
                  variant="h3"
                  sx={{ 
                    fontWeight: 900, mb: 1, letterSpacing: '-0.05em',
                    background: 'linear-gradient(135deg, #fff 0%, #aaa 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    display: theme.themeMode === 'dark' ? 'block' : 'none',
                    fontSize: { xs: '2.5rem', md: '3.8rem' },
                    lineHeight: 1
                  }}
                />
                <TranslatedText 
                  text={`${greeting}, ${user.email?.split('@')[0]}`}
                  variant="h3"
                  sx={{ 
                    fontWeight: 900, mb: 1, letterSpacing: '-0.05em',
                    color: 'text.primary',
                    display: theme.themeMode === 'dark' ? 'none' : 'block',
                    fontSize: { xs: '2.5rem', md: '3.8rem' },
                    lineHeight: 1
                  }}
                />
                <TranslatedText 
                  text="Welcome back! Here's your workspace overview for today."
                  variant="h6"
                  sx={{ color: theme.themeMode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 500, mt: 0.5, ml: 0.8, fontSize: { xs: '1rem', md: '1.1rem' } }}
                />
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1.5, p: 1.5, borderRadius: 5, bgcolor: alpha(theme.themeMode === 'dark' ? '#fff' : '#000', 0.05), border: '1px solid', borderColor: 'divider', backdropFilter: 'blur(20px)' }}>
                <IconButton onClick={() => router.push('/user-clock')} sx={{ color: 'text.primary' }}><ClockIcon size={22} /></IconButton>
                <IconButton onClick={handleThemeMenuOpen} sx={{ color: 'text.primary' }}>{theme.themeMode === 'dark' ? <MoonIcon size={22} /> : <SunIcon size={22} />}</IconButton>
                <Box sx={{ position: 'relative' }}>
                  <IconButton sx={{ color: 'text.primary' }}><Bell size={22} /></IconButton>
                  <Box sx={{ position: 'absolute', top: 5, right: 5, width: 8, height: 8, bgcolor: 'error.main', borderRadius: '50%', border: '2px solid', borderColor: 'background.paper' }} />
                </Box>
              </Box>
            </Box>

            <Grid container spacing={2.5}>
              {/* Stats Row */}
              {[
                { label: 'Pending Tasks', value: stats.activeTasks, icon: <ProfessionalIcon />, color: '#FF9800', trend: 'tasks' },
                { label: 'Today Events', value: stats.todayEvents, icon: <CalendarIcon />, color: '#4CAF50', trend: 'events' },
                { label: 'Total Notes', value: stats.totalNotes, icon: <NoteIcon />, color: '#6750A4', trend: 'notes' },
                { label: 'Efficiency', value: `${stats.completionRate}%`, icon: <Zap />, color: '#00D2FF', trend: 'score' }
              ].map((stat, i) => (
                <Grid key={i} size={{ xs: 12, sm: 12, md: 3 }}>
                  <Grow in timeout={i * 100}>
                    <Card sx={{ 
                      borderRadius: '20px', 
                      bgcolor: theme.themeMode === 'dark' ? '#1e293b' : '#ffffff',
                      border: '1px solid',
                      borderColor: theme.themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      boxShadow: theme.themeMode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.04)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.themeMode === 'dark' ? '0 8px 30px rgba(0,0,0,0.6)' : '0 10px 30px rgba(0,0,0,0.08)',
                      }
                    }}>
                      <CardContent sx={{ p: '20px !important' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                            <Box sx={{ 
                              p: 1.5, 
                              borderRadius: 3.5, 
                              bgcolor: alpha(stat.color, 0.15), 
                              color: stat.color, 
                              display: 'flex',
                              boxShadow: `0 8px 20px ${alpha(stat.color, 0.1)}`
                            }}>
                              {React.cloneElement(stat.icon as any, { size: 28 })}
                            </Box>
                            <Box>
                              <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.2 }}>
                                <TranslatedText text={stat.label} />
                              </Typography>
                              <Typography variant="caption" sx={{ color: stat.color, fontWeight: 700, fontSize: '0.65rem' }}>
                                <TranslatedText text={stat.trend} />
                              </Typography>
                            </Box>
                          </Box>
                          <Typography variant="h3" sx={{ fontWeight: 900, color: 'text.primary', fontSize: '1.8rem', letterSpacing: '-0.02em' }}>
                            {stat.value}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grow>
                </Grid>
              ))}

              {/* Main Content Area */}
              <Grid size={{ xs: 12, lg: 8 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Professional Tracker */}
                  <Card sx={{ borderRadius: '24px', bgcolor: theme.themeMode === 'dark' ? '#1e293b' : '#ffffff', border: '1px solid', borderColor: theme.themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', boxShadow: theme.themeMode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.04)' }}>
                    <CardContent sx={{ p: 4 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 2 }}>
                          <ProfessionalIcon size={24} color="#FF9800" /> <TranslatedText text="Analytical & Professional" />
                        </Typography>
                        <Button endIcon={<ChevronRight />} onClick={() => router.push('/professional')} sx={{ fontWeight: 700 }}>
                          <TranslatedText text="View All" />
                        </Button>
                      </Box>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {tasks.slice(0, 3).map((task, i) => (
                          <Box key={i} sx={{ 
                            p: 2.5, borderRadius: 4, 
                            bgcolor: alpha(theme.themeMode === 'dark' ? '#fff' : '#000', 0.03),
                            border: '1px solid', borderColor: 'divider',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                          }}>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: task.status === 'completed' ? '#4CAF50' : '#FF9800' }} />
                              <Box>
                                <Typography sx={{ fontWeight: 700 }}>{task.title}</Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{task.task_date}</Typography>
                              </Box>
                            </Box>
                            <Chip label={task.priority || 'Medium'} size="small" variant="outlined" sx={{ fontWeight: 700, borderRadius: 2 }} />
                          </Box>
                        ))}
                        {tasks.length === 0 && (
                          <Typography align="center" sx={{ py: 4, opacity: 0.5 }}>No active tasks found</Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Personal & Notes Hub */}
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Card sx={{ height: '100%', borderRadius: '24px', bgcolor: theme.themeMode === 'dark' ? '#1e293b' : '#ffffff', border: '1px solid', borderColor: theme.themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', boxShadow: theme.themeMode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.04)' }}>
                        <CardContent sx={{ p: 4 }}>
                          <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <PersonalIcon size={20} color="#9C27B0" /> Personal Life
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {personalEntries.slice(0, 4).map((entry, i) => (
                              <Box key={i} sx={{ display: 'flex', gap: 2 }}>
                                <Box sx={{ width: 4, height: 32, bgcolor: '#9C27B0', borderRadius: 2 }} />
                                <Box>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{entry.title}</Typography>
                                  <Typography variant="caption" sx={{ opacity: 0.5 }}>{entry.category}</Typography>
                                </Box>
                              </Box>
                            ))}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Card sx={{ height: '100%', borderRadius: '24px', bgcolor: theme.themeMode === 'dark' ? '#1e293b' : '#ffffff', border: '1px solid', borderColor: theme.themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', boxShadow: theme.themeMode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.04)' }}>
                        <CardContent sx={{ p: 4 }}>
                          <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <NoteIcon size={20} color="#6750A4" /> Note Taking
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {notes.slice(0, 2).map((note, i) => (
                              <Box key={i} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: alpha('#6750A4', 0.05) }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>{note.title}</Typography>
                                <Typography variant="caption" sx={{ opacity: 0.6, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{note.content}</Typography>
                              </Box>
                            ))}
                            <Button variant="outlined" fullWidth onClick={() => router.push('/note-taking')} sx={{ borderRadius: 3, mt: 1 }}>All Notes</Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>

              {/* Sidebar Analytics */}
              <Grid size={{ xs: 12, lg: 4 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Card sx={{ borderRadius: '24px', bgcolor: theme.themeMode === 'dark' ? '#1e293b' : '#ffffff', border: '1px solid', borderColor: theme.themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', boxShadow: theme.themeMode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.04)' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Activity size={20} color="#00D2FF" /> Weekly Activity
                      </Typography>
                      <Box sx={{ height: 250 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: alpha(theme.themeMode === 'dark' ? '#fff' : '#000', 0.5) }} />
                            <ChartTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }} />
                            <Bar dataKey="prof" stackId="a" fill="#FF9800" radius={[0, 0, 0, 0]} barSize={20} />
                            <Bar dataKey="pers" stackId="a" fill="#9C27B0" radius={[0, 0, 0, 0]} barSize={20} />
                            <Bar dataKey="notes" stackId="a" fill="#6750A4" radius={[6, 6, 0, 0]} barSize={20} />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>

                  <Card sx={{ borderRadius: '24px', bgcolor: theme.themeMode === 'dark' ? '#1e293b' : '#ffffff', border: '1px solid', borderColor: theme.themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', boxShadow: theme.themeMode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.04)' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Target size={20} color="#FFD700" /> Success Metrics
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700 }}>Task Completion</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 700 }}>{stats.completionRate}%</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={stats.completionRate} sx={{ height: 10, borderRadius: 5, bgcolor: alpha('#00D2FF', 0.1), '& .MuiLinearProgress-bar': { bgcolor: '#00D2FF', borderRadius: 5 } }} />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                            <ResponsiveContainer width={160} height={160}>
                              <PieChart>
                                <Pie data={distributionData.data} innerRadius={55} outerRadius={75} paddingAngle={8} dataKey="value">
                                  {distributionData.data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                              <Typography variant="h5" sx={{ fontWeight: 900 }}>{stats.completionRate}%</Typography>
                              <Typography variant="caption" sx={{ opacity: 0.5, textTransform: 'uppercase', fontSize: '0.6rem' }}>Score</Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Container>
        </Box>
      </Fade>

      {/* Menus */}
      <Menu anchorEl={themeMenuAnchor} open={Boolean(themeMenuAnchor)} onClose={handleThemeMenuClose} PaperProps={{ sx: { borderRadius: 3, mt: 1, minWidth: 160 } }}>
        <MenuItem onClick={() => handleThemeChange('light')} sx={{ gap: 2 }}><SunIcon size={18} color="#FFD700" /> Light</MenuItem>
        <MenuItem onClick={() => handleThemeChange('dark')} sx={{ gap: 2 }}><MoonIcon size={18} color="#9C27B0" /> Dark</MenuItem>
        <MenuItem onClick={() => handleThemeChange('auto')} sx={{ gap: 2 }}><Monitor size={18} color="#2196F3" /> Auto</MenuItem>
      </Menu>
    </>
  );
};

export default function Dashboard() {
  return (
    <ProtectedLayout>
      <DashboardContent />
    </ProtectedLayout>
  );
}