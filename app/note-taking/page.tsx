'use client';

import { useState, useEffect, useMemo } from 'react';
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
  CircularProgress,
  LinearProgress,
  Grid,
  Fade,
  Divider
} from '@mui/material';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import {
  ArrowLeft as ArrowBackIcon,
  Plus as AddIcon,
  Edit as EditIcon,
  Trash2 as DeleteIcon,
  X as CloseIcon,
  Copy as ContentCopyIcon,
  MoreVertical as MoreVertIcon,
  FileText as TaskIcon,
  Briefcase as WorkIcon,
  BarChart as BarChartIcon,
  TrendingUp as TrendingUpIcon,
  Activity as TimelineIcon,
  Brain as InsightsIcon,
  CheckCircle as CheckCircleIcon,
  Target as TargetIcon,
  Zap as ZapIcon,
  Calendar as CalendarIcon,
  RefreshCw as RefreshIcon,
  ChevronDown,
  Brush as BrushIcon,
  Mic as MicIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { addCalendarEntry, getCalendarEntries } from '../../lib/personal-calendar-db';
import { addProfessionalTask } from '../../lib/professional-db';
import { getNotes, addNote, updateNote, deleteNote, markNoteAsConverted, Note, addNoteWithAttachments, getNotesWithAttachments, deleteNoteWithAttachments, NoteAttachment } from '../../lib/notes-db';

import DrawingCanvas from '../../components/drawing-canvas';
import FileUpload from '../../components/file-upload';
import AudioRecorder from '../../components/audio-recorder';
import LucideIcon from '../../components/icon-wrapper';
import NoteMediaDisplay from '../../components/note-media-display';


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
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
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
  const [attachments, setAttachments] = useState<NoteAttachment[]>([]);
  const [drawingData, setDrawingData] = useState<string | null>(null);
  const [drawingThumbnail, setDrawingThumbnail] = useState<string | null>(null);
  const [audioRecordingUrl, setAudioRecordingUrl] = useState<string | null>(null);
  const [showDrawingCanvas, setShowDrawingCanvas] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [noteWithAttachments, setNoteWithAttachments] = useState<(Note & { note_attachments: NoteAttachment[] })[]>([]);
  const [noteColor, setNoteColor] = useState('#ffffff'); // State for note color
  const [timeRange, setTimeRange] = useState('30days'); // Time range state for dropdown
  const [viewNoteOpen, setViewNoteOpen] = useState(false);
  const [selectedNoteForView, setSelectedNoteForView] = useState<(Note & { note_attachments: NoteAttachment[] }) | null>(null);

  const mergedNotes = useMemo(() => {
    const attachmentMap = new Map(noteWithAttachments.map((n) => [n.id, n]));
    return notes.map((n) => attachmentMap.get(n.id) || n);
  }, [notes, noteWithAttachments]);

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
          // Load notes with attachments
          const userNotesWithAttachments = await getNotesWithAttachments(user.id);
          setNoteWithAttachments(userNotesWithAttachments);

          // Also load regular notes for backward compatibility
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
          setSnackbar({ open: true, message: 'Failed to load data', severity: 'error' });
        } finally {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [user]);

  const handleAddNote = async () => {
    if (!title.trim() || !content.trim() || !user) {
      setSnackbar({ open: true, message: 'Please enter both title and content', severity: 'error' });
      return;
    }

    const newNote = {
      user_id: user.id,
      title: title.trim(),
      content: content.trim(),
      color: noteColor,
      drawing_data: drawingData || undefined,
      drawing_thumbnail: drawingThumbnail || undefined,
      audio_recording_url: audioRecordingUrl || undefined,
      is_drawing: !!drawingData,
      is_recording: !!audioRecordingUrl,
    };

    try {
      let addedNote;
      if (attachments.length > 0 || drawingData || audioRecordingUrl) {
        // Use the enhanced function for notes with attachments
        const result = await addNoteWithAttachments(newNote, attachments);
        if (result && result.note) {
          addedNote = result.note;
          // Update both note lists
          setNotes([addedNote, ...notes]);
          setNoteWithAttachments([{
            ...addedNote,
            note_attachments: result.attachments || []
          }, ...noteWithAttachments]);
        } else {
          throw new Error('Failed to add note with attachments');
        }
      } else {
        // Use regular function for simple notes
        addedNote = await addNote(newNote);
        if (addedNote) {
          setNotes([addedNote, ...notes]);
        }
      }

      if (addedNote) {
        // Reset form
        setTitle('');
        setContent('');
        setOpenDialog(false);
        setEditingNote(null);
        setAttachments([]);
        setDrawingData(null);
        setDrawingThumbnail(null);
        setAudioRecordingUrl(null);
        setNoteColor('#ffffff');
        setSnackbar({ open: true, message: 'Note added successfully!', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: 'Failed to add note', severity: 'error' });
      }
    } catch (error) {
      console.error('Error adding note:', error);
      setSnackbar({ open: true, message: 'Failed to add note', severity: 'error' });
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
      setSnackbar({ open: true, message: 'Please enter both title and content', severity: 'error' });
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
            ? { ...note, title: title.trim(), content: content.trim(), updated_at: new Date().toISOString() }
            : note
        );

        setNotes(updatedNotes);
        setNoteWithAttachments(prev => prev.map(n => n.id === editingNote.id ? { ...n, title: title.trim(), content: content.trim(), updated_at: new Date().toISOString() } : n));
        setTitle('');
        setContent('');
        setOpenDialog(false);
        setEditingNote(null);
        setSnackbar({ open: true, message: 'Note updated successfully!', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: 'Failed to update note', severity: 'error' });
      }
    } catch (error) {
      console.error('Error updating note:', error);
      setSnackbar({ open: true, message: 'Failed to update note', severity: 'error' });
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const success = await deleteNote(id);
      if (success) {
        const updatedNotes = notes.filter(note => note.id !== id);
        setNotes(updatedNotes);
        setNoteWithAttachments(prev => prev.filter(note => note.id !== id));
        setSnackbar({ open: true, message: 'Note deleted successfully!', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: 'Failed to delete note', severity: 'error' });
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      setSnackbar({ open: true, message: 'Failed to delete note', severity: 'error' });
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
    setAttachments([]);
    setDrawingData(null);
    setDrawingThumbnail(null);
    setAudioRecordingUrl(null);
    setShowDrawingCanvas(false);
    setShowAudioRecorder(false);
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

      // Get multimedia data from the current note
      const noteWithMultimedia = noteWithAttachments.find((n: any) => n.id === currentNote.id);
      const multimediaData = {
        drawing_data: (currentNote as any).drawing_data || noteWithMultimedia?.drawing_data,
        drawing_thumbnail: (currentNote as any).drawing_thumbnail || noteWithMultimedia?.drawing_thumbnail,
        audio_recording_url: (currentNote as any).audio_recording_url || noteWithMultimedia?.audio_recording_url,
        attachments: noteWithMultimedia?.note_attachments || [],
        is_drawing: (currentNote as any).is_drawing || noteWithMultimedia?.is_drawing,
        is_recording: (currentNote as any).is_recording || noteWithMultimedia?.is_recording
      };

      console.log('Multimedia data extracted:', multimediaData);
      console.log('Current note ID:', currentNote.id);
      console.log('User ID:', user.id);

      if (conversionType === 'personal') {
        // Convert to personal task with multimedia data
        const personalTask = {
          user_id: user.id,
          title: conversionData.title,
          category: conversionData.category,
          entry_date: new Date(conversionData.date).toISOString(),
          category_data: {
            ...multimediaData,
            original_note_id: currentNote.id,
            conversion_date: new Date().toISOString()
          },
          priority: conversionData.priority,
          status: 'pending',
          description: conversionData.description
        };

        console.log('Creating personal task with multimedia:', personalTask);
        const result = await addCalendarEntry(personalTask);
        console.log('Personal task result:', result);

        if (result) {
          success = true;
          setSnackbar({ open: true, message: 'Note converted to personal task successfully!', severity: 'success' });
        } else {
          throw new Error('Failed to add personal calendar entry');
        }
      } else if (conversionType === 'professional') {
        // Convert to professional task with multimedia data
        const professionalTask = {
          user_id: user.id,
          title: conversionData.title,
          description: conversionData.description,
          department: 'General',
          role: 'General',
          responsibilities: '',
          experience: '',
          task_date: conversionData.date, // This should be a date string that works with both date and text types
          priority: conversionData.priority,
          status: 'pending',
          // Add multimedia data as additional fields
          drawing_data: multimediaData.drawing_data,
          drawing_thumbnail: multimediaData.drawing_thumbnail,
          audio_recording_url: multimediaData.audio_recording_url,
          attachments: multimediaData.attachments, // This will be stored as JSON
          is_drawing: multimediaData.is_drawing,
          is_recording: multimediaData.is_recording,
          original_note_id: currentNote.id,
          conversion_date: new Date().toISOString()
        };

        console.log('Creating professional task with multimedia:', professionalTask);
        const result = await addProfessionalTask(professionalTask);
        if (result) {
          success = true;
          setSnackbar({ open: true, message: 'Note converted to professional task successfully!', severity: 'success' });
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

            // Also reload notes with attachments
            const userNotesWithAttachments = await getNotesWithAttachments(user.id);
            setNoteWithAttachments(userNotesWithAttachments);
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
      {/* Top App Bar with modern design */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
          borderRadius: 0,
          mb: 0
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
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
            <LucideIcon icon={ArrowBackIcon} size={20} />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700, color: 'text.primary' }}>
            Note Taking
          </Typography>

          {/* Time Range Selector in Header */}
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
                  borderColor: '#6750A4'
                },
                '&:focus-within': {
                  boxShadow: '0 8px 30px rgba(103, 80, 164, 0.15)',
                  borderColor: '#6750A4'
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
                  <LucideIcon icon={CalendarIcon} size={16} sx={{ color: '#6750A4' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Last 7 Days</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="30days">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <LucideIcon icon={TrendingUpIcon} size={16} sx={{ color: '#10b981' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Last 30 Days</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="90days">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <LucideIcon icon={TimelineIcon} size={16} sx={{ color: '#f59e0b' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Last 90 Days</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="1year">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <LucideIcon icon={TargetIcon} size={16} sx={{ color: '#ef4444' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Last Year</Typography>
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </Toolbar>
      </AppBar>

      <Fade in timeout={350}>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          {/* KPI Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                sx={{
                  height: 140,
                  background: 'linear-gradient(135deg, rgba(103, 80, 164, 0.05) 0%, rgba(98, 91, 113, 0.05) 100%)',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 4,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-8px) scale(1.02)',
                    boxShadow: '0 12px 40px rgba(103, 80, 164, 0.2)',
                    borderColor: '#6750A4',
                    '& .card-icon': {
                      transform: 'scale(1.1) rotate(5deg)',
                      background: 'linear-gradient(135deg, #6750A4 0%, #625B71 100%)',
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
                    background: 'linear-gradient(180deg, #6750A4 0%, #625B71 100%)',
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
                        background: 'linear-gradient(135deg, rgba(103, 80, 164, 0.1) 0%, rgba(98, 91, 113, 0.1) 100%)',
                        color: '#6750A4',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 4px 12px rgba(103, 80, 164, 0.2)'
                      }}
                    >
                      <LucideIcon icon={TaskIcon} size={20} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.95rem' }}>
                      Total Notes
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, background: 'linear-gradient(135deg, #6750A4 0%, #625B71 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontSize: '2rem' }}>
                    {notes.length}
                  </Typography>
                  <Box sx={{ position: 'relative' }}>
                    <LinearProgress
                      variant="determinate"
                      value={100}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: 'rgba(103, 80, 164, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(90deg, #6750A4 0%, #625B71 100%)',
                          borderRadius: 3,
                          boxShadow: '0 2px 8px rgba(103, 80, 164, 0.4)',
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
                  height: 140,
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
                      <LucideIcon icon={CheckCircleIcon} size={20} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.95rem' }}>
                      Converted Tasks
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontSize: '2rem' }}>
                    {notes.filter(note => note.converted_to_task).length}
                  </Typography>
                  <Box sx={{ position: 'relative' }}>
                    <LinearProgress
                      variant="determinate"
                      value={notes.length > 0 ? (notes.filter(note => note.converted_to_task).length / notes.length) * 100 : 0}
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
                  height: 140,
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
                      <LucideIcon icon={TrendingUpIcon} size={20} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.95rem' }}>
                      Conversion Rate
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontSize: '2rem' }}>
                    {notes.length > 0 ? Math.round((notes.filter(note => note.converted_to_task).length / notes.length) * 100) : 0}%
                  </Typography>
                  <Box sx={{ position: 'relative' }}>
                    <LinearProgress
                      variant="determinate"
                      value={notes.length > 0 ? (notes.filter(note => note.converted_to_task).length / notes.length) * 100 : 0}
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

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                sx={{
                  height: 140,
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
                      <LucideIcon icon={TimelineIcon} size={20} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.95rem' }}>
                      Active Notes
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontSize: '2rem' }}>
                    {notes.filter(note => !note.converted_to_task).length}
                  </Typography>
                  <Box sx={{ position: 'relative' }}>
                    <LinearProgress
                      variant="determinate"
                      value={notes.length > 0 ? (notes.filter(note => !note.converted_to_task).length / notes.length) * 100 : 0}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: 'rgba(59, 130, 246, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                          borderRadius: 3,
                          boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)',
                          transition: 'all 0.3s ease'
                        }
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Add Note Button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
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
              <LucideIcon icon={AddIcon} size={24} sx={{ color: 'white' }} />
            </Fab>
          </Box>

          {snackbar.open && (
            <Alert
              severity={snackbar.severity}
              onClose={() => setSnackbar({ ...snackbar, open: false })}
              sx={{ mb: 2 }}
            >
              {snackbar.message}
            </Alert>
          )}

          {mergedNotes.length === 0 && tasks.length === 0 ? (
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
                            <LucideIcon icon={TaskIcon} size={20} sx={{ mr: 1, color: 'success.main' }} />
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
              {mergedNotes.length > 0 && (
                <Box>
                  <Typography variant="h5" sx={{ mb: 2, color: 'primary.main', fontWeight: 700 }}>
                    Notes ({mergedNotes.length})
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
                    {mergedNotes.map((note) => {
                      const attachmentsForNote = (note as any).note_attachments || [];
                      return (
                        <Card
                          key={note.id}
                          sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                            background: note.color || '#f8fafc',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
                            transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                            '&:hover': {
                              transform: 'translateY(-6px)',
                              boxShadow: '0 16px 40px rgba(0,0,0,0.12)'
                            }
                          }}
                        >
                          <CardContent sx={{ flex: 1, p: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.5 }}>
                                  {formatDate(note.created_at)}
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
                                  {note.title}
                                </Typography>
                              </Box>
                              <IconButton size="small" onClick={(e) => handleNoteMenuOpen(e, note)}>
                                <MoreVertIcon fontSize="small" />
                              </IconButton>
                            </Box>

                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                              {note.content.length > 140 ? `${note.content.substring(0, 140)}...` : note.content}
                            </Typography>

                            <NoteMediaDisplay
                              attachments={attachmentsForNote}
                              drawingData={(note as any).drawing_data}
                              drawingThumbnail={(note as any).drawing_thumbnail}
                              audioRecordingUrl={(note as any).audio_recording_url}
                              isDrawing={(note as any).is_drawing}
                              isRecording={(note as any).is_recording}
                              compact={true}
                            />
                          </CardContent>
                          <Divider />
                          <CardActions sx={{ p: 2, justifyContent: 'flex-end', gap: 1 }}>
                            <Button size="small" variant="outlined" startIcon={<LucideIcon icon={InsightsIcon} size={16} />} onClick={() => {
                              const attachmentNote = noteWithAttachments.find((n) => n.id === note.id);
                              setSelectedNoteForView(attachmentNote || { ...(note as any), note_attachments: attachmentsForNote });
                              setViewNoteOpen(true);
                            }}>
                              View
                            </Button>
                            <Button size="small" startIcon={<EditIcon />} onClick={() => handleEditNote(note)}>
                              Edit
                            </Button>
                            <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => handleDeleteNote(note.id)}>
                              Delete
                            </Button>
                          </CardActions>
                        </Card>
                      );
                    })}
                  </Box>
                </Box>
              )}
            </>
          )}
        </Container>
      </Fade>

      {/* Add/Edit Note Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ p: 0 }}>
          <Box sx={{
            px: 3,
            py: 2,
            background: 'linear-gradient(135deg, #6750A4 0%, #4a387d 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Box>
              <Typography variant="overline" sx={{ opacity: 0.8 }}>
                {editingNote ? 'Update your note' : 'Create a new note'}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {editingNote ? 'Edit Note' : 'Add Note'}
              </Typography>
            </Box>
            <IconButton onClick={handleCloseDialog} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ maxHeight: '75vh', overflowY: 'auto', p: 3, backgroundColor: '#f8f8fb' }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', backgroundColor: 'white' }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: 'text.secondary' }}>
                  Note Details
                </Typography>
                <TextField
                  label="Title"
                  fullWidth
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Content"
                  fullWidth
                  multiline
                  minRows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', backgroundColor: 'white', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: 'text.secondary' }}>
                    Media & Tools
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      variant={showDrawingCanvas ? 'contained' : 'outlined'}
                      startIcon={<BrushIcon />}
                      onClick={() => setShowDrawingCanvas(!showDrawingCanvas)}
                    >
                      {showDrawingCanvas ? 'Close Canvas' : 'Add Drawing'}
                    </Button>
                    <Button
                      variant={showAudioRecorder ? 'contained' : 'outlined'}
                      startIcon={<MicIcon />}
                      onClick={() => setShowAudioRecorder(!showAudioRecorder)}
                    >
                      {showAudioRecorder ? 'Close Recorder' : 'Add Audio'}
                    </Button>
                  </Box>
                </Box>

                {showDrawingCanvas && (
                  <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
                    <DrawingCanvas
                      width={420}
                      height={240}
                      onSave={(imageData, thumbnailData) => {
                        setDrawingData(imageData);
                        setDrawingThumbnail(thumbnailData);
                        setShowDrawingCanvas(false);
                      }}
                      initialData={drawingData || undefined}
                    />
                  </Box>
                )}

                {showAudioRecorder && (
                  <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
                    <AudioRecorder
                      onRecordingComplete={(audioData) => {
                        setAudioRecordingUrl(audioData);
                        setShowAudioRecorder(false);
                      }}
                    />
                  </Box>
                )}

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: 'text.secondary' }}>
                    Attachments
                  </Typography>
                  <FileUpload onFilesChange={setAttachments} maxFiles={5} maxSize={15} />
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LucideIcon icon={ZapIcon} size={16} /> Color
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {colorPalette.map((color) => (
                      <Box
                        key={color}
                        onClick={() => setNoteColor(color)}
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: color,
                          border: noteColor === color ? '3px solid #6750A4' : '1px solid #e5e7eb',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: noteColor === color ? '0 0 0 4px rgba(103,80,164,0.12)' : 'none',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 20px rgba(0,0,0,0.08)'
                          }
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, backgroundColor: '#f8f8fb' }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={editingNote ? handleUpdateNote : handleAddNote} variant="contained" sx={{ boxShadow: '0 10px 20px rgba(103,80,164,0.25)' }}>
            {editingNote ? 'Update Note' : 'Save Note'}
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
        <DialogTitle sx={{ p: 0 }}>
          <Box sx={{
            px: 3,
            py: 2,
            background: conversionType === 'personal' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #6750A4 0%, #4a387d 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Convert to {conversionType === 'personal' ? 'Personal' : 'Professional'} Task
            </Typography>
            <IconButton onClick={handleConversionCancel} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ backgroundColor: '#f8f8fb' }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', backgroundColor: 'white' }}>
            <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 700 }}>
              {conversionData.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
              {conversionData.description}
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Task Title"
                  fullWidth
                  value={conversionData.title}
                  onChange={(e) => setConversionData({ ...conversionData, title: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Date"
                  type="date"
                  fullWidth
                  value={conversionData.date}
                  InputLabelProps={{ shrink: true }}
                  onChange={(e) => setConversionData({ ...conversionData, date: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={conversionData.priority}
                    label="Priority"
                    onChange={(e) => setConversionData({ ...conversionData, priority: e.target.value })}
                  >
                    <MenuItem value="Low">Low</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="High">High</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {conversionType === 'personal' && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={conversionData.category}
                      label="Category"
                      onChange={(e) => setConversionData({ ...conversionData, category: e.target.value })}
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
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, backgroundColor: '#f8f8fb' }}>
          <Button onClick={handleConversionCancel} disabled={isConverting}>Cancel</Button>
          <Button
            onClick={handleConversionConfirm}
            variant="contained"
            disabled={isConverting}
            startIcon={isConverting ? <CircularProgress size={20} /> : null}
            sx={{ boxShadow: conversionType === 'personal' ? '0 10px 20px rgba(16,185,129,0.25)' : '0 10px 20px rgba(103,80,164,0.25)' }}
          >
            {isConverting ? 'Converting...' : `Convert to ${conversionType === 'personal' ? 'Personal' : 'Professional'} Task`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Note Dialog */}
      {selectedNoteForView && (
        <Dialog open={viewNoteOpen} onClose={() => setViewNoteOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="overline" sx={{ color: 'text.secondary' }}>Note Preview</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>{selectedNoteForView.title}</Typography>
            </Box>
            <IconButton onClick={() => setViewNoteOpen(false)}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ backgroundColor: '#fafafa' }}>
            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
              {selectedNoteForView.content}
            </Typography>
            <NoteMediaDisplay
              attachments={selectedNoteForView.note_attachments}
              drawingData={selectedNoteForView.drawing_data}
              drawingThumbnail={selectedNoteForView.drawing_thumbnail}
              audioRecordingUrl={selectedNoteForView.audio_recording_url}
              isDrawing={selectedNoteForView.is_drawing}
              isRecording={selectedNoteForView.is_recording}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              Last updated: {formatDate(selectedNoteForView.updated_at)}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewNoteOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
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