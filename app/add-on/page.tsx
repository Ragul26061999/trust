'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';
import { ThemeProvider as AppThemeProvider, useTheme as useCustomTheme } from '../../lib/theme-context';
import ProtectedRoute from '../../lib/protected-route';
import ProtectedLayout from '../protected-layout';
import { Box, Container, AppBar, Toolbar, Typography, Button, CssBaseline, IconButton, Paper, Card, CardContent, Chip, FormControl, InputLabel, Select, MenuItem, Dialog, DialogActions, DialogContent, DialogTitle, TextField, CircularProgress } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import SettingsIcon from '@mui/icons-material/Settings';
import WorkIcon from '@mui/icons-material/Work';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import GroupsIcon from '@mui/icons-material/Groups';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import LowPriorityIcon from '@mui/icons-material/LowPriority';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import { useRouter } from 'next/navigation';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { format } from 'date-fns';

import TimetableAnalytics from '../../components/timetable-analytics';

// Define types for our timetable entries
interface TimetableEntry {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  category: 'work' | 'personal' | 'study' | 'meeting' | 'other';
  priority: 'low' | 'medium' | 'high';
}

// Define database type for Supabase
interface DbTimetableEntry {
  id: string;
  user_id: string;
  title: string;
  description: string;
  start_time: string; // Using ISO string format for Supabase
  end_time: string; // Using ISO string format for Supabase
  category: 'work' | 'personal' | 'study' | 'meeting' | 'other';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

// Dynamic theme based on user preferences
const AddOnPageContent = () => {
  const { theme } = useCustomTheme();
  const { user, logout } = useAuth();
  const router = useRouter();
  // Dynamic theme based on user preferences using useMemo to prevent hooks order issues
  const muiTheme = useMemo(() => createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: theme.primaryColor || '#6750A4',
        light: theme.primaryColor ? `${theme.primaryColor}20` : '#EADDFF',
        dark: theme.primaryColor ? `${theme.primaryColor}CC` : '#6200EA',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: theme.secondaryColor || '#625B71',
        light: theme.secondaryColor ? `${theme.secondaryColor}20` : '#E8DEF8',
        dark: theme.secondaryColor ? `${theme.secondaryColor}CC` : '#4A4458',
        contrastText: '#FFFFFF',
      },
      background: {
        default: theme.backgroundColor || '#FEF7FF',
        paper: '#FFFFFF',
      },
      text: {
        primary: theme.textColor || '#1C1B1F',
        secondary: '#5F5D6B',
      },
      grey: {
        50: '#FAF9FE',
        100: '#F3F2F8',
        200: '#EBEAEE',
        300: '#E0DFE4',
        400: '#C8C6CD',
        500: '#A2A0A9',
        600: '#797781',
        700: '#5F5D6B',
        800: '#474654',
        900: '#302F3D',
      },
    },
    shape: {
      borderRadius: 12, // Material 3 rounded corners
    },
    typography: {
      fontFamily: [
        'Poppins',
        'Inter',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      h4: {
        fontWeight: 600,
        letterSpacing: '-0.02em',
      },
      h6: {
        fontWeight: 600,
        letterSpacing: '0.01em',
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
            },
          },
        },
      },
    },
  }), [theme]);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState<Date | null>(new Date());
  const [endTime, setEndTime] = useState<Date | null>(new Date(Date.now() + 60 * 60 * 1000)); // Default to 1 hour later
  const [category, setCategory] = useState<'work' | 'personal' | 'study' | 'meeting' | 'other'>('other');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // State for managing timetable entries
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<TimetableEntry | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openAnalyticsDialog, setOpenAnalyticsDialog] = useState(false);
    
  // Fetch timetable entries from database
  useEffect(() => {
    const fetchTimetableEntries = async () => {
      if (user && supabase) {
        try {
          const { data, error } = await supabase
            .from('timetable_entries')
            .select('*')
            .eq('user_id', user.id)
            .order('start_time', { ascending: false });
            
          if (error) throw error;
            
          if (data) {
            // Convert database entries to frontend format
            const formattedEntries: TimetableEntry[] = data.map(entry => ({
              id: entry.id,
              title: entry.title,
              description: entry.description,
              startTime: new Date(entry.start_time),
              endTime: new Date(entry.end_time),
              category: entry.category,
              priority: entry.priority,
            }));
            setTimetableEntries(formattedEntries);
          }
        } catch (error: any) {
          console.error('Error fetching timetable entries:', error.message);
        }
      }
    };
      
    fetchTimetableEntries();
  }, [user]);

  const handleLogout = () => {
    logout();
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleOpenAnalytics = () => {
    setOpenAnalyticsDialog(true);
  };

  // Handle opening the form for adding a new entry
  const handleAddEntry = () => {
    setCurrentEntry(null);
    setTitle('');
    setDescription('');
    setStartTime(new Date());
    setEndTime(new Date(Date.now() + 60 * 60 * 1000));
    setCategory('other');
    setPriority('medium');
    setOpenDialog(true);
  };

  // Handle opening the form for editing an entry
  const handleEditEntry = (entry: TimetableEntry) => {
    setCurrentEntry(entry);
    setTitle(entry.title);
    setDescription(entry.description);
    setStartTime(entry.startTime);
    setEndTime(entry.endTime);
    setCategory(entry.category);
    setPriority(entry.priority);
    setOpenDialog(true);
  };

  // Handle saving an entry
  const handleSaveEntry = async () => {
    if (!title.trim()) return;
    
    try {
      if (!supabase) {
        console.error('Supabase client not available');
        return;
      }
      
      if (currentEntry) {
        // Update existing entry in database
        const { error } = await supabase
          .from('timetable_entries')
          .update({
            title,
            description,
            start_time: startTime!.toISOString(),
            end_time: endTime!.toISOString(),
            category,
            priority,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentEntry.id)
          .eq('user_id', user?.id);
          
        if (error) throw error;
      } else {
        // Add new entry to database
        const { error } = await supabase
          .from('timetable_entries')
          .insert([{
            user_id: user?.id,
            title,
            description,
            start_time: startTime!.toISOString(),
            end_time: endTime!.toISOString(),
            category,
            priority,
          }]);
          
        if (error) throw error;
      }
      
      // Refresh the entries from database
      const { data, error } = await supabase
        .from('timetable_entries')
        .select('*')
        .eq('user_id', user?.id)
        .order('start_time', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        // Convert database entries to frontend format
        const formattedEntries: TimetableEntry[] = data.map(entry => ({
          id: entry.id,
          title: entry.title,
          description: entry.description,
          startTime: new Date(entry.start_time),
          endTime: new Date(entry.end_time),
          category: entry.category,
          priority: entry.priority,
        }));
        setTimetableEntries(formattedEntries);
      }
    } catch (error: any) {
      console.error('Error saving timetable entry:', error.message);
    }
    
    setOpenDialog(false);
  };

  // Handle deleting an entry
  const handleDeleteEntry = async (id: string) => {
    try {
      if (!supabase) {
        console.error('Supabase client not available');
        return;
      }
      
      const { error } = await supabase
        .from('timetable_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);
        
      if (error) throw error;
      
      // Refresh the entries from database
      const { data, error: fetchError } = await supabase
        .from('timetable_entries')
        .select('*')
        .eq('user_id', user?.id)
        .order('start_time', { ascending: false });
        
      if (fetchError) throw fetchError;
      
      if (data) {
        // Convert database entries to frontend format
        const formattedEntries: TimetableEntry[] = data.map(entry => ({
          id: entry.id,
          title: entry.title,
          description: entry.description,
          startTime: new Date(entry.start_time),
          endTime: new Date(entry.end_time),
          category: entry.category,
          priority: entry.priority,
        }));
        setTimetableEntries(formattedEntries);
      }
    } catch (error: any) {
      console.error('Error deleting timetable entry:', error.message);
    }
  };

  // Handle category change
  const handleCategoryChange = (event: any) => {
    setCategory(event.target.value as 'work' | 'personal' | 'study' | 'meeting' | 'other');
  };

  // Handle priority change
  const handlePriorityChange = (event: any) => {
    setPriority(event.target.value as 'low' | 'medium' | 'high');
  };

  // Define columns for the data grid
  const columns: GridColDef[] = [
    { field: 'title', headerName: 'Title', flex: 1 },
    { 
      field: 'startTime', 
      headerName: 'Start Time', 
      flex: 1,
      renderCell: (params: GridRenderCellParams<Date>) => 
        params.value ? format(params.value, 'MMM dd, yyyy HH:mm') : ''
    },
    { 
      field: 'endTime', 
      headerName: 'End Time', 
      flex: 1,
      renderCell: (params: GridRenderCellParams<Date>) => 
        params.value ? format(params.value, 'MMM dd, yyyy HH:mm') : ''
    },
    { 
      field: 'category', 
      headerName: 'Category', 
      flex: 0.5,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          size="small" 
          color={
            params.value === 'work' ? 'primary' :
            params.value === 'meeting' ? 'secondary' :
            params.value === 'study' ? 'info' :
            params.value === 'personal' ? 'success' : 'default'
          }
        />
      )
    },
    { 
      field: 'priority', 
      headerName: 'Priority', 
      flex: 0.5,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          size="small" 
          color={params.value === 'high' ? 'error' : params.value === 'medium' ? 'warning' : 'default'}
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      width: 150,
      renderCell: (params) => (
        <>
          <Button 
            size="small" 
            onClick={() => handleEditEntry(params.row)}
            color="primary"
          >
            Edit
          </Button>
          <Button 
            size="small" 
            onClick={() => handleDeleteEntry(params.row.id)}
            color="error"
          >
            Delete
          </Button>
        </>
      ),
    },
  ];

  // Show loading state while fetching data
  if (!user) {
    return (
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        <Box 
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress />
        </Box>
      </MuiThemeProvider>
    );
  }

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ 
          flexGrow: 1, 
          bgcolor: 'background.default',
          backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}>
          {/* Page Header */}
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                Time OS - Timetable
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '600px' }}>
                Manage your schedule and optimize your time usage with Time OS analytics.
              </Typography>
            </Box>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={handleAddEntry}
              sx={{ borderRadius: 2, py: 1.5, px: 3 }}
            >
              Add New Entry
            </Button>
          </Box>

          {/* Stats Overview */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <Card sx={{ p: 2, textAlign: 'center', flex: 1, minWidth: 150, backgroundColor: 'primary.light' }}>
              <Typography variant="h5" color="primary.dark" gutterBottom>{timetableEntries.length}</Typography>
              <Typography variant="body2" color="primary.main">Total Entries</Typography>
            </Card>
            <Card sx={{ p: 2, textAlign: 'center', flex: 1, minWidth: 150, backgroundColor: 'secondary.light' }}>
              <Typography variant="h5" color="secondary.dark" gutterBottom>
                {timetableEntries.filter(e => e.category === 'work').length}
              </Typography>
              <Typography variant="body2" color="secondary.main">Work Items</Typography>
            </Card>
            <Card sx={{ p: 2, textAlign: 'center', flex: 1, minWidth: 150, backgroundColor: 'error.light' }}>
              <Typography variant="h5" color="error.dark" gutterBottom>
                {timetableEntries.filter(e => e.priority === 'high').length}
              </Typography>
              <Typography variant="body2" color="error.main">High Priority</Typography>
            </Card>
          </Box>

          {/* Action Bar */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Button 
                variant="outlined" 
                color="secondary" 
                onClick={() => {
                  // Add export functionality here
                }}
                sx={{ px: 3, borderRadius: 2, py: 1.5, mr: 2 }}
              >
                Export
              </Button>
              <Button 
                variant="outlined" 
                color="info" 
                startIcon={<AutoGraphIcon />}
                onClick={handleOpenAnalytics}
                sx={{ px: 3, borderRadius: 2, py: 1.5 }}
              >
                Analytics
              </Button>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                Sort by:
              </Typography>
              <Select
                value="start_time"
                size="small"
                sx={{ minWidth: 120, borderRadius: 2 }}
              >
                <MenuItem value="start_time">Start Time</MenuItem>
                <MenuItem value="end_time">End Time</MenuItem>
                <MenuItem value="title">Title</MenuItem>
                <MenuItem value="priority">Priority</MenuItem>
              </Select>
            </Box>
          </Box>

          {/* Main Content Grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
            {/* Left Column - Table */}
            <Card elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600, mb: 2 }}>
                  Schedule Entries
                </Typography>
                <Paper sx={{ height: 600, width: '100%', overflow: 'hidden', borderRadius: 2 }}>
                  <DataGrid
                    rows={timetableEntries}
                    columns={columns}
                    pageSizeOptions={[5, 10, 20, 50]}
                    initialState={{
                      pagination: {
                        paginationModel: { page: 0, pageSize: 10 },
                      },
                      sorting: {
                        sortModel: [{ field: 'startTime', sort: 'asc' }],
                      },
                    }}
                    density="comfortable"
                    sx={{ border: 0, '& .MuiDataGrid-columnHeaders': { backgroundColor: 'grey.50', borderRadius: '8px 8px 0 0' } }}
                    slots={{
                      noRowsOverlay: () => (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', p: 3 }}>
                          <Box sx={{ textAlign: 'center' }}>
                            <EventNoteIcon sx={{ fontSize: 60, color: 'grey.300', mb: 2 }} />
                            <Typography color="text.secondary">No timetable entries found</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              Add your first entry to get started
                            </Typography>
                          </Box>
                        </Box>
                      ),
                    }}
                  />
                </Paper>
              </CardContent>
            </Card>

            {/* Right Column - Analytics */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                    Analytics Overview
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Button 
                      variant="outlined" 
                      color="info" 
                      startIcon={<AutoGraphIcon />}
                      onClick={handleOpenAnalytics}
                      sx={{ 
                        justifyContent: 'space-between',
                        borderRadius: 3,
                        p: 1.5,
                        '&:hover': {
                          backgroundColor: 'info.light',
                        }
                      }}
                    >
                      <Box sx={{ textAlign: 'left', flex: 1 }}>
                        <Typography variant="button" fontWeight="600">View Full Analytics</Typography>
                        <Typography variant="caption" color="text.secondary" display="block">Detailed time insights</Typography>
                      </Box>
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      startIcon={<EventAvailableIcon />}
                      onClick={handleAddEntry}
                      sx={{ 
                        justifyContent: 'space-between',
                        borderRadius: 3,
                        p: 1.5,
                        '&:hover': {
                          backgroundColor: 'primary.light',
                        }
                      }}
                    >
                      <Box sx={{ textAlign: 'left', flex: 1 }}>
                        <Typography variant="button" fontWeight="600">Add New Entry</Typography>
                        <Typography variant="caption" color="text.secondary" display="block">Schedule a new activity</Typography>
                      </Box>
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="secondary" 
                      startIcon={<SettingsIcon />}
                      onClick={() => {}}
                      sx={{ 
                        justifyContent: 'space-between',
                        borderRadius: 3,
                        p: 1.5,
                        '&:hover': {
                          backgroundColor: 'grey.100',
                        }
                      }}
                    >
                      <Box sx={{ textAlign: 'left', flex: 1 }}>
                        <Typography variant="button" fontWeight="600">Schedule Settings</Typography>
                        <Typography variant="caption" color="text.secondary" display="block">Configure your preferences</Typography>
                      </Box>
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
          
          {/* Dialog for adding/editing entries */}
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
              <DialogTitle sx={{ pb: 2, pt: 3, px: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ 
                    mr: 2, 
                    width: 48, 
                    height: 48, 
                    borderRadius: '50%', 
                    bgcolor: currentEntry ? 'warning.light' : 'success.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {currentEntry ? <EditIcon color="warning" /> : <AddIcon color="success" />}
                  </Box>
                  <Typography variant="h6" component="span" fontWeight="600">
                    {currentEntry ? 'Edit Timetable Entry' : 'Add New Timetable Entry'}
                  </Typography>
                </Box>
              </DialogTitle>
              <DialogContent dividers sx={{ pt: 2, pb: 1, px: 3 }}>
                <TextField
                  autoFocus
                  margin="normal"
                  label="Title"
                  fullWidth
                  variant="outlined"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <TextField
                  margin="normal"
                  label="Description"
                  fullWidth
                  multiline
                  minRows={3}
                  maxRows={6}
                  variant="outlined"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                  <DateTimePicker
                    label="Start Time"
                    value={startTime}
                    onChange={(newValue) => setStartTime(newValue)}
                    slotProps={{ textField: { fullWidth: true, sx: { '& .MuiOutlinedInput-root': { borderRadius: 2 } } } }}
                  />
                  <DateTimePicker
                    label="End Time"
                    value={endTime}
                    onChange={(newValue) => setEndTime(newValue)}
                    slotProps={{ textField: { fullWidth: true, sx: { '& .MuiOutlinedInput-root': { borderRadius: 2 } } } }}
                  />
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={category}
                      label="Category"
                      onChange={handleCategoryChange}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="work">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <WorkIcon fontSize="small" sx={{ mr: 1 }} />
                          Work
                        </Box>
                      </MenuItem>
                      <MenuItem value="personal">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                          Personal
                        </Box>
                      </MenuItem>
                      <MenuItem value="study">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <SchoolIcon fontSize="small" sx={{ mr: 1 }} />
                          Study
                        </Box>
                      </MenuItem>
                      <MenuItem value="meeting">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <GroupsIcon fontSize="small" sx={{ mr: 1 }} />
                          Meeting
                        </Box>
                      </MenuItem>
                      <MenuItem value="other">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <MoreHorizIcon fontSize="small" sx={{ mr: 1 }} />
                          Other
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={priority}
                      label="Priority"
                      onChange={handlePriorityChange}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="low">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LowPriorityIcon fontSize="small" sx={{ mr: 1 }} />
                          Low
                        </Box>
                      </MenuItem>
                      <MenuItem value="medium">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <SignalCellularAltIcon fontSize="small" sx={{ mr: 1 }} />
                          Medium
                        </Box>
                      </MenuItem>
                      <MenuItem value="high">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PriorityHighIcon fontSize="small" sx={{ mr: 1 }} />
                          High
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </DialogContent>
              <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
                <Button 
                  onClick={() => setOpenDialog(false)} 
                  color="inherit"
                  variant="outlined"
                  sx={{ borderRadius: 2, minWidth: 100 }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveEntry} 
                  variant="contained" 
                  color="primary"
                  disabled={!title.trim()}
                  startIcon={currentEntry ? <EditIcon /> : <AddIcon />}
                  sx={{ borderRadius: 2, minWidth: 120 }}
                >
                  {currentEntry ? 'Update Entry' : 'Add Entry'}
                </Button>
              </DialogActions>
            </Dialog>
          </LocalizationProvider>
          
          {/* Analytics Dialog */}
          <Dialog open={openAnalyticsDialog} onClose={() => setOpenAnalyticsDialog(false)} maxWidth="md" fullWidth>
            <DialogTitle sx={{ pb: 2, pt: 3, px: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ 
                  mr: 2, 
                  width: 48, 
                  height: 48, 
                  borderRadius: '50%', 
                  bgcolor: 'info.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <AutoGraphIcon color="info" />
                </Box>
                <Typography variant="h6" component="span" fontWeight="600">
                  Analytics Dashboard
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent dividers sx={{ pt: 2, pb: 1, px: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                      Quick Actions
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Button 
                        variant="outlined" 
                        color="primary" 
                        startIcon={<EventAvailableIcon />}
                        onClick={() => {
                          handleAddEntry();
                          setOpenAnalyticsDialog(false);
                        }}
                        sx={{ 
                          justifyContent: 'space-between',
                          borderRadius: 3,
                          p: 1.5,
                          '&:hover': {
                            backgroundColor: 'primary.light',
                          }
                        }}
                      >
                        <Box sx={{ textAlign: 'left', flex: 1 }}>
                          <Typography variant="button" fontWeight="600">Add New Entry</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">Schedule a new activity</Typography>
                        </Box>
                      </Button>
                      <Button 
                        variant="outlined" 
                        color="info" 
                        startIcon={<SettingsIcon />}
                        onClick={() => {
                          setOpenAnalyticsDialog(false);
                          // Add settings navigation here
                        }}
                        sx={{ 
                          justifyContent: 'space-between',
                          borderRadius: 3,
                          p: 1.5,
                          '&:hover': {
                            backgroundColor: 'info.light',
                          }
                        }}
                      >
                        <Box sx={{ textAlign: 'left', flex: 1 }}>
                          <Typography variant="button" fontWeight="600">Schedule Settings</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">Configure your preferences</Typography>
                        </Box>
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
                
                <TimetableAnalytics timetableEntries={timetableEntries} />
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setOpenAnalyticsDialog(false)} color="secondary" variant="outlined" sx={{ borderRadius: 2, minWidth: 100 }}>
                Close
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Container>
    </MuiThemeProvider>
  );
};

export default function AddOnPage() {
  return (
    <ProtectedLayout>
      <AddOnPageContent />
    </ProtectedLayout>
  );
}