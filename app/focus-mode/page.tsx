'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import ProtectedLayout from '../protected-layout';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  Paper,
  Alert,
  CircularProgress,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import TimerIcon from '@mui/icons-material/Timer';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  status: 'open' | 'completed';
  created_at: string;
}

function FocusModeContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [sessionType, setSessionType] = useState<'work' | 'break'>('work');
  const [showTaskSelector, setShowTaskSelector] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getUserId = async () => {
    if (!supabase) {
      console.error('Supabase client not available');
      return null;
    }
    
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id;
  };

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      if (sessionType === 'work') {
        setSessionType('break');
        setTimeLeft(5 * 60);
      } else {
        setSessionType('work');
        setTimeLeft(timerMinutes * 60);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, sessionType, timerMinutes]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      if (!supabase) {
        setError('Supabase client not available');
        return;
      }
      
      const userId = await getUserId();
      if (!userId) {
        setError('User not authenticated');
        return;
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      setError('Failed to load tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartFocus = () => {
    if (!selectedTask) {
      alert('Please select a task to focus on');
      return;
    }
    setIsFocused(true);
    setTimeLeft(timerMinutes * 60);
    setIsActive(true);
    setSessionType('work');
  };

  const handlePauseResume = () => {
    setIsActive(!isActive);
  };

  const handleStopFocus = () => {
    setIsFocused(false);
    setIsActive(false);
    setTimeLeft(0);
    setSessionType('work');
  };

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
    setShowTaskSelector(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <Typography>Loading tasks...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {!isFocused ? (
        <>
          <AppBar position="static" elevation={0} sx={{ bgcolor: 'primary.main', borderRadius: 2, mb: 3 }}>
            <Toolbar>
              <IconButton edge="start" color="inherit" onClick={() => router.push('/dashboard')} sx={{ mr: 2 }}>
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
                Focus Mode
              </Typography>
            </Toolbar>
          </AppBar>

          <Container maxWidth="md">
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Paper sx={{ p: 4, textAlign: 'center', mb: 3 }}>
              <TimerIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
                Focus Mode
              </Typography>
              <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                Concentrate on a single task without distractions
              </Typography>
            </Paper>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Select a Task to Focus On
                </Typography>

                {selectedTask ? (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{ color: 'primary.main' }}>
                      {selectedTask.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {selectedTask.description}
                    </Typography>
                    <Button onClick={() => setShowTaskSelector(true)} variant="outlined" sx={{ mt: 1 }}>
                      Change Task
                    </Button>
                  </Box>
                ) : (
                  <Button onClick={() => setShowTaskSelector(true)} variant="contained" sx={{ mb: 2 }}>
                    Select Task
                  </Button>
                )}

                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Focus Duration (minutes)
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 2 }}>
                  {[15, 25, 30, 45, 60].map(min => (
                    <Button
                      key={min}
                      variant={timerMinutes === min ? 'contained' : 'outlined'}
                      onClick={() => setTimerMinutes(min)}
                      sx={{ minWidth: 60 }}
                    >
                      {min}
                    </Button>
                  ))}
                </Box>

                <Button
                  variant="contained"
                  size="large"
                  startIcon={<PlayArrowIcon />}
                  onClick={handleStartFocus}
                  disabled={!selectedTask}
                  sx={{
                    py: 1.5,
                    px: 4,
                    fontSize: '1.2rem',
                    bgcolor: 'success.main',
                    '&:hover': { bgcolor: 'success.dark' }
                  }}
                  fullWidth
                >
                  Start Focus Session
                </Button>
              </CardContent>
            </Card>

            <Paper sx={{ p: 3, bgcolor: 'info.light' }}>
              <Typography variant="h6" gutterBottom>
                How Focus Mode Works
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • Select a task to focus on
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • Set your desired focus duration
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • Eliminate distractions and stay focused
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • Complete the task when timer finishes
              </Typography>
            </Paper>
          </Container>
        </>
      ) : (
        <Box sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: sessionType === 'work' ? 'primary.main' : 'secondary.main',
          color: 'white',
          p: 2,
          zIndex: 1300
        }}>
          <Box sx={{ textAlign: 'center', maxWidth: 600, width: '100%' }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              {sessionType === 'work' ? 'Focus Time!' : 'Break Time!'}
            </Typography>

            <Box sx={{ position: 'relative', display: 'inline-block', mb: 3 }}>
              <CircularProgress
                variant="determinate"
                value={100 - (timeLeft / (sessionType === 'work' ? timerMinutes * 60 : 5 * 60)) * 100}
                size={200}
                thickness={4}
                sx={{ color: 'rgba(255, 255, 255, 0.3)' }}
              />
              <Box sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Typography variant="h2" component="div" sx={{ color: 'white' }}>
                  {formatTime(timeLeft)}
                </Typography>
              </Box>
            </Box>

            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
              {selectedTask?.title}
            </Typography>

            <Typography variant="body1" sx={{ mb: 4, opacity: 0.9 }}>
              {selectedTask?.description || 'Stay focused on this task'}
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
              <Fab
                color="inherit"
                onClick={handlePauseResume}
                sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}
              >
                {isActive ? <PauseIcon /> : <PlayArrowIcon />}
              </Fab>
              <Fab
                color="error"
                onClick={handleStopFocus}
                sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}
              >
                <StopIcon />
              </Fab>
            </Box>

            <Typography variant="body2" sx={{ mt: 3, opacity: 0.8 }}>
              {sessionType === 'work'
                ? 'Focus on your task. Avoid distractions.'
                : 'Take a short break. You deserve it!'}
            </Typography>
          </Box>
        </Box>
      )}

      <Dialog open={showTaskSelector} onClose={() => setShowTaskSelector(false)} maxWidth="md" fullWidth>
        <DialogTitle>Select Task for Focus</DialogTitle>
        <DialogContent>
          {tasks.length === 0 ? (
            <Typography>No open tasks available</Typography>
          ) : (
            <Box>
              {tasks.map(task => (
                <Card
                  key={task.id}
                  sx={{ mb: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                  onClick={() => handleTaskSelect(task)}
                >
                  <CardContent>
                    <Typography variant="h6">{task.title}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {task.description}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTaskSelector(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function FocusModePage() {
  return (
    <ProtectedLayout>
      <FocusModeContent />
    </ProtectedLayout>
  );
}