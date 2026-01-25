'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import ProtectedLayout from '../protected-layout';
import {
  Box,
  Container,
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Fade,
  Tabs,
  Tab,
  Chip,
  LinearProgress,
  useTheme,
  alpha,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  ArrowLeft as ArrowBackIcon,
  BarChart3 as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  Calendar as CalendarIcon,
  Briefcase as WorkIcon,
  Heart as HealthIcon,
  Wallet as WealthIcon,
  CalendarDays as EventIcon,
  FileText as TaskIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  TrendingUp,
  Brain as InsightsIcon,
  RefreshCw as RefreshIcon,
  Download as DownloadIcon,
  Building as BusinessIcon,
  Target,
  Activity,
  Zap,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

// Create icon wrapper components for Lucide icons to work with MUI
const LucideIcon = ({ icon: Icon, size = 20, sx, ...props }: any) => (
  <Box sx={{ display: 'flex', alignItems: 'center', ...sx }} {...props}>
    <Icon size={size} />
  </Box>
);
import { 
  PieChart as RePieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart as ReBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LineChart as ReLineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { useRouter } from 'next/navigation';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths, isWithinInterval, parseISO } from 'date-fns';

// Import data fetching functions
import { getCalendarEntries } from '../../lib/personal-calendar-db';
import { getProfessionalTasks, getProfessionalInfo } from '../../lib/professional-db';

// Data interfaces
interface CalendarEntry {
  id: string;
  title: string;
  date: Date;
  category: string;
  priority?: string;
  status?: string;
  description?: string;
}

interface ProfessionalTask {
  id: string;
  title: string;
  task_date: string;
  priority?: string;
  status?: string;
  department?: string;
  role?: string;
}

interface AnalyticsData {
  personal: {
    totalEntries: number;
    entriesByCategory: Record<string, number>;
    completedEntries: number;
    pendingEntries: number;
    weeklyActivity: number[];
    monthlyActivity: number[];
  };
  professional: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    highPriorityTasks: number;
    weeklyTaskCompletion: number[];
    departmentDistribution: Record<string, number>;
  };
  combined: {
    productivityScore: number;
    balanceScore: number;
    overallCompletionRate: number;
    recommendations: string[];
  };
}

const AnalyticalPageContent = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  
  // State management
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');
  const [activeTab, setActiveTab] = useState(0);
  
  // Color palette for charts
  const categoryColors = {
    health: '#10b981',
    wealth: '#f59e0b',
    event: '#6366f1',
    task: '#3b82f6',
    goal: '#8b5cf6',
    adls: '#14b8a6',
    family: '#f97316',
    entertainment: '#ec4899',
    household: '#f43f5e'
  };

  // Fetch and process analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Fetch personal calendar data
        const personalEntries = await getCalendarEntries(user.id);
        const mappedPersonalEntries: CalendarEntry[] = personalEntries.map(entry => ({
          id: entry.id,
          title: entry.title,
          category: entry.category,
          priority: entry.priority,
          status: entry.status || 'pending',
          description: entry.description,
          date: parseISO(entry.entry_date)
        }));
        
        // Fetch professional data
        const professionalTasks = await getProfessionalTasks(user.id);
        const professionalInfo = await getProfessionalInfo(user.id);
        
        // Process data for analytics
        const processedData = processData(mappedPersonalEntries, professionalTasks, professionalInfo);
        setAnalyticsData(processedData);
        
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, [user, timeRange]);
  
  // Data processing function
  const processData = (
    personalEntries: CalendarEntry[],
    professionalTasks: ProfessionalTask[],
    professionalInfo: any
  ): AnalyticsData => {
    
    // Calculate date range based on selected time period
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case 'week':
        startDate = subWeeks(now, 1);
        break;
      case 'month':
        startDate = subMonths(now, 1);
        break;
      case 'quarter':
        startDate = subMonths(now, 3);
        break;
      default:
        startDate = subMonths(now, 1);
    }
    
    // Filter data by date range
    const filteredPersonal = personalEntries.filter(entry => 
      isWithinInterval(entry.date, { start: startDate, end: now })
    );
    
    const filteredProfessional = professionalTasks.filter(task => {
      const taskDate = parseISO(task.task_date);
      return isWithinInterval(taskDate, { start: startDate, end: now });
    });
    
    // Personal analytics
    const personalStats = {
      totalEntries: filteredPersonal.length,
      entriesByCategory: filteredPersonal.reduce((acc, entry) => {
        acc[entry.category] = (acc[entry.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      completedEntries: filteredPersonal.filter(e => e.status === 'completed').length,
      pendingEntries: filteredPersonal.filter(e => e.status === 'pending').length,
      weeklyActivity: generateWeeklyActivity(filteredPersonal, startDate),
      monthlyActivity: generateMonthlyActivity(filteredPersonal, startDate)
    };
    
    // Professional analytics
    const professionalStats = {
      totalTasks: filteredProfessional.length,
      completedTasks: filteredProfessional.filter(t => t.status === 'completed').length,
      pendingTasks: filteredProfessional.filter(t => t.status === 'pending').length,
      highPriorityTasks: filteredProfessional.filter(t => t.priority === 'High').length,
      weeklyTaskCompletion: generateWeeklyTaskCompletion(filteredProfessional, startDate),
      departmentDistribution: filteredProfessional.reduce((acc, task) => {
        const dept = task.department || 'Unassigned';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
    
    // Combined analytics
    const combinedStats = {
      productivityScore: calculateProductivityScore(personalStats, professionalStats),
      balanceScore: calculateBalanceScore(personalStats, professionalStats),
      overallCompletionRate: ((personalStats.completedEntries + professionalStats.completedTasks) / 
                             (personalStats.totalEntries + professionalStats.totalTasks) * 100) || 0,
      recommendations: generateRecommendations(personalStats, professionalStats)
    };
    
    return {
      personal: personalStats,
      professional: professionalStats,
      combined: combinedStats
    };
  };
  
  // Helper functions for data generation
  const generateWeeklyActivity = (entries: CalendarEntry[], startDate: Date): number[] => {
    const weeks = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = startOfWeek(subWeeks(new Date(), 3 - i));
      const weekEnd = endOfWeek(weekStart);
      const count = entries.filter(entry => 
        isWithinInterval(entry.date, { start: weekStart, end: weekEnd })
      ).length;
      weeks.push(count);
    }
    return weeks;
  };
  
  const generateMonthlyActivity = (entries: CalendarEntry[], startDate: Date): number[] => {
    const months = [];
    for (let i = 0; i < 3; i++) {
      const monthStart = startOfMonth(subMonths(new Date(), 2 - i));
      const monthEnd = endOfMonth(monthStart);
      const count = entries.filter(entry => 
        isWithinInterval(entry.date, { start: monthStart, end: monthEnd })
      ).length;
      months.push(count);
    }
    return months;
  };
  
  const generateWeeklyTaskCompletion = (tasks: ProfessionalTask[], startDate: Date): number[] => {
    const weeks = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = startOfWeek(subWeeks(new Date(), 3 - i));
      const weekEnd = endOfWeek(weekStart);
      const weekTasks = tasks.filter(task => {
        const taskDate = parseISO(task.task_date);
        return isWithinInterval(taskDate, { start: weekStart, end: weekEnd });
      });
      const completed = weekTasks.filter(t => t.status === 'completed').length;
      const rate = weekTasks.length > 0 ? (completed / weekTasks.length) * 100 : 0;
      weeks.push(Math.round(rate));
    }
    return weeks;
  };
  
  const calculateProductivityScore = (personal: any, professional: any): number => {
    const personalCompletionRate = personal.totalEntries > 0 ? 
      (personal.completedEntries / personal.totalEntries) * 50 : 0;
    const professionalCompletionRate = professional.totalTasks > 0 ? 
      (professional.completedTasks / professional.totalTasks) * 50 : 0;
    return Math.round(personalCompletionRate + professionalCompletionRate);
  };
  
  const calculateBalanceScore = (personal: any, professional: any): number => {
    const personalRatio = personal.totalEntries > 0 ? 
      personal.entriesByCategory.health / personal.totalEntries : 0;
    const professionalRatio = professional.totalTasks > 0 ? 
      professional.highPriorityTasks / professional.totalTasks : 0;
    
    // Balance score: 50% health focus, 50% reasonable priority distribution
    const healthScore = Math.min(personalRatio * 100, 50);
    const priorityScore = Math.max(0, 50 - (professionalRatio * 50));
    
    return Math.round(healthScore + priorityScore);
  };
  
  const generateRecommendations = (personal: any, professional: any): string[] => {
    const recommendations = [];
    
    if (personal.entriesByCategory.health < personal.totalEntries * 0.1) {
      recommendations.push('Focus more on health-related activities');
    }
    
    if (professional.pendingTasks > professional.totalTasks * 0.5) {
      recommendations.push('Prioritize completing pending professional tasks');
    }
    
    if (personal.totalEntries === 0 && professional.totalTasks === 0) {
      recommendations.push('Start adding entries to track your activities');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Great job maintaining your activities! Keep up the good work.');
    }
    
    return recommendations;
  };
  
  // Chart helper functions
  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      'health': '#10b981',
      'wealth': '#f59e0b',
      'family': '#ef4444',
      'personal': '#8b5cf6',
      'event': '#06b6d4',
      'adl': '#84cc16',
      'household': '#f97316',
      'entertainment': '#ec4899',
      'engineering': '#3b82f6',
      'marketing': '#8b5cf6',
      'sales': '#10b981',
      'hr': '#f59e0b',
      'finance': '#ef4444',
      'operations': '#06b6d4',
      'unassigned': '#6b7280'
    };
    return colors[category.toLowerCase()] || '#6b7280';
  };

  const getWeeklyChartData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, index) => ({
      day,
      personal: analyticsData?.personal?.weeklyActivity?.[index] || 0,
      professional: analyticsData?.professional?.weeklyTaskCompletion?.[index] || 0
    }));
  };

  const getMonthlyChartData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, index) => ({
      month,
      completionRate: Math.random() * 30 + 60, // Simulated data
      productivity: Math.random() * 25 + 65 // Simulated data
    }));
  };

  const handleLogout = () => {
    logout();
  };

  const handleGoBack = () => {
    router.back();
  };
  
  const handleRefresh = () => {
    // Trigger data refresh
    if (user) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  };
  
  if (loading || !analyticsData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'transparent', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <Toolbar>
          <IconButton 
            edge="start" 
            onClick={handleGoBack} 
            aria-label="back"
            sx={{ 
              color: 'text.primary',
              '&:hover': {
                bgcolor: 'action.hover',
                borderRadius: 2
              }
            }}
          >
            <LucideIcon icon={ArrowBackIcon} size={24} />
          </IconButton>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box 
              sx={{ 
                width: 40, 
                height: 40, 
                borderRadius: 3,
                background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <LucideIcon icon={AnalyticsIcon} size={20} sx={{ color: 'white' }} />
            </Box>
            <Box>
              <Typography 
                variant="h4" 
                component="div" 
                sx={{ 
                  fontWeight: 800, 
                  background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  lineHeight: 1.2
                }}
              >
                Analytics Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Track your productivity and performance metrics
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton 
              onClick={handleRefresh} 
              sx={{ 
                color: 'text.primary',
                '&:hover': {
                  bgcolor: 'action.hover',
                  borderRadius: 2
                }
              }}
            >
              <LucideIcon icon={RefreshIcon} size={20} />
            </IconButton>
            <FormControl 
              size="small" 
              sx={{ 
                minWidth: 180,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                    borderColor: '#2196F3'
                  },
                  '&:focus-within': {
                    boxShadow: '0 8px 30px rgba(33, 150, 243, 0.15)',
                    borderColor: '#2196F3'
                  }
                }
              }}
            >
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                displayEmpty
                sx={{
                  '& .MuiSelect-select': {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontWeight: 600,
                    color: 'text.primary'
                  }
                }}
              >
                <MenuItem value="7days">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LucideIcon icon={CalendarIcon} size={16} sx={{ color: '#2196F3' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Last 7 Days</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="30days">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LucideIcon icon={TrendingUp} size={16} sx={{ color: '#10b981' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Last 30 Days</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="90days">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LucideIcon icon={Activity} size={16} sx={{ color: '#f59e0b' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Last 90 Days</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="1year">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LucideIcon icon={Target} size={16} sx={{ color: '#ef4444' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Last Year</Typography>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Toolbar>
      </AppBar>

      <Fade in timeout={350}>
        <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Overview Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card 
              sx={{ 
                height: 140, // Reduced height
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  boxShadow: '0 12px 40px rgba(102, 126, 234, 0.2)',
                  borderColor: '#667eea',
                  '& .color-strip': {
                    width: '100%',
                    opacity: 1
                  },
                  '& .card-icon': {
                    transform: 'scale(1.1) rotate(5deg)',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white'
                  }
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: 4,
                  background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
                  opacity: 0.8,
                  transition: 'all 0.3s ease'
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box 
                    className="card-icon"
                    sx={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                      color: '#667eea',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
                    }}
                  >
                    <LucideIcon icon={AnalyticsIcon} size={20} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.95rem' }}>
                    Productivity Score
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontSize: '2rem' }}>
                  {analyticsData.combined.productivityScore}%
                </Typography>
                <Box sx={{ position: 'relative' }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={analyticsData.combined.productivityScore} 
                    sx={{ 
                      height: 6, 
                      borderRadius: 3,
                      bgcolor: 'rgba(102, 126, 234, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: 3,
                        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.4)',
                        transition: 'all 0.3s ease'
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card 
              sx={{ 
                height: 140, // Reduced height
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  boxShadow: '0 12px 40px rgba(16, 185, 129, 0.2)',
                  borderColor: '#10b981',
                  '& .card-icon': {
                    transform: 'scale(1.1) rotate(5deg)',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white'
                  }
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: 4,
                  background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
                  opacity: 0.8,
                  transition: 'all 0.3s ease'
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box 
                    className="card-icon"
                    sx={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
                      color: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                    }}
                  >
                    <LucideIcon icon={Target} size={20} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.95rem' }}>
                    Total Tasks
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontSize: '2rem' }}>
                  {analyticsData.personal.totalEntries + analyticsData.professional.totalTasks}
                </Typography>
                <Box sx={{ position: 'relative' }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={(analyticsData.personal.completedEntries + analyticsData.professional.completedTasks) / (analyticsData.personal.totalEntries + analyticsData.professional.totalTasks) * 100} 
                    sx={{ 
                      height: 6, 
                      borderRadius: 3,
                      bgcolor: 'rgba(16, 185, 129, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                        borderRadius: 3,
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
                        transition: 'all 0.3s ease'
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card 
              sx={{ 
                height: 140, // Reduced height
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.05) 100%)',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  boxShadow: '0 12px 40px rgba(59, 130, 246, 0.2)',
                  borderColor: '#3b82f6',
                  '& .card-icon': {
                    transform: 'scale(1.1) rotate(5deg)',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white'
                  }
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: 4,
                  background: 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)',
                  opacity: 0.8,
                  transition: 'all 0.3s ease'
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box 
                    className="card-icon"
                    sx={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)',
                      color: '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
                    }}
                  >
                    <LucideIcon icon={Activity} size={20} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.95rem' }}>
                    Total Activities
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontSize: '2rem' }}>
                  {analyticsData.personal.totalEntries + analyticsData.professional.totalTasks}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip 
                    label={`${analyticsData.personal.totalEntries} Personal`} 
                    size="small" 
                    sx={{ 
                      bgcolor: 'rgba(59, 130, 246, 0.1)',
                      color: '#3b82f6',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      fontWeight: 600,
                      borderRadius: 2,
                      fontSize: '0.7rem'
                    }}
                  />
                  <Chip 
                    label={`${analyticsData.professional.totalTasks} Professional`} 
                    size="small" 
                    sx={{ 
                      bgcolor: 'rgba(37, 99, 235, 0.1)',
                      color: '#2563eb',
                      border: '1px solid rgba(37, 99, 235, 0.2)',
                      fontWeight: 600,
                      borderRadius: 2,
                      fontSize: '0.7rem'
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card 
              sx={{ 
                height: 140, // Reduced height
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(217, 119, 6, 0.05) 100%)',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  boxShadow: '0 12px 40px rgba(245, 158, 11, 0.2)',
                  borderColor: '#f59e0b',
                  '& .card-icon': {
                    transform: 'scale(1.1) rotate(5deg)',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white'
                  }
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: 4,
                  background: 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)',
                  opacity: 0.8,
                  transition: 'all 0.3s ease'
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box 
                    className="card-icon"
                    sx={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)',
                      color: '#f59e0b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)'
                    }}
                  >
                    <LucideIcon icon={Zap} size={20} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.95rem' }}>
                    Balance Score
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontSize: '2rem' }}>
                  {analyticsData.combined.balanceScore}%
                </Typography>
                <Box sx={{ position: 'relative' }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={analyticsData.combined.balanceScore} 
                    sx={{ 
                      height: 6, 
                      borderRadius: 3,
                      bgcolor: 'rgba(245, 158, 11, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
                        borderRadius: 3,
                        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)',
                        transition: 'all 0.3s ease'
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts Section - Task Usage Analysis */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Task Usage Pie Chart */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card 
              sx={{ 
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
                  Task Usage Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <RePieChart>
                    <Pie
                      data={Object.entries({
                        ...analyticsData.personal.entriesByCategory,
                        ...analyticsData.professional.departmentDistribution
                      }).map(([category, count]) => ({
                        name: category.charAt(0).toUpperCase() + category.slice(1),
                        value: count,
                        color: getCategoryColor(category)
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries({
                        ...analyticsData.personal.entriesByCategory,
                        ...analyticsData.professional.departmentDistribution
                      }).map(([category, count], index) => (
                        <Cell key={`cell-${index}`} fill={getCategoryColor(category)} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Weekly Activity Bar Chart */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card 
              sx={{ 
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
                  Weekly Activity Trend
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <ReBarChart data={getWeeklyChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="personal" fill="#8884d8" name="Personal Tasks" />
                    <Bar dataKey="professional" fill="#82ca9d" name="Professional Tasks" />
                  </ReBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Monthly Trend Line Chart */}
          <Grid size={{ xs: 12 }}>
            <Card 
              sx={{ 
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
                  Monthly Completion Trend
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <ReLineChart data={getMonthlyChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="completionRate" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Completion Rate %"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="productivity" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      name="Productivity Score"
                    />
                  </ReLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Enhanced Tabs for Detailed Analytics */}
        <Box sx={{ 
          mb: 4,
          bgcolor: 'background.paper',
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          p: 2,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
          }
        }}>
          <Tabs 
            value={activeTab} 
            variant="scrollable"
            scrollButtons="auto"
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              '& .MuiTabs-indicator': {
                display: 'none'
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.875rem',
                color: 'text.secondary',
                minHeight: 56,
                px: 3,
                borderRadius: 3,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '1px solid transparent',
                '&:hover': {
                  bgcolor: 'action.hover',
                  color: 'text.primary',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                },
                '&.Mui-selected': {
                  color: '#2196F3',
                  bgcolor: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(25, 118, 210, 0.1) 100%)',
                  border: '1px solid rgba(33, 150, 243, 0.3)',
                  boxShadow: '0 4px 20px rgba(33, 150, 243, 0.15)',
                  transform: 'translateY(-2px)',
                  '& .MuiSvgIcon-root': {
                    color: '#2196F3'
                  }
                }
              }
            }}
          >
            <Tab 
              label="Overview" 
              icon={<LucideIcon icon={BarChartIcon} size={18} />} 
              iconPosition="start" 
            />
            <Tab 
              label="Personal Life" 
              icon={<LucideIcon icon={CalendarIcon} size={18} />} 
              iconPosition="start" 
            />
            <Tab 
              label="Professional" 
              icon={<LucideIcon icon={WorkIcon} size={18} />} 
              iconPosition="start" 
            />
            <Tab 
              label="Recommendations" 
              icon={<LucideIcon icon={InsightsIcon} size={18} />} 
              iconPosition="start" 
            />
          </Tabs>
        </Box>

        {/* Tab Content */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            {/* Activity Distribution */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card 
                sx={{ 
                  borderRadius: 3,
                  border: '1px solid rgba(0,0,0,0.08)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
                    Activity Distribution
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {Object.entries({
                      ...analyticsData.personal.entriesByCategory,
                      ...analyticsData.professional.departmentDistribution
                    }).map(([category, count]) => (
                      <Box key={category}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                            {count}
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={(count / (analyticsData.personal.totalEntries + analyticsData.professional.totalTasks)) * 100}
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            bgcolor: 'grey.100',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: categoryColors[category as keyof typeof categoryColors] || theme.palette.primary.main,
                              borderRadius: 4
                            }
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Weekly Trends */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card 
                sx={{ 
                  borderRadius: 3,
                  border: '1px solid rgba(0,0,0,0.08)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
                    Weekly Completion Trends
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {analyticsData.personal.weeklyActivity.map((count, index) => (
                      <Box key={index}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            Week {index + 1}
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                            {count} activities
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={(count / Math.max(...analyticsData.personal.weeklyActivity)) * 100}
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            bgcolor: 'grey.100',
                            '& .MuiLinearProgress-bar': {
                              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                              borderRadius: 4
                            }
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {activeTab === 1 && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card 
                sx={{ 
                  borderRadius: 3,
                  border: '1px solid rgba(0,0,0,0.08)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
                    Personal Categories
                  </Typography>
                  {Object.entries(analyticsData.personal.entriesByCategory).map(([category, count]) => (
                    <Box key={category} sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
                      <Box 
                        sx={{ 
                          width: 16, 
                          height: 16, 
                          borderRadius: '50%', 
                          bgcolor: categoryColors[category as keyof typeof categoryColors] || 'primary.main',
                          mr: 3,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }} 
                      />
                      <Typography variant="body1" sx={{ flex: 1, fontWeight: 500, color: 'text.primary' }}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                        {count}
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid size={{ xs: 12, md: 8 }}>
              <Card 
                sx={{ 
                  borderRadius: 3,
                  border: '1px solid rgba(0,0,0,0.08)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
                    Personal Activity Summary
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid size={6}>
                      <Box 
                        sx={{ 
                          textAlign: 'center', 
                          p: 3, 
                          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
                          borderRadius: 3,
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.15)'
                          }
                        }}
                      >
                        <Typography variant="h3" sx={{ fontWeight: 800, color: '#10b981', mb: 1 }}>
                          {analyticsData.personal.completedEntries}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          Completed
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={6}>
                      <Box 
                        sx={{ 
                          textAlign: 'center', 
                          p: 3, 
                          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)',
                          borderRadius: 3,
                          border: '1px solid rgba(245, 158, 11, 0.2)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 20px rgba(245, 158, 11, 0.15)'
                          }
                        }}
                      >
                        <Typography variant="h3" sx={{ fontWeight: 800, color: '#f59e0b', mb: 1 }}>
                          {analyticsData.personal.pendingEntries}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          Pending
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {activeTab === 2 && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card 
                sx={{ 
                  borderRadius: 3,
                  border: '1px solid rgba(0,0,0,0.08)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
                    Professional Task Status
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                    <Box 
                      sx={{ 
                        p: 2,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 20px rgba(16, 185, 129, 0.15)'
                        }
                      }}
                    >
                      <Typography variant="h3" sx={{ fontWeight: 800, color: '#10b981', mb: 1 }}>
                        {analyticsData.professional.completedTasks}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                        Completed
                      </Typography>
                    </Box>
                    <Box 
                      sx={{ 
                        p: 2,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)',
                        border: '1px solid rgba(245, 158, 11, 0.2)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 20px rgba(245, 158, 11, 0.15)'
                        }
                      }}
                    >
                      <Typography variant="h3" sx={{ fontWeight: 800, color: '#f59e0b', mb: 1 }}>
                        {analyticsData.professional.pendingTasks}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                        Pending
                      </Typography>
                    </Box>
                    <Box 
                      sx={{ 
                        p: 2,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 20px rgba(239, 68, 68, 0.15)'
                        }
                      }}
                    >
                      <Typography variant="h3" sx={{ fontWeight: 800, color: '#ef4444', mb: 1 }}>
                        {analyticsData.professional.highPriorityTasks}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                        High Priority
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <Card 
                sx={{ 
                  borderRadius: 3,
                  border: '1px solid rgba(0,0,0,0.08)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
                    Department Distribution
                  </Typography>
                  {Object.entries(analyticsData.professional.departmentDistribution).map(([dept, count]) => (
                    <Box key={dept} sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
                      <Box 
                        sx={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: 3,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 3
                        }}
                      >
                        <LucideIcon icon={BusinessIcon} size={20} sx={{ color: 'white' }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                          {dept}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {count} tasks
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {count}
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {activeTab === 3 && (
          <Card 
            sx={{ 
              borderRadius: 3,
              border: '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box 
                  sx={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2
                  }}
                >
                  <LucideIcon icon={InsightsIcon} size={24} sx={{ color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    AI-Powered Recommendations
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Personalized insights to improve your productivity
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {analyticsData.combined.recommendations.map((rec, index) => (
                  <Box 
                    key={index}
                    sx={{ 
                      p: 3, 
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                      borderRadius: 3, 
                      border: '1px solid rgba(102, 126, 234, 0.15)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateX(4px)',
                        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.1)',
                        border: '1px solid rgba(102, 126, 234, 0.3)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <Box 
                        sx={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%', 
                          bgcolor: 'primary.main',
                          mr: 2,
                          mt: 1,
                          flexShrink: 0
                        }} 
                      />
                      <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary', lineHeight: 1.6 }}>
                        {rec}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        )}
        
        {/* Personal Life Tab Content */}
        {activeTab === 1 && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LucideIcon icon={CalendarIcon} size={24} sx={{ color: '#9C27B0' }} />
                    Personal Calendar Overview
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box sx={{ p: 3, bgcolor: 'rgba(156, 39, 176, 0.05)', borderRadius: 3, border: '1px solid rgba(156, 39, 176, 0.2)' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#9C27B0', mb: 1 }}>
                        Total Entries: {analyticsData.personal.totalEntries}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Personal goals, habits, and life milestones
                      </Typography>
                    </Box>
                    <Box sx={{ p: 3, bgcolor: 'rgba(76, 175, 80, 0.05)', borderRadius: 3, border: '1px solid rgba(76, 175, 80, 0.2)' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#4CAF50', mb: 1 }}>
                        Completed: {analyticsData.personal.completedEntries}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Successfully achieved personal objectives
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LucideIcon icon={Target} size={24} sx={{ color: '#9C27B0' }} />
                    Personal Categories
                  </Typography>
                  {Object.entries(analyticsData.personal.entriesByCategory).map(([category, count]) => (
                    <Box key={category} sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: '#9C27B0' }}>
                          {count}
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={(count / analyticsData.personal.totalEntries) * 100}
                        sx={{ 
                          height: 8, 
                          borderRadius: 2,
                          bgcolor: 'rgba(156, 39, 176, 0.1)',
                          '& .MuiLinearProgress-bar': {
                            background: 'linear-gradient(90deg, #9C27B0 0%, #7B1FA2 100%)',
                            borderRadius: 2
                          }
                        }}
                      />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
        
        {/* Professional Tab Content */}
        {activeTab === 2 && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LucideIcon icon={WorkIcon} size={24} sx={{ color: '#FF9800' }} />
                    Professional Tasks Overview
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box sx={{ p: 3, bgcolor: 'rgba(255, 152, 0, 0.05)', borderRadius: 3, border: '1px solid rgba(255, 152, 0, 0.2)' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#FF9800', mb: 1 }}>
                        Total Tasks: {analyticsData.professional.totalTasks}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Work projects and professional objectives
                      </Typography>
                    </Box>
                    <Box sx={{ p: 3, bgcolor: 'rgba(244, 67, 54, 0.05)', borderRadius: 3, border: '1px solid rgba(244, 67, 54, 0.2)' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#F44336', mb: 1 }}>
                        High Priority: {analyticsData.professional.highPriorityTasks}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tasks requiring immediate attention
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LucideIcon icon={BusinessIcon} size={24} sx={{ color: '#FF9800' }} />
                    Department Distribution
                  </Typography>
                  {Object.entries(analyticsData.professional.departmentDistribution).map(([dept, count]) => (
                    <Box key={dept} sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {dept.charAt(0).toUpperCase() + dept.slice(1)}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: '#FF9800' }}>
                          {count}
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={(count / analyticsData.professional.totalTasks) * 100}
                        sx={{ 
                          height: 8, 
                          borderRadius: 2,
                          bgcolor: 'rgba(255, 152, 0, 0.1)',
                          '& .MuiLinearProgress-bar': {
                            background: 'linear-gradient(90deg, #FF9800 0%, #F57C00 100%)',
                            borderRadius: 2
                          }
                        }}
                      />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
        
        {/* Recommendations Tab Content */}
        {activeTab === 3 && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                    <Box sx={{ 
                      width: 48, 
                      height: 48, 
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 3
                    }}>
                      <LucideIcon icon={InsightsIcon} size={24} sx={{ color: 'white' }} />
                    </Box>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        AI-Powered Recommendations
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Personalized insights to improve your productivity
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {analyticsData.combined.recommendations.map((rec, index) => (
                      <Box 
                        key={index}
                        sx={{ 
                          p: 3, 
                          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                          borderRadius: 3, 
                          border: '1px solid rgba(102, 126, 234, 0.15)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateX(4px)',
                            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.1)',
                            border: '1px solid rgba(102, 126, 234, 0.3)'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                          <LucideIcon icon={Sparkles} size={16} sx={{ color: '#667eea', mr: 2, mt: 1, flexShrink: 0 }} />
                          <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary', lineHeight: 1.6 }}>
                            {rec}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
        </Container>
      </Fade>
    </Box>
  );
};

export default function AnalyticalPage() {
  return (
    <ProtectedLayout>
      <AnalyticalPageContent />
    </ProtectedLayout>
  );
}