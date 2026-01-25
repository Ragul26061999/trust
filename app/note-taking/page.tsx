'use client';

import { useState, useEffect } from 'react';
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../../lib/auth-context';
import { ThemeProvider as AppThemeProvider, useTheme as useCustomTheme } from '../../lib/theme-context';
import ProtectedRoute from '../../lib/protected-route';
import ProtectedLayout from '../protected-layout';
import { 
  Box, 
  Container, 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  CssBaseline, 
  IconButton,
  TextField,
  Card,
  CardContent,
  CardActions,
  Fab,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  Slide,
  Menu,
  ListItemButton,
  CircularProgress
} from '@mui/material';
import { Grid } from '@mui/material';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { Palette as PaletteIcon } from '@mui/icons-material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import TaskIcon from '@mui/icons-material/Task';
import WorkIcon from '@mui/icons-material/Work';
import BarChartIcon from '@mui/icons-material/BarChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TimelineIcon from '@mui/icons-material/Timeline';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useRouter } from 'next/navigation';
import { addCalendarEntry, getCalendarEntries } from '../../lib/personal-calendar-db';
import { addProfessionalTask } from '../../lib/professional-db';
import { getNotes, addNote, updateNote, deleteNote, markNoteAsConverted, Note } from '../../lib/notes-db';

// Dynamic theme based on user preferences
const DynamicTheme = () => {
  const { theme } = useCustomTheme();

  return createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: theme.primaryColor || '#6750A4',
      },
      secondary: {
        main: theme.secondaryColor || '#625B71',
      },
      background: {
        default: theme.backgroundColor || '#FEF7FF',
        paper: '#FFFFFF',
      },
      text: {
        primary: theme.textColor || '#1C1B1F',
      },
    },
    typography: {
      fontFamily: [
        'Inter',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
    },
  });
};

const NoteTakingPageContent = () => {
  const { theme } = useCustomTheme();
  const { user, logout } = useAuth();
  const router = useRouter();
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<any[]>([]); // Add state for tasks
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({open: false, message: '', severity: 'success'});
  const [selectedNoteForConversion, setSelectedNoteForConversion] = useState<Note | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [conversionDialogOpen, setConversionDialogOpen] = useState(false);
  const [conversionType, setConversionType] = useState<'personal' | 'professional' | null>(null);
  const [conversionData, setConversionData] = useState({
    title: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    priority: 'Medium',
    category: 'task'
  });
  const [isConverting, setIsConverting] = useState(false);
  const [noteColor, setNoteColor] = useState('#ffffff'); // State for note color
  const [showAnalytics, setShowAnalytics] = useState(false); // State for analytics dialog

  // Define color palette for notes
  const colorPalette = [
    '#ffffff', // White
    '#f3e5f5', // Light Purple
    '#e8f5e8', // Light Green
    '#fff3e0', // Light Orange
    '#e3f2fd', // Light Blue
    '#fce4ec', // Light Pink
    '#f1f8e9', // Light Lime
    '#fff8e1', // Light Yellow
    '#f5f5f5', // Light Gray
    '#e0f2f1', // Light Teal
  ];

  // Calculate analytics data
  const getAnalyticsData = () => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    
    // Notes analytics
    const totalNotes = notes.length;
    const convertedNotes = notes.filter(note => note.converted_to_task).length;
    const thisWeekNotes = notes.filter(note => {
      const noteDate = parseISO(note.created_at);
      return isWithinInterval(noteDate, { start: weekStart, end: weekEnd });
    }).length;
    
    // Tasks analytics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const pendingTasks = tasks.filter(task => task.status === 'pending').length;
    const thisWeekTasks = tasks.filter(task => {
      const taskDate = parseISO(task.created_at);
      return isWithinInterval(taskDate, { start: weekStart, end: weekEnd });
    }).length;
    
    // Priority distribution for tasks
    const priorityData = tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Status distribution
    const statusData = {
      completed: completedTasks,
      pending: pendingTasks,
      total: totalTasks
    };
    
    // Conversion rate
    const conversionRate = totalNotes > 0 ? Math.round((convertedNotes / totalNotes) * 100) : 0;
    
    // Task completion rate
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    return {
      totalNotes,
      convertedNotes,
      thisWeekNotes,
      totalTasks,
      completedTasks,
      pendingTasks,
      thisWeekTasks,
      priorityData,
      statusData,
      conversionRate,
      taskCompletionRate
    };
  };

  // Load notes and tasks from database on component mount
  useEffect(() => {
    const loadData = async () => {
      if (user) {
        setLoading(true);
        try {
          // Load notes
          const userNotes = await getNotes(user.id);
          setNotes(userNotes);
          
          // Load tasks (calendar entries)
          const userTasks = await getCalendarEntries(user.id);
          // Filter for task entries and format them
          const formattedTasks = userTasks
            .filter(entry => entry.category === 'task')
            .map(task => ({
              id: task.id,
              title: task.title,
              content: task.description || '',
              type: 'task',
              priority: task.priority,
              status: task.status,
              created_at: task.created_at
            }));
          setTasks(formattedTasks);
        } catch (error) {
          console.error('Error loading data:', error);
          setSnackbar({open: true, message: 'Failed to load data', severity: 'error'});
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadData();
  }, [user]);

  const handleAddNote = async () => {
    if (!title.trim() || !content.trim() || !user) {
      setSnackbar({open: true, message: 'Please enter both title and content', severity: 'error'});
      return;
    }

    const newNote = {
      user_id: user.id,
      title: title.trim(),
      content: content.trim(),
      color: noteColor,
    };

    try {
      const addedNote = await addNote(newNote);
      if (addedNote) {
        setNotes([addedNote, ...notes]);
        setTitle('');
        setContent('');
        setOpenDialog(false);
        setEditingNote(null);
        setSnackbar({open: true, message: 'Note added successfully!', severity: 'success'});
      } else {
        setSnackbar({open: true, message: 'Failed to add note', severity: 'error'});
      }
    } catch (error) {
      console.error('Error adding note:', error);
      setSnackbar({open: true, message: 'Failed to add note', severity: 'error'});
    }
  };

  const handleEditNote = (note: Note) => {
    setTitle(note.title);
    setContent(note.content);
    setEditingNote(note);
    setOpenDialog(true);
  };

  const handleUpdateNote = async () => {
    if (!title.trim() || !content.trim() || !editingNote) {
      setSnackbar({open: true, message: 'Please enter both title and content', severity: 'error'});
      return;
    }

    try {
      const success = await updateNote(editingNote.id, {
        title: title.trim(),
        content: content.trim(),
      });

      if (success) {
        const updatedNotes = notes.map(note => 
          note.id === editingNote.id 
            ? {...note, title: title.trim(), content: content.trim(), updated_at: new Date().toISOString()} 
            : note
        );

        setNotes(updatedNotes);
        setTitle('');
        setContent('');
        setOpenDialog(false);
        setEditingNote(null);
        setSnackbar({open: true, message: 'Note updated successfully!', severity: 'success'});
      } else {
        setSnackbar({open: true, message: 'Failed to update note', severity: 'error'});
      }
    } catch (error) {
      console.error('Error updating note:', error);
      setSnackbar({open: true, message: 'Failed to update note', severity: 'error'});
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const success = await deleteNote(id);
      if (success) {
        const updatedNotes = notes.filter(note => note.id !== id);
        setNotes(updatedNotes);
        setSnackbar({open: true, message: 'Note deleted successfully!', severity: 'success'});
      } else {
        setSnackbar({open: true, message: 'Failed to delete note', severity: 'error'});
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      setSnackbar({open: true, message: 'Failed to delete note', severity: 'error'});
    }
  };

  const handleOpenDialog = () => {
    setTitle('');
    setContent('');
    setEditingNote(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setTitle('');
    setContent('');
    setNoteColor('#ffffff'); // Reset color to default
    setEditingNote(null);
  };

  const handleLogout = () => {
    logout();
  };

  const handleGoBack = () => {
    router.back();
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleNoteMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, note: Note) => {
    setAnchorEl(event.currentTarget);
    setCurrentNote(note);
    setConversionData({
      title: note.title,
      description: note.content,
      date: format(new Date(), 'yyyy-MM-dd'),
      priority: 'Medium',
      category: 'task'
    });
  };

  const handleNoteMenuClose = () => {
    setAnchorEl(null);
    // Don't clear currentNote here - it should only be cleared when dialog is closed
  };

  const clearCurrentNote = () => {
    setCurrentNote(null);
  };

  const handleConvertToPersonal = () => {
    console.log('Convert to Personal clicked, currentNote:', currentNote);
    if (!currentNote) {
      console.error('No current note selected');
      return;
    }
    setConversionType('personal');
    setConversionDialogOpen(true);
    // Don't close the menu immediately, let the dialog handle it
    setAnchorEl(null);
  };

  const handleConvertToProfessional = () => {
    if (!currentNote) {
      console.error('No current note selected');
      return;
    }
    setConversionType('professional');
    setConversionDialogOpen(true);
    // Don't close the menu immediately, let the dialog handle it
    setAnchorEl(null);
  };

  const handleConversionConfirm = async () => {
    if (!user || !currentNote || !conversionType) {
      console.error('Missing required data:', { user: !!user, currentNote: !!currentNote, conversionType });
      return;
    }

    console.log('Starting conversion:', { conversionType, conversionData });
    setIsConverting(true);
    
    try {
      let success = false;
      
      if (conversionType === 'personal') {
        // Convert to personal task
        const personalTask = {
          user_id: user.id,
          title: conversionData.title,
          category: conversionData.category,
          entry_date: new Date(conversionData.date).toISOString(),
          category_data: {},
          priority: conversionData.priority,
          status: 'pending',
          description: conversionData.description
        };

        console.log('Creating personal task:', personalTask);
        const result = await addCalendarEntry(personalTask);
        console.log('Personal task result:', result);
        
        if (result) {
          success = true;
          setSnackbar({open: true, message: 'Note converted to personal task successfully!', severity: 'success'});
        } else {
          throw new Error('Failed to add personal calendar entry');
        }
      } else if (conversionType === 'professional') {
        // Convert to professional task
        const professionalTask = {
          user_id: user.id,
          title: conversionData.title,
          description: conversionData.description,
          department: 'General',
          role: 'General',
          responsibilities: '',
          experience: '',
          task_date: conversionData.date,
          priority: conversionData.priority,
          status: 'pending'
        };

        const result = await addProfessionalTask(professionalTask);
        if (result) {
          success = true;
          setSnackbar({open: true, message: 'Note converted to professional task successfully!', severity: 'success'});
        } else {
          throw new Error('Failed to add professional task');
        }
      }

      if (success) {
        setConversionDialogOpen(false);
        setConversionType(null);
        clearCurrentNote(); // Use the new function
        // Reset conversion data
        setConversionData({
          title: '',
          description: '',
          date: format(new Date(), 'yyyy-MM-dd'),
          priority: 'Medium',
          category: 'task'
        });
        
        // Reload tasks to show the newly converted task
        if (conversionType === 'personal' && user) {
          try {
            const userTasks = await getCalendarEntries(user.id);
            const formattedTasks = userTasks
              .filter(entry => entry.category === 'task')
              .map(task => ({
                id: task.id,
                title: task.title,
                content: task.description || '',
                type: 'task',
                priority: task.priority,
                status: task.status,
                created_at: task.created_at
              }));
            setTasks(formattedTasks);
          } catch (error) {
            console.error('Error reloading tasks:', error);
          }
        }
        
        // Mark the original note as converted and reload notes
        if (currentNote) {
          try {
            await markNoteAsConverted(currentNote.id);
            // Reload notes to remove the converted one
            const userNotes = await getNotes(user.id);
            setNotes(userNotes);
          } catch (error) {
            console.error('Error marking note as converted:', error);
          }
        }
      }
    } catch (error) {
      console.error(`Error converting note to ${conversionType} task:`, error);
      setSnackbar({
        open: true, 
        message: `Failed to convert note to ${conversionType} task: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        severity: 'error'
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleConversionCancel = () => {
    setConversionDialogOpen(false);
    setConversionType(null);
    clearCurrentNote(); // Use the new function
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        pb: 8
      }}
    >
      {/* Top App Bar inside main content */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'primary.main', borderRadius: 2, mb: 3 }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleGoBack}
            aria-label="back"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Note Taking
          </Typography>
          <Button
            color="inherit"
            onClick={handleLogout}
            sx={{ textTransform: 'none' }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
              Note Taking Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your notes and converted tasks
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant="outlined"
              onClick={() => setShowAnalytics(true)}
              startIcon={<BarChartIcon />}
              sx={{ 
                borderRadius: 3, 
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1
              }}
            >
              Analytics
            </Button>
            <Fab 
              color="primary" 
              aria-label="add note"
              onClick={handleOpenDialog}
              sx={{ 
                boxShadow: 3,
                '&:hover': {
                  boxShadow: 6,
                }
              }}
            >
              <AddIcon />
            </Fab>
          </Box>
        </Box>

        {snackbar.open && (
          <Alert 
            severity={snackbar.severity} 
            onClose={() => setSnackbar({...snackbar, open: false})}
            sx={{ mb: 2 }}
          >
            {snackbar.message}
          </Alert>
        )}

        {notes.length === 0 && tasks.length === 0 ? (
          <Paper 
            sx={{ 
              p: 6, 
              textAlign: 'center', 
              border: '2px dashed #ccc', 
              borderRadius: 4,
              backgroundColor: 'background.default'
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No notes or tasks yet
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Click the + button to create your first note, or convert notes to tasks
            </Typography>
          </Paper>
        ) : (
          <>
            {/* Tasks Section */}
            {tasks.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
                  Tasks ({tasks.length})
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
                  {tasks.map((task) => (
                    <Card 
                      key={task.id}
                      sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        border: '2px solid',
                        borderColor: 'success.main',
                        backgroundColor: 'success.light',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4
                        }
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <TaskIcon sx={{ mr: 1, color: 'success.main' }} />
                          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                            {task.title}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {task.content}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip 
                            label={task.priority} 
                            size="small" 
                            color={task.priority === 'High' ? 'error' : task.priority === 'Medium' ? 'warning' : 'default'}
                          />
                          <Chip 
                            label={task.status} 
                            size="small" 
                            color={task.status === 'completed' ? 'success' : 'info'}
                          />
                          <Chip 
                            label="Task" 
                            size="small" 
                            color="success"
                            icon={<TaskIcon />}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Box>
            )}
            
            {/* Notes Section */}
            {notes.length > 0 && (
              <Box>
                <Typography variant="h5" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
                  Notes ({notes.length})
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
                  {notes.map((note) => (
              <Card 
                key={note.id}
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: note.color || '#ffffff', // Apply custom color
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardContent sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
                      {note.title}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => handleNoteMenuOpen(e, note)}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {note.content.substring(0, 100)}{note.content.length > 100 ? '...' : ''}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    {formatDate(note.updated_at)}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                  <Button 
                    size="small" 
                    startIcon={<EditIcon />} 
                    onClick={() => handleEditNote(note)}
                    sx={{ mr: 1 }}
                  >
                    Edit
                  </Button>
                  <Button 
                    size="small" 
                    color="error" 
                    startIcon={<DeleteIcon />} 
                    onClick={() => handleDeleteNote(note.id)}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            ))}
                </Box>
              </Box>
            )}
          </>
        )}
      </Container>

      {/* Add/Edit Note Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingNote ? 'Edit Note' : 'Add New Note'}
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            variant="outlined"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Content"
            fullWidth
            multiline
            rows={6}
            variant="outlined"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          {/* Color Picker Section */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
              <PaletteIcon sx={{ mr: 1, fontSize: 18 }} />
              Note Color
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {colorPalette.map((color) => (
                <Box
                  key={color}
                  onClick={() => setNoteColor(color)}
                  sx={{
                    width: 32,
                    height: 32,
                    backgroundColor: color,
                    border: noteColor === color ? '3px solid #1976d2' : '2px solid #ddd',
                    borderRadius: 1,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'scale(1.1)',
                      boxShadow: 2
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={editingNote ? handleUpdateNote : handleAddNote} 
            variant="contained" 
            color="primary"
          >
            {editingNote ? 'Update' : 'Add'} Note
          </Button>
        </DialogActions>
      </Dialog>

      {/* Conversion Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleNoteMenuClose}
        PaperProps={{
          elevation: 3,
          sx: {
            borderRadius: 3,
            mt: 1,
            minWidth: 200,
          }
        }}
      >
        <MenuItem onClick={handleConvertToPersonal}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TaskIcon fontSize="small" />
            <Typography>Convert to Personal Task</Typography>
          </Box>
        </MenuItem>
        <MenuItem onClick={handleConvertToProfessional}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WorkIcon fontSize="small" />
            <Typography>Convert to Professional Task</Typography>
          </Box>
        </MenuItem>
      </Menu>

      {/* Conversion Confirmation Dialog */}
      <Dialog 
        open={conversionDialogOpen} 
        onClose={handleConversionCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Convert Note to {conversionType === 'personal' ? 'Personal' : 'Professional'} Task
          <IconButton
            aria-label="close"
            onClick={handleConversionCancel}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            {conversionData.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {conversionData.description}
          </Typography>
          
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Task Title"
                fullWidth
                variant="outlined"
                value={conversionData.title}
                onChange={(e) => setConversionData({...conversionData, title: e.target.value})}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Date"
                type="date"
                fullWidth
                variant="outlined"
                value={conversionData.date}
                InputLabelProps={{ shrink: true }}
                onChange={(e) => setConversionData({...conversionData, date: e.target.value})}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={conversionData.priority}
                  onChange={(e) => setConversionData({...conversionData, priority: e.target.value})}
                  label="Priority"
                >
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {conversionType === 'personal' && (
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={conversionData.category}
                    onChange={(e) => setConversionData({...conversionData, category: e.target.value})}
                    label="Category"
                  >
                    <MenuItem value="task">Task</MenuItem>
                    <MenuItem value="event">Event</MenuItem>
                    <MenuItem value="goal">Goal</MenuItem>
                    <MenuItem value="health">Health</MenuItem>
                    <MenuItem value="wealth">Wealth</MenuItem>
                    <MenuItem value="adls">ADLs</MenuItem>
                    <MenuItem value="family">Family</MenuItem>
                    <MenuItem value="entertainment">Entertainment</MenuItem>
                    <MenuItem value="household">Household</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConversionCancel} disabled={isConverting}>
            Cancel
          </Button>
          <Button 
            onClick={handleConversionConfirm} 
            variant="contained" 
            color="primary"
            disabled={isConverting}
            startIcon={isConverting ? <CircularProgress size={20} /> : null}
          >
            {isConverting ? 'Converting...' : `Convert to ${conversionType === 'personal' ? 'Personal' : 'Professional'} Task`}
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
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 3
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'white' }}>
                Notes & Tasks Analytics
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Comprehensive insights into your notes and task performance
              </Typography>
            </Box>
            <AssessmentIcon sx={{ fontSize: 40, opacity: 0.8 }} />
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 4, py: 3 }}>
          {(() => {
            const analytics = getAnalyticsData();
            return (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Overview Cards */}
                <Grid container spacing={3}>
                  <Grid size={3}>
                    <Box sx={{ 
                      p: 3, 
                      borderRadius: 3, 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      textAlign: 'center'
                    }}>
                      <AssignmentIcon sx={{ fontSize: 24, color: 'white' }} />
                      <Typography variant="h3" sx={{ fontWeight: 800, color: '#667eea', mb: 1 }}>
                        {analytics.totalNotes}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        Total Notes
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={3}>
                    <Box sx={{ 
                      p: 3, 
                      borderRadius: 3, 
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      textAlign: 'center'
                    }}>
                      <CheckCircleIcon sx={{ fontSize: 24, color: 'white' }} />
                      <Typography variant="h3" sx={{ fontWeight: 800, color: '#10b981', mb: 1 }}>
                        {analytics.convertedNotes}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        Converted
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={3}>
                    <Box sx={{ 
                      p: 3, 
                      borderRadius: 3, 
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: 'white',
                      textAlign: 'center'
                    }}>
                      <TrendingUpIcon sx={{ fontSize: 24, color: 'white' }} />
                      <Typography variant="h3" sx={{ fontWeight: 800, color: '#f59e0b', mb: 1 }}>
                        {analytics.conversionRate}%
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        Conversion Rate
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={3}>
                    <Box sx={{ 
                      p: 3, 
                      borderRadius: 3, 
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      color: 'white',
                      textAlign: 'center'
                    }}>
                      <TimelineIcon sx={{ fontSize: 24, color: 'white' }} />
                      <Typography variant="h3" sx={{ fontWeight: 800, color: '#3b82f6', mb: 1 }}>
                        {analytics.thisWeekNotes}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        This Week
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Task Analytics */}
                <Paper sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                    Task Performance
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={4}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: alpha('#10b981', 0.1), borderRadius: 2 }}>
                        <Typography variant="h5" color="#10b981" sx={{ fontWeight: 800 }}>
                          {analytics.totalTasks}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          Total Tasks
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={4}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: alpha('#10b981', 0.1), borderRadius: 2 }}>
                        <Typography variant="h5" color="#10b981" sx={{ fontWeight: 800 }}>
                          {analytics.completedTasks}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          Completed
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={4}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: alpha('#f59e0b', 0.1), borderRadius: 2 }}>
                        <Typography variant="h5" color="#f59e0b" sx={{ fontWeight: 800 }}>
                          {analytics.taskCompletionRate}%
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          Completion Rate
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Box>
            );
          })()}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default function NoteTakingPage() {
  return (
    <ProtectedLayout>
      <NoteTakingPageContent />
    </ProtectedLayout>
  );
}