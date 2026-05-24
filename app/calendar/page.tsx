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
  Fab
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

import { getCalendarEntries } from '../../lib/personal-calendar-db';
import { getProfessionalTasks } from '../../lib/professional-db';
import { getNotes } from '../../lib/notes-db';

interface UnifiedEvent {
  id: string;
  title: string;
  date: Date;
  type: 'personal' | 'professional' | 'note';
  color: string;
  timeStr?: string;
  status?: string;
  description?: string;
}

const CalendarPageContent = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<UnifiedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedEvent, setSelectedEvent] = useState<UnifiedEvent | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSearchEvent, setSelectedSearchEvent] = useState<UnifiedEvent | null>(null);

  const fetchAllData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [personal, professional, notes] = await Promise.all([
        getCalendarEntries(user.id).catch(() => []),
        getProfessionalTasks(user.id).catch(() => []),
        getNotes(user.id).catch(() => [])
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

      notes.forEach((n: any) => {
        const d = parseISO(n.created_at);
        if (isValid(d)) {
          formattedEvents.push({
            id: `note-${n.id}`,
            title: n.title,
            date: d,
            type: 'note',
            color: '#6750A4',
            timeStr: format(d, 'HH:mm'),
            description: n.content
          });
        }
      });

      setEvents(formattedEvents);
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

  const handleEventClick = (e: React.MouseEvent, event: UnifiedEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
  };

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
    <Box sx={{ flexGrow: 1, p: { xs: 1, sm: 3 } }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 3, gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          My Complete Schedule
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip icon={<EventIcon />} label="Personal" sx={{ bgcolor: alpha('#9C27B0', 0.1), color: '#9C27B0', fontWeight: 600 }} />
          <Chip icon={<WorkIcon />} label="Professional" sx={{ bgcolor: alpha('#FF9800', 0.1), color: '#FF9800', fontWeight: 600 }} />
          <Chip icon={<NoteIcon />} label="Notes" sx={{ bgcolor: alpha('#6750A4', 0.1), color: '#6750A4', fontWeight: 600 }} />
        </Box>
      </Box>

      <Paper sx={{ p: 2, borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', lg: 'center' }, mb: 3, gap: 2 }}>
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

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <CircularProgress size={40} thickness={4} />
          </Box>
        ) : (
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
                    {dayEvents.sort((a, b) => a.date.getTime() - b.date.getTime()).map((e) => (
                      <Box
                        key={e.id}
                        onClick={(ev) => handleEventClick(ev, e)}
                        sx={{
                          bgcolor: alpha(e.color, 0.12),
                          color: e.color,
                          px: 1.5,
                          py: 1,
                          borderRadius: 2,
                          fontSize: viewMode === 'day' ? '0.9rem' : '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          whiteSpace: viewMode === 'day' ? 'normal' : 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          transition: 'all 0.2s ease',
                          border: '1px solid',
                          borderColor: 'transparent',
                          '&:hover': {
                            bgcolor: alpha(e.color, 0.2),
                            borderColor: alpha(e.color, 0.3),
                            transform: 'translateY(-1px)'
                          }
                        }}
                      >
                        {getIconForType(e.type)}
                        <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', gap: 1 }}>
                          {e.timeStr !== 'All Day' && <span style={{ opacity: 0.8 }}>{e.timeStr}</span>}
                          <span>{e.title}</span>
                        </Box>
                      </Box>
                    ))}
                    {dayEvents.length === 0 && viewMode === 'day' && (
                      <Typography variant="body1" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
                        No events or notes for this day.
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Paper>

      <Dialog 
        open={!!selectedEvent} 
        onClose={() => setSelectedEvent(null)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4, overflow: 'hidden' }
        }}
      >
        {selectedEvent && (
          <>
            <Box sx={{ height: 8, bgcolor: selectedEvent.color, width: '100%' }} />
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pt: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(selectedEvent.color, 0.1), color: selectedEvent.color, width: 40, height: 40, borderRadius: 2 }}>
                {getIconForType(selectedEvent.type)}
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {selectedEvent.title}
              </Typography>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                    Date & Time
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {format(selectedEvent.date, 'EEEE, MMMM d, yyyy')} {selectedEvent.timeStr !== 'All Day' ? `at ${selectedEvent.timeStr}` : ''}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <Chip label={selectedEvent.type.toUpperCase()} size="small" sx={{ bgcolor: alpha(selectedEvent.color, 0.1), color: selectedEvent.color, fontWeight: 700, letterSpacing: '0.05em' }} />
                {selectedEvent.status && (
                  <Chip label={selectedEvent.status.toUpperCase()} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                )}
              </Box>

              {selectedEvent.description && (
                <Box sx={{ mt: 2, bgcolor: alpha('#000', 0.02), p: 2, borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', mb: 1, display: 'block' }}>
                    Details
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {selectedEvent.description}
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2, px: 3 }}>
              <Button onClick={() => setSelectedEvent(null)} variant="contained" sx={{ bgcolor: selectedEvent.color, '&:hover': { bgcolor: alpha(selectedEvent.color, 0.8) }, borderRadius: 2, px: 4, textTransform: 'none', fontWeight: 600 }}>
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