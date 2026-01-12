'use client';

import { useState, useEffect } from 'react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addDays,
    parseISO,
    isValid
} from 'date-fns';
import {
    Box,
    Typography,
    Button,
    IconButton,
    Checkbox,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Tooltip,
    Divider,
    CircularProgress
} from '@mui/material';
import {
    ChevronLeft,
    ChevronRight,
    Add as AddIcon,
    Search as SearchIcon,
    HelpOutline as HelpIcon,
    Settings as SettingsIcon,
    CalendarMonth as CalendarIcon,
    HealthAndSafety as HealthIcon,
    AccountBalanceWallet as WealthIcon,
    Event as EventIcon,
    Assignment as TaskIcon,
    Flag as GoalIcon,
    SelfImprovement as AdlIcon,
    FamilyRestroom as FamilyIcon,
    TheaterComedy as EntertainmentIcon,
    House as HouseholdIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import ProtectedLayout from '../protected-layout';
import { useAuth } from '../../lib/auth-context';
import { getCalendarEntries, addCalendarEntry, deleteCalendarEntry } from '../../lib/personal-calendar-db';

// Category Definitions
const CATEGORIES = [
    { id: 'health', label: 'Health', color: '#10b981', icon: <HealthIcon sx={{ fontSize: '0.8rem' }} /> },
    { id: 'wealth', label: 'Wealth', color: '#f59e0b', icon: <WealthIcon sx={{ fontSize: '0.8rem' }} /> },
    { id: 'event', label: 'Event', color: '#6366f1', icon: <EventIcon sx={{ fontSize: '0.8rem' }} /> },
    { id: 'task', label: 'Task', color: '#3b82f6', icon: <TaskIcon sx={{ fontSize: '0.8rem' }} /> },
    { id: 'goal', label: 'Goal', color: '#8b5cf6', icon: <GoalIcon sx={{ fontSize: '0.8rem' }} /> },
    { id: 'adls', label: 'ADLs', color: '#14b8a6', icon: <AdlIcon sx={{ fontSize: '0.8rem' }} /> },
    { id: 'family', label: 'Family', color: '#f97316', icon: <FamilyIcon sx={{ fontSize: '0.8rem' }} /> },
    { id: 'entertainment', label: 'Entertainment', color: '#ec4899', icon: <EntertainmentIcon sx={{ fontSize: '0.8rem' }} /> },
    { id: 'household', label: 'Household', color: '#f43f5e', icon: <HouseholdIcon sx={{ fontSize: '0.8rem' }} /> },
];

interface CalendarEntry {
    id: string;
    title: string;
    date: Date;
    category: string;
}

const PersonalCalendarPage = () => {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [entries, setEntries] = useState<CalendarEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('event');
    const [newEntryTitle, setNewEntryTitle] = useState('');
    const [newEntryDate, setNewEntryDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [visibleCategories, setVisibleCategories] = useState<Record<string, boolean>>(
        CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.id]: true }), {})
    );

    // Fetch entries from DB
    useEffect(() => {
        if (user) {
            fetchEntries();
        }
    }, [user]);

    const fetchEntries = async () => {
        if (!user) return;
        setLoading(true);
        const dbEntries = await getCalendarEntries(user.id);

        // Map DB entries to local state format
        const mappedEntries: CalendarEntry[] = dbEntries.map(entry => {
            const date = parseISO(entry.entry_date);
            return {
                id: entry.id,
                title: entry.title,
                category: entry.category,
                date: isValid(date) ? date : new Date()
            };
        });

        setEntries(mappedEntries);
        setLoading(false);
    };

    // Calendar Logic
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    // Mini Calendar Logic
    const miniMonthStart = startOfMonth(currentDate);
    const miniMonthEnd = endOfMonth(miniMonthStart);
    const miniStartDate = startOfWeek(miniMonthStart);
    const miniEndDate = endOfWeek(miniMonthEnd);
    const miniDays = eachDayOfInterval({ start: miniStartDate, end: miniEndDate });

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const goToToday = () => setCurrentDate(new Date());

    const handleAddEntry = async () => {
        if (!newEntryTitle || !user) return;

        const entryToAdd = {
            user_id: user.id,
            title: newEntryTitle,
            category: selectedCategory,
            entry_date: new Date(newEntryDate).toISOString()
        };

        const addedEntry = await addCalendarEntry(entryToAdd);

        if (addedEntry) {
            const mappedAdded: CalendarEntry = {
                id: addedEntry.id,
                title: addedEntry.title,
                category: addedEntry.category,
                date: parseISO(addedEntry.entry_date)
            };
            setEntries([...entries, mappedAdded]);
            setNewEntryTitle('');
            setOpenDialog(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const success = await deleteCalendarEntry(id);
        if (success) {
            setEntries(entries.filter(entry => entry.id !== id));
        }
    };

    const toggleCategory = (categoryId: string) => {
        setVisibleCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
    };

    const filteredEntries = entries.filter(entry => visibleCategories[entry.category]);

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 64px)',
            bgcolor: 'background.default',
            m: -4, // Counteract ProtectedLayout padding
            overflow: 'hidden'
        }}>
            {/* Header */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 3,
                py: 1,
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: '#FFFFFF',
                zIndex: 10
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600, mr: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon /> Personal Life
                    </Typography>
                    <Button variant="outlined" size="small" onClick={goToToday} sx={{ borderRadius: 1.5, textTransform: 'none', color: 'text.primary', borderColor: 'divider', fontWeight: 500 }}>
                        Today
                    </Button>
                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                        <IconButton size="small" onClick={prevMonth}><ChevronLeft fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={nextMonth}><ChevronRight fontSize="small" /></IconButton>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 400, ml: 1, fontSize: '1.25rem' }}>
                        {format(currentDate, 'MMMM yyyy')}
                    </Typography>
                    {loading && <CircularProgress size={20} sx={{ ml: 2 }} />}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Tooltip title="Search"><IconButton size="small"><SearchIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Support"><IconButton size="small"><HelpIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Settings"><IconButton size="small"><SettingsIcon fontSize="small" /></IconButton></Tooltip>
                    <Select
                        size="small"
                        value="Month"
                        sx={{
                            borderRadius: 1.5,
                            height: 36,
                            fontSize: '0.875rem',
                            ml: 1,
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' }
                        }}
                        disabled
                    >
                        <MenuItem value="Month">Month</MenuItem>
                    </Select>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Left Sidebar */}
                <Box sx={{
                    width: 256,
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: '#FFFFFF',
                    overflowY: 'auto'
                }}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon sx={{ fontSize: 28 }} />}
                        onClick={() => setOpenDialog(true)}
                        sx={{
                            borderRadius: 7,
                            py: 1,
                            px: 2.5,
                            mb: 3,
                            textTransform: 'none',
                            boxShadow: '0 1px 2px 0 rgba(60,64,67,.30), 0 1px 3px 1px rgba(60,64,67,.15)',
                            bgcolor: '#FFFFFF',
                            color: 'text.primary',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            width: 'fit-content',
                            '&:hover': {
                                bgcolor: '#f1f3f4',
                                boxShadow: '0 4px 4px 0 rgba(60,64,67,.30), 0 8px 12px 6px rgba(60,64,67,.15)',
                            }
                        }}
                    >
                        Create
                    </Button>

                    {/* Mini Calendar */}
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, px: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>{format(currentDate, 'MMMM yyyy')}</Typography>
                            <Box>
                                <IconButton size="small" onClick={prevMonth} sx={{ p: 0.25 }}><ChevronLeft fontSize="inherit" /></IconButton>
                                <IconButton size="small" onClick={nextMonth} sx={{ p: 0.25 }}><ChevronRight fontSize="inherit" /></IconButton>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, textAlign: 'center' }}>
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                <Typography key={`mini-day-${i}`} variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 600 }}>{d}</Typography>
                            ))}
                            {miniDays.map((day, i) => (
                                <Box
                                    key={i}
                                    sx={{
                                        fontSize: '0.7rem',
                                        height: 24,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '50%',
                                        cursor: 'pointer',
                                        color: isSameMonth(day, currentDate) ? 'text.primary' : 'text.disabled',
                                        bgcolor: isSameDay(day, new Date()) ? 'primary.main' : 'transparent',
                                        '&:hover': { bgcolor: isSameDay(day, new Date()) ? 'primary.dark' : '#f1f3f4' },
                                        ...(isSameDay(day, new Date()) && { color: '#FFFFFF' })
                                    }}
                                    onClick={() => setCurrentDate(day)}
                                >
                                    {format(day, 'd')}
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, px: 1, fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        My Calendars
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                        {CATEGORIES.map(cat => (
                            <Box key={cat.id} sx={{
                                display: 'flex',
                                alignItems: 'center',
                                px: 1,
                                py: 0.25,
                                '&:hover': { bgcolor: '#f1f3f4', borderRadius: 1 },
                                cursor: 'pointer'
                            }} onClick={() => toggleCategory(cat.id)}>
                                <Checkbox
                                    size="small"
                                    checked={visibleCategories[cat.id]}
                                    sx={{
                                        p: 0.5,
                                        color: cat.color,
                                        '&.Mui-checked': { color: cat.color }
                                    }}
                                />
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, ml: 0.5 }}>
                                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                                        {cat.label}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* Main Calendar Grid */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#FFFFFF' }}>
                        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, index) => (
                            <Box key={`header-${index}`} sx={{ py: 1, textAlign: 'center', borderRight: '1px solid', borderColor: 'divider', '&:last-child': { borderRight: 'none' } }}>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.7rem' }}>
                                    {day}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        gridAutoRows: '1fr',
                        flex: 1,
                        overflowY: 'auto',
                        bgcolor: 'divider'
                    }}>
                        {calendarDays.map((day, idx) => {
                            const dayEntries = filteredEntries.filter(entry => isSameDay(entry.date, day));
                            const isCurrentMonth = isSameMonth(day, monthStart);
                            const isToday = isSameDay(day, new Date());

                            return (
                                <Box
                                    key={idx}
                                    sx={{
                                        bgcolor: isCurrentMonth ? '#FFFFFF' : '#f8f9fa',
                                        p: 0.5,
                                        minHeight: 120,
                                        borderRight: '1px solid',
                                        borderBottom: '1px solid',
                                        borderColor: 'divider',
                                        transition: 'background-color 0.2s',
                                        '&:hover': { bgcolor: isCurrentMonth ? '#fafafa' : '#f1f3f4' }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5 }}>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                width: 28,
                                                height: 28,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: '50%',
                                                fontSize: '0.75rem',
                                                fontWeight: isToday ? 700 : 500,
                                                bgcolor: isToday ? 'primary.main' : 'transparent',
                                                color: isToday ? '#FFFFFF' : (isCurrentMonth ? 'text.primary' : 'text.disabled'),
                                                '&:hover': { bgcolor: isToday ? 'primary.dark' : '#f1f3f4' },
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {format(day, 'd')}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                        {dayEntries.map(entry => {
                                            const cat = CATEGORIES.find(c => c.id === entry.category);
                                            return (
                                                <Box
                                                    key={entry.id}
                                                    sx={{
                                                        bgcolor: cat?.color || 'primary.main',
                                                        color: '#FFFFFF',
                                                        px: 1,
                                                        py: 0.5,
                                                        borderRadius: 1,
                                                        fontSize: '0.725rem',
                                                        fontWeight: 600,
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                                        '&:hover': {
                                                            filter: 'brightness(0.9)',
                                                            transform: 'translateY(-1px)',
                                                            '& .delete-btn': { opacity: 1 }
                                                        },
                                                        transition: 'all 0.1s'
                                                    }}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, overflow: 'hidden' }}>
                                                        {cat?.icon}
                                                        <Typography variant="inherit" noWrap>{entry.title}</Typography>
                                                    </Box>
                                                    <IconButton
                                                        className="delete-btn"
                                                        size="small"
                                                        onClick={(e) => handleDelete(e, entry.id)}
                                                        sx={{
                                                            p: 0,
                                                            color: 'inherit',
                                                            opacity: 0,
                                                            transition: 'opacity 0.2s',
                                                            '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                                                        }}
                                                    >
                                                        <DeleteIcon sx={{ fontSize: '0.9rem' }} />
                                                    </IconButton>
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>
                </Box>
            </Box>

            {/* Add Entry Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>Create New Entry</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            label="Title"
                            fullWidth
                            variant="standard"
                            value={newEntryTitle}
                            onChange={(e) => setNewEntryTitle(e.target.value)}
                            autoFocus
                        />
                        <TextField
                            label="Date"
                            type="date"
                            fullWidth
                            variant="standard"
                            value={newEntryDate}
                            onChange={(e) => setNewEntryDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                        <FormControl fullWidth variant="standard">
                            <InputLabel>Category</InputLabel>
                            <Select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                {CATEGORIES.map(cat => (
                                    <MenuItem key={cat.id} value={cat.id}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: cat.color }} />
                                            {cat.label}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setOpenDialog(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
                    <Button
                        onClick={handleAddEntry}
                        variant="contained"
                        disabled={!newEntryTitle}
                        sx={{ textTransform: 'none', borderRadius: 5 }}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default function PersonalPage() {
    return (
        <ProtectedLayout>
            <PersonalCalendarPage />
        </ProtectedLayout>
    );
}
