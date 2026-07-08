'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import ProtectedLayout from '../protected-layout';
import { 
  Box, 
  Container, 
  Typography, 
  IconButton, 
  Paper, 
  Grid,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  ButtonGroup,
  TextField,
  InputAdornment,
  alpha,
  Autocomplete,
  Fab,
  Card,
  CardContent,
  useTheme
} from '@mui/material';
import { 
  ChevronLeft as ChevronLeftIcon, 
  ChevronRight as ChevronRightIcon,
  Event as EventIcon,
  Work as WorkIcon,
  Note as NoteIcon,
  Search as SearchIcon,
  ViewModule as MonthIcon,
  ViewWeek as WeekIcon,
  ViewDay as DayIcon
} from '@mui/icons-material';
import { 
  format, 
  addMonths, 
  subMonths, 
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  eachDayOfInterval,
  isSameMonth, 
  isSameDay,
  parseISO,
  isValid
} from 'date-fns';
import { SearchPanel } from '../../components/analytics/SearchPanel';
import { UnifiedSearchResult, TaskHistoryEntry, searchAllItems, getTaskHistory } from '../../lib/analytics-db';

import { getCalendarEntries } from '../../lib/personal-calendar-db';
import { getProfessionalTasks } from '../../lib/professional-db';
interface UnifiedEvent {
  id: string;
  title: string;
  date: Date;
  type: 'personal' | 'professional' | 'note';
  color: string;
  timeStr: string;
  status?: string;
  description?: string;
}


let cachedCalendarEvents: UnifiedEvent[] | null = null;

const CalendarPageContent = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<UnifiedEvent[]>(cachedCalendarEvents || []);
  const [loading, setLoading] = useState(!cachedCalendarEvents);
  
  const [selectedDayGroup, setSelectedDayGroup] = useState<{ date: Date, type: string, events: UnifiedEvent[] } | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSearchEvent, setSelectedSearchEvent] = useState<UnifiedEvent | null>(null);

  // Global Search State
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState<UnifiedSearchResult[]>([]);
  const [globalSearchLoading, setGlobalSearchLoading] = useState(false);
  const [globalSelectedItem, setGlobalSelectedItem] = useState<UnifiedSearchResult | null>(null);
  const [globalTaskHistory, setGlobalTaskHistory] = useState<TaskHistoryEntry[]>([]);

  useEffect(() => {
    if (!user || !globalSearchQuery.trim()) {
      setGlobalSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setGlobalSearchLoading(true);
      try {
        const results = await searchAllItems(user.id, globalSearchQuery);
        setGlobalSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setGlobalSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [globalSearchQuery, user]);

  const handleGlobalSelectItem = async (item: UnifiedSearchResult) => {
    setGlobalSelectedItem(item);
    if (user) {
      const history = await getTaskHistory(user.id, item.id);
      setGlobalTaskHistory(history);
    }
  };

  const fetchAllData = async () => {
    if (!user) return;
    if (!cachedCalendarEvents) setLoading(true);
    try {
      const [personal, professional] = await Promise.all([
        getCalendarEntries(user.id).catch(() => []),
        getProfessionalTasks(user.id).catch(() => [])
      ]);

      const formattedEvents: UnifiedEvent[] = [];

      personal.forEach((p: any) => {
        const d = parseISO(p.entry_date);
        if (isValid(d)) {
          formattedEvents.push({
            id: `pers-${p.id}`,
            title: p.title,
            date: d,
            type: 'personal',
            color: '#9C27B0',
            timeStr: format(d, 'HH:mm'),
            status: p.status,
            description: p.description
          });
        }
      });

      professional.forEach((p: any) => {
        const d = parseISO(p.task_date);
        if (isValid(d)) {
          formattedEvents.push({
            id: `prof-${p.id}`,
            title: p.title,
            date: d,
            type: 'professional',
            color: '#FF9800',
            timeStr: p.task_date.includes('T') ? format(d, 'HH:mm') : 'All Day',
            status: p.status,
            description: p.description
          });
        }
      });

      setEvents(formattedEvents);
      cachedCalendarEvents = formattedEvents;
    } catch (err) {
      console.error('Error fetching calendar data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [user]);

  let startDate: Date, endDate: Date;
  if (viewMode === 'month') {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    startDate = startOfWeek(monthStart);
    endDate = endOfWeek(monthEnd);
  } else if (viewMode === 'week') {
    startDate = startOfWeek(currentDate);
    endDate = endOfWeek(currentDate);
  } else {
    startDate = currentDate;
    endDate = currentDate;
  }
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextPeriod = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const prevPeriod = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const goToToday = () => setCurrentDate(new Date());


  const getIconForType = (type: string) => {
    switch (type) {
      case 'personal': return <EventIcon sx={{ fontSize: 14, mr: 0.5 }} />;
      case 'professional': return <WorkIcon sx={{ fontSize: 14, mr: 0.5 }} />;
      case 'note': return <NoteIcon sx={{ fontSize: 14, mr: 0.5 }} />;
      default: return null;
    }
  };

  const filteredEvents = events.filter(e => {
    if (selectedSearchEvent) {
      return e.id === selectedSearchEvent.id;
    }
    return searchQuery === '' || 
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  return (
    <Box sx={{ 
      flexGrow: 1, 
      minHeight: '100vh',
      background: (theme) => theme.palette.mode === 'dark'
        ? 'linear-gradient(135deg, #0f172a 0%, #064e3b 100%)'
        : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)'
    }}>
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          bgcolor: (theme) => alpha(theme.palette.background.paper, 0.85),
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          px: { xs: 2, md: 4 },
          py: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, md: 3 } }}>
            <Box 
              sx={{ 
                width: { xs: 40, md: 48 }, 
                height: { xs: 40, md: 48 }, 
                borderRadius: 3,
                background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(76, 175, 80, 0.35)'
              }}
            >
              <EventIcon sx={{ fontSize: 24, color: 'white' }} />
            </Box>
            <Box>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 800, 
                  mb: 0.5,
                  fontSize: { xs: '1.5rem', md: '2.125rem' },
                  background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  lineHeight: 1.2
                }}
              >
                My Complete Schedule
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'text.secondary',
                  fontSize: { xs: '0.875rem', md: '1rem' },
                  fontWeight: 500,
                  mt: 0.5
                }}
              >
                Manage your personal, professional, and note events
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box sx={{ minWidth: 200, maxWidth: 350, mr: 2 }}>
              <SearchPanel
                results={globalSearchResults}
                searchQuery={globalSearchQuery}
                onSearchChange={setGlobalSearchQuery}
                onSelectItem={handleGlobalSelectItem}
                selectedItem={globalSelectedItem}
                taskHistory={globalTaskHistory}
                onClose={() => { setGlobalSelectedItem(null); setGlobalTaskHistory([]); }}
                loading={globalSearchLoading}
              />
            </Box>
            <Chip icon={<EventIcon />} label="Personal" sx={{ bgcolor: alpha('#9C27B0', 0.1), color: '#9C27B0', fontWeight: 600 }} />
            <Chip icon={<WorkIcon />} label="Professional" sx={{ bgcolor: alpha('#FF9800', 0.1), color: '#FF9800', fontWeight: 600 }} />
          </Box>
        </Box>
      </Box>

      <Box sx={{ p: { xs: 1, sm: 3 } }}>
        <Paper sx={{ p: 2, borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 3, gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', minWidth: 200 }}>
              {viewMode === 'day' ? format(currentDate, 'MMMM d, yyyy') : format(currentDate, 'MMMM yyyy')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button onClick={goToToday} variant="outlined" size="small" sx={{ mr: 2, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                Today
              </Button>
              <IconButton onClick={prevPeriod} sx={{ bgcolor: 'action.hover', mr: 1, '&:hover': { bgcolor: 'action.selected' } }}>
                <ChevronLeftIcon />
              </IconButton>
              <IconButton onClick={nextPeriod} sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}>
                <ChevronRightIcon />
              </IconButton>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Autocomplete
              size="small"
              options={events}
              getOptionLabel={(option) => `${option.title} (${format(option.date, 'MMM d, yyyy')})`}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props as any;
                return (
                  <li key={option.id} {...otherProps}>
                    {option.title} ({format(option.date, 'MMM d, yyyy')})
                  </li>
                );
              }}
              value={selectedSearchEvent}
              onChange={(event, newValue) => {
                setSelectedSearchEvent(newValue);
                if (newValue) {
                  setSearchQuery(newValue.title);
                  setCurrentDate(newValue.date);
                  setViewMode('month');
                } else {
                  setSearchQuery('');
                }
              }}
              inputValue={searchQuery}
              onInputChange={(event, newInputValue, reason) => {
                setSearchQuery(newInputValue);
                if (reason === 'clear') {
                  setSelectedSearchEvent(null);
                }
              }}
              sx={{ minWidth: 300 }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search tasks or notes..."
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start" sx={{ pl: 1 }}>
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />
              )}
            />
            
            <ButtonGroup variant="outlined" size="small" aria-label="calendar view toggle" sx={{ '& .MuiButton-root': { textTransform: 'none', fontWeight: 600 } }}>
              <Button 
                onClick={() => setViewMode('month')} 
                variant={viewMode === 'month' ? 'contained' : 'outlined'}
                startIcon={<MonthIcon />}
              >
                Month
              </Button>
              <Button 
                onClick={() => setViewMode('week')} 
                variant={viewMode === 'week' ? 'contained' : 'outlined'}
                startIcon={<WeekIcon />}
              >
                Week
              </Button>
              <Button 
                onClick={() => setViewMode('day')} 
                variant={viewMode === 'day' ? 'contained' : 'outlined'}
                startIcon={<DayIcon />}
              >
                Day
              </Button>
            </ButtonGroup>
          </Box>
        </Box>

        {viewMode !== 'day' && (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 1 }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
              <Box sx={{ textAlign: 'center', fontWeight: 700, py: 1, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }} key={i}>
                {day}
              </Box>
            ))}
          </Box>
        )}

        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: viewMode === 'day' ? '1fr' : 'repeat(7, 1fr)',
            gap: '1px',
            bgcolor: 'divider',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            overflow: 'hidden'
          }}>
            {days.map((day, i) => {
              const dayEvents = filteredEvents.filter(e => isSameDay(e.date, day));
              const isCurrentMonth = isSameMonth(day, startOfMonth(currentDate));
              const isTodayDate = isSameDay(day, new Date());

              return (
                <Box 
                  key={i} 
                  sx={{ 
                    bgcolor: (isCurrentMonth || viewMode !== 'month') ? 'background.paper' : alpha('#000', 0.02),
                    minHeight: viewMode === 'day' ? 400 : { xs: 100, md: 140 },
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: (isCurrentMonth || viewMode !== 'month') ? alpha('#4CAF50', 0.02) : alpha('#000', 0.04),
                    }
                  }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: isTodayDate ? 800 : 600,
                      color: isTodayDate ? 'white' : ((isCurrentMonth || viewMode !== 'month') ? 'text.primary' : 'text.disabled'),
                      mb: 2,
                      textAlign: viewMode === 'day' ? 'left' : 'center',
                      fontSize: viewMode === 'day' ? '1.2rem' : undefined,
                      ...(isTodayDate && viewMode !== 'day' && {
                        bgcolor: '#4CAF50',
                        borderRadius: '50%',
                        width: 28,
                        height: 28,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 8px auto',
                        boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)'
                      }),
                      ...(isTodayDate && viewMode === 'day' && {
                        color: '#4CAF50',
                      })
                    }}
                  >
                    {viewMode === 'day' ? format(day, 'EEEE, MMMM d') : format(day, "d")}
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, overflowY: 'auto', flexGrow: 1, pb: 1, '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.1)', borderRadius: '4px' } }}>
                    {(() => {
                      const personalEvents = dayEvents.filter(e => e.type === 'personal');
                      const professionalEvents = dayEvents.filter(e => e.type === 'professional');
                      return (
                        <>
                          {personalEvents.length > 0 && (
                            <Box
                              onClick={(ev) => {
                                ev.stopPropagation();
                                setSelectedDayGroup({ date: day, type: 'personal', events: personalEvents });
                              }}
                              sx={{
                                bgcolor: alpha('#9C27B0', 0.12),
                                color: '#9C27B0',
                                px: 1.5,
                                py: 1,
                                borderRadius: 2,
                                fontSize: viewMode === 'day' ? '0.9rem' : '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'all 0.2s ease',
                                border: '1px solid transparent',
                                '&:hover': {
                                  bgcolor: alpha('#9C27B0', 0.2),
                                  borderColor: alpha('#9C27B0', 0.3),
                                  transform: 'translateY(-1px)'
                                }
                              }}
                            >
                              Personal: {personalEvents.length}
                            </Box>
                          )}
                          {professionalEvents.length > 0 && (
                            <Box
                              onClick={(ev) => {
                                ev.stopPropagation();
                                setSelectedDayGroup({ date: day, type: 'professional', events: professionalEvents });
                              }}
                              sx={{
                                bgcolor: alpha('#FF9800', 0.12),
                                color: '#FF9800',
                                px: 1.5,
                                py: 1,
                                borderRadius: 2,
                                fontSize: viewMode === 'day' ? '0.9rem' : '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                mt: 0.5,
                                transition: 'all 0.2s ease',
                                border: '1px solid transparent',
                                '&:hover': {
                                  bgcolor: alpha('#FF9800', 0.2),
                                  borderColor: alpha('#FF9800', 0.3),
                                  transform: 'translateY(-1px)'
                                }
                              }}
                            >
                              Professional: {professionalEvents.length}
                            </Box>
                          )}
                        </>
                      );
                    })()}
                    {dayEvents.length === 0 && viewMode === 'day' && (
                      <Typography variant="body1" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
                        No events for this day.
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
      </Paper>
      </Box>

      <Dialog 
        open={!!selectedDayGroup} 
        onClose={() => setSelectedDayGroup(null)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4, overflow: 'hidden' }
        }}
      >
        {selectedDayGroup && (
          <>
            <Box sx={{ height: 8, bgcolor: selectedDayGroup.type === 'personal' ? '#9C27B0' : '#FF9800', width: '100%' }} />
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(selectedDayGroup.type === 'personal' ? '#9C27B0' : '#FF9800', 0.1), color: selectedDayGroup.type === 'personal' ? '#9C27B0' : '#FF9800', width: 40, height: 40, borderRadius: 2 }}>
                  {selectedDayGroup.type === 'personal' ? <EventIcon /> : <WorkIcon />}
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {selectedDayGroup.type === 'personal' ? 'Personal' : 'Professional'} Tasks
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {format(selectedDayGroup.date, 'EEEE, MMMM d, yyyy')}
                  </Typography>
                </Box>
              </Box>
              <Chip label={`${selectedDayGroup.events.length} Tasks`} sx={{ fontWeight: 600, bgcolor: alpha(selectedDayGroup.type === 'personal' ? '#9C27B0' : '#FF9800', 0.1), color: selectedDayGroup.type === 'personal' ? '#9C27B0' : '#FF9800' }} />
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0, bgcolor: alpha('#000', 0.01) }}>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                {selectedDayGroup.events.map((event, idx) => (
                  <Box key={event.id} sx={{ p: 3, borderBottom: idx < selectedDayGroup.events.length - 1 ? '1px solid' : 'none', borderColor: 'divider', bgcolor: 'background.paper', transition: 'all 0.2s ease', '&:hover': { bgcolor: alpha(event.color, 0.02) } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>{event.title}</Typography>
                      {event.timeStr !== 'All Day' && (
                        <Typography variant="body2" sx={{ fontWeight: 600, color: event.color, bgcolor: alpha(event.color, 0.1), px: 1.5, py: 0.5, borderRadius: 2 }}>
                          {event.timeStr}
                        </Typography>
                      )}
                    </Box>
                    {event.status && (
                      <Chip label={event.status.toUpperCase()} size="small" variant="outlined" sx={{ fontWeight: 600, mb: 2 }} />
                    )}
                    {event.description && (
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary', mt: 1 }}>
                        {event.description}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2, px: 3 }}>
              <Button onClick={() => setSelectedDayGroup(null)} variant="contained" sx={{ bgcolor: selectedDayGroup.type === 'personal' ? '#9C27B0' : '#FF9800', '&:hover': { bgcolor: alpha(selectedDayGroup.type === 'personal' ? '#9C27B0' : '#FF9800', 0.8) }, borderRadius: 2, px: 4, textTransform: 'none', fontWeight: 600 }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default function CalendarPage() {
  return (
    <ProtectedLayout>
      <CalendarPageContent />
    </ProtectedLayout>
  );
}