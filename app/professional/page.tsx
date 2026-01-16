'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
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
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Fab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Business as BusinessIcon,
  Settings as SettingsIcon,
  SupportAgent as SupportAgentIcon,
  Group as GroupIcon,
  MonetizationOn as MonetizationOnIcon,
  CorporateFare as CorporateFareIcon,
  School as SchoolIcon,
  LaptopMac as LaptopMacIcon,
  Add as AddIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Delete as DeleteIcon,
  EventNote as EventNoteIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  Timer as TimerIcon,
  MenuBook as BookIcon,
  Stars as StarsIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { addCalendarEntry, getCalendarEntries, deleteCalendarEntry, updateCalendarEntry, CalendarEntry } from '../../lib/personal-calendar-db';
import { getProfessionalRole, saveProfessionalRole, ProfessionalRole } from '../../lib/professional-db';

// Role Definitions
const PROFESSIONAL_ROLES = [
  { id: 'executive', label: 'Executive', icon: <BusinessIcon />, color: '#1a237e', description: 'Lead and strategize company goals.' },
  { id: 'operation', label: 'Operation', icon: <SettingsIcon />, color: '#004d40', description: 'Manage daily business processes.' },
  { id: 'assistant', label: 'Assistant', icon: <SupportAgentIcon />, color: '#4a148c', description: 'Provide essential support and coordination.' },
  { id: 'manager', label: 'Manager', icon: <GroupIcon />, color: '#e65100', description: 'Oversee teams and project delivery.' },
  { id: 'ceo', label: 'CEO', icon: <MonetizationOnIcon />, color: '#212121', description: 'Highest-ranking officer in the organization.' },
  { id: 'managing_director', label: 'Managing Director', icon: <CorporateFareIcon />, color: '#b71c1c', description: 'Oversee overall business operations.' },
  { id: 'student', label: 'Student', icon: <SchoolIcon />, color: '#01579b', description: 'Focus on exams, schedules, and topic tracking.' },
  { id: 'freelancer', label: 'Freelancer', icon: <LaptopMacIcon />, color: '#006064', description: 'Manage independent projects and clients.' },
];

const ProfessionalPageContent = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isOtherRole, setIsOtherRole] = useState(false);
  const [otherRoleName, setOtherRoleName] = useState('');
  const [tasks, setTasks] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [openTaskDialog, setOpenTaskDialog] = useState(false);

  // Professional Setup State
  const [activeStep, setActiveStep] = useState(0);
  const [profConfig, setProfConfig] = useState<Partial<ProfessionalRole>>({
    experience: '',
    responsibilities: '',
    schedule: [],
  });
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newItem, setNewItem] = useState({ time: '09:00 AM', task: '', duration: '1 hour' });

  // New Task State
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm'),
    isExam: false,
    topic: '',
  });

  // Load persistence and professional config
  useEffect(() => {
    const init = async () => {
      if (!user) return;

      const savedRole = localStorage.getItem('professionalRole');
      const config = await getProfessionalRole(user.id);

      if (config) {
        setProfConfig(config);
        setSelectedRole(config.role_name);
      } else if (savedRole) {
        setSelectedRole(savedRole);
      }

      setLoading(false);
    };
    init();
  }, [user]);

  // Fetch Tasks
  useEffect(() => {
    if (user && selectedRole) {
      fetchProfessionalTasks();
    }
  }, [user, selectedRole]);

  const fetchProfessionalTasks = async () => {
    if (!user) return;
    const allEntries = await getCalendarEntries(user.id);
    const profTasks = allEntries.filter(entry => entry.category === 'professional');
    setTasks(profTasks);
  };

  const handleRoleSelect = (roleId: string) => {
    if (roleId === 'other') {
      setIsOtherRole(true);
    } else {
      const role = PROFESSIONAL_ROLES.find(r => r.id === roleId);
      const roleName = role ? role.label : roleId;
      setSelectedRole(roleName);
      setIsSettingUp(true);
      setActiveStep(0);
    }
  };

  const handleOtherRoleSubmit = () => {
    if (otherRoleName.trim()) {
      setSelectedRole(otherRoleName);
      localStorage.setItem('professionalRole', otherRoleName);
      setIsOtherRole(false);
      setIsSettingUp(true);
      setActiveStep(0);
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !selectedRole) return;
    setIsGenerating(true);

    const newConfig: Omit<ProfessionalRole, 'id' | 'created_at' | 'updated_at'> = {
      user_id: user.id,
      role_name: selectedRole,
      experience: profConfig.experience || '',
      responsibilities: profConfig.responsibilities || '',
      schedule: profConfig.schedule || []
    };

    const saved = await saveProfessionalRole(newConfig);
    if (saved) {
      setProfConfig(saved);
      setIsSettingUp(false);
      localStorage.setItem('professionalRole', selectedRole);
      fetchProfessionalTasks();
    }
    setIsGenerating(false);
  };

  const addScheduleItem = () => {
    if (!newItem.task) return;
    const updatedSchedule = [...(profConfig.schedule || []), newItem];
    setProfConfig({ ...profConfig, schedule: updatedSchedule });
    setNewItem({ time: '09:00 AM', task: '', duration: '1 hour' });
  };

  const removeScheduleItem = (index: number) => {
    const updatedSchedule = [...(profConfig.schedule || [])];
    updatedSchedule.splice(index, 1);
    setProfConfig({ ...profConfig, schedule: updatedSchedule });
  };

  const resetRole = () => {
    setSelectedRole(null);
    setProfConfig({ experience: '', responsibilities: '' });
    localStorage.removeItem('professionalRole');
    setIsSettingUp(false);
  };

  const handleAddTask = async () => {
    if (!user || !newTask.title) return;

    const entryDateTime = new Date(`${newTask.date}T${newTask.time}`);
    const entryData = {
      user_id: user.id,
      title: newTask.title,
      category: 'professional',
      entry_date: entryDateTime.toISOString(),
      description: newTask.description,
      priority: newTask.priority,
      status: 'pending',
      category_data: {
        role: selectedRole,
        isExam: newTask.isExam,
        topic: newTask.topic,
      }
    };

    const added = await addCalendarEntry(entryData);
    if (added) {
      setTasks(prev => [...prev, added]);
      setOpenTaskDialog(false);
      setNewTask({
        title: '',
        description: '',
        priority: 'Medium',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: format(new Date(), 'HH:mm'),
        isExam: false,
        topic: '',
      });
    }
  };

  const toggleTaskStatus = async (task: CalendarEntry) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    const success = await updateCalendarEntry(task.id, { status: newStatus });
    if (success) {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    }
  };

  const handleDeleteTask = async (id: string) => {
    const success = await deleteCalendarEntry(id);
    if (success) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Role Selection Screen
  if (!selectedRole && !isSettingUp) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main', mb: 2 }}>
            Choose Your Professional Role
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Tailor your professional dashboard to your specific needs.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {PROFESSIONAL_ROLES.map((role) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={role.id}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
                    borderColor: role.color
                  },
                  border: '2px solid transparent',
                  borderRadius: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}
                onClick={() => handleRoleSelect(role.id)}
              >
                <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', bgcolor: `${role.color}10` }}>
                  <Box sx={{ color: role.color, '& svg': { fontSize: 48 } }}>
                    {role.icon}
                  </Box>
                </Box>
                <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    {role.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {role.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* Other Role Card */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                },
                border: '2px dashed #999',
                borderRadius: 4,
                display: 'flex',
                flexDirection: 'column'
              }}
              onClick={() => handleRoleSelect('other')}
            >
              <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', flexGrow: 1, alignItems: 'center', bgcolor: 'rgba(0,0,0,0.02)' }}>
                <AddIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
              </Box>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Other
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create a custom role name.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Other Role Dialog */}
        <Dialog open={isOtherRole} onClose={() => setIsOtherRole(false)}>
          <DialogTitle>Enter Custom Role</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Role Name"
              fullWidth
              variant="outlined"
              value={otherRoleName}
              onChange={(e) => setOtherRoleName(e.target.value)}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setIsOtherRole(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleOtherRoleSubmit}>Confirm</Button>
          </DialogActions>
        </Dialog>
      </Container>
    );
  }

  // Role Setup View
  if (isSettingUp) {
    const steps = ['Details', 'Responsibilities', 'Process'];

    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, borderRadius: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, textAlign: 'center' }}>
            Setup Your {selectedRole} Profile
          </Typography>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>Tell us about your experience</Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Experience in this role"
                placeholder="e.g. 5 years in corporate management, focusing on..."
                value={profConfig.experience}
                onChange={(e) => setProfConfig({ ...profConfig, experience: e.target.value })}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button variant="contained" onClick={() => setActiveStep(1)}>Next</Button>
              </Box>
            </Box>
          )}

          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>What are your key responsibilities?</Typography>
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Roles and Responsibilities"
                placeholder="e.g. Managing team of 10, overseeing quarterly reports, client acquisition..."
                value={profConfig.responsibilities}
                onChange={(e) => setProfConfig({ ...profConfig, responsibilities: e.target.value })}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button onClick={() => setActiveStep(0)}>Back</Button>
                <Button variant="contained" onClick={() => setActiveStep(2)}>Next</Button>
              </Box>
            </Box>
          )}

          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>Define Your Job Schedule</Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={3}>
                  <TextField
                    fullWidth
                    label="Time"
                    value={newItem.time}
                    onChange={(e) => setNewItem({ ...newItem, time: e.target.value })}
                    placeholder="e.g. 09:00 AM"
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Task"
                    value={newItem.task}
                    onChange={(e) => setNewItem({ ...newItem, task: e.target.value })}
                    placeholder="e.g. Morning Standup"
                  />
                </Grid>
                <Grid size={3}>
                  <Button fullWidth variant="outlined" startIcon={<AddIcon />} onClick={addScheduleItem} sx={{ height: '56px' }}>
                    Add
                  </Button>
                </Grid>
              </Grid>

              <List sx={{ maxHeight: 300, overflow: 'auto', bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2 }}>
                {profConfig.schedule?.map((item: any, idx: number) => (
                  <ListItem key={idx} secondaryAction={
                    <IconButton size="small" onClick={() => removeScheduleItem(idx)} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }>
                    <ListItemText primary={item.task} secondary={item.time} />
                  </ListItem>
                ))}
                {(!profConfig.schedule || profConfig.schedule.length === 0) && (
                  <ListItem><ListItemText secondary="No schedule items added yet." /></ListItem>
                )}
              </List>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button onClick={() => setActiveStep(1)}>Back</Button>
                <Button
                  variant="contained"
                  onClick={handleSaveProfile}
                  disabled={isGenerating}
                  startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {isGenerating ? 'Saving...' : 'Complete Setup'}
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      </Container>
    );
  }

  // Main Dashboard UI
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
          color: 'white',
          borderRadius: { xs: 0, md: 4 },
          mx: { xs: 0, md: 2 },
          mt: { xs: 0, md: 2 }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => router.back()} sx={{ color: 'white' }}>
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                {selectedRole} Dashboard
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {profConfig.experience ? `Experience: ${profConfig.experience}` : 'Organize and track your professional milestones'}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={resetRole}
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', textTransform: 'none' }}
            >
              Change Role
            </Button>
            <Button
              variant="contained"
              onClick={logout}
              sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }, textTransform: 'none' }}
            >
              Logout
            </Button>
          </Box>
        </Box>
      </Paper>

      <Container maxWidth="xl">
        <Grid container spacing={4}>
          {/* Stats Section */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Job Schedule Card */}
              {profConfig.schedule && (
                <Card sx={{ borderRadius: 4, border: '1px solid rgba(0,0,0,0.1)' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ScheduleIcon color="primary" /> Job Schedule
                      </Typography>
                      <IconButton size="small" onClick={() => setIsSettingUp(true)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <List dense>
                      {profConfig.schedule.map((item: any, idx: number) => (
                        <React.Fragment key={idx}>
                          <ListItem sx={{ px: 0 }}>
                            <ListItemText
                              primary={item.task}
                              secondary={`${item.time} • ${item.duration || ''}`}
                              primaryTypographyProps={{ fontWeight: 600 }}
                            />
                          </ListItem>
                          {idx < profConfig.schedule.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              )}

              <Card sx={{ borderRadius: 4, p: 1 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon color="primary" /> Overview
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-around', py: 2 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary" sx={{ fontWeight: 800 }}>{tasks.length}</Typography>
                      <Typography variant="caption" color="text.secondary">Total Tasks</Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem />
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main" sx={{ fontWeight: 800 }}>
                        {tasks.filter(t => t.status === 'completed').length}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Completed</Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem />
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main" sx={{ fontWeight: 800 }}>
                        {tasks.filter(t => t.status === 'pending').length}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Pending</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Special Context for Student */}
              {selectedRole?.toLowerCase() === 'student' && (
                <Card sx={{ borderRadius: 4, bgcolor: 'primary.main', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TimerIcon /> Exam Focus Mode
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
                      Track topics, schedules, and prepare for your upcoming exams.
                    </Typography>
                    <Button
                      variant="contained"
                      fullWidth
                      sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
                      onClick={() => {
                        setNewTask(prev => ({ ...prev, isExam: true }));
                        setOpenTaskDialog(true);
                      }}
                    >
                      New Exam Schedule
                    </Button>
                  </CardContent>
                </Card>
              )}
            </Box>
          </Grid>

          {/* Tasks Section */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                Project Tasks & Milestones
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenTaskDialog(true)}
                sx={{ borderRadius: 8, px: 3 }}
              >
                Add Task
              </Button>
            </Box>

            <List sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {tasks.length === 0 ? (
                <Box sx={{ p: 8, textAlign: 'center', bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 4, border: '1px dashed #ccc' }}>
                  <AssignmentIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography color="text.secondary">No tasks created for this role yet.</Typography>
                  <Button variant="text" sx={{ mt: 1 }} onClick={() => setOpenTaskDialog(true)}>Create your first task</Button>
                </Box>
              ) : (
                tasks.map((task) => (
                  <Card key={task.id} sx={{ borderRadius: 3, transition: '0.2s', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } }}>
                    <ListItem
                      secondaryAction={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={task.priority}
                            size="small"
                            color={task.priority === 'High' ? 'error' : task.priority === 'Medium' ? 'warning' : 'info'}
                            sx={{ fontWeight: 600 }}
                          />
                          <IconButton size="small" onClick={() => handleDeleteTask(task.id)}>
                            <DeleteIcon fontSize="small" color="error" />
                          </IconButton>
                        </Box>
                      }
                      disablePadding
                    >
                      <ListItemText
                        sx={{ p: 2 }}
                        primaryTypographyProps={{ component: 'div' }}
                        secondaryTypographyProps={{ component: 'div' }}
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => toggleTaskStatus(task)}
                              sx={{ color: task.status === 'completed' ? 'success.main' : 'text.disabled' }}
                            >
                              {task.status === 'completed' ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
                            </IconButton>
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 700,
                                textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                                color: task.status === 'completed' ? 'text.secondary' : 'text.primary'
                              }}
                            >
                              {task.title}
                            </Typography>
                            {task.category_data?.isExam && (
                              <Chip label="EXAM" size="small" variant="outlined" color="primary" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800 }} />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1, ml: 5 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {task.description}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <EventNoteIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                                <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600 }}>
                                  {format(new Date(task.entry_date), 'MMM d, h:mm a')}
                                </Typography>
                              </Box>
                              {task.category_data?.topic && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <BookIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                                  <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600 }}>
                                    {task.category_data.topic}
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
      <Dialog open={openTaskDialog} onClose={() => setOpenTaskDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800, px: 3, pt: 3 }}>
          {newTask.isExam ? 'New Exam Milestone' : 'Create Professional Task'}
        </DialogTitle>
        <DialogContent sx={{ px: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Task Title"
              fullWidth
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              placeholder={newTask.isExam ? 'e.g. Mathematics Midterm' : 'e.g. Quarterly Board Meeting'}
            />
            {selectedRole?.toLowerCase() === 'student' && (
              <TextField
                label="Topic / Subject"
                fullWidth
                value={newTask.topic}
                onChange={(e) => setNewTask({ ...newTask, topic: e.target.value })}
                placeholder="e.g. Algebra & Calculus"
              />
            )}
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            />
            <Grid container spacing={2}>
              <Grid size={6}>
                <TextField
                  label="Date"
                  type="date"
                  fullWidth
                  value={newTask.date}
                  onChange={(e) => setNewTask({ ...newTask, date: e.target.value })}
                  inputProps={{ min: format(new Date(), 'yyyy-MM-dd') }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  label="Time"
                  type="time"
                  fullWidth
                  value={newTask.time}
                  onChange={(e) => setNewTask({ ...newTask, time: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={newTask.priority}
                label="Priority"
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as string })}
              >
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenTaskDialog(false)} sx={{ fontWeight: 600 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddTask}
            disabled={!newTask.title}
            sx={{ borderRadius: 8, px: 4, fontWeight: 700 }}
          >
            Create Task
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default function ProfessionalPage() {
  return (
    <ProtectedLayout>
      <ProfessionalPageContent />
    </ProtectedLayout>
  );
}