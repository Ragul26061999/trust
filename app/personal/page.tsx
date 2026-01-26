'use client';

import React, { useState, useEffect } from 'react';
import {
    format,
    addMonths,
    subMonths,
    addWeeks,
    subWeeks,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isSameWeek,
    addDays,
    parseISO,
    isValid,
    getDayOfYear,
    getWeek,
    getISOWeeksInYear,
    isLeapYear
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
    FormControlLabel,
    InputLabel,
    Tooltip,
    Divider,
    CircularProgress,
    Chip,
    Card,
    CardContent,
    Alert,
    Snackbar,
    Tabs,
    Tab,
    Switch,
    Slider,
    Grid
} from '@mui/material';
import {
    ChevronLeft,
    ChevronRight,
    ArrowBack as ArrowBackIcon,
    Add as AddIcon,
    Search as SearchIcon,
    HelpOutline as HelpIcon,
    Settings as SettingsIcon,
    CalendarMonth as CalendarIcon,
    HealthAndSafety as HealthIcon,
    AccountBalanceWallet as WealthIcon,
    Event as EventIcon,
    Assignment as TaskIcon,
    Assignment as AssignmentIcon,
    Flag as GoalIcon,
    SelfImprovement as AdlIcon,
    FamilyRestroom as FamilyIcon,
    TheaterComedy as EntertainmentIcon,
    House as HouseholdIcon,
    Delete as DeleteIcon,
    BarChart as AnalyticsIcon,
    ExpandMore as ExpandMoreIcon,
    CheckCircle as CheckCircleIcon,
    RadioButtonUnchecked as RadioButtonUncheckedIcon,
    Edit as EditIcon,
    Insights as InsightsIcon,
    Email as EmailIcon,
    Notifications as NotificationIcon,
    Sync as SyncIcon,
    Feedback as FeedbackIcon,
    CloudSync as CloudSyncIcon,
    AccessTime as TimeIcon,
    TrendingUp as TrendingUpIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import ProtectedLayout from '../protected-layout';
import { useAuth } from '../../lib/auth-context';
import { useRouter } from 'next/navigation';
import { getCalendarEntries, addCalendarEntry, updateCalendarEntry, deleteCalendarEntry, getCustomCalendars, addCustomCalendar } from '../../lib/personal-calendar-db';
import { 
    getTimezonePreference, 
    setTimezonePreference, 
    getNotificationSettings, 
    updateNotificationSettings,
    getTimezoneOptions,
    detectUserTimezone
} from '../../lib/settings-service';
import { 
    submitFeedback, 
    FEEDBACK_CATEGORIES, 
    PRIORITY_LEVELS,
    validateFeedback
} from '../../lib/feedback-service';
import { 
    getUserCalendarIntegrations,
    createCalendarIntegration,
    deleteCalendarIntegration,
    toggleCalendarSync,
    syncCalendarIntegration,
    updateSyncFrequency,
    CALENDAR_PROVIDERS,
    SYNC_FREQUENCIES,
    type CalendarProvider,
    type SyncFrequency
} from '../../lib/calendar-integration-service';
import { convertFromUTC } from '../../lib/timezone-utils';

// Category Definitions
const CATEGORIES = [
    { id: 'health', label: 'Health', color: '#10b981', icon: <HealthIcon sx={{ fontSize: '0.8rem' }} /> },
    { id: 'wealth', label: 'Wealth', color: '#f59e0b', icon: <WealthIcon sx={{ fontSize: '0.8rem' }} /> },
    { id: 'event', label: 'Event', color: '#6366f1', icon: <EventIcon sx={{ fontSize: '0.8rem' }} /> },
    { id: 'task', label: 'Task', color: '#3b82f6', icon: <TaskIcon sx={{ fontSize: '0.8rem' }} /> },
    { id: 'goal', label: 'Goal', color: '#8b5cf6', icon: <GoalIcon sx={{ fontSize: '0.8rem' }} /> },
    { id: 'adls', label: "ADL's", color: '#14b8a6', icon: <AdlIcon sx={{ fontSize: '0.8rem' }} /> },
    { id: 'family', label: 'Family', color: '#f97316', icon: <FamilyIcon sx={{ fontSize: '0.8rem' }} /> },
    { id: 'entertainment', label: 'Entertainment', color: '#ec4899', icon: <EntertainmentIcon sx={{ fontSize: '0.8rem' }} /> },
    { id: 'household', label: 'Household', color: '#f43f5e', icon: <HouseholdIcon sx={{ fontSize: '0.8rem' }} /> },
];

interface CalendarEntry {
    id: string;
    title: string;
    date: Date;
    category: string;
    category_data?: any;
    priority?: string;
    status?: string;
    description?: string;
    source?: string;
    integrationId?: string;
}

interface CustomCalendar {
    id: string;
    name: string;
    color: string;
    visible: boolean;
}

const PersonalCalendarPage = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [view, setView] = useState<'month' | 'week' | 'day'>('month');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentDate, setCurrentDate] = useState(new Date());
    const [entries, setEntries] = useState<CalendarEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('event');
    const [selectedPriority, setSelectedPriority] = useState('Medium');
    const [newEntryTitle, setNewEntryTitle] = useState('');
    const [newEntryDate, setNewEntryDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [newEntryTime, setNewEntryTime] = useState(format(new Date(), 'HH:mm'));
    const [categoryData, setCategoryData] = useState<any>({});
    const [editingEntry, setEditingEntry] = useState<CalendarEntry & { dateStr: string, timeStr: string } | null>(null);
    const [multipleEntries, setMultipleEntries] = useState<{ title: string, date: string }[]>([{ title: '', date: format(new Date(), 'yyyy-MM-dd') }]);
    const [goalDuration, setGoalDuration] = useState('day');
    const [goalRecurring, setGoalRecurring] = useState(false);
    const [visibleCategories, setVisibleCategories] = useState<Record<string, boolean>>(
        CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.id]: true }), {})
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchBar, setShowSearchBar] = useState(false);
    const [showNoteDetails, setShowNoteDetails] = useState<Record<string, boolean>>({});
    const [openSettings, setOpenSettings] = useState(false);
    const [categoriesExpanded, setCategoriesExpanded] = useState(true);
    const [otherCalendarsExpanded, setOtherCalendarsExpanded] = useState(true);
    const [otherCalendars, setOtherCalendars] = useState<CustomCalendar[]>([]);
    const [showAddCalendarDialog, setShowAddCalendarDialog] = useState(false);
    const [newCalendarName, setNewCalendarName] = useState('');
    const [newCalendarColor, setNewCalendarColor] = useState('#6366f1');
    
    // Settings State
    const [settingsTab, setSettingsTab] = useState(0);
    const [timezone, setTimezone] = useState('UTC');
    const [notificationSettings, setNotificationSettings] = useState({
        email: true,
        push: true,
        daily_reminders: false,
        frequency: 'daily'
    });
    const [calendarIntegrations, setCalendarIntegrations] = useState<any[]>([]);
    const [feedbackForm, setFeedbackForm] = useState({
        category: 'general',
        subject: '',
        message: '',
        priority: 'medium'
    });
    
    // Loading and Error States
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' | 'info' });
    
    // Calendar Integration States
    const [showAddCalendarIntegration, setShowAddCalendarIntegration] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<CalendarProvider>('google');
    const [integrationDisplayName, setIntegrationDisplayName] = useState('');
    const [integrationEmail, setIntegrationEmail] = useState('');
    const [syncingIntegrationId, setSyncingIntegrationId] = useState<string | null>(null);
    
    // Analytics State
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [analyticsFilter, setAnalyticsFilter] = useState('all'); // all, today, week, month
    const [analyticsCategory, setAnalyticsCategory] = useState('all');

    const handleCategoryDataChange = (field: string, value: any) => {
        setCategoryData((prev: any) => ({ ...prev, [field]: value }));
    };
    // Fetch entries and custom calendars from DB
    useEffect(() => {
        if (user) {
            fetchEntries();
            fetchCustomCalendars();
            loadUserSettings();
            loadCalendarIntegrations();
        }
    }, [user]);

    // Load user settings
    const loadUserSettings = async () => {
        if (!user) return;
        
        setSettingsLoading(true);
        
        try {
            // Load timezone preference
            const tz = await getTimezonePreference(user.id);
            if (tz) {
                setTimezone(tz);
            }
            
            // Load notification settings
            const notifSettings = await getNotificationSettings(user.id);
            if (notifSettings) {
                setNotificationSettings(notifSettings);
            }
        } catch (error) {
            console.error('Error loading user settings:', error);
        } finally {
            setSettingsLoading(false);
        }
    };

    // Load calendar integrations
    const loadCalendarIntegrations = async () => {
        if (!user) return;
        
        try {
            const integrations = await getUserCalendarIntegrations(user.id);
            if (integrations) {
                setCalendarIntegrations(integrations);
                
                // Fetch external calendar events for connected calendars
                await fetchExternalCalendarEvents(integrations);
            }
        } catch (error) {
            console.error('Error loading calendar integrations:', error);
        }
    };

    // Fetch external calendar events from connected integrations
    const fetchExternalCalendarEvents = async (integrations: any[]) => {
        if (!user) return;
        
        try {
            // Filter for connected and enabled integrations
            const activeIntegrations = integrations.filter(
                (integration: any) => integration.sync_enabled && integration.sync_status === 'connected'
            );
            
            // For each active integration, fetch events (simulated here)
            for (const integration of activeIntegrations) {
                // In a real implementation, this would call the external calendar API
                // For now, we'll simulate with mock data
                const externalEvents = await simulateFetchExternalEvents(integration);
                
                // Convert external events to our calendar entry format
                const externalEntries = externalEvents.map((event: any) => {
                    return {
                        id: `external_${integration.id}_${event.id}`,
                        title: event.summary || event.title,
                        date: convertFromUTC(new Date(event.start.dateTime || event.start.date), timezone),
                        category: 'event', // Default to event category for external events
                        priority: 'Medium',
                        status: 'pending',
                        description: event.description || '',
                        source: 'external', // Mark as external source
                        integrationId: integration.id
                    };
                });
                
                // Add external events to the entries state
                setEntries(prevEntries => {
                    // Remove old external events from this integration
                    const filteredEntries = prevEntries.filter(entry => 
                        entry.source !== 'external' || entry.integrationId !== integration.id
                    );
                    
                    // Add new external events
                    return [...filteredEntries, ...externalEntries];
                });
            }
        } catch (error) {
            console.error('Error fetching external calendar events:', error);
        }
    };

    // Simulate fetching external calendar events (in real implementation, this would call actual APIs)
    const simulateFetchExternalEvents = async (integration: any): Promise<any[]> => {
        // This is a simulation - in real implementation, this would call Google Calendar API, etc.
        // depending on the integration provider
        
        // Return mock events for demonstration
        if (integration.sync_enabled) {
            return [
                {
                    id: 'mock_event_1',
                    summary: `Mock ${integration.provider} Event`,
                    description: `This is a simulated event from ${integration.provider}`,
                    start: { dateTime: new Date(Date.now() + 86400000).toISOString() }, // Tomorrow
                    end: { dateTime: new Date(Date.now() + 86400000 + 3600000).toISOString() } // Tomorrow + 1 hour
                }
            ];
        }
        return [];
    };

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
                category_data: entry.category_data,
                priority: entry.priority,
                status: entry.status || 'pending',
                description: entry.description,
                date: isValid(date) ? date : new Date()
            };
        });

        setEntries(mappedEntries);
        setLoading(false);
    };

    const fetchCustomCalendars = async () => {
        if (!user) return;

        const dbCalendars = await getCustomCalendars(user.id);

        // Map DB calendars to local state format
        const mappedCalendars: CustomCalendar[] = dbCalendars.map(calendar => {
            return {
                id: calendar.id,
                name: calendar.name,
                color: calendar.color,
                visible: calendar.is_visible
            };
        });

        setOtherCalendars(mappedCalendars);
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

    const nextPeriod = () => {
        if (view === 'month') {
            setCurrentDate(addMonths(currentDate, 1));
        } else if (view === 'week') {
            setCurrentDate(addWeeks(currentDate, 1));
        } else {
            const nextDay = addDays(selectedDate, 1);
            setSelectedDate(nextDay);
            setCurrentDate(nextDay);
        }
    };

    const prevPeriod = () => {
        if (view === 'month') {
            setCurrentDate(subMonths(currentDate, 1));
        } else if (view === 'week') {
            setCurrentDate(subWeeks(currentDate, 1));
        } else {
            const prevDay = addDays(selectedDate, -1);
            setSelectedDate(prevDay);
            setCurrentDate(prevDay);
        }
    };

    const goToToday = () => {
        setSelectedDate(new Date());
        setCurrentDate(new Date());
    };

    const handleGoBack = () => {
        router.back();
    };

    const handleAddEntry = async () => {
        if (!user) return;

        let entriesToAdd: any[] = [];

        if (selectedCategory === 'task' || selectedCategory === 'adls') {
            entriesToAdd = multipleEntries
                .filter(entry => entry.title.trim() !== '')
                .map(entry => {
                    const entryDateTime = new Date(`${entry.date}T${newEntryTime}`);
                    return {
                        user_id: user.id,
                        title: entry.title,
                        category: selectedCategory,
                        entry_date: entryDateTime.toISOString(),
                        category_data: categoryData || {},
                        priority: selectedPriority,
                        status: 'pending',
                        description: ''
                    };
                });
        } else if (selectedCategory === 'goal') {
            const entryDateTime = new Date(`${newEntryDate}T${newEntryTime}`);
            const goalEntries = createGoalEntry(entryDateTime);
            entriesToAdd = Array.isArray(goalEntries) ? goalEntries : [goalEntries];

            if (goalRecurring) {
                const additionalEntries = generateRecurringGoals(entryDateTime);
                entriesToAdd = [...entriesToAdd, ...additionalEntries];
            }
        } else {
            const entryDateTime = new Date(`${newEntryDate}T${newEntryTime}`);
            entriesToAdd = [{
                user_id: user.id,
                title: newEntryTitle,
                category: selectedCategory,
                entry_date: entryDateTime.toISOString(),
                category_data: categoryData || {},
                priority: selectedPriority,
                status: 'pending',
                description: ''
            }];
        }

        const addedEntries: any[] = [];
        for (const entry of entriesToAdd) {
            const addedEntry = await addCalendarEntry(entry);
            if (addedEntry) {
                addedEntries.push(addedEntry);
            }
        }

        if (addedEntries.length > 0) {
            const mappedAddedEntries = addedEntries.map(addedEntry => ({
                id: addedEntry.id,
                title: addedEntry.title,
                category: addedEntry.category,
                category_data: addedEntry.category_data,
                priority: addedEntry.priority,
                description: addedEntry.description,
                date: parseISO(addedEntry.entry_date)
            }));

            setEntries([...entries, ...mappedAddedEntries]);
            setNewEntryTitle('');
            setMultipleEntries([{ title: '', date: format(new Date(), 'yyyy-MM-dd') }]);
            setOpenDialog(false);
        }
    };

    // Helper function to create a goal entry based on duration
    const createGoalEntry = (entryDateTime: Date) => {
        if (!user) return []; // Return empty array if user is not authenticated

        const baseEntry = {
            user_id: user.id,
            title: newEntryTitle,
            category: selectedCategory,
            category_data: categoryData || {},
            priority: selectedPriority,
            status: 'pending',
            description: ''
        };

        switch (goalDuration) {
            case 'day':
                return {
                    ...baseEntry,
                    title: `${newEntryTitle} (Day Goal)`,
                    entry_date: entryDateTime.toISOString()
                };
            case 'week':
                // For a week goal, create entries for each day of the week
                const weekEntries = [];
                for (let i = 0; i < 7; i++) {
                    const dayDate = new Date(entryDateTime);
                    dayDate.setDate(entryDateTime.getDate() + i);
                    weekEntries.push({
                        ...baseEntry,
                        title: `${newEntryTitle} (Week Goal - Day ${i + 1})`,
                        entry_date: dayDate.toISOString()
                    });
                }
                return weekEntries;
            case 'month':
                // For a month goal, create entries for each day of the month
                const monthEntries = [];
                const daysInMonth = new Date(entryDateTime.getFullYear(), entryDateTime.getMonth() + 1, 0).getDate();
                for (let i = 0; i < daysInMonth; i++) {
                    const dayDate = new Date(entryDateTime);
                    dayDate.setDate(entryDateTime.getDate() + i);
                    monthEntries.push({
                        ...baseEntry,
                        title: `${newEntryTitle} (Month Goal - Day ${i + 1})`,
                        entry_date: dayDate.toISOString()
                    });
                }
                return monthEntries;
            case 'year':
                // For a year goal, create entries for each month of the year
                const yearEntries = [];
                for (let i = 0; i < 12; i++) {
                    const monthDate = new Date(entryDateTime);
                    monthDate.setMonth(entryDateTime.getMonth() + i);
                    yearEntries.push({
                        ...baseEntry,
                        title: `${newEntryTitle} (Year Goal - Month ${i + 1})`,
                        entry_date: monthDate.toISOString()
                    });
                }
                return yearEntries;
            default:
                return {
                    ...baseEntry,
                    entry_date: entryDateTime.toISOString()
                };
        }
    };

    // Helper function to generate recurring goals
    const generateRecurringGoals = (startDate: Date) => {
        if (!user) return []; // Return empty array if user is not authenticated

        // This is a simplified implementation - in a real app, you'd calculate based on duration and recurrence pattern
        const recurringEntries = [];

        // For demonstration, let's create 3 more occurrences
        for (let i = 1; i <= 3; i++) {
            const recurringDate = new Date(startDate);

            switch (goalDuration) {
                case 'day':
                    recurringDate.setDate(startDate.getDate() + i);
                    break;
                case 'week':
                    recurringDate.setDate(startDate.getDate() + (i * 7));
                    break;
                case 'month':
                    recurringDate.setMonth(startDate.getMonth() + i);
                    break;
                case 'year':
                    recurringDate.setFullYear(startDate.getFullYear() + i);
                    break;
            }

            recurringEntries.push({
                user_id: user.id,
                title: `${newEntryTitle} (Recurring)`,
                category: selectedCategory,
                entry_date: recurringDate.toISOString(),
                category_data: categoryData || {},
                priority: selectedPriority,
                status: 'pending',
                description: ''
            });
        }

        return recurringEntries;
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const success = await deleteCalendarEntry(id);
        if (success) {
            setEntries(entries.filter((entry: CalendarEntry) => entry.id !== id));
        }
    };

    const toggleEntryStatus = async (e: React.MouseEvent, entry: CalendarEntry) => {
        e.stopPropagation();
        const newStatus = entry.status === 'completed' ? 'pending' : 'completed';
        
        console.log('Toggling entry status:', { 
            entryId: entry.id, 
            currentStatus: entry.status, 
            newStatus: newStatus 
        });
        
        // Check if this is an external calendar entry (mock data)
        if (entry.source === 'external') {
            // For external calendar entries, we can't update them in our database
            // So we just update the local state temporarily
            setEntries(entries.map(e => e.id === entry.id ? { ...e, status: newStatus } : e));
            showSnackbar('Status updated locally for external calendar entry', 'info');
            return;
        }
        
        try {
            const success = await updateCalendarEntry(entry.id, { status: newStatus });
            
            if (success) {
                setEntries(entries.map(e => e.id === entry.id ? { ...e, status: newStatus } : e));
                console.log('Successfully toggled entry status');
                showSnackbar('Entry status updated successfully', 'success');
            } else {
                console.error('Failed to toggle entry status for entry:', entry.id);
                showSnackbar('Failed to update entry status', 'error');
            }
        } catch (error) {
            console.error('Error updating calendar entry:', error);
            showSnackbar('An error occurred while updating the entry status', 'error');
        }
    };

    const handleEdit = (entry: CalendarEntry) => {
        setEditingEntry({
            ...entry,
            dateStr: format(entry.date, 'yyyy-MM-dd'),
            timeStr: format(entry.date, 'HH:mm')
        });
        setNewEntryTitle(entry.title);
        setSelectedCategory(entry.category);
        setCategoryData(entry.category_data || {});
        setSelectedPriority(entry.priority || 'Medium');
        setNewEntryDate(format(entry.date, 'yyyy-MM-dd'));
        setNewEntryTime(format(entry.date, 'HH:mm'));
        setOpenDialog(true);
    };

    const handleUpdateEntry = async () => {
        if (!editingEntry || !user) return;

        let updates;

        if (selectedCategory === 'task' || selectedCategory === 'adls') {
            // Handle multiple entries for tasks and ADLs
            // For simplicity in update, we'll update the single entry
            updates = {
                title: newEntryTitle,
                category: selectedCategory,
                entry_date: new Date(`${newEntryDate}T${newEntryTime}`).toISOString(),
                category_data: categoryData || {},
                priority: selectedPriority,
                description: ''
            };
        } else if (selectedCategory === 'goal') {
            // Handle goal updates
            updates = {
                title: `${newEntryTitle} (${goalDuration.charAt(0).toUpperCase() + goalDuration.slice(1)} Goal)`,
                category: selectedCategory,
                entry_date: new Date(`${newEntryDate}T${newEntryTime}`).toISOString(),
                category_data: categoryData || {},
                priority: selectedPriority,
                description: ''
            };
        } else {
            updates = {
                title: newEntryTitle,
                category: selectedCategory,
                entry_date: new Date(`${newEntryDate}T${newEntryTime}`).toISOString(),
                category_data: categoryData || {},
                priority: selectedPriority,
                description: ''
            };
        }

        const success = await updateCalendarEntry(editingEntry.id, updates);

        if (success) {
            // Update the entry in the local state
            setEntries(entries.map(entry =>
                entry.id === editingEntry.id
                    ? {
                        ...entry,
                        title: updates.title,
                        category: updates.category,
                        category_data: updates.category_data,
                        priority: updates.priority,
                        description: updates.description,
                        date: new Date(updates.entry_date)
                    }
                    : entry
            ));

            setEditingEntry(null);
            setNewEntryTitle('');
            setMultipleEntries([{ title: '', date: format(new Date(), 'yyyy-MM-dd') }]); // Reset multiple entries
            setOpenDialog(false);
        }
    };

    const toggleCategory = (categoryId: string) => {
        setVisibleCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
    };

    const toggleOtherCalendar = (calendarId: string) => {
        setOtherCalendars(prev =>
            prev.map(cal =>
                cal.id === calendarId
                    ? { ...cal, visible: !cal.visible }
                    : cal
            )
        );
    };

    const toggleNoteDetails = (entryId: string) => {
        setShowNoteDetails(prev => ({ ...prev, [entryId]: !prev[entryId] }));
    };

    const addNewCalendar = async () => {
        if (newCalendarName.trim() && user) {
            const calendarToAdd = {
                user_id: user.id,
                name: newCalendarName.trim(),
                color: newCalendarColor,
                is_visible: true
            };

            const addedCalendar = await addCustomCalendar(calendarToAdd);

            if (addedCalendar) {
                const newCalendar = {
                    id: addedCalendar.id,
                    name: addedCalendar.name,
                    color: addedCalendar.color,
                    visible: addedCalendar.is_visible
                };
                setOtherCalendars(prev => [...prev, newCalendar]);
            }

            setNewCalendarName('');
            setShowAddCalendarDialog(false);
        }
    };

    // Settings Helper Functions
    const handleTimezoneChange = async (newTimezone: string) => {
        if (!user) return;
        
        setSettingsLoading(true);
        try {
            const success = await setTimezonePreference(user.id, newTimezone);
            if (success) {
                setTimezone(newTimezone);
                showSnackbar('Timezone updated successfully', 'success');
            } else {
                showSnackbar('Failed to update timezone', 'error');
            }
        } catch (error) {
            console.error('Error updating timezone:', error);
            showSnackbar('Failed to update timezone', 'error');
        } finally {
            setSettingsLoading(false);
        }
    };

    const handleNotificationSettingChange = async (setting: string, value: any) => {
        if (!user) return;
        
        const newSettings = { ...notificationSettings, [setting]: value };
        setNotificationSettings(newSettings);
        
        setSettingsLoading(true);
        try {
            const success = await updateNotificationSettings(user.id, newSettings);
            if (!success) {
                showSnackbar('Failed to update notification settings', 'error');
            }
        } catch (error) {
            console.error('Error updating notification settings:', error);
            showSnackbar('Failed to update notification settings', 'error');
        } finally {
            setSettingsLoading(false);
        }
    };

    const handleFeedbackSubmit = async () => {
        if (!user) return;
        
        const { isValid, errors } = validateFeedback(feedbackForm.subject, feedbackForm.message);
        if (!isValid) {
            showSnackbar(errors[0], 'error');
            return;
        }
        
        setSettingsLoading(true);
        try {
            const result = await submitFeedback(
                user.id,
                feedbackForm.category as any,
                feedbackForm.subject,
                feedbackForm.message,
                feedbackForm.priority as any
            );
            
            if (result.success) {
                showSnackbar('Feedback submitted successfully!', 'success');
                // Reset form
                setFeedbackForm({
                    category: 'general',
                    subject: '',
                    message: '',
                    priority: 'medium'
                });
                setOpenSettings(false);
            } else {
                showSnackbar(result.error || 'Failed to submit feedback', 'error');
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            showSnackbar('Failed to submit feedback', 'error');
        } finally {
            setSettingsLoading(false);
        }
    };

    // Calendar Integration Functions
    const handleAddCalendarIntegration = async () => {
        if (!user || !integrationDisplayName.trim()) return;
        
        setSettingsLoading(true);
        try {
            const result = await createCalendarIntegration(
                user.id,
                selectedProvider,
                integrationDisplayName,
                integrationEmail,
                CALENDAR_PROVIDERS.find(p => p.id === selectedProvider)?.color || '#3b82f6'
            );
            
            if (result.success && result.integration) {
                showSnackbar(`${selectedProvider} calendar connected successfully!`, 'success');
                setCalendarIntegrations(prev => [...prev, result.integration]);
                // Reset form
                setIntegrationDisplayName('');
                setIntegrationEmail('');
                setShowAddCalendarIntegration(false);
            } else {
                showSnackbar(result.error || 'Failed to connect calendar', 'error');
            }
        } catch (error) {
            console.error('Error connecting calendar:', error);
            showSnackbar('Failed to connect calendar', 'error');
        } finally {
            setSettingsLoading(false);
        }
    };

    const handleDeleteCalendarIntegration = async (integrationId: string) => {
        if (!user) return;
        
        setSettingsLoading(true);
        try {
            const success = await deleteCalendarIntegration(integrationId, user.id);
            if (success) {
                showSnackbar('Calendar integration removed', 'success');
                setCalendarIntegrations(prev => prev.filter(int => int.id !== integrationId));
            } else {
                showSnackbar('Failed to remove calendar integration', 'error');
            }
        } catch (error) {
            console.error('Error removing calendar integration:', error);
            showSnackbar('Failed to remove calendar integration', 'error');
        } finally {
            setSettingsLoading(false);
        }
    };

    const handleToggleCalendarSync = async (integrationId: string) => {
        if (!user) return;
        
        setSettingsLoading(true);
        try {
            const success = await toggleCalendarSync(integrationId, user.id);
            if (success) {
                // Refresh integrations to get updated status
                await loadCalendarIntegrations();
                showSnackbar('Calendar sync toggled', 'success');
            } else {
                showSnackbar('Failed to toggle calendar sync', 'error');
            }
        } catch (error) {
            console.error('Error toggling calendar sync:', error);
            showSnackbar('Failed to toggle calendar sync', 'error');
        } finally {
            setSettingsLoading(false);
        }
    };

    const handleSyncCalendar = async (integrationId: string) => {
        if (!user) return;
        
        setSyncingIntegrationId(integrationId);
        try {
            const success = await syncCalendarIntegration(integrationId, user.id);
            if (success) {
                showSnackbar('Calendar synced successfully!', 'success');
                // Refresh integrations to get updated status
                await loadCalendarIntegrations();
            } else {
                showSnackbar('Failed to sync calendar', 'error');
            }
        } catch (error) {
            console.error('Error syncing calendar:', error);
            showSnackbar('Failed to sync calendar', 'error');
        } finally {
            setSyncingIntegrationId(null);
        }
    };

    const handleUpdateSyncFrequency = async (integrationId: string, frequency: SyncFrequency) => {
        if (!user) return;
        
        setSettingsLoading(true);
        try {
            const success = await updateSyncFrequency(integrationId, user.id, frequency);
            if (success) {
                // Refresh integrations to get updated status
                await loadCalendarIntegrations();
                showSnackbar('Sync frequency updated', 'success');
            } else {
                showSnackbar('Failed to update sync frequency', 'error');
            }
        } catch (error) {
            console.error('Error updating sync frequency:', error);
            showSnackbar('Failed to update sync frequency', 'error');
        } finally {
            setSettingsLoading(false);
        }
    };

    // Utility Functions
    const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const closeSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    // Analytics calculations
    const getTotalEntries = () => entries.length;
    const getEntriesByCategory = () => {
        const counts: Record<string, number> = {};
        entries.forEach(entry => {
            counts[entry.category] = (counts[entry.category] || 0) + 1;
        });
        return counts;
    };
    const getMostActiveCategory = () => {
        const counts = getEntriesByCategory();
        return Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'None';
    };
    const getEntriesThisWeek = () => {
        const weekStart = startOfWeek(new Date());
        const weekEnd = endOfWeek(new Date());
        return entries.filter(entry =>
            entry.date >= weekStart && entry.date <= weekEnd
        ).length;
    };

    const filteredEntries = entries.filter((entry: CalendarEntry) => {
        const matchesCategory = visibleCategories[entry.category];
        const matchesSearch = searchQuery === '' ||
            entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            entry.category.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // Analytics data calculation
    const getAnalyticsData = () => {
        const now = new Date();
        const weekStart = startOfWeek(now);
        const weekEnd = endOfWeek(now);
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);

        // Filter entries based on analytics filter
        let filteredForAnalytics = entries;
        if (analyticsFilter === 'today') {
            filteredForAnalytics = entries.filter(entry => isSameDay(entry.date, now));
        } else if (analyticsFilter === 'week') {
            filteredForAnalytics = entries.filter(entry => 
                entry.date >= weekStart && entry.date <= weekEnd
            );
        } else if (analyticsFilter === 'month') {
            filteredForAnalytics = entries.filter(entry => 
                entry.date >= monthStart && entry.date <= monthEnd
            );
        }

        // Apply category filter
        if (analyticsCategory !== 'all') {
            filteredForAnalytics = filteredForAnalytics.filter(entry => entry.category === analyticsCategory);
        }

        const totalTasks = filteredForAnalytics.length;
        const completedTasks = filteredForAnalytics.filter(entry => entry.status === 'completed').length;
        const pendingTasks = filteredForAnalytics.filter(entry => entry.status === 'pending').length;
        
        // Category breakdown
        const categoryBreakdown: Record<string, number> = {};
        filteredForAnalytics.forEach(entry => {
            categoryBreakdown[entry.category] = (categoryBreakdown[entry.category] || 0) + 1;
        });

        // Priority breakdown
        const priorityBreakdown: Record<string, number> = {};
        filteredForAnalytics.forEach(entry => {
            if (entry.priority) {
                priorityBreakdown[entry.priority] = (priorityBreakdown[entry.priority] || 0) + 1;
            }
        });

        // This week's entries
        const thisWeekEntries = entries.filter(entry => 
            entry.date >= weekStart && entry.date <= weekEnd
        );

        // Completion rate
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
            totalTasks,
            completedTasks,
            pendingTasks,
            categoryBreakdown,
            priorityBreakdown,
            thisWeekEntries: thisWeekEntries.length,
            completionRate,
            filteredEntries: filteredForAnalytics
        };
    };

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            bgcolor: 'background.default',
            m: -4, // Counteract ProtectedLayout padding
            overflow: 'hidden'
        }}>
            {/* Header */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 4,
                py: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                zIndex: 10,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton
                        size="small"
                        onClick={handleGoBack}
                        sx={{
                            borderRadius: 4,
                            width: 40,
                            height: 40,
                            bgcolor: 'action.hover',
                            '&:hover': { bgcolor: 'action.selected' }
                        }}
                    >
                        <ArrowBackIcon fontSize="small" />
                    </IconButton>
                    <Typography variant="h6" sx={{ color: '#9C27B0', fontWeight: 800, mr: 2, display: 'flex', alignItems: 'center', gap: 1, fontSize: '1.25rem' }}>
                        <CalendarIcon /> Personal Life
                    </Typography>
                    <Button variant="outlined" size="small" onClick={goToToday} sx={{ borderRadius: 4, textTransform: 'none', color: 'text.primary', borderColor: 'divider', fontWeight: 600, px: 2, py: 0.5 }}>
                        Today
                    </Button>
                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                        <IconButton size="small" onClick={prevPeriod} sx={{ borderRadius: 4, width: 40, height: 40, bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}><ChevronLeft fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={nextPeriod} sx={{ borderRadius: 4, width: 40, height: 40, bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}><ChevronRight fontSize="small" /></IconButton>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, ml: 1, fontSize: '1.25rem', color: 'text.primary' }}>
                        {view === 'month'
                            ? format(currentDate, 'MMMM yyyy')
                            : view === 'week'
                                ? `${format(startOfWeek(currentDate), 'MMM d')} - ${format(endOfWeek(currentDate), 'MMM d, yyyy')}`
                                : format(selectedDate, 'MMMM d, yyyy')}
                    </Typography>
                    {loading && <CircularProgress size={20} sx={{ ml: 2 }} />}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {showSearchBar ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
                            <TextField
                                size="small"
                                placeholder="Search entries..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                variant="outlined"
                                sx={{
                                    width: 240,
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': { borderColor: 'divider' },
                                        '&:hover fieldset': { borderColor: '#9C27B0' },
                                        '&.Mui-focused fieldset': { borderColor: '#9C27B0' },
                                        borderRadius: 4,
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
                                    }
                                }}
                                InputProps={{
                                    sx: { fontSize: '0.875rem' }
                                }}
                            />
                            <IconButton size="small" onClick={() => {
                                setShowSearchBar(false);
                                setSearchQuery('');
                            }}
                                sx={{ borderRadius: 4 }}>
                                <SearchIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    ) : (
                        <Tooltip title="Search"><IconButton size="small" onClick={() => setShowSearchBar(true)} sx={{ borderRadius: 4 }}><SearchIcon fontSize="small" /></IconButton></Tooltip>
                    )}
                    <Tooltip title="Task Analytics">
                        <IconButton
                            size="small"
                            onClick={() => setShowAnalytics(true)}
                            sx={{
                                borderRadius: 4,
                                color: '#9C27B0',
                                bgcolor: 'rgba(156, 39, 176, 0.08)',
                                mx: 0.5
                            }}
                        >
                            <InsightsIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Support"><IconButton size="small" sx={{ borderRadius: 4 }}><HelpIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Settings"><IconButton size="small" onClick={() => setOpenSettings(true)} sx={{ borderRadius: 4 }}><SettingsIcon fontSize="small" /></IconButton></Tooltip>
                    <Select
                        size="small"
                        value={view}
                        onChange={(e) => setView(e.target.value as 'month' | 'week' | 'day')}
                        sx={{
                            borderRadius: 4,
                            height: 40,
                            fontSize: '0.875rem',
                            ml: 1,
                            backgroundColor: 'background.paper',
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#9C27B0' },
                            boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
                        }}
                    >
                        <MenuItem value="month">Month</MenuItem>
                        <MenuItem value="week">Week</MenuItem>
                        <MenuItem value="day">Day</MenuItem>
                    </Select>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Left Sidebar */}
                <Box sx={{
                    width: 300,
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    p: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: 'background.paper',
                    overflowY: 'auto',
                    boxShadow: 'inset -1px 0 0 rgba(0,0,0,0.05)'
                }}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenDialog(true)}
                        sx={{
                            borderRadius: 4,
                            py: 1.5,
                            px: 3,
                            mb: 3,
                            textTransform: 'none',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            bgcolor: '#9C27B0',
                            color: 'white',
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            width: '100%',
                            '&:hover': {
                                bgcolor: '#7B1FA2',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            }
                        }}
                    >
                        Create New
                    </Button>

                    {/* Mini Calendar */}
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, px: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.8rem' }}>{format(currentDate, 'MMMM yyyy')}</Typography>
                            <Box>
                                <IconButton size="small" onClick={() => setCurrentDate(subMonths(currentDate, 1))} sx={{ p: 0.5, borderRadius: 4 }}><ChevronLeft fontSize="inherit" /></IconButton>
                                <IconButton size="small" onClick={() => setCurrentDate(addMonths(currentDate, 1))} sx={{ p: 0.5, borderRadius: 4 }}><ChevronRight fontSize="inherit" /></IconButton>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 1, textAlign: 'center' }}>
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => {
                                const pastelColors = [
                                    '#FFE4E1', // Sunday - Misty Rose
                                    '#E6F3FF', // Monday - Light Blue
                                    '#F0FFF0', // Tuesday - Honeydew
                                    '#FFF8DC', // Wednesday - Cornsilk
                                    '#FFE4F3', // Thursday - Pink
                                    '#E6E6FA', // Friday - Lavender
                                    '#F5F5DC'  // Saturday - Beige
                                ];
                                return (
                                    <Box key={`mini-day-${i}`} sx={{ 
                                        bgcolor: pastelColors[i], 
                                        borderRadius: 1,
                                        py: 0.5
                                    }}>
                                        <Typography variant="caption" sx={{ 
                                            fontSize: '0.7rem', 
                                            color: 'text.secondary', 
                                            fontWeight: 700, 
                                            textTransform: 'uppercase' 
                                        }}>
                                            {d}
                                        </Typography>
                                    </Box>
                                );
                            })}
                            {miniDays.map((day, i) => (
                                <Box
                                    key={i}
                                    sx={{
                                        fontSize: '0.75rem',
                                        height: 32,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '50%',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        color: isSameDay(day, new Date()) ? '#9C27B0' : (isSameMonth(day, currentDate) ? 'text.primary' : 'text.disabled'),
                                        bgcolor: isSameDay(day, new Date()) ? 'rgba(156, 39, 176, 0.15)' : 'transparent',
                                        fontWeight: isSameDay(day, new Date()) ? 800 : 500,
                                        '&:hover': { bgcolor: 'action.hover' },
                                        ...(isSameDay(day, selectedDate) && view === 'day' && { border: '1px solid', borderColor: '#9C27B0' })
                                    }}
                                    onClick={() => {
                                        setSelectedDate(day);
                                        setCurrentDate(day);
                                        setView('day');
                                    }}
                                >
                                    {format(day, 'd')}
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    {/* Analytics Button */}
                    <Button
                        variant="outlined"
                        onClick={() => setShowAnalytics(true)}
                        sx={{
                            mt: 0,
                            mb: 2,
                            borderRadius: 4,
                            py: 1.5,
                            px: 2,
                            textTransform: 'none',
                            borderColor: 'divider',
                            color: 'text.primary',
                            fontWeight: 600,
                            width: '100%',
                            justifyContent: 'flex-start',
                            '&:hover': {
                                bgcolor: 'action.hover',
                                borderColor: '#9C27B0'
                            }
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AnalyticsIcon sx={{ color: '#9C27B0' }} />
                            <span>Analytics</span>
                        </Box>
                    </Button>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, px: 0, fontSize: '1rem', color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Categories
                        </Typography>
                        <IconButton
                            size="small"
                            onClick={() => setCategoriesExpanded(!categoriesExpanded)}
                            sx={{
                                transform: categoriesExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.3s ease',
                                borderRadius: 4,
                                '&:hover': { bgcolor: 'action.hover' }
                            }}
                        >
                            <ExpandMoreIcon fontSize="small" />
                        </IconButton>
                    </Box>
                    <Box sx={{ display: categoriesExpanded ? 'flex' : 'none', flexDirection: 'column', gap: 0.5 }}>
                        {CATEGORIES.map(cat => (
                            <Box key={cat.id} sx={{
                                display: 'flex',
                                alignItems: 'center',
                                px: 2,
                                py: 1.5,
                                borderRadius: 3,
                                '&:hover': { bgcolor: 'action.hover' },
                                cursor: 'pointer',
                                bgcolor: visibleCategories[cat.id] ? `${cat.color}10` : 'transparent',
                                border: `1px solid ${visibleCategories[cat.id] ? cat.color : 'divider'}`,
                                transition: 'all 0.2s ease-in-out'
                            }} onClick={() => toggleCategory(cat.id)}>
                                <Checkbox
                                    size="medium"
                                    checked={visibleCategories[cat.id]}
                                    sx={{
                                        p: 0.5,
                                        color: cat.color,
                                        '&.Mui-checked': { color: cat.color }
                                    }}
                                />
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                    <Box sx={{
                                        bgcolor: cat.color,
                                        mr: 1
                                    }} />
                                    <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500, color: 'text.primary' }}>
                                        {cat.label}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </Box>


                    {/* Other Calendars Section */}
                    <Box sx={{ mt: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, px: 0, fontSize: '1rem', color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Other Calendars
                            </Typography>
                            <IconButton
                                size="small"
                                onClick={() => setOtherCalendarsExpanded(!otherCalendarsExpanded)}
                                sx={{
                                    transform: otherCalendarsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.3s ease',
                                    borderRadius: 4,
                                    '&:hover': { bgcolor: 'action.hover' }
                                }}
                            >
                                <ExpandMoreIcon fontSize="small" />
                            </IconButton>
                        </Box>
                        <Box sx={{ display: otherCalendarsExpanded ? 'flex' : 'none', flexDirection: 'column', gap: 0.5 }}>
                            {otherCalendars.map(calendar => (
                                <Box key={calendar.id} sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    px: 2,
                                    py: 1.5,
                                    borderRadius: 3,
                                    '&:hover': { bgcolor: 'action.hover' },
                                    cursor: 'pointer',
                                    bgcolor: calendar.visible ? `${calendar.color}10` : 'transparent',
                                    border: `1px solid ${calendar.visible ? calendar.color : 'divider'}`,
                                    transition: 'all 0.2s ease-in-out'
                                }} onClick={() => toggleOtherCalendar(calendar.id)}>
                                    <Checkbox
                                        size="medium"
                                        checked={calendar.visible}
                                        sx={{
                                            p: 0.5,
                                            color: calendar.color,
                                            '&.Mui-checked': { color: calendar.color }
                                        }}
                                    />
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                        <Box sx={{
                                            width: 12,
                                            height: 12,
                                            borderRadius: '50%',
                                            bgcolor: calendar.color,
                                            mr: 1
                                        }} />
                                        <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500, color: 'text.primary' }}>
                                            {calendar.name}
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                            <Button
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={() => setShowAddCalendarDialog(true)}
                                sx={{
                                    mt: 1,
                                    borderRadius: 4,
                                    py: 1,
                                    px: 2,
                                    textTransform: 'none',
                                    borderColor: 'divider',
                                    color: 'text.primary',
                                    fontWeight: 600,
                                    justifyContent: 'flex-start',
                                    '&:hover': {
                                        bgcolor: 'action.hover',
                                        borderColor: '#9C27B0'
                                    }
                                }}
                            >
                                Add Calendar
                            </Button>
                        </Box>
                    </Box>
                </Box>

                {/* Main Calendar Grid */}
                <Box sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    m: 2,
                    mb: 0,
                    borderRadius: 6,
                    bgcolor: 'rgba(255, 255, 255, 0.3)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
                }}>
                    {view === 'month' ? (
                        <>
                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                                borderBottom: '1px solid',
                                borderColor: 'rgba(255, 255, 255, 0.3)',
                                bgcolor: 'rgba(255, 255, 255, 0.4)',
                                borderTopLeftRadius: 24,
                                borderTopRightRadius: 24,
                                p: 1,
                                gap: 1
                            }}>
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
                                    const pastelColors = [
                                        '#FFE4E1', // Sunday - Misty Rose
                                        '#E6F3FF', // Monday - Light Blue
                                        '#F0FFF0', // Tuesday - Honeydew
                                        '#FFF8DC', // Wednesday - Cornsilk
                                        '#FFE4F3', // Thursday - Pink
                                        '#E6E6FA', // Friday - Lavender
                                        '#F5F5DC'  // Saturday - Beige
                                    ];
                                    return (
                                        <Box key={`header-${index}`} sx={{ 
                                            py: 1, 
                                            textAlign: 'center',
                                            bgcolor: pastelColors[index],
                                            borderRadius: 2,
                                            mx: 0.5
                                        }}>
                                            <Typography variant="body2" sx={{ 
                                                fontWeight: 700, 
                                                color: 'text.secondary', 
                                                fontSize: '0.8rem', 
                                                textTransform: 'uppercase', 
                                                letterSpacing: '0.05em' 
                                            }}>
                                                {day}
                                            </Typography>
                                        </Box>
                                    );
                                })}
                            </Box>
                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                                gridAutoRows: 'minmax(150px, 1fr)',
                                flex: 1,
                                overflowY: 'auto',
                                bgcolor: 'transparent',
                                p: 1,
                                gap: 1
                            }}>
                                {calendarDays.map((day, idx) => {
                                    const dayEntries = filteredEntries.filter((entry: CalendarEntry) => isSameDay(entry.date, day));
                                    const isCurrentMonth = isSameMonth(day, monthStart);
                                    const isToday = isSameDay(day, new Date());
                                    const isSelected = isSameDay(day, selectedDate);

                                    return (
                                        <Box
                                            key={idx}
                                            sx={{
                                                bgcolor: isCurrentMonth ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                                                p: 1.5,
                                                minHeight: 150,
                                                borderRadius: 4,
                                                border: '1px solid',
                                                borderColor: 'rgba(255, 255, 255, 0.4)',
                                                transition: 'all 0.2s ease',
                                                cursor: 'pointer',
                                                position: 'relative',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                                                backdropFilter: 'blur(4px)',
                                                ...(isSelected && { bgcolor: 'rgba(156, 39, 176, 0.12)', border: '2px solid', borderColor: '#9C27B0' }),
                                                '&:hover': { bgcolor: isCurrentMonth ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.15)', transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }
                                            }}
                                            onClick={() => {
                                                setSelectedDate(day);
                                                setView('day');
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        width: 36,
                                                        height: 36,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        borderRadius: '50%',
                                                        fontSize: '0.9rem',
                                                        fontWeight: isToday ? 800 : 500,
                                                        bgcolor: isToday ? '#9C27B0' : 'transparent',
                                                        color: isToday ? 'white' : (isCurrentMonth ? 'text.primary' : 'text.disabled'),
                                                        '&:hover': { bgcolor: isToday ? '#7B1FA2' : 'action.hover' },
                                                    }}
                                                >
                                                    {format(day, 'd')}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, maxHeight: 100, overflow: 'hidden' }}>
                                                {dayEntries.map((entry: CalendarEntry) => {
                                                    const cat = CATEGORIES.find(c => c.id === entry.category);
                                                    return (
                                                        <Box
                                                            key={entry.id}
                                                            sx={{
                                                                bgcolor: entry.status === 'completed' ? 'rgba(0, 0, 0, 0.1)' : (cat?.color || '#9C27B0'),
                                                                color: entry.status === 'completed' ? 'text.secondary' : '#FFFFFF',
                                                                px: 1,
                                                                py: 0.5,
                                                                borderRadius: 2,
                                                                fontSize: '0.75rem',
                                                                fontWeight: 600,
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                boxShadow: entry.status === 'completed' ? 'none' : '0 2px 4px rgba(0,0,0,0.08)',
                                                                cursor: 'pointer',
                                                                opacity: entry.status === 'completed' ? 0.7 : 1,
                                                                textDecoration: entry.status === 'completed' ? 'line-through' : 'none',
                                                                '&:hover': {
                                                                    filter: 'brightness(0.95)',
                                                                    transform: 'translateY(-1px)',
                                                                    '& .delete-btn': { opacity: 1 },
                                                                    '& .edit-btn': { opacity: 1 }
                                                                },
                                                                transition: 'all 0.15s ease',
                                                                borderLeft: '2px solid',
                                                                borderColor: 'transparent',
                                                                minWidth: 0
                                                            }}
                                                            onClick={(e) => toggleEntryStatus(e, entry)}
                                                        >
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, overflow: 'hidden', minWidth: 0 }}>
                                                                {entry.status === 'completed' ? <CheckCircleIcon sx={{ fontSize: '0.8rem' }} /> : cat?.icon}
                                                                <Typography variant="inherit" noWrap sx={{ opacity: entry.status === 'completed' ? 0.7 : 1 }}>
                                                                    {entry.title} ({format(entry.date, 'HH:mm')})
                                                                </Typography>
                                                            </Box>
                                                            <IconButton
                                                                className="edit-btn"
                                                                size="small"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEdit(entry);
                                                                }}
                                                                sx={{
                                                                    opacity: 0,
                                                                    transition: 'opacity 0.3s',
                                                                    color: '#FFFFFF',
                                                                    ml: 0.5
                                                                }}
                                                            >
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                        </Box>
                                                    );
                                                })}
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </>
                    ) : view === 'week' ? (
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: 'transparent' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, px: 4, pt: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box>
                                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>{format(startOfWeek(currentDate), 'MMM d')} - {format(endOfWeek(currentDate), 'MMM d, yyyy')}</Typography>
                                        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>Week View</Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Box sx={{ textAlign: 'right', px: 3, py: 2, bgcolor: 'grey.50', borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>YEAR PROGRESS</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main', fontSize: '1rem' }}>
                                            Week {getWeek(currentDate)} / {isLeapYear(currentDate) ? (Math.ceil(366 / 7)) : Math.floor(365 / 7)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'right', px: 3, py: 2, bgcolor: 'grey.50', borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>WEEK PROGRESS</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 800, color: 'secondary.main', fontSize: '1rem' }}>
                                            {eachDayOfInterval({ start: startOfWeek(currentDate), end: endOfWeek(currentDate) }).filter(day => day <= new Date()).length} / 7 days
                                        </Typography>
                                    </Box>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => setView('month')}
                                        sx={{ borderRadius: 4, textTransform: 'none', px: 3, py: 1, fontWeight: 600 }}
                                    >
                                        Back to Month
                                    </Button>
                                </Box>
                            </Box>
                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                                borderBottom: '1px solid',
                                borderColor: 'rgba(255, 255, 255, 0.3)',
                                bgcolor: 'rgba(255, 255, 255, 0.4)',
                                p: 1,
                                gap: 1
                            }}>
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
                                    const pastelColors = [
                                        '#FFE4E1', // Sunday - Misty Rose
                                        '#E6F3FF', // Monday - Light Blue
                                        '#F0FFF0', // Tuesday - Honeydew
                                        '#FFF8DC', // Wednesday - Cornsilk
                                        '#FFE4F3', // Thursday - Pink
                                        '#E6E6FA', // Friday - Lavender
                                        '#F5F5DC'  // Saturday - Beige
                                    ];
                                    return (
                                        <Box key={`week-header-${index}`} sx={{ 
                                            py: 1, 
                                            textAlign: 'center',
                                            bgcolor: pastelColors[index],
                                            borderRadius: 2,
                                            mx: 0.5
                                        }}>
                                            <Typography variant="body2" sx={{ 
                                                fontWeight: 700, 
                                                color: 'text.secondary', 
                                                fontSize: '0.8rem', 
                                                textTransform: 'uppercase', 
                                                letterSpacing: '0.05em' 
                                            }}>
                                                {day}
                                            </Typography>
                                        </Box>
                                    );
                                })}
                            </Box>
                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                                gridAutoRows: 'minmax(130px, 1fr)',
                                flex: 1,
                                overflowY: 'auto',
                                bgcolor: 'transparent',
                                p: 1,
                                gap: 1
                            }}>
                                {eachDayOfInterval({ start: startOfWeek(currentDate), end: endOfWeek(currentDate) }).map((day, idx) => {
                                    const dayEntries = filteredEntries.filter((entry: CalendarEntry) => isSameDay(entry.date, day));
                                    const isToday = isSameDay(day, new Date());
                                    const isSelected = isSameDay(day, selectedDate);

                                    return (
                                        <Box
                                            key={idx}
                                            sx={{
                                                bgcolor: 'rgba(255, 255, 255, 0.25)',
                                                p: 1.5,
                                                minHeight: 130,
                                                borderRadius: 4,
                                                border: '1px solid',
                                                borderColor: 'rgba(255, 255, 255, 0.4)',
                                                transition: 'all 0.2s ease',
                                                cursor: 'pointer',
                                                position: 'relative',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                                                backdropFilter: 'blur(4px)',
                                                ...(isSelected && { bgcolor: 'rgba(37, 99, 235, 0.12) !important' }),
                                                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.35)', transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }
                                            }}
                                            onClick={() => {
                                                setSelectedDate(day);
                                                setView('day');
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5 }}>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        width: 32,
                                                        height: 32,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        borderRadius: '50%',
                                                        fontSize: '0.8rem',
                                                        fontWeight: isToday ? 700 : 500,
                                                        bgcolor: isToday ? 'primary.main' : 'transparent',
                                                        color: isToday ? '#FFFFFF' : 'text.primary',
                                                        '&:hover': { bgcolor: isToday ? 'primary.dark' : 'action.hover' },
                                                    }}
                                                >
                                                    {format(day, 'd')}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                {dayEntries.slice(0, 3).map((entry: CalendarEntry) => { // Show only first 3 entries to avoid overcrowding
                                                    const cat = CATEGORIES.find(c => c.id === entry.category);
                                                    return (
                                                        <Box
                                                            key={entry.id}
                                                            sx={{
                                                                bgcolor: entry.status === 'completed' ? 'rgba(0, 0, 0, 0.1)' : (cat?.color || '#9C27B0'),
                                                                color: entry.status === 'completed' ? 'text.secondary' : '#FFFFFF',
                                                                px: 1,
                                                                py: 0.5,
                                                                borderRadius: 2,
                                                                fontSize: '0.75rem',
                                                                fontWeight: 600,
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                boxShadow: entry.status === 'completed' ? 'none' : '0 2px 4px rgba(0,0,0,0.08)',
                                                                cursor: 'pointer',
                                                                opacity: entry.status === 'completed' ? 0.7 : 1,
                                                                textDecoration: entry.status === 'completed' ? 'line-through' : 'none',
                                                                '&:hover': {
                                                                    filter: 'brightness(0.9)',
                                                                    transform: 'translateY(-1px)',
                                                                    '& .delete-btn': { opacity: 1 },
                                                                    '& .edit-btn': { opacity: 1 }
                                                                },
                                                                transition: 'all 0.1s',
                                                                minWidth: 0
                                                            }}
                                                            onClick={(e) => toggleEntryStatus(e, entry)}
                                                        >
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, overflow: 'hidden', minWidth: 0 }}>
                                                                {entry.status === 'completed' ? <CheckCircleIcon sx={{ fontSize: '0.8rem' }} /> : cat?.icon}
                                                                <Typography variant="inherit" noWrap sx={{ opacity: entry.status === 'completed' ? 0.7 : 1 }}>
                                                                    {entry.title} ({format(entry.date, 'HH:mm')})
                                                                </Typography>
                                                            </Box>
                                                            <IconButton
                                                                className="edit-btn"
                                                                size="small"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEdit(entry);
                                                                }}
                                                                sx={{
                                                                    opacity: 0,
                                                                    transition: 'opacity 0.3s',
                                                                    color: '#FFFFFF',
                                                                    ml: 0.5
                                                                }}
                                                            >
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                        </Box>
                                                    );
                                                })}
                                                {dayEntries.length > 3 && (
                                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                                                        +{dayEntries.length - 3} more
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>
                            {/* Floating Create Button for Week View */}
                            <IconButton
                                onClick={() => {
                                    setNewEntryDate(format(currentDate, 'yyyy-MM-dd')); // Default to current week's start date
                                    setOpenDialog(true);
                                }}
                                sx={{
                                    position: 'fixed',
                                    bottom: 24,
                                    right: 24,
                                    zIndex: 1000,
                                    bgcolor: 'primary.main',
                                    color: 'white',
                                    width: 56,
                                    height: 56,
                                    borderRadius: '50%',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                                    '&:hover': {
                                        bgcolor: 'primary.dark',
                                        boxShadow: '0 6px 16px rgba(0,0,0,0.3)',
                                    }
                                }}
                            >
                                <AddIcon sx={{ fontSize: 28 }} />
                            </IconButton>
                        </Box>
                    ) : (
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: 'transparent', overflowY: 'auto' }}>
                            <Box sx={{ p: 4 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{
                                            width: 80,
                                            height: 80,
                                            borderRadius: '50%',
                                            bgcolor: isSameDay(selectedDate, new Date()) ? 'primary.main' : 'background.paper',
                                            color: isSameDay(selectedDate, new Date()) ? 'white' : 'text.primary',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: isSameDay(selectedDate, new Date()) ? 'none' : '1px solid',
                                            borderColor: 'divider',
                                            boxShadow: isSameDay(selectedDate, new Date()) ? '0 6px 16px rgba(0,0,0,0.15)' : 'none'
                                        }}>
                                            <Typography variant="h3" sx={{ fontWeight: 800, fontSize: '2rem', color: 'inherit' }}>{format(selectedDate, 'd')}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>{format(selectedDate, 'EEEE')}</Typography>
                                            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>{format(selectedDate, 'MMMM yyyy')}</Typography>
                                        </Box>
                                    </Box>

                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <Box sx={{ textAlign: 'right', px: 3, py: 2, bgcolor: 'grey.50', borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                                            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>YEAR PROGRESS</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main', fontSize: '1rem' }}>
                                                Day {getDayOfYear(selectedDate)} / {isLeapYear(selectedDate) ? 366 : 365}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'right', px: 3, py: 2, bgcolor: 'grey.50', borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                                            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>WEEK PROGRESS</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 800, color: 'secondary.main', fontSize: '1rem' }}>
                                                Week {getWeek(selectedDate)} / {getISOWeeksInYear(selectedDate)}
                                            </Typography>
                                        </Box>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => setView('month')}
                                            sx={{ borderRadius: 4, textTransform: 'none', px: 3, py: 1, fontWeight: 600, boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}
                                        >
                                            Back to Month
                                        </Button>
                                    </Box>
                                </Box>

                                <Divider sx={{ mb: 4, mt: 2 }} />

                                <Typography variant="h6" sx={{ mb: 3, fontWeight: 800, color: 'text.primary', textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '0.05em' }}>
                                    Day Schedule
                                </Typography>

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {(() => {
                                        const dayEntries = filteredEntries.filter((e: CalendarEntry) => isSameDay(e.date, selectedDate));
                                        return dayEntries.length > 0 ? (
                                            dayEntries.map((entry: CalendarEntry) => {
                                                const cat = CATEGORIES.find(c => c.id === entry.category);
                                                return (
                                                    <Box
                                                        key={entry.id}
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 2,
                                                            p: 3,
                                                            borderRadius: 4,
                                                            bgcolor: 'background.paper',
                                                            border: '1px solid',
                                                            borderColor: 'divider',
                                                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                                            transition: 'all 0.2s ease',
                                                            '&:hover': {
                                                                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                                                                transform: 'translateY(-2px)',
                                                                '& .delete-btn': { opacity: 1 },
                                                                '& .edit-btn': { opacity: 1 }
                                                            }
                                                        }}
                                                    >
                                                        <Box sx={{
                                                            width: 48,
                                                            height: 48,
                                                            borderRadius: 4,
                                                            bgcolor: `${cat?.color}15`,
                                                            color: cat?.color,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            border: '1px solid',
                                                            borderColor: `${cat?.color}20`
                                                        }}>
                                                            {cat?.icon && React.cloneElement(cat.icon as any, { sx: { fontSize: '1.4rem' } })}
                                                        </Box>
                                                        <Box sx={{ flex: 1 }}>
                                                            <Typography
                                                                variant="subtitle1"
                                                                sx={{
                                                                    fontWeight: 700,
                                                                    color: entry.status === 'completed' ? 'text.disabled' : 'text.primary',
                                                                    fontSize: '1rem',
                                                                    textDecoration: entry.status === 'completed' ? 'line-through' : 'none'
                                                                }}
                                                            >
                                                                {entry.title}
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.85rem', color: 'text.secondary' }}>
                                                                <span>{cat?.label} • {format(entry.date, 'HH:mm')}</span>
                                                                {entry.priority && (
                                                                    <Chip
                                                                        label={entry.priority}
                                                                        size="small"
                                                                        sx={{
                                                                            height: 20,
                                                                            fontSize: '0.65rem',
                                                                            fontWeight: 700,
                                                                            textTransform: 'uppercase',
                                                                            bgcolor: entry.priority === 'High' ? 'rgba(244, 67, 54, 0.1)' :
                                                                                entry.priority === 'Medium' ? 'rgba(255, 152, 0, 0.1)' :
                                                                                    'rgba(76, 175, 80, 0.1)',
                                                                            color: entry.priority === 'High' ? '#f44336' :
                                                                                entry.priority === 'Medium' ? '#ff9800' :
                                                                                    '#4caf50',
                                                                            border: '1px solid',
                                                                            borderColor: 'currentColor'
                                                                        }}
                                                                    />
                                                                )}
                                                                <Chip
                                                                    label={entry.status === 'completed' ? 'Completed' : 'Pending'}
                                                                    size="small"
                                                                    sx={{
                                                                        height: 20,
                                                                        fontSize: '0.65rem',
                                                                        fontWeight: 700,
                                                                        textTransform: 'uppercase',
                                                                        bgcolor: entry.status === 'completed' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                                                                        color: entry.status === 'completed' ? '#4caf50' : 'text.secondary',
                                                                        border: '1px solid',
                                                                        borderColor: 'currentColor'
                                                                    }}
                                                                />
                                                            </Box>
                                                            {entry.category_data && Object.entries(entry.category_data as Record<string, any>).some(([_, v]) => v) && (
                                                                <Box sx={{ mt: 1 }}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                toggleNoteDetails(entry.id);
                                                                            }}
                                                                            sx={{
                                                                        p: 0.5,
                                                                        borderRadius: 1,
                                                                        color: 'text.secondary',
                                                                        '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                                                                            }}
                                                                        >
                                                                            {showNoteDetails[entry.id] ? <VisibilityOffIcon sx={{ fontSize: '0.9rem' }} /> : <VisibilityIcon sx={{ fontSize: '0.9rem' }} />}
                                                                        </IconButton>
                                                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                                                            Note Details
                                                                        </Typography>
                                                                    </Box>
                                                                    {showNoteDetails[entry.id] && (
                                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                                            {(Object.entries(entry.category_data) as [string, any][]).map(([key, value]) => (
                                                                                value && (
                                                                                    <Chip
                                                                                        key={key}
                                                                                        label={`${key.replace(/_/g, ' ')}: ${value}`}
                                                                                        size="small"
                                                                                        variant="outlined"
                                                                                        sx={{
                                                                                            fontSize: '0.65rem',
                                                                                            height: 20,
                                                                                            borderColor: `${cat?.color}40`,
                                                                                            color: 'text.secondary',
                                                                                            bgcolor: `${cat?.color}05`,
                                                                                            textTransform: 'capitalize'
                                                                                        }}
                                                                                    />
                                                                                )
                                                                            ))}
                                                                        </Box>
                                                                    )}
                                                                </Box>
                                                            )}
                                                        </Box>
                                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                                            <IconButton
                                                                onClick={(e) => toggleEntryStatus(e, entry)}
                                                                sx={{
                                                                    color: entry.status === 'completed' ? 'success.main' : 'text.disabled',
                                                                    borderRadius: 2,
                                                                    '&:hover': { bgcolor: 'rgba(76, 175, 80, 0.1)' }
                                                                }}
                                                            >
                                                                {entry.status === 'completed' ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
                                                            </IconButton>
                                                            <IconButton
                                                                className="edit-btn"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEdit(entry);
                                                                }}
                                                                sx={{ opacity: 0, transition: 'opacity 0.3s', color: 'primary.main', borderRadius: 2 }}
                                                            >
                                                                <EditIcon />
                                                            </IconButton>
                                                            <IconButton
                                                                className="delete-btn"
                                                                onClick={(e) => handleDelete(e, entry.id)}
                                                                sx={{ opacity: 0, transition: 'opacity 0.3s', color: 'error.main', borderRadius: 2 }}
                                                            >
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        </Box>
                                                    </Box>
                                                );
                                            })
                                        ) : (
                                            <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'background.paper', borderRadius: 6, border: '2px dashed', borderColor: 'divider', p: 6 }}>
                                                <EventIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 3 }} />
                                                <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700, mb: 1, fontSize: '1.2rem' }}>No events scheduled</Typography>
                                                <Typography variant="body2" color="text.disabled" sx={{ mb: 3, fontSize: '0.9rem' }}>There are no entries for this day yet.</Typography>
                                                <Button
                                                    startIcon={<AddIcon />}
                                                    variant="contained"
                                                    sx={{ mt: 2, px: 4, py: 1.5, borderRadius: 4 }}
                                                    onClick={() => {
                                                        setNewEntryDate(format(selectedDate, 'yyyy-MM-dd'));
                                                        setOpenDialog(true);
                                                    }}
                                                >
                                                    Create Entry
                                                </Button>
                                            </Box>
                                        );
                                    })()}
                                </Box>
                            </Box>
                            {/* Floating Create Button for Day View */}
                            <IconButton
                                onClick={() => {
                                    setNewEntryDate(format(selectedDate, 'yyyy-MM-dd'));
                                    setOpenDialog(true);
                                }}
                                sx={{
                                    position: 'fixed',
                                    bottom: 24,
                                    right: 24,
                                    zIndex: 1000,
                                    bgcolor: 'primary.main',
                                    color: 'white',
                                    width: 56,
                                    height: 56,
                                    borderRadius: '50%',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                                    '&:hover': {
                                        bgcolor: 'primary.dark',
                                        boxShadow: '0 6px 16px rgba(0,0,0,0.3)',
                                    }
                                }}
                            >
                                <AddIcon sx={{ fontSize: 28 }} />
                            </IconButton>
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Add Entry Dialog */}
            <Dialog open={openDialog} onClose={() => {
                setOpenDialog(false);
                setEditingEntry(null);
                setNewEntryTitle('');
                setCategoryData({});
                setSelectedPriority('Medium');
            }} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ pb: 2, fontWeight: 700, fontSize: '1.25rem' }}>{editingEntry ? 'Edit Entry' : 'Create New Entry'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                        <TextField
                            label="Title"
                            fullWidth
                            variant="outlined"
                            value={newEntryTitle}
                            onChange={(e) => setNewEntryTitle(e.target.value)}
                            autoFocus
                            sx={{ mt: 1 }}
                        />
                        <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                            <TextField
                                label="Date"
                                type="date"
                                fullWidth
                                variant="outlined"
                                value={newEntryDate}
                                onChange={(e) => setNewEntryDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                sx={{ mt: 2 }}
                            />
                            <TextField
                                label="Time"
                                type="time"
                                fullWidth
                                variant="outlined"
                                value={newEntryTime}
                                onChange={(e) => setNewEntryTime(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                sx={{ mt: 2 }}
                            />
                        </Box>
                        <FormControl fullWidth variant="outlined" sx={{ mt: 2 }}>
                            <InputLabel>Category</InputLabel>
                            <Select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                label="Category"
                            >
                                {CATEGORIES.map(cat => (
                                    <MenuItem key={cat.id} value={cat.id}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{ width: 12, height: 12, bgcolor: cat.color }} />
                                            {cat.label}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth variant="outlined" sx={{ mt: 2 }}>
                            <InputLabel>Priority Level</InputLabel>
                            <Select
                                value={selectedPriority}
                                onChange={(e) => setSelectedPriority(e.target.value)}
                                label="Priority Level"
                            >
                                <MenuItem value="Low">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 12, height: 12, bgcolor: '#4caf50', borderRadius: '50%' }} />
                                        Low
                                    </Box>
                                </MenuItem>
                                <MenuItem value="Medium">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 12, height: 12, bgcolor: '#ff9800', borderRadius: '50%' }} />
                                        Medium
                                    </Box>
                                </MenuItem>
                                <MenuItem value="High">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 12, height: 12, bgcolor: '#f44336', borderRadius: '50%' }} />
                                        High
                                    </Box>
                                </MenuItem>
                            </Select>
                        </FormControl>

                        {/* Category Specific Fields */}
                        {selectedCategory === 'health' && (
                            <TextField
                                label="Regular Checkup Schedule"
                                fullWidth
                                variant="outlined"
                                value={categoryData.checkup_schedule || ''}
                                onChange={(e) => handleCategoryDataChange('checkup_schedule', e.target.value)}
                                placeholder="e.g. Every 6 months"
                            />
                        )}

                        {selectedCategory === 'wealth' && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    label="Income"
                                    type="number"
                                    fullWidth
                                    variant="outlined"
                                    value={categoryData.income || ''}
                                    onChange={(e) => handleCategoryDataChange('income', e.target.value)}
                                />
                                <TextField
                                    label="Outcome"
                                    type="number"
                                    fullWidth
                                    variant="outlined"
                                    value={categoryData.outcome || ''}
                                    onChange={(e) => handleCategoryDataChange('outcome', e.target.value)}
                                />
                                <TextField
                                    label="Investment"
                                    type="number"
                                    fullWidth
                                    variant="outlined"
                                    value={categoryData.investment || ''}
                                    onChange={(e) => handleCategoryDataChange('investment', e.target.value)}
                                />
                            </Box>
                        )}

                        {selectedCategory === 'event' && (
                            <TextField
                                label="Family Events"
                                fullWidth
                                variant="outlined"
                                multiline
                                rows={2}
                                value={categoryData.family_events || ''}
                                onChange={(e) => handleCategoryDataChange('family_events', e.target.value)}
                                placeholder="Details about the family event..."
                            />
                        )}

                        {(selectedCategory === 'task' || selectedCategory === 'adls') && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                    Multiple {selectedCategory === 'task' ? 'Tasks' : 'ADLs'}
                                </Typography>
                                {multipleEntries.map((entry, index) => (
                                    <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                        <TextField
                                            label={selectedCategory === 'task' ? "Task" : "ADL"}
                                            fullWidth
                                            variant="outlined"
                                            value={entry.title}
                                            onChange={(e) => {
                                                const newEntries = [...multipleEntries];
                                                newEntries[index].title = e.target.value;
                                                setMultipleEntries(newEntries);
                                            }}
                                            placeholder={selectedCategory === 'task' ? "Enter task" : "Enter ADL"}
                                        />
                                        <IconButton
                                            onClick={() => {
                                                const newEntries = multipleEntries.filter((_, i) => i !== index);
                                                setMultipleEntries(newEntries);
                                            }}
                                            sx={{ color: 'error.main' }}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                ))}
                                <Button
                                    onClick={() => setMultipleEntries([...multipleEntries, { title: '', date: newEntryDate }])}
                                    startIcon={<AddIcon />}
                                    variant="outlined"
                                    sx={{ alignSelf: 'flex-start' }}
                                >
                                    Add More {selectedCategory === 'task' ? 'Tasks' : 'ADLs'}
                                </Button>
                            </Box>
                        )}

                        {selectedCategory === 'goal' && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <FormControl fullWidth variant="outlined">
                                    <InputLabel>Goal Duration</InputLabel>
                                    <Select
                                        value={goalDuration}
                                        onChange={(e) => setGoalDuration(e.target.value)}
                                        label="Goal Duration"
                                    >
                                        <MenuItem value="day">Day</MenuItem>
                                        <MenuItem value="week">Week</MenuItem>
                                        <MenuItem value="month">Month</MenuItem>
                                        <MenuItem value="year">Year</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={goalRecurring}
                                            onChange={(e) => setGoalRecurring(e.target.checked)}
                                        />
                                    }
                                    label="Recurring Goal"
                                />
                                <TextField
                                    label="Goal Details"
                                    fullWidth
                                    variant="outlined"
                                    multiline
                                    rows={2}
                                    value={categoryData.goal_details || ''}
                                    onChange={(e) => handleCategoryDataChange('goal_details', e.target.value)}
                                    placeholder="Describe your goal..."
                                />
                            </Box>
                        )}


                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => {
                        setOpenDialog(false);
                        setEditingEntry(null);
                        setNewEntryTitle('');
                        setCategoryData({});
                        setMultipleEntries([{ title: '', date: format(new Date(), 'yyyy-MM-dd') }]);
                        setGoalDuration('day');
                        setGoalRecurring(false);
                    }} sx={{ textTransform: 'none', fontWeight: 600, px: 3, py: 1 }}>Cancel</Button>
                    {editingEntry ? (
                        <Button
                            onClick={handleUpdateEntry}
                            variant="contained"
                            disabled={!newEntryTitle}
                            sx={{ textTransform: 'none', borderRadius: 4, fontWeight: 600, px: 3, py: 1 }}
                        >
                            Update
                        </Button>
                    ) : (
                        <Button
                            onClick={handleAddEntry}
                            variant="contained"
                            disabled={!(newEntryTitle || (selectedCategory === 'task' && multipleEntries.some(e => e.title.trim() !== '')) || (selectedCategory === 'adls' && multipleEntries.some(e => e.title.trim() !== '')))}
                            sx={{ textTransform: 'none', borderRadius: 4, fontWeight: 600, px: 3, py: 1 }}
                        >
                            Save
                        </Button>
                    )}
                </DialogActions>
            </Dialog>


            {/* Add Calendar Integration Dialog */}
            <Dialog open={showAddCalendarIntegration} onClose={() => setShowAddCalendarIntegration(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ pb: 2, fontWeight: 700 }}>
                    Connect Calendar
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                        <FormControl fullWidth>
                            <InputLabel>Calendar Provider</InputLabel>
                            <Select
                                value={selectedProvider}
                                onChange={(e) => setSelectedProvider(e.target.value as CalendarProvider)}
                                label="Calendar Provider"
                                disabled={settingsLoading}
                            >
                                {CALENDAR_PROVIDERS.map(provider => (
                                    <MenuItem key={provider.id} value={provider.id}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Box sx={{ 
                                                width: 24, 
                                                height: 24, 
                                                borderRadius: '50%', 
                                                bgcolor: provider.color,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontWeight: 'bold',
                                                fontSize: '0.75rem'
                                            }}>
                                                {provider.icon}
                                            </Box>
                                            <Box>
                                                <Typography variant="body1">{provider.name}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {provider.description}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        
                        <TextField
                            label="Display Name"
                            fullWidth
                            variant="outlined"
                            value={integrationDisplayName}
                            onChange={(e) => setIntegrationDisplayName(e.target.value)}
                            disabled={settingsLoading}
                            helperText="Give this calendar connection a name"
                        />
                        
                        <TextField
                            label="Email Address (Optional)"
                            fullWidth
                            variant="outlined"
                            type="email"
                            value={integrationEmail}
                            onChange={(e) => setIntegrationEmail(e.target.value)}
                            disabled={settingsLoading}
                            helperText="Your calendar email address"
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button 
                        onClick={() => setShowAddCalendarIntegration(false)}
                        disabled={settingsLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAddCalendarIntegration}
                        variant="contained"
                        disabled={settingsLoading || !integrationDisplayName.trim()}
                        startIcon={settingsLoading ? <CircularProgress size={20} /> : <AddIcon />}
                    >
                        {settingsLoading ? 'Connecting...' : 'Connect Calendar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={closeSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert 
                    onClose={closeSnackbar} 
                    severity={snackbar.severity} 
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* Settings Dialog */}
            <Dialog open={openSettings} onClose={() => setOpenSettings(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ pb: 2, fontWeight: 700, fontSize: '1.25rem' }}>
                    Settings
                </DialogTitle>
                <DialogContent dividers sx={{ p: 0 }}>
                    <Tabs
                        value={settingsTab}
                        onChange={(e, newValue) => setSettingsTab(newValue)}
                        variant="fullWidth"
                        sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
                    >
                        <Tab icon={<TimeIcon />} label="Time Zone" />
                        <Tab icon={<NotificationIcon />} label="Notifications" />
                        <Tab icon={<CloudSyncIcon />} label="Calendar Sync" />
                        <Tab icon={<FeedbackIcon />} label="Feedback" />
                    </Tabs>
                    
                    <Box sx={{ p: 3 }}>
                        {/* Time Zone Tab */}
                        {settingsTab === 0 && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                    Time Zone Settings
                                </Typography>
                                
                                <Box>
                                    <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                                        Current Time Zone: <strong>{timezone}</strong>
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => {
                                            const detected = detectUserTimezone();
                                            handleTimezoneChange(detected);
                                        }}
                                        sx={{ mb: 2 }}
                                    >
                                        Detect My Time Zone
                                    </Button>
                                    
                                    <FormControl fullWidth variant="outlined" size="small">
                                        <InputLabel>Choose Time Zone</InputLabel>
                                        <Select
                                            label="Choose Time Zone"
                                            value={timezone}
                                            onChange={(e) => handleTimezoneChange(e.target.value)}
                                            disabled={settingsLoading}
                                        >
                                            {getTimezoneOptions().map((tz) => (
                                                <MenuItem key={tz.value} value={tz.value}>
                                                    {tz.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            </Box>
                        )}

                        {/* Notification Settings Tab */}
                        {settingsTab === 1 && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                    Notification Preferences
                                </Typography>
                                
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                        <Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <EmailIcon color="primary" />
                                                <Typography variant="body1" sx={{ fontWeight: 600 }}>Email Notifications</Typography>
                                            </Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Receive email notifications for events and reminders
                                            </Typography>
                                        </Box>
                                        <Switch
                                            checked={notificationSettings.email}
                                            onChange={(e) => handleNotificationSettingChange('email', e.target.checked)}
                                            disabled={settingsLoading}
                                        />
                                    </Box>
                                    
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                        <Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <NotificationIcon color="primary" />
                                                <Typography variant="body1" sx={{ fontWeight: 600 }}>Push Notifications</Typography>
                                            </Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Receive push notifications on your device
                                            </Typography>
                                        </Box>
                                        <Switch
                                            checked={notificationSettings.push}
                                            onChange={(e) => handleNotificationSettingChange('push', e.target.checked)}
                                            disabled={settingsLoading}
                                        />
                                    </Box>
                                    
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                        <Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <TimeIcon color="primary" />
                                                <Typography variant="body1" sx={{ fontWeight: 600 }}>Daily Reminders</Typography>
                                            </Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Get daily summaries and reminders
                                            </Typography>
                                        </Box>
                                        <Switch
                                            checked={notificationSettings.daily_reminders}
                                            onChange={(e) => handleNotificationSettingChange('daily_reminders', e.target.checked)}
                                            disabled={settingsLoading}
                                        />
                                    </Box>
                                </Box>
                                
                                {notificationSettings.daily_reminders && (
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                            Reminder Frequency
                                        </Typography>
                                        <FormControl fullWidth size="small">
                                            <Select
                                                value={notificationSettings.frequency}
                                                onChange={(e) => handleNotificationSettingChange('frequency', e.target.value)}
                                                disabled={settingsLoading}
                                            >
                                                <MenuItem value="daily">Daily</MenuItem>
                                                <MenuItem value="weekly">Weekly</MenuItem>
                                                <MenuItem value="monthly">Monthly</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Box>
                                )}
                            </Box>
                        )}

                        {/* Calendar Sync Tab */}
                        {settingsTab === 2 && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                        Calendar Integrations
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={() => setShowAddCalendarIntegration(true)}
                                        size="small"
                                    >
                                        Add Calendar
                                    </Button>
                                </Box>
                                
                                {calendarIntegrations.length === 0 ? (
                                    <Box sx={{ textAlign: 'center', py: 4 }}>
                                        <CloudSyncIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                                        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                                            No Calendar Connections
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            Connect your external calendars to sync events automatically
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            onClick={() => setShowAddCalendarIntegration(true)}
                                        >
                                            Connect Calendar
                                        </Button>
                                    </Box>
                                ) : (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        {calendarIntegrations.map((integration) => {
                                            const providerInfo = CALENDAR_PROVIDERS.find(p => p.id === integration.provider);
                                            return (
                                                <Card key={integration.id} sx={{ border: '1px solid', borderColor: 'divider' }}>
                                                    <CardContent>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                                <Box sx={{ 
                                                                    width: 40, 
                                                                    height: 40, 
                                                                    borderRadius: '50%', 
                                                                    bgcolor: providerInfo?.color || '#3b82f6',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    color: 'white',
                                                                    fontWeight: 'bold'
                                                                }}>
                                                                    {providerInfo?.icon || integration.provider.charAt(0).toUpperCase()}
                                                                </Box>
                                                                <Box>
                                                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                                        {integration.display_name}
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {integration.email || 'No email provided'}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                            
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Chip
                                                                    label={integration.sync_status}
                                                                    size="small"
                                                                    color={
                                                                        integration.sync_status === 'connected' ? 'success' :
                                                                        integration.sync_status === 'error' ? 'error' : 'default'
                                                                    }
                                                                    sx={{ textTransform: 'capitalize' }}
                                                                />
                                                                {syncingIntegrationId === integration.id ? (
                                                                    <CircularProgress size={20} />
                                                                ) : (
                                                                    <IconButton
                                                                        onClick={() => handleSyncCalendar(integration.id)}
                                                                        size="small"
                                                                        disabled={!integration.sync_enabled}
                                                                    >
                                                                        <SyncIcon fontSize="small" />
                                                                    </IconButton>
                                                                )}
                                                                <IconButton
                                                                    onClick={() => handleDeleteCalendarIntegration(integration.id)}
                                                                    size="small"
                                                                    color="error"
                                                                >
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </Box>
                                                        </Box>
                                                        
                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                            <FormControlLabel
                                                                control={
                                                                    <Switch
                                                                        checked={integration.sync_enabled}
                                                                        onChange={() => handleToggleCalendarSync(integration.id)}
                                                                        disabled={settingsLoading}
                                                                    />
                                                                }
                                                                label="Enable Sync"
                                                            />
                                                            
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Sync Frequency:
                                                                </Typography>
                                                                <Select
                                                                    size="small"
                                                                    value={integration.sync_frequency}
                                                                    onChange={(e) => handleUpdateSyncFrequency(integration.id, e.target.value as SyncFrequency)}
                                                                    disabled={settingsLoading || !integration.sync_enabled}
                                                                    sx={{ minWidth: 120 }}
                                                                >
                                                                    {SYNC_FREQUENCIES.map(freq => (
                                                                        <MenuItem key={freq.value} value={freq.value}>
                                                                            {freq.label}
                                                                        </MenuItem>
                                                                    ))}
                                                                </Select>
                                                            </Box>
                                                        </Box>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </Box>
                                )}
                            </Box>
                        )}

                        {/* Feedback Tab */}
                        {settingsTab === 3 && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                    Send Feedback
                                </Typography>
                                
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Feedback Category</InputLabel>
                                        <Select
                                            value={feedbackForm.category}
                                            onChange={(e) => setFeedbackForm(prev => ({ ...prev, category: e.target.value }))}
                                            disabled={settingsLoading}
                                        >
                                            {FEEDBACK_CATEGORIES.map(category => (
                                                <MenuItem key={category.value} value={category.value}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <span>{category.icon}</span>
                                                        <span>{category.label}</span>
                                                    </Box>
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    
                                    <TextField
                                        label="Subject"
                                        fullWidth
                                        variant="outlined"
                                        value={feedbackForm.subject}
                                        onChange={(e) => setFeedbackForm(prev => ({ ...prev, subject: e.target.value }))}
                                        disabled={settingsLoading}
                                        helperText="Brief description of your feedback"
                                    />
                                    
                                    <TextField
                                        label="Detailed Message"
                                        multiline
                                        rows={4}
                                        fullWidth
                                        variant="outlined"
                                        value={feedbackForm.message}
                                        onChange={(e) => setFeedbackForm(prev => ({ ...prev, message: e.target.value }))}
                                        disabled={settingsLoading}
                                        helperText="Please provide detailed information about your feedback"
                                    />
                                    
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Priority</InputLabel>
                                        <Select
                                            value={feedbackForm.priority}
                                            onChange={(e) => setFeedbackForm(prev => ({ ...prev, priority: e.target.value }))}
                                            disabled={settingsLoading}
                                        >
                                            {PRIORITY_LEVELS.map(level => (
                                                <MenuItem key={level.value} value={level.value}>
                                                    <Chip
                                                        label={level.label}
                                                        size="small"
                                                        color={level.color as any}
                                                        variant="outlined"
                                                    />
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                        <Button
                                            variant="contained"
                                            onClick={handleFeedbackSubmit}
                                            disabled={settingsLoading || !feedbackForm.subject.trim() || !feedbackForm.message.trim()}
                                            startIcon={settingsLoading ? <CircularProgress size={20} /> : null}
                                        >
                                            {settingsLoading ? 'Submitting...' : 'Send Feedback'}
                                        </Button>
                                    </Box>
                                </Box>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setOpenSettings(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>
                        Close
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
                        background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.05) 0%, rgba(156, 39, 176, 0.02) 100%)',
                        borderBottom: '1px solid rgba(156, 39, 176, 0.1)'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Box 
                                sx={{ 
                                    width: 48, 
                                    height: 48, 
                                    borderRadius: 3, 
                                    bgcolor: '#9C27B0', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 12px rgba(156, 39, 176, 0.3)'
                                }}
                            >
                                <AnalyticsIcon sx={{ fontSize: 24, color: 'white' }} />
                            </Box>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
                                    Personal Task Analytics
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Comprehensive insights into your personal tasks and activities
                                </Typography>
                            </Box>
                        </Box>
                        <IconButton onClick={() => setShowAnalytics(false)} sx={{ color: 'text.secondary' }}>
                            ×
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ px: 4, py: 3 }}>
                    {(() => {
                        const analytics = getAnalyticsData();
                        return (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {/* Filters */}
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                    <FormControl size="small" sx={{ minWidth: 120 }}>
                                        <InputLabel>Time Period</InputLabel>
                                        <Select
                                            value={analyticsFilter}
                                            onChange={(e) => setAnalyticsFilter(e.target.value)}
                                            label="Time Period"
                                        >
                                            <MenuItem value="all">All Time</MenuItem>
                                            <MenuItem value="today">Today</MenuItem>
                                            <MenuItem value="week">This Week</MenuItem>
                                            <MenuItem value="month">This Month</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <FormControl size="small" sx={{ minWidth: 120 }}>
                                        <InputLabel>Category</InputLabel>
                                        <Select
                                            value={analyticsCategory}
                                            onChange={(e) => setAnalyticsCategory(e.target.value)}
                                            label="Category"
                                        >
                                            <MenuItem value="all">All Categories</MenuItem>
                                            {CATEGORIES.map(cat => (
                                                <MenuItem key={cat.id} value={cat.id}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <span>{cat.icon}</span>
                                                        <span>{cat.label}</span>
                                                    </Box>
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>

                                {/* Overview Cards */}
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3 }}>
                                    <Box>
                                        <Card sx={{ 
                                            p: 3, 
                                            textAlign: 'center',
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            color: 'white',
                                            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
                                        }}>
                                            <Box sx={{ mb: 2 }}>
                                                <AssignmentIcon sx={{ fontSize: 24, color: 'white' }} />
                                            </Box>
                                            <Typography variant="h3" sx={{ fontWeight: 800, color: 'white', mb: 1 }}>
                                                {analytics.totalTasks}
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700, opacity: 0.9 }}>
                                                Total Tasks
                                            </Typography>
                                        </Card>
                                    </Box>
                                    <Box>
                                        <Card sx={{ 
                                            p: 3, 
                                            textAlign: 'center',
                                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                            color: 'white',
                                            boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)'
                                        }}>
                                            <Box sx={{ mb: 2 }}>
                                                <CheckCircleIcon sx={{ fontSize: 24, color: 'white' }} />
                                            </Box>
                                            <Typography variant="h3" sx={{ fontWeight: 800, color: 'white', mb: 1 }}>
                                                {analytics.completedTasks}
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700, opacity: 0.9 }}>
                                                Completed
                                            </Typography>
                                        </Card>
                                    </Box>
                                    <Box>
                                        <Card sx={{ 
                                            p: 3, 
                                            textAlign: 'center',
                                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                            color: 'white',
                                            boxShadow: '0 8px 32px rgba(245, 158, 11, 0.3)'
                                        }}>
                                            <Box sx={{ mb: 2 }}>
                                                <RadioButtonUncheckedIcon sx={{ fontSize: 24, color: 'white' }} />
                                            </Box>
                                            <Typography variant="h3" sx={{ fontWeight: 800, color: 'white', mb: 1 }}>
                                                {analytics.pendingTasks}
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700, opacity: 0.9 }}>
                                                Pending
                                            </Typography>
                                        </Card>
                                    </Box>
                                    <Box>
                                        <Card sx={{ 
                                            p: 3, 
                                            textAlign: 'center',
                                            background: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
                                            color: 'white',
                                            boxShadow: '0 8px 32px rgba(156, 39, 176, 0.3)'
                                        }}>
                                            <Box sx={{ mb: 2 }}>
                                                <TrendingUpIcon sx={{ fontSize: 24, color: 'white' }} />
                                            </Box>
                                            <Typography variant="h3" sx={{ fontWeight: 800, color: 'white', mb: 1 }}>
                                                {analytics.completionRate}%
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700, opacity: 0.9 }}>
                                                Completion Rate
                                            </Typography>
                                        </Card>
                                    </Box>
                                </Box>

                                {/* Category Breakdown */}
                                <Card sx={{ p: 3 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
                                        Category Breakdown
                                    </Typography>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                                        {Object.entries(analytics.categoryBreakdown).map(([category, count]) => {
                                            const cat = CATEGORIES.find(c => c.id === category);
                                            return (
                                                <Box key={category} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                                                    <Box sx={{ 
                                                        width: 40, 
                                                        height: 40, 
                                                        borderRadius: 2, 
                                                        bgcolor: cat?.color || '#9C27B0',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white'
                                                    }}>
                                                        {cat?.icon || '📋'}
                                                    </Box>
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                            {cat?.label || category}
                                                        </Typography>
                                                        <Typography variant="h6" sx={{ fontWeight: 700, color: cat?.color || '#9C27B0' }}>
                                                            {count}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                </Card>

                                {/* Priority Breakdown */}
                                {Object.keys(analytics.priorityBreakdown).length > 0 && (
                                    <Card sx={{ p: 3 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
                                            Priority Breakdown
                                        </Typography>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                                            {Object.entries(analytics.priorityBreakdown).map(([priority, count]) => (
                                                <Box key={priority} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                                                    <Chip 
                                                        label={priority} 
                                                        size="small"
                                                        sx={{ 
                                                            bgcolor: priority === 'High' ? '#ef4444' : priority === 'Medium' ? '#f59e0b' : '#10b981',
                                                            color: 'white',
                                                            fontWeight: 600
                                                        }}
                                                    />
                                                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                        {count}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Card>
                                )}
                            </Box>
                        );
                    })()}
                </DialogContent>
                <DialogActions sx={{ px: 4, py: 3, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                    <Button 
                        onClick={() => setShowAnalytics(false)} 
                        sx={{ 
                            fontWeight: 600, 
                            borderRadius: 3,
                            textTransform: 'none'
                        }}
                    >
                        Close
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
