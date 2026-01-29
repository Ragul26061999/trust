'use client';

import React, { useState, useEffect, ChangeEvent } from 'react';
import { useAuth } from '../../lib/auth-context';
import { useTimeEngine } from '../../lib/time-engine';
import ProtectedLayout from '../protected-layout';
import {
  Box,
  Container,
  Typography,
  Button,
  IconButton,
  Card,
  CardContent,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  Fab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  LinearProgress,
  Avatar,
  useTheme,
  alpha,
  Menu,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Event as EventIcon,
  Assignment as AssignmentIcon,
  Business as BusinessIcon,
  Work as WorkIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  CalendarToday as CalendarIcon,
  DateRange as DateRangeIcon,
  MoreVert as MoreVertIcon,
  BarChart as BarChartIcon,
  TrendingUp as TrendingUpIcon,
  Timeline as TimelineIcon,
  PieChart as PieChartIcon,
  Assessment as AssessmentIcon,
  Download as DownloadIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useRouter } from 'next/navigation';
import { format, parseISO, addDays, isToday, isTomorrow, isThisWeek, startOfWeek, endOfWeek, eachDayOfInterval, subDays, startOfMonth, endOfMonth, isWithinInterval, getYear, getMonth } from 'date-fns';
import {
  getProfessionalInfo,
  saveProfessionalInfo,
  getProfessionalTasks,
  addProfessionalTask,
  updateProfessionalTask,
  rescheduleProfessionalTask,
  deleteProfessionalTask,
  ensureProfessionalTasksTable,
  ProfessionalTask
} from '../../lib/professional-db';

import { isSupabaseConfigured } from '../../lib/supabase';

const ProfessionalPageContent = () => {
  const { user, logout } = useAuth();
  const { addAlarm } = useTimeEngine();
  const router = useRouter();
  
  // State for user profile information
  const [profileInfo, setProfileInfo] = useState({
    department: '',
    role: '',
    responsibilities: '',
    experience: '',
  });
  
  // State for tasks
  const [tasks, setTasks] = useState<ProfessionalTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSetupForm, setShowSetupForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  
  // State for new task form
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    task_date: format(new Date(), 'yyyy-MM-dd'),
  });
  
  // State for alarm functionality
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [alarmTime, setAlarmTime] = useState('');
  
  // State for rescheduling dialog
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [taskToReschedule, setTaskToReschedule] = useState<ProfessionalTask | null>(null);
  const [newDate, setNewDate] = useState<Date | null>(new Date());
  
  // State for tab navigation
  const [tabValue, setTabValue] = useState(0);
  
  // State for analytics dialog
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // State for month/year filtering
  const [filterMode, setFilterMode] = useState<'default' | 'monthYear'>('default');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState(new Date());
  
  // State for download options
  const [downloadMenuAnchor, setDownloadMenuAnchor] = useState<null | HTMLElement>(null);
  
  const theme = useTheme();
  
  // Check if user has completed profile setup
  useEffect(() => {
    if (!user) return;
    
    console.log('User object:', user);
    console.log('User ID:', user.id);
    console.log('User ID type:', typeof user.id);
    
    // Validate user ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(user.id)) {
      console.error('Invalid user ID format detected:', user.id);
      console.error('Expected UUID format but got:', typeof user.id);
      // Still proceed but with warning
    }
    
    const checkProfileSetup = async () => {
      try {
        // Ensure the professional_tasks table exists
        const tableExists = await ensureProfessionalTasksTable();
        
        if (!tableExists) {
          console.warn('Professional tasks table does not exist. Showing setup form.');
          setShowSetupForm(true);
          return;
        }
        
        const info = await getProfessionalInfo(user.id);
        if (!info) {
          setShowSetupForm(true);
        } else {
          setProfileInfo({
            department: info.department || '',
            role: info.role || '',
            responsibilities: info.responsibilities || '',
            experience: info.experience || '',
          });
          fetchTasks();
        }
      } catch (error) {
        console.error('Error in profile setup check:', error);
        // If there's an error, show setup form to ensure data gets initialized
        setShowSetupForm(true);
      } finally {
        setLoading(false);
      }
    };
  }, [user]);

  const handleGoBack = () => {
    router.back();
  };
  
  // Fetch tasks when user is authenticated
  const fetchTasks = async () => {
    if (!user) return;
    
    try {
      const tasksData = await getProfessionalTasks(user.id);
      setTasks(tasksData);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };
  
  // Handle profile setup submission
  const handleProfileSetup = async () => {
    if (!user) {
      console.error('No user found');
      alert('Authentication error: No user found. Please log in again.');
      return;
    }
    
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured - simulating profile save in development');
      // In development mode without Supabase, just simulate success
      setShowSetupForm(false);
      fetchTasks();
      alert('Profile saved successfully (simulated in development mode)!');
      return;
    }
    
    // Validate user ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(user.id)) {
      console.error('Invalid user ID format:', user.id);
      alert('Authentication error: Invalid user ID format. Please log in again.');
      return;
    }
    
    // Validate required fields
    if (!profileInfo.department || !profileInfo.role) {
      console.error('Missing required fields: department or role');
      alert('Please fill in all required fields (Department and Role)');
      return;
    }
    
    setLoading(true);
    
    const profileData = {
      user_id: user.id,
      department: profileInfo.department,
      role: profileInfo.role,
      responsibilities: profileInfo.responsibilities,
      experience: profileInfo.experience,
    };
    
    console.log('Submitting profile data for user:', user.id);
    console.log('Profile data:', profileData);
    
    try {
      console.log('About to save profile data:', profileData);
      const result = await saveProfessionalInfo(profileData);
      console.log('Save result:', result);
      if (result) {
        console.log('Profile saved successfully:', result);
        setShowSetupForm(false);
        fetchTasks();
        alert('Profile saved successfully!');
      } else {
        console.error('Failed to save profile - function returned null');
        alert('Failed to save profile information. Please check the console for details.');
      }
    } catch (error) {
      console.error('Caught error in handleProfileSetup:', error);
      alert('An error occurred while saving your profile. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  const checkProfileSetup = async () => {
    try {
      // Ensure the professional_tasks table exists
      const tableExists = await ensureProfessionalTasksTable();
      
      if (!tableExists) {
        console.warn('Professional tasks table does not exist. Showing setup form.');
        setShowSetupForm(true);
        return;
      }
      
      const info = await getProfessionalInfo(user?.id || '');
      if (!info) {
        setShowSetupForm(true);
      } else {
        setProfileInfo({
          department: info.department || '',
          role: info.role || '',
          responsibilities: info.responsibilities || '',
          experience: info.experience || '',
        });
        fetchTasks();
      }
    } catch (error) {
      console.error('Error in profile setup check:', error);
      // If there's an error, show setup form to ensure data gets initialized
      setShowSetupForm(true);
    } finally {
      setLoading(false);
    }
  };

  // Load profile info on component mount
  useEffect(() => {
    if (user) {
      checkProfileSetup();
    }
  }, [user]);

  // Handle task creation
  const handleCreateTask = async () => {
    if (!user || !newTask.title) return;
    
    setLoading(true);
    
    const taskData = {
      user_id: user.id,
      title: newTask.title,
      description: newTask.description,
      department: profileInfo.department,
      role: profileInfo.role,
      responsibilities: profileInfo.responsibilities,
      experience: profileInfo.experience,
      task_date: newTask.task_date,
      priority: newTask.priority,
      status: 'pending',
    };
    
    try {
      const newTaskResult = await addProfessionalTask(taskData);
      if (newTaskResult) {
        setTasks([...tasks, newTaskResult]);
        
        // Create alarm if enabled
        if (alarmEnabled && alarmTime && user) {
          await addAlarm({
            title: `Alarm for: ${newTask.title}`,
            source: 'Professional Task',
            triggerLocalIso: alarmTime,
            link: `/professional`
          });
        }
        
        setShowTaskForm(false);
        setNewTask({
          title: '',
          description: '',
          priority: 'Medium',
          task_date: format(new Date(), 'yyyy-MM-dd'),
        });
        setAlarmEnabled(false);
        setAlarmTime('');
      }
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle task status toggle
  const toggleTaskStatus = async (task: ProfessionalTask) => {
    if (!user) return;
    
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    
    try {
      const success = await updateProfessionalTask(task.id, { status: newStatus });
      if (success) {
        setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };
  
  // Handle task deletion
  const handleDeleteTask = async (taskId: string) => {
    try {
      const success = await deleteProfessionalTask(taskId);
      if (success) {
        setTasks(tasks.filter(t => t.id !== taskId));
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };
  
  // Open reschedule dialog
  const openRescheduleDialog = (task: ProfessionalTask) => {
    setTaskToReschedule(task);
    setRescheduleDialogOpen(true);
    setNewDate(parseISO(task.task_date));
  };
  
  // Handle task rescheduling
  const handleRescheduleTask = async () => {
    if (!taskToReschedule || !newDate) return;
    
    try {
      const newDateString = format(newDate, 'yyyy-MM-dd');
      const success = await rescheduleProfessionalTask(taskToReschedule.id, newDateString);
      if (success) {
        setTasks(tasks.map(t => 
          t.id === taskToReschedule.id 
            ? { ...t, scheduled_for: newDateString, status: 'rescheduled' } 
            : t
        ));
        setRescheduleDialogOpen(false);
        setTaskToReschedule(null);
      }
    } catch (error) {
      console.error('Error rescheduling task:', error);
    }
  };
  
  // Calculate analytics data
  const getAnalyticsData = () => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const lastWeekStart = subDays(weekStart, 7);
    const lastWeekEnd = subDays(weekEnd, 7);
    
    const thisWeekTasks = tasks.filter(task => {
      const taskDate = parseISO(task.task_date);
      return taskDate >= weekStart && taskDate <= weekEnd;
    });
    
    const lastWeekTasks = tasks.filter(task => {
      const taskDate = parseISO(task.task_date);
      return taskDate >= lastWeekStart && taskDate <= lastWeekEnd;
    });
    
    const completedThisWeek = thisWeekTasks.filter(t => t.status === 'completed').length;
    const completedLastWeek = lastWeekTasks.filter(t => t.status === 'completed').length;
    
    const priorityData = {
      High: tasks.filter(t => t.priority === 'High').length,
      Medium: tasks.filter(t => t.priority === 'Medium').length,
      Low: tasks.filter(t => t.priority === 'Low').length,
    };
    
    const statusData = {
      completed: tasks.filter(t => t.status === 'completed').length,
      pending: tasks.filter(t => t.status === 'pending').length,
      rescheduled: tasks.filter(t => t.status === 'rescheduled').length,
    };
    
    const completionRate = tasks.length > 0 ? (statusData.completed / tasks.length) * 100 : 0;
    const weeklyProgress = lastWeekTasks.length > 0 ? 
      ((completedThisWeek - completedLastWeek) / lastWeekTasks.length) * 100 : 0;
    
    return {
      totalTasks: tasks.length,
      completedTasks: statusData.completed,
      pendingTasks: statusData.pending,
      completionRate: completionRate.toFixed(1),
      weeklyProgress: weeklyProgress.toFixed(1),
      thisWeekTasks: thisWeekTasks.length,
      priorityData,
      statusData,
      completedThisWeek,
      completedLastWeek,
    };
  };
  // Filter tasks based on selected tab and month/year filter
  const getFilteredTasks = () => {
    const today = new Date();
    let filteredTasks: ProfessionalTask[] = [];
    
    if (filterMode === 'monthYear') {
      // Filter by selected month and year
      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);
      
      filteredTasks = tasks.filter(task => {
        const taskDate = parseISO(task.task_date);
        return isWithinInterval(taskDate, { start: monthStart, end: monthEnd });
      });
    } else {
      // Default filtering by tabs
      switch (tabValue) {
        case 0: // Today
          filteredTasks = tasks.filter(task => isToday(parseISO(task.task_date)));
          break;
        case 1: // Tomorrow
          filteredTasks = tasks.filter(task => isTomorrow(parseISO(task.task_date)));
          break;
        case 2: // This Week
          filteredTasks = tasks.filter(task => isThisWeek(parseISO(task.task_date)));
          break;
        case 3: // All
          filteredTasks = tasks;
          break;
        default:
          filteredTasks = tasks.filter(task => isToday(parseISO(task.task_date)));
      }
    }
    
    return filteredTasks;
  };
  
  // Download functions
  const downloadCSV = () => {
    const filteredTasks = getFilteredTasks();
    const headers = ['Title', 'Description', 'Priority', 'Status', 'Due Date', 'Department', 'Role'];
    const csvContent = [
      headers.join(','),
      ...filteredTasks.map(task => [
        `"${task.title}"`,
        `"${task.description}"`,
        task.priority,
        task.status,
        task.task_date,
        `"${task.department}"`,
        `"${task.role}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `professional-tasks-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadMenuAnchor(null);
  };
  
  const downloadPDF = () => {
    // For PDF generation, we'll create a simple text-based report
    const filteredTasks = getFilteredTasks();
    const reportContent = `
PROFESSIONAL TASKS REPORT
Generated: ${format(new Date(), 'PPP')}
Filter: ${filterMode === 'monthYear' ? format(selectedMonth, 'MMMM yyyy') : ['Today', 'Tomorrow', 'This Week', 'All'][tabValue]}
Total Tasks: ${filteredTasks.length}

${filteredTasks.map((task, index) => `
${index + 1}. ${task.title}
   Status: ${task.status}
   Priority: ${task.priority}
   Due Date: ${format(parseISO(task.task_date), 'PPP')}
   Department: ${task.department}
   Role: ${task.role}
   Description: ${task.description}
`).join('\n')}
    `;
    
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `professional-tasks-report-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadMenuAnchor(null);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (showSetupForm) {
    // Profile Setup Form
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, borderRadius: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <WorkIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
              Professional Profile Setup
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Tell us about your professional background
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Department"
              value={profileInfo.department}
              onChange={(e) => setProfileInfo({...profileInfo, department: e.target.value})}
              fullWidth
              required
              placeholder="e.g. Engineering, Marketing, Sales"
            />
            <TextField
              label="Role"
              value={profileInfo.role}
              onChange={(e) => setProfileInfo({...profileInfo, role: e.target.value})}
              fullWidth
              required
              placeholder="e.g. Software Engineer, Manager, Designer"
            />
            <TextField
              label="Responsibilities"
              value={profileInfo.responsibilities}
              onChange={(e) => setProfileInfo({...profileInfo, responsibilities: e.target.value})}
              fullWidth
              multiline
              rows={4}
              required
              placeholder="Describe your key responsibilities..."
            />
            <TextField
              label="Experience"
              value={profileInfo.experience}
              onChange={(e) => setProfileInfo({...profileInfo, experience: e.target.value})}
              fullWidth
              multiline
              rows={3}
              required
              placeholder="Years of experience and background..."
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
              <Button 
                variant="outlined" 
                onClick={() => router.push('/dashboard')}
                disabled={loading}
              >
                Skip for Now
              </Button>
              <Button 
                variant="contained" 
                onClick={handleProfileSetup}
                disabled={loading || !profileInfo.department || !profileInfo.role || !profileInfo.responsibilities || !profileInfo.experience}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Saving...' : 'Save Profile'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    );
  }
  
  // Main Professional Dashboard
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        {/* Header */}
        <Box
          sx={{
            p: { xs: 2, md: 4 },
            mb: 4,
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            position: 'relative',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, md: 3 } }}>
              <IconButton
                edge="start"
                onClick={handleGoBack}
                sx={{
                  borderRadius: 3,
                  bgcolor: 'action.hover',
                  '&:hover': { bgcolor: 'action.selected' }
                }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Box 
                sx={{ 
                  width: { xs: 48, md: 64 }, 
                  height: { xs: 48, md: 64 }, 
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(255, 152, 0, 0.35)'
                }}
              >
                <WorkIcon sx={{ fontSize: { xs: 24, md: 32 }, color: 'white' }} />
              </Box>
              <Box>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 800, 
                    mb: 0.5,
                    fontSize: { xs: '1.5rem', md: '2.125rem' },
                    background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    lineHeight: 1.2
                  }}
                >
                  Professional Dashboard
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: 'text.secondary',
                    fontSize: { xs: '0.875rem', md: '1rem' },
                    fontWeight: 500
                  }}
                >
                  {profileInfo.role}, {profileInfo.department}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, opacity: 0.7 }}>
                  {profileInfo.experience}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: { xs: 1, md: 2 }, flexDirection: { xs: 'column', sm: 'row' } }}>
              <Button
                variant="outlined"
                onClick={() => setShowAnalytics(true)}
                startIcon={<BarChartIcon />}
                sx={{ 
                  borderRadius: 3, 
                  textTransform: 'none',
                  borderColor: 'divider',
                  color: 'text.primary',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    borderColor: 'primary.main'
                  }
                }}
              >
                Analytics
              </Button>
              <Button
                variant="outlined"
                onClick={() => setShowSetupForm(true)}
                sx={{ 
                  borderRadius: 3, 
                  textTransform: 'none',
                  borderColor: 'divider',
                  color: 'text.primary',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    borderColor: 'primary.main'
                  }
                }}
              >
                Edit Profile
              </Button>
              <Button
                variant="contained"
                onClick={logout}
                sx={{ 
                  background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
                  color: 'white', 
                  '&:hover': { 
                    background: 'linear-gradient(135deg, #FB8C00 0%, #EF6C00 100%)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 6px 20px rgba(255, 152, 0, 0.45)'
                  }, 
                  textTransform: 'none',
                  borderRadius: 3,
                  transition: 'all 0.3s ease'
                }}
              >
                Logout
              </Button>
            </Box>
          </Box>
        </Box>

        <Container maxWidth="xl">
          <Grid container spacing={4}>
            {/* Profile Summary Card */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card 
                sx={{ 
                  borderRadius: 3, 
                  border: '1px solid rgba(0,0,0,0.08)', 
                  mb: 3,
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 30px rgba(102, 126, 234, 0.15)'
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
                      }}
                    >
                      <WorkIcon sx={{ fontSize: 28, color: 'white' }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        Profile Summary
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Professional Overview
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box 
                        sx={{ 
                          width: 32, 
                          height: 32, 
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <BusinessIcon sx={{ fontSize: 16, color: '#3b82f6' }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Role
                        </Typography>
                        <Typography variant="body1" color="text.primary" sx={{ fontWeight: 600 }}>
                          {profileInfo.role}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box 
                        sx={{ 
                          width: 32, 
                          height: 32, 
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <BusinessIcon sx={{ fontSize: 16, color: '#10b981' }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Department
                        </Typography>
                        <Typography variant="body1" color="text.primary" sx={{ fontWeight: 600 }}>
                          {profileInfo.department}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box 
                        sx={{ 
                          width: 32, 
                          height: 32, 
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <SchoolIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Experience
                        </Typography>
                        <Typography variant="body1" color="text.primary" sx={{ fontWeight: 600 }}>
                          {profileInfo.experience}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  <Box sx={{ mt: 3, p: 2.5, background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)', borderRadius: 3, border: '1px solid rgba(102, 126, 234, 0.1)' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>
                      Responsibilities
                    </Typography>
                    <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.6 }}>
                      {profileInfo.responsibilities}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
              
              {/* Stats Cards */}
              <Grid container spacing={2}>
                <Grid size={6}>
                  <Card 
                    sx={{ 
                      borderRadius: 3, 
                      textAlign: 'center', 
                      p: 2.5,
                      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)',
                      border: '1px solid rgba(245, 158, 11, 0.2)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 30px rgba(245, 158, 11, 0.15)'
                      }
                    }}
                  >
                    <Box sx={{ mb: 2 }}>
                      <Box 
                        sx={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: 3,
                          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                        }}
                      >
                        <TrendingUpIcon sx={{ fontSize: 20, color: 'white' }} />
                      </Box>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#f59e0b', mb: 0.5 }}>
                      {tasks.filter(t => t.status === 'pending').length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                      Pending Tasks
                    </Typography>
                  </Card>
                </Grid>
                <Grid size={6}>
                  <Card 
                    sx={{ 
                      borderRadius: 3, 
                      textAlign: 'center', 
                      p: 2.5,
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 30px rgba(16, 185, 129, 0.15)'
                      }
                    }}
                  >
                    <Box sx={{ mb: 2 }}>
                      <Box 
                        sx={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: 3,
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        <CheckCircleIcon sx={{ fontSize: 20, color: 'white' }} />
                      </Box>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#10b981', mb: 0.5 }}>
                      {tasks.filter(t => t.status === 'completed').length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                      Completed
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            </Grid>

            {/* Tasks Section */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
                    Daily Tasks
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Manage your professional tasks efficiently
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Button
                    variant="outlined"
                    startIcon={<FilterListIcon />}
                    onClick={() => setFilterMode(filterMode === 'default' ? 'monthYear' : 'default')}
                    sx={{ 
                      borderRadius: 3, 
                      textTransform: 'none',
                      bgcolor: filterMode === 'monthYear' ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                      borderColor: filterMode === 'monthYear' ? theme.palette.primary.main : 'rgba(0,0,0,0.23)',
                      color: filterMode === 'monthYear' ? theme.palette.primary.main : 'text.primary',
                    }}
                  >
                    {filterMode === 'default' ? 'Month/Year Filter' : format(selectedMonth, 'MMMM yyyy')}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={(e) => setDownloadMenuAnchor(e.currentTarget)}
                    sx={{ 
                      borderRadius: 3, 
                      textTransform: 'none',
                    }}
                  >
                    Download
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setShowTaskForm(true)}
                    sx={{ 
                      borderRadius: 3, 
                      px: 3,
                      py: 1.5,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 30px rgba(102, 126, 234, 0.4)'
                      },
                      transition: 'all 0.3s ease',
                      textTransform: 'none',
                      fontWeight: 600
                    }}
                  >
                    Add Task
                  </Button>
                </Box>
              </Box>
              
              {/* Month/Year Filter */}
              {filterMode === 'monthYear' && (
                <Paper 
                  sx={{ 
                    mb: 3, 
                    p: 2,
                    borderRadius: 3,
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    border: '1px solid rgba(0,0,0,0.08)',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Filter by:
                    </Typography>
                    <DatePicker
                      label="Select Month"
                      views={['month', 'year']}
                      value={selectedMonth}
                      onChange={(newValue) => {
                        if (newValue) {
                          setSelectedMonth(newValue);
                          setSelectedYear(newValue);
                        }
                      }}
                      sx={{ minWidth: 200 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {getFilteredTasks().length} tasks found
                    </Typography>
                  </Box>
                </Paper>
              )}
              
              {/* Tabs for filtering tasks */}
              {filterMode === 'default' && (
                <Box sx={{ 
                  mb: 3, 
                  bgcolor: 'background.paper',
                  borderRadius: 3,
                  border: '1px solid rgba(0,0,0,0.08)',
                  p: 1
                }}>
                  <Tabs 
                    value={tabValue} 
                    onChange={(e, newValue) => setTabValue(newValue)} 
                    sx={{
                      '& .MuiTabs-indicator': {
                        display: 'none'
                      },
                      '& .MuiTab-root': {
                        textTransform: 'none',
                        fontWeight: 600,
                        color: 'text.secondary',
                        borderRadius: 2,
                        minHeight: 48,
                        px: 3,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: 'action.hover'
                        },
                        '&.Mui-selected': {
                          color: 'primary.main',
                          bgcolor: 'primary.light',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }
                      }
                    }}
                  >
                    <Tab label="Today" />
                    <Tab label="Tomorrow" />
                    <Tab label="This Week" />
                    <Tab label="All" />
                  </Tabs>
                </Box>
              )}
              
              {/* Task List */}
              <List sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {getFilteredTasks().length === 0 ? (
                  <Paper 
                    sx={{ 
                      p: 8, 
                      textAlign: 'center', 
                      bgcolor: alpha(theme.palette.background.default, 0.5),
                      borderRadius: 4, 
                      border: '2px dashed rgba(0,0,0,0.1)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        width: 80,
                        height: 80,
                        mx: 'auto',
                        mb: 2,
                      }}
                    >
                      <AssignmentIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                    </Avatar>
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                      No tasks found for this period
                    </Typography>
                    <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
                      Start by creating your first professional task
                    </Typography>
                    <Button 
                      variant="outlined" 
                      onClick={() => setShowTaskForm(true)}
                      startIcon={<AddIcon />}
                      sx={{ borderRadius: 3 }}
                    >
                      Create your first task
                    </Button>
                  </Paper>
                ) : (
                  getFilteredTasks().map((task) => (
                    <Card 
                      key={task.id} 
                      sx={{ 
                        borderRadius: 3, 
                        transition: 'all 0.3s ease',
                        border: '1px solid rgba(0,0,0,0.08)',
                        borderLeft: `4px solid ${
                          task.priority === 'High' 
                            ? '#ef4444'
                            : task.priority === 'Medium' 
                            ? '#f59e0b' 
                            : '#3b82f6'
                        }`,
                        background: task.status === 'completed' 
                          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)'
                          : 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(10px)',
                        '&:hover': { 
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                          borderColor: 'rgba(102, 126, 234, 0.2)',
                        }
                      }}
                    >
                      <ListItem
                        secondaryAction={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: task.priority === 'High' 
                                  ? '#ef4444'
                                  : task.priority === 'Medium' 
                                  ? '#f59e0b' 
                                  : '#3b82f6',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                              }}
                            />
                            <IconButton 
                              size="small" 
                              onClick={() => openRescheduleDialog(task)}
                              sx={{
                                bgcolor: 'rgba(102, 126, 234, 0.1)',
                                color: '#667eea',
                                '&:hover': {
                                  bgcolor: 'rgba(102, 126, 234, 0.2)',
                                  transform: 'scale(1.1)'
                                },
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <DateRangeIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteTask(task.id)}
                              sx={{
                                bgcolor: 'rgba(239, 68, 68, 0.1)',
                                color: '#ef4444',
                                '&:hover': {
                                  bgcolor: 'rgba(239, 68, 68, 0.2)',
                                  transform: 'scale(1.1)'
                                },
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        }
                        disablePadding
                      >
                        <ListItemText
                          sx={{ p: 2.5 }}
                          primaryTypographyProps={{ component: 'div' }}
                          secondaryTypographyProps={{ component: 'div' }}
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <IconButton
                                size="small"
                                onClick={() => toggleTaskStatus(task)}
                                sx={{ 
                                  color: task.status === 'completed' ? '#10b981' : 'text.disabled',
                                  bgcolor: task.status === 'completed' 
                                    ? 'rgba(16, 185, 129, 0.1)'
                                    : 'rgba(0, 0, 0, 0.05)',
                                  '&:hover': {
                                    bgcolor: task.status === 'completed'
                                      ? 'rgba(16, 185, 129, 0.2)'
                                      : 'rgba(0, 0, 0, 0.1)',
                                    transform: 'scale(1.1)'
                                  },
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                {task.status === 'completed' ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
                              </IconButton>
                              <Typography
                                variant="h6"
                                sx={{
                                  fontWeight: 700,
                                  textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                                  color: task.status === 'completed' ? 'text.secondary' : 'text.primary',
                                  lineHeight: 1.3
                                }}
                              >
                                {task.title}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 1.5, ml: 5 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.6 }}>
                                {task.description}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <CalendarIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                                  <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600 }}>
                                    {format(parseISO(task.task_date), 'MMM d, yyyy')}
                                  </Typography>
                                </Box>
                                {task.scheduled_for && task.scheduled_for !== task.task_date && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <EventIcon sx={{ fontSize: 16, color: '#667eea' }} />
                                    <Typography variant="caption" sx={{ color: '#667eea', fontWeight: 600 }}>
                                      Rescheduled to {format(parseISO(task.scheduled_for), 'MMM d')}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                    </Card>
                  ))
                )}
              </List>
            </Grid>
          </Grid>
        </Container>

        {/* Add Task Dialog */}
        <Dialog open={showTaskForm} onClose={() => setShowTaskForm(false)} fullWidth maxWidth="md" sx={{ '& .MuiDialog-paper': { maxHeight: '80vh', borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 800, px: 4, pt: 4, pb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box 
                sx={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
                }}
              >
                <AddIcon sx={{ fontSize: 24, color: 'white' }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  Create New Task
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Add a new professional task to your dashboard
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ px: 4, py: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, overflow: 'auto', maxHeight: 'calc(80vh - 200px)' }}>
              <TextField
                label="Task Title"
                fullWidth
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="e.g. Team meeting, Project review"
                required
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    '&:hover fieldset': {
                      borderColor: 'rgba(102, 126, 234, 0.5)'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#667eea',
                      boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)'
                    }
                  }
                }}
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={4}
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Describe the task..."
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    '&:hover fieldset': {
                      borderColor: 'rgba(102, 126, 234, 0.5)'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#667eea',
                      boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)'
                    }
                  }
                }}
              />
              <Grid container spacing={3}>
                <Grid size={6}>
                  <FormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={newTask.priority}
                      label="Priority"
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(102, 126, 234, 0.5)'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#667eea',
                            boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)'
                          }
                        }
                      }}
                    >
                      <MenuItem value="Low">Low</MenuItem>
                      <MenuItem value="Medium">Medium</MenuItem>
                      <MenuItem value="High">High</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={6}>
                  <DatePicker
                    label="Due Date"
                    value={parseISO(newTask.task_date)}
                    onChange={(newValue: Date | null) => setNewTask({
                      ...newTask,
                      task_date: newValue ? format(newValue, 'yyyy-MM-dd') : newTask.task_date
                    })}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        '&:hover fieldset': {
                          borderColor: 'rgba(102, 126, 234, 0.5)'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#667eea',
                          boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)'
                        }
                      }
                    }}
                  />
                </Grid>
              </Grid>
              
              {/* Alarm Controls */}
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
                  Alarm Settings
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={alarmEnabled}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAlarmEnabled(e.target.checked)}
                      />
                    }
                    label="Enable Alarm"
                    sx={{ mr: 2 }}
                  />
                  <TextField
                    label="Alarm Time"
                    type="datetime-local"
                    fullWidth
                    value={alarmTime}
                    onChange={(e) => setAlarmTime(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    disabled={!alarmEnabled}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        '&:hover fieldset': {
                          borderColor: 'rgba(102, 126, 234, 0.5)'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#667eea',
                          boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)'
                        }
                      }
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 4, py: 3, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
            <Button 
              onClick={() => {
                setShowTaskForm(false);
                setAlarmEnabled(false);
                setAlarmTime('');
              }} 
              sx={{ 
                fontWeight: 600, 
                borderRadius: 3,
                borderColor: 'divider',
                color: 'text.primary',
                '&:hover': {
                  bgcolor: 'action.hover',
                  borderColor: 'primary.main'
                }
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateTask}
              disabled={!newTask.title}
              sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 3, 
                px: 4, 
                fontWeight: 700,
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              Create Task
            </Button>
          </DialogActions>
        </Dialog>

        {/* Reschedule Task Dialog */}
        <Dialog open={rescheduleDialogOpen} onClose={() => setRescheduleDialogOpen(false)} fullWidth maxWidth="sm" sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 800, px: 4, pt: 4, pb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box 
                sx={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
                }}
              >
                <DateRangeIcon sx={{ fontSize: 24, color: 'white' }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  Reschedule Task
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Select a new date for "{taskToReschedule?.title}"
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ px: 4, py: 3 }}>
            <DatePicker
              label="New Date"
              value={newDate}
              onChange={(newValue: Date | null) => setNewDate(newValue)}
              minDate={new Date()}
              sx={{ 
                width: '100%',
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  '&:hover fieldset': {
                    borderColor: 'rgba(102, 126, 234, 0.5)'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#667eea',
                    boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)'
                  }
                }
              }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 4, py: 3, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
            <Button 
              onClick={() => setRescheduleDialogOpen(false)} 
              sx={{ 
                fontWeight: 600, 
                borderRadius: 3,
                borderColor: 'divider',
                color: 'text.primary',
                '&:hover': {
                  bgcolor: 'action.hover',
                  borderColor: 'primary.main'
                }
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleRescheduleTask}
              disabled={!newDate}
              sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 3, 
                px: 4, 
                fontWeight: 700,
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              Reschedule
            </Button>
          </DialogActions>
        </Dialog>

        {/* Analytics Dialog */}
        <Dialog 
          open={showAnalytics} 
          onClose={() => setShowAnalytics(false)} 
          fullWidth 
          maxWidth="lg"
          sx={{ '& .MuiDialog-paper': { borderRadius: 3, maxHeight: '90vh' } }}
        >
          <DialogTitle 
            sx={{ 
              fontWeight: 800, 
              px: 4, 
              pt: 4,
              pb: 2,
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
              borderBottom: '1px solid rgba(0,0,0,0.08)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box 
                sx={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
                }}
              >
                <AssessmentIcon sx={{ fontSize: 24, color: 'white' }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  Professional Task Analytics
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Comprehensive insights into your task performance
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ px: 4, py: 3 }}>
            {(() => {
              const analytics = getAnalyticsData();
              return (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Overview Cards */}
                  <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Card 
                        sx={{ 
                          p: 3,
                          textAlign: 'center',
                          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                          border: '1px solid rgba(102, 126, 234, 0.2)',
                          borderRadius: 3,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 8px 30px rgba(102, 126, 234, 0.15)'
                          }
                        }}
                      >
                        <Box 
                          sx={{ 
                            width: 48, 
                            height: 48, 
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: 2,
                            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
                          }}
                        >
                          <AssignmentIcon sx={{ fontSize: 24, color: 'white' }} />
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 800, color: '#667eea', mb: 1 }}>
                          {analytics.totalTasks}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                          Total Tasks
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Card 
                        sx={{ 
                          p: 3,
                          textAlign: 'center',
                          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                          borderRadius: 3,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 8px 30px rgba(16, 185, 129, 0.15)'
                          }
                        }}
                      >
                        <Box 
                          sx={{ 
                            width: 48, 
                            height: 48, 
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: 2,
                            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
                          }}
                        >
                          <CheckCircleIcon sx={{ fontSize: 24, color: 'white' }} />
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 800, color: '#10b981', mb: 1 }}>
                          {analytics.completedTasks}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                          Completed
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Card 
                        sx={{ 
                          p: 3,
                          textAlign: 'center',
                          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)',
                          border: '1px solid rgba(245, 158, 11, 0.2)',
                          borderRadius: 3,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 8px 30px rgba(245, 158, 11, 0.15)'
                          }
                        }}
                      >
                        <Box 
                          sx={{ 
                            width: 48, 
                            height: 48, 
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: 2,
                            boxShadow: '0 4px 20px rgba(245, 158, 11, 0.3)'
                          }}
                        >
                          <TrendingUpIcon sx={{ fontSize: 24, color: 'white' }} />
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 800, color: '#f59e0b', mb: 1 }}>
                          {analytics.completionRate}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                          Completion Rate
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Card 
                        sx={{ 
                          p: 3,
                          textAlign: 'center',
                          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)',
                          border: '1px solid rgba(59, 130, 246, 0.2)',
                          borderRadius: 3,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 8px 30px rgba(59, 130, 246, 0.15)'
                          }
                        }}
                      >
                        <Box 
                          sx={{ 
                            width: 48, 
                            height: 48, 
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: 2,
                            boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)'
                          }}
                        >
                          <TimelineIcon sx={{ fontSize: 24, color: 'white' }} />
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 800, color: '#3b82f6', mb: 1 }}>
                          {analytics.thisWeekTasks}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                          This Week
                        </Typography>
                      </Card>
                    </Grid>
                  </Grid>

                  {/* Priority Distribution */}
                  <Card sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PieChartIcon color="primary" />
                      Priority Distribution
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {Object.entries(analytics.priorityData).map(([priority, count]) => {
                        const percentage = analytics.totalTasks > 0 ? (count / analytics.totalTasks) * 100 : 0;
                        const color = priority === 'High' ? 'error' : priority === 'Medium' ? 'warning' : 'info';
                        return (
                          <Box key={priority}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {priority} Priority
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {count} tasks ({percentage.toFixed(1)}%)
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={percentage} 
                              color={color as any}
                              sx={{ 
                                height: 8, 
                                borderRadius: 4,
                                bgcolor: alpha(theme.palette.background.default, 0.5),
                              }}
                            />
                          </Box>
                        );
                      })}
                    </Box>
                  </Card>

                  {/* Status Overview */}
                  <Card sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BarChartIcon color="primary" />
                      Status Overview
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={4}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.success.main, 0.1), borderRadius: 2 }}>
                          <Typography variant="h5" color="success.main" sx={{ fontWeight: 800 }}>
                            {analytics.statusData.completed}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            Completed
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={4}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.warning.main, 0.1), borderRadius: 2 }}>
                          <Typography variant="h5" color="warning.main" sx={{ fontWeight: 800 }}>
                            {analytics.statusData.pending}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            Pending
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={4}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.info.main, 0.1), borderRadius: 2 }}>
                          <Typography variant="h5" color="info.main" sx={{ fontWeight: 800 }}>
                            {analytics.statusData.rescheduled}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            Rescheduled
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Card>

                  {/* Weekly Progress */}
                  <Card sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUpIcon color="primary" />
                      Weekly Progress
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          Completed this week
                        </Typography>
                        <Typography variant="h5" color="success.main" sx={{ fontWeight: 800 }}>
                          {analytics.completedThisWeek}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          vs Last Week
                        </Typography>
                        <Typography 
                          variant="h5" 
                          sx={{ 
                            fontWeight: 800,
                            color: parseFloat(analytics.weeklyProgress) >= 0 ? 'success.main' : 'error.main'
                          }}
                        >
                          {parseFloat(analytics.weeklyProgress) >= 0 ? '+' : ''}{analytics.weeklyProgress}%
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          Completed last week
                        </Typography>
                        <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 800 }}>
                          {analytics.completedLastWeek}
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Box>
              );
            })()}
          </DialogContent>
          <DialogActions sx={{ p: 4, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
            <Button 
              onClick={() => setShowAnalytics(false)} 
              sx={{ fontWeight: 600, borderRadius: 3 }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Download Menu */}
        <Menu
          anchorEl={downloadMenuAnchor}
          open={Boolean(downloadMenuAnchor)}
          onClose={() => setDownloadMenuAnchor(null)}
          PaperProps={{
            sx: {
              borderRadius: 3,
              mt: 1,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }
          }}
        >
          <MenuItem onClick={downloadCSV} sx={{ borderRadius: 2 }}>
            <DownloadIcon sx={{ mr: 1, fontSize: 20 }} />
            Download as CSV
          </MenuItem>
          <MenuItem onClick={downloadPDF} sx={{ borderRadius: 2 }}>
            <DownloadIcon sx={{ mr: 1, fontSize: 20 }} />
            Download as Report (TXT)
          </MenuItem>
        </Menu>
      </Box>
    </LocalizationProvider>
  );
};

import { TimeEngineProvider } from '../../lib/time-engine';

export default function ProfessionalPage() {
  return (
    <ProtectedLayout>
      <TimeEngineProvider>
        <ProfessionalPageContent />
      </TimeEngineProvider>
    </ProtectedLayout>
  );
}