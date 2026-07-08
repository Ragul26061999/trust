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
    Grid,
    Menu
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
import TranslatedText from '../../components/translated-text';
import { useTimeEngine, TimeEngineProvider } from '../../lib/time-engine';
import { useAuth } from '../../lib/auth-context';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
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
    updateCalendarIntegration,
    CALENDAR_PROVIDERS,
    SYNC_FREQUENCIES,
    type CalendarProvider,
    type SyncFrequency
} from '../../lib/calendar-integration-service';
import { convertFromUTC } from '../../lib/timezone-utils';
import { fetchGoogleCalendarEvents } from '../../lib/google-calendar-service';
import { SearchPanel } from '../../components/analytics/SearchPanel';
import { UnifiedSearchResult, TaskHistoryEntry, searchAllItems, getTaskHistory } from '../../lib/analytics-db';

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

import { checkConflicts, UnifiedTask } from '../../lib/task-logic-service';

interface CalendarEntry {
    id: string;
    title: string;
    date: Date;
    category: string;
    category_data?: any;
    priority?: string;
    status?: string;
    description?: string;
    completion_feedback?: string;
    source?: string;
    integrationId?: string;
    before_popup_minutes?: number;
    after_popup_minutes?: number;
}

interface CustomCalendar {
    id: string;
    name: string;
    color: string;
    visible: boolean;
}

const PersonalCalendarPage = () => {
    const { user } = useAuth();
    const { addAlarm } = useTimeEngine();
    const router = useRouter();
    const [view, setView] = useState<'month' | 'week' | 'day'>('day');
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
    const [beforePopupMinutes, setBeforePopupMinutes] = useState(0);
    const [afterPopupMinutes, setAfterPopupMinutes] = useState(0);
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

    const [addMenuAnchor, setAddMenuAnchor] = useState<null | HTMLElement>(null);

    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        if (scrollContainerRef.current && (view === 'day' || view === 'week')) {
            const currentHour = new Date().getHours();
            const rowHeight = view === 'day' ? 80 : 60;
            // Center the current time roughly by scrolling to currentHour minus 2
            const scrollTo = Math.max(0, (currentHour - 2) * rowHeight);
            
            // Allow a tiny delay for React to finish rendering the DOM before scrolling
            setTimeout(() => {
                scrollContainerRef.current?.scrollTo({ top: scrollTo, behavior: 'smooth' });
            }, 100);
        }
    }, [view, selectedDate, currentDate]);

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
            loadRoutines();
        }
    }, [user]);

    const [userRoutines, setUserRoutines] = useState<{ sleepStart: string | null, sleepEnd: string | null, breaks: any[] }>({ sleepStart: null, sleepEnd: null, breaks: [] });

    const loadRoutines = async () => {
        if (!user || !supabase) return;
        try {
            const prefsRes = await supabase.from('user_preferences').select('default_sleep_start, default_sleep_end').eq('user_id', user.id).single();
            const breaksRes = await supabase.from('user_breaks').select('*').eq('user_id', user.id);
            
            setUserRoutines({
                sleepStart: prefsRes.data?.default_sleep_start || null,
                sleepEnd: prefsRes.data?.default_sleep_end || null,
                breaks: breaksRes.data || []
            });
        } catch (e) {
            console.error('Error loading routines:', e);
        }
    };

    // Load user settings
    const loadUserSettings = async () => {
        if (!user) return;
        
        setSettingsLoading(true);
        
        try {
            // Load timezone preference
            const tz = await getTimezonePreference(user.id);
            if (tz && tz !== 'UTC') {
                setTimezone(tz);
            } else {
                // If not set or UTC (default), detect the user's actual timezone
                const detected = detectUserTimezone();
                if (detected && detected !== timezone) {
                    setTimezone(detected);
                    // Inform the user we're setting their timezone
                    console.log('Automatically detected and setting timezone:', detected);
                    // We don't necessarily need to save it immediately to the DB to avoid unnecessary writes,
                    // but it's good to have it in the UI
                }
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

    // Fetch actual external calendar events from connected integrations
    const fetchExternalCalendarEventsFromAPI = async (integration: any): Promise<any[]> => {
        if (!user || integration.provider !== 'google' || !integration.access_token) {
            return [];
        }

        try {
            const timeMin = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
            const timeMax = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();
            
            const googleEvents = await fetchGoogleCalendarEvents(
                integration.access_token,
                timeMin,
                timeMax
            );
            
            return googleEvents;
        } catch (error: any) {
            console.error(`Error fetching Google events for ${integration.display_name}:`, error);
            
            // If unauthorized, update sync status to error
            if (error.message === 'UNAUTHORIZED' || error.message?.includes('invalid_grant')) {
                updateCalendarIntegration(integration.id, user.id, { 
                    sync_status: 'error',
                    error_message: 'Authentication expired. Please reconnect your calendar.'
                });
            }
            
            return [];
        }
    };

    // Main function to fetch external calendar events from connected integrations
    const fetchExternalCalendarEvents = async (integrations: any[]) => {
        if (!user) return;
        
        try {
            // Filter for connected and enabled integrations
            const activeIntegrations = integrations.filter(
                (integration: any) => integration.sync_enabled && 
                                    (integration.sync_status === 'connected' || integration.sync_status === 'syncing')
            );
            
            for (const integration of activeIntegrations) {
                const externalEvents = await fetchExternalCalendarEventsFromAPI(integration);
                
                // Convert external events to our calendar entry format
                const externalEntries = externalEvents.map((event: any) => {
                    const startDateTime = event.start.dateTime || event.start.date;
                    return {
                        id: `external_${integration.id}_${event.id}`,
                        title: event.summary || 'No Title',
                        date: convertFromUTC(new Date(startDateTime), timezone),
                        category: 'event',
                        priority: 'Medium',
                        status: 'pending',
                        description: event.description || '',
                        source: 'external',
                        integrationId: integration.id
                    };
                });
                
                // Add external events to the entries state
                setEntries(prevEntries => {
                    const filteredEntries = prevEntries.filter(entry => 
                        entry.source !== 'external' || entry.integrationId !== integration.id
                    );
                    return [...filteredEntries, ...externalEntries];
                });

                // Update last sync time in DB silently
                if (integration.sync_frequency === 'realtime') {
                   updateCalendarIntegration(integration.id, user.id, { last_sync_at: new Date().toISOString() });
                }
            }
        } catch (error) {
            console.error('Error in fetchExternalCalendarEvents:', error);
        }
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
    
    // Real-time Sync Polling
    useEffect(() => {
        if (!user || calendarIntegrations.length === 0) return;
        
        const realtimeIntegrations = calendarIntegrations.filter(
            int => int.sync_enabled && int.sync_frequency === 'realtime'
        );
        
        if (realtimeIntegrations.length === 0) return;
        
        // Initial fetch is already handled on load
        
        const intervalId = setInterval(() => {
            console.log('Real-time sync polling triggered...');
            fetchExternalCalendarEvents(calendarIntegrations);
        }, 5 * 60 * 1000); // Poll every 5 minutes
        
        return () => clearInterval(intervalId);
    }, [user, calendarIntegrations]);

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
        
        const entryDateTime = new Date(`${newEntryDate}T${newEntryTime}`);
        
        // 1. Logic Check: Conflict Detection (Senior logically thinking)
        const conflicts = await checkConflicts(user.id, entryDateTime.toISOString());
        if (conflicts.length > 0) {
            const confirmConflict = window.confirm(
                `Logic Alert: You have ${conflicts.length} existing task(s) overlapping with this time. \n\n` +
                conflicts.map(c => `- ${c.title} (${format(parseISO(c.start_time), 'HH:mm')})`).join('\n') +
                `\n\nDo you want to proceed anyway?`
            );
            if (!confirmConflict) return;
        }

        let entriesToAdd: any[] = [];

        if (selectedCategory === 'task' || selectedCategory === 'adls') {
            entriesToAdd = multipleEntries
                .filter(entry => entry.title.trim() !== '')
                .map(entry => {
                    const taskDateTime = new Date(`${entry.date}T${newEntryTime}`);
                    return {
                        user_id: user.id,
                        title: entry.title,
                        category: selectedCategory,
                        entry_date: taskDateTime.toISOString(),
                        category_data: categoryData || {},
                        priority: selectedPriority,
                        status: 'pending',
                        description: '',
                        before_popup_minutes: beforePopupMinutes,
                        after_popup_minutes: afterPopupMinutes
                    };
                });
        } else if (selectedCategory === 'goal') {
            const goalEntries = createGoalEntry(entryDateTime);
            entriesToAdd = Array.isArray(goalEntries) ? goalEntries : [goalEntries];

            if (goalRecurring) {
                const additionalEntries = generateRecurringGoals(entryDateTime);
                entriesToAdd = [...entriesToAdd, ...additionalEntries];
            }
        } else {
            entriesToAdd = [{
                user_id: user.id,
                title: newEntryTitle,
                category: selectedCategory,
                entry_date: entryDateTime.toISOString(),
                category_data: categoryData || {},
                priority: selectedPriority,
                status: 'pending',
                description: '',
                before_popup_minutes: beforePopupMinutes,
                after_popup_minutes: afterPopupMinutes
            }];
        }

        const addedEntries: any[] = [];
        for (const entry of entriesToAdd) {
            const addedEntry = await addCalendarEntry(entry);
            if (addedEntry) {
                addedEntries.push(addedEntry);
                
                // 2. Automated Alarm Creation for Web Application Notifications
                if (entry.category === 'task' || entry.category === 'event') {
                    await addAlarm({
                        title: entry.title,
                        source: 'Personal Task',
                        triggerLocalIso: entry.entry_date,
                        link: '/personal'
                    });
                }
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
                date: parseISO(addedEntry.entry_date),
                before_popup_minutes: addedEntry.before_popup_minutes,
                after_popup_minutes: addedEntry.after_popup_minutes
            }));

            setEntries([...entries, ...mappedAddedEntries]);
            setNewEntryTitle('');
            setMultipleEntries([{ title: '', date: format(new Date(), 'yyyy-MM-dd') }]);
            setBeforePopupMinutes(0);
            setAfterPopupMinutes(0);
            setOpenDialog(false);
            showSnackbar('Task scheduled and notification set!', 'success');
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
        setBeforePopupMinutes(entry.before_popup_minutes || 0);
        setAfterPopupMinutes(entry.after_popup_minutes || 0);
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
                description: '',
                before_popup_minutes: beforePopupMinutes,
                after_popup_minutes: afterPopupMinutes
            };
        } else if (selectedCategory === 'goal') {
            // Handle goal updates
            updates = {
                title: `${newEntryTitle} (${goalDuration.charAt(0).toUpperCase() + goalDuration.slice(1)} Goal)`,
                category: selectedCategory,
                entry_date: new Date(`${newEntryDate}T${newEntryTime}`).toISOString(),
                category_data: categoryData || {},
                priority: selectedPriority,
                description: '',
                before_popup_minutes: beforePopupMinutes,
                after_popup_minutes: afterPopupMinutes
            };
        } else {
            updates = {
                title: newEntryTitle,
                category: selectedCategory,
                entry_date: new Date(`${newEntryDate}T${newEntryTime}`).toISOString(),
                category_data: categoryData || {},
                priority: selectedPriority,
                description: '',
                before_popup_minutes: beforePopupMinutes,
                after_popup_minutes: afterPopupMinutes
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
                        date: new Date(updates.entry_date),
                        before_popup_minutes: updates.before_popup_minutes,
                        after_popup_minutes: updates.after_popup_minutes
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
            if (selectedProvider === 'google') {
                // For Google, we use OAuth to get the proper tokens
                // We'll first create the record in the DB (or it will be up-sorted in the callback)
                // then redirect to Google OAuth
                if (!supabase) {
                    showSnackbar('Authentication service is not configured. Please check your system settings.', 'error');
                    setSettingsLoading(false);
                    return;
                }
                
                const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: `${window.location.origin}/auth/callback?next=/personal&sync=google`,
                        scopes: 'https://www.googleapis.com/auth/calendar.readonly',
                        queryParams: {
                            access_type: 'offline',
                            prompt: 'consent',
                        },
                    },
                });
                
                if (error) throw error;
                // Redirect will happen, so no need to continue here
                return;
            }

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
        } catch (error: any) {
            console.error('Error connecting calendar:', error);
            showSnackbar(`Failed to connect calendar: ${error.message || 'Unknown error'}`, 'error');
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

    let filteredEntries = entries.filter((entry: CalendarEntry) => {
        const matchesCategory = visibleCategories[entry.category];
        const matchesSearch = searchQuery === '' ||
            entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            entry.category.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // Generate Routine Blocks for visual display (only on this page, not professional)
    const generateRoutineEntriesForDate = (date: Date) => {
        const routineEntries: any[] = [];
        
        if (userRoutines.sleepStart && userRoutines.sleepEnd) {
            const [sh, sm] = userRoutines.sleepStart.split(':');
            const [eh, em] = userRoutines.sleepEnd.split(':');
            
            const startHour = parseInt(sh);
            const endHour = parseInt(eh);
            
            // If sleep crosses midnight (e.g. 22:00 to 06:00)
            if (endHour < startHour) {
                // Morning block (00:00 to sleepEnd)
                for (let h = 0; h <= endHour; h++) {
                    const blockDate = new Date(date);
                    blockDate.setHours(h, 0, 0, 0);
                    routineEntries.push({
                        id: `routine-sleep-m-${date.toISOString()}-${h}`,
                        title: 'Sleep',
                        category: 'health',
                        date: blockDate,
                        status: 'routine', // Using status as a flag for styling
                        priority: 'Low'
                    });
                }
                
                // Evening block (sleepStart to 23:59)
                for (let h = startHour; h <= 23; h++) {
                    const blockDate = new Date(date);
                    blockDate.setHours(h, 0, 0, 0);
                    routineEntries.push({
                        id: `routine-sleep-e-${date.toISOString()}-${h}`,
                        title: 'Sleep',
                        category: 'health',
                        date: blockDate,
                        status: 'routine',
                        priority: 'Low'
                    });
                }
            } else {
                // Normal sleep block
                for (let h = startHour; h <= endHour; h++) {
                    const blockDate = new Date(date);
                    blockDate.setHours(h, 0, 0, 0);
                    routineEntries.push({
                        id: `routine-sleep-${date.toISOString()}-${h}`,
                        title: 'Sleep',
                        category: 'health',
                        date: blockDate,
                        status: 'routine',
                        priority: 'Low'
                    });
                }
            }
        }

        if (userRoutines.breaks) {
            userRoutines.breaks.forEach(brk => {
                const [bh, bm] = brk.start_time.split(':');
                const [beh, bem] = brk.end_time.split(':');
                const breakStart = parseInt(bh);
                const breakEnd = parseInt(beh);
                
                for (let h = breakStart; h <= breakEnd; h++) {
                    const blockDate = new Date(date);
                    blockDate.setHours(h, 0, 0, 0);
                    routineEntries.push({
                        id: `routine-break-${brk.id}-${date.toISOString()}-${h}`,
                        title: `Break: ${brk.name}`,
                        category: 'health',
                        date: blockDate,
                        status: 'routine',
                        priority: 'Low'
                    });
                }
            });
        }
        
        return routineEntries;
    };

    // Append routines for each visible day
    if (calendarDays && calendarDays.length > 0) {
        calendarDays.forEach(day => {
            filteredEntries = [...filteredEntries, ...generateRoutineEntriesForDate(day)];
        });
    }

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


    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<CalendarEntry | null>(null);
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#F8FAFC', m: 0, overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 4, py: 2, borderBottom: '1px solid', borderColor: 'rgba(0,0,0,0.06)', bgcolor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', zIndex: 10 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Typography variant="h6" sx={{ color: '#0F172A', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5, letterSpacing: '-0.02em', fontSize: '1.25rem' }}>
                        <Box sx={{ p: 1, borderRadius: 2.5, bgcolor: 'rgba(99, 102, 241, 0.1)', color: '#6366F1', display: 'flex' }}><CalendarIcon fontSize="small" /></Box>
                        Personal Schedule
                    </Typography>
                    
                    <Box sx={{ height: 24, width: '1px', bgcolor: 'rgba(0,0,0,0.08)' }} />
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>Today</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.2, color: '#0F172A' }}>{format(new Date(), 'EEEE, MMM d')}</Typography>
                        </Box>
                    </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Button 
                        variant="contained" 
                        startIcon={<AddIcon />} 
                        onClick={(e) => setAddMenuAnchor(e.currentTarget)} 
                        disableElevation 
                        sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700, bgcolor: '#6366F1', '&:hover': { bgcolor: '#4F46E5' } }}
                    >
                        Add New
                    </Button>
                    <Menu
                        anchorEl={addMenuAnchor}
                        open={Boolean(addMenuAnchor)}
                        onClose={() => setAddMenuAnchor(null)}
                        PaperProps={{ sx: { borderRadius: 3, mt: 1, minWidth: 180, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' } }}
                    >
                        <MenuItem onClick={() => { setAddMenuAnchor(null); setNewEntryDate(format(new Date(), 'yyyy-MM-dd')); setSelectedCategory('task'); setOpenDialog(true); }}>
                            <TaskIcon sx={{ fontSize: 18, mr: 1.5, color: '#3b82f6' }} /> Task
                        </MenuItem>
                        <MenuItem onClick={() => { setAddMenuAnchor(null); setNewEntryDate(format(new Date(), 'yyyy-MM-dd')); setSelectedCategory('event'); setOpenDialog(true); }}>
                            <EventIcon sx={{ fontSize: 18, mr: 1.5, color: '#6366f1' }} /> Event
                        </MenuItem>
                        <MenuItem onClick={() => { setAddMenuAnchor(null); setSelectedCategory('goal'); setOpenDialog(true); }}>
                            <GoalIcon sx={{ fontSize: 18, mr: 1.5, color: '#8b5cf6' }} /> Goal
                        </MenuItem>
                    </Menu>

                    <Box sx={{ minWidth: 200, maxWidth: 350 }}>
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
                    <IconButton size="small" onClick={() => setOpenSettings(true)} sx={{ borderRadius: 3, color: '#475569', bgcolor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', '&:hover': { bgcolor: '#F8FAFC' } }}><SettingsIcon fontSize="small" /></IconButton>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Main Content Area */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: 'transparent', overflowY: 'auto', position: 'relative', p: { xs: 2, md: 4 } }}>
                    
                    {/* Categories and Overview Toolbar */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3, px: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', flex: 1 }}>
                            {CATEGORIES.map(cat => {
                                const count = entries.filter((e: CalendarEntry) => e.category === cat.id).length;
                                return (
                                    <Chip 
                                        key={cat.id} 
                                        icon={cat.icon} 
                                        label={count > 0 ? `${cat.label} ${count}` : cat.label}
                                        onClick={() => toggleCategory(cat.id)}
                                        sx={{ 
                                            borderRadius: 2, 
                                            fontWeight: 600, 
                                            bgcolor: visibleCategories[cat.id] ? `${cat.color}15` : '#FFFFFF', 
                                            color: visibleCategories[cat.id] ? cat.color : '#64748B', 
                                            border: '1px solid', 
                                            borderColor: visibleCategories[cat.id] ? `${cat.color}30` : 'rgba(0,0,0,0.08)',
                                            '&:hover': { bgcolor: visibleCategories[cat.id] ? `${cat.color}25` : '#F8FAFC' },
                                            '& .MuiChip-icon': { color: visibleCategories[cat.id] ? cat.color : '#94A3B8' }
                                        }} 
                                    />
                                );
                            })}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, bgcolor: '#FFFFFF', p: 1, px: 2, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Completed</Typography>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#10B981' }}>{entries.filter(e => isSameDay(e.date, new Date()) && e.status === 'completed').length}</Typography>
                            </Box>
                            <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Pending</Typography>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#F59E0B' }}>{entries.filter(e => isSameDay(e.date, new Date()) && (!e.status || e.status === 'pending')).length}</Typography>
                            </Box>
                            <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Rescheduled</Typography>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#3B82F6' }}>{entries.filter(e => isSameDay(e.date, new Date()) && e.status === 'rescheduled').length}</Typography>
                            </Box>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, px: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em' }}>
                                {view === 'day' ? format(selectedDate, 'MMMM d, yyyy') : 
                                 view === 'week' ? `${format(startOfWeek(currentDate), 'MMM d')} - ${format(endOfWeek(currentDate), 'MMM d, yyyy')}` : 
                                 format(currentDate, 'MMMM yyyy')}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, gap: 0.5 }}>
                                <IconButton size="small" onClick={prevPeriod} sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)', bgcolor: '#FFFFFF', '&:hover': { bgcolor: '#F8FAFC' } }}><ChevronLeft fontSize="small" /></IconButton>
                                <Button size="small" onClick={goToToday} sx={{ textTransform: 'none', fontWeight: 700, color: '#0F172A', bgcolor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 2, px: 2, '&:hover': { bgcolor: '#F8FAFC' } }}>Today</Button>
                                <IconButton size="small" onClick={nextPeriod} sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)', bgcolor: '#FFFFFF', '&:hover': { bgcolor: '#F8FAFC' } }}><ChevronRight fontSize="small" /></IconButton>
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#E2E8F0', borderRadius: 3, p: 0.5 }}>
                            {['day', 'week', 'month'].map((v) => (
                                <Button key={v} variant={view === v ? 'contained' : 'text'} size="small" onClick={() => setView(v as any)} disableElevation sx={{ borderRadius: 2.5, textTransform: 'capitalize', px: 3, py: 0.75, minWidth: 0, fontWeight: view === v ? 700 : 600, color: view === v ? '#0F172A' : '#64748B', bgcolor: view === v ? '#FFFFFF' : 'transparent', boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', '&:hover': { bgcolor: view === v ? '#FFFFFF' : 'rgba(0,0,0,0.04)' } }}>{v}</Button>
                            ))}
                        </Box>
                    </Box>

                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: '#FFFFFF', borderRadius: 4, border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.02), 0 8px 10px -6px rgba(0, 0, 0, 0.01)', overflow: 'hidden' }}>
                    {view === 'day' && (
                        <Box ref={scrollContainerRef} sx={{ position: 'relative', flex: 1, overflowY: 'auto' }}>
                            {Array.from({ length: 24 }).map((_, hour) => (
                                <Box key={hour} sx={{ display: 'flex', minHeight: 80, borderBottom: '1px solid rgba(0,0,0,0.03)', position: 'relative' }}>
                                    <Box sx={{ width: 70, borderRight: '1px solid rgba(0,0,0,0.03)', display: 'flex', justifyContent: 'center', pt: 1.5, bgcolor: '#FAFAFA' }}>
                                        <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 700 }}>{format(new Date().setHours(hour, 0, 0, 0), 'ha')}</Typography>
                                    </Box>
                                    <Box sx={{ flex: 1, position: 'relative', px: 2 }}>
                                        {filteredEntries.filter((e: CalendarEntry) => isSameDay(e.date, selectedDate) && e.date.getHours() === hour).map((entry: CalendarEntry, i: number, arr: any[]) => {
                                            const cat = CATEGORIES.find(c => c.id === entry.category);
                                            const width = `calc(${100 / arr.length}% - 8px)`;
                                            const left = `calc(${(100 / arr.length) * i}% + 4px)`;
                                            return (
                                                <Box 
                                                    key={entry.id} 
                                                    onClick={() => { if (entry.status !== 'routine') { setSelectedTask(entry); setDrawerOpen(true); } }}
                                                    sx={{ position: 'absolute', top: 4, bottom: 4, left, width, p: 1.5, borderRadius: 3, bgcolor: entry.status === 'routine' ? '#F1F5F9' : (entry.status === 'completed' ? '#F3F4F6' : `${cat?.color}15`), borderLeft: '4px solid', borderColor: entry.status === 'routine' ? '#CBD5E1' : (entry.status === 'completed' ? '#D1D5DB' : cat?.color), display: 'flex', flexDirection: 'column', cursor: entry.status === 'routine' ? 'default' : 'pointer', overflow: 'hidden', transition: 'all 0.2s', '&:hover': { transform: entry.status === 'routine' ? 'none' : 'translateY(-1px)', boxShadow: entry.status === 'routine' ? 'none' : '0 4px 6px rgba(0,0,0,0.05)', bgcolor: entry.status === 'routine' ? '#E2E8F0' : (entry.status === 'completed' ? '#E5E7EB' : `${cat?.color}25`) } }}
                                                >
                                                    <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.85rem', color: entry.status === 'routine' ? '#475569' : (entry.status === 'completed' ? '#9CA3AF' : '#111827'), textDecoration: entry.status === 'completed' ? 'line-through' : 'none', fontStyle: entry.status === 'routine' ? 'italic' : 'normal' }} noWrap>{entry.title}</Typography>
                                                    {entry.status !== 'routine' && <Typography variant="caption" sx={{ color: entry.status === 'completed' ? '#9CA3AF' : '#4B5563', fontWeight: 600 }}>{format(entry.date, 'h:mm a')}</Typography>}
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                </Box>
                            ))}
                            {isSameDay(selectedDate, new Date()) && (
                                <Box sx={{ position: 'absolute', left: 0, right: 0, top: `${(new Date().getHours() * 80) + (new Date().getMinutes() / 60 * 80)}px`, height: 2, bgcolor: '#EF4444', zIndex: 5, pointerEvents: 'none' }}>
                                    <Box sx={{ position: 'absolute', left: 63, top: -4, width: 10, height: 10, borderRadius: '50%', bgcolor: '#EF4444', boxShadow: '0 0 0 3px rgba(239,68,68,0.2)' }} />
                                </Box>
                            )}
                        </Box>
                    )}

                    {view === 'week' && (
                        <Box ref={scrollContainerRef} sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', position: 'relative' }}>
                            {/* Header Row */}
                            <Box sx={{ display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.03)', bgcolor: '#FAFAFA', position: 'sticky', top: 0, zIndex: 10 }}>
                                <Box sx={{ width: 80, borderRight: '1px solid rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#FAFAFA' }}>
                                    <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 800, color: '#9CA3AF', letterSpacing: '0.05em' }}>DAYS</Typography>
                                    <Box sx={{ width: '40px', height: '1px', bgcolor: 'rgba(0,0,0,0.1)', my: 0.25, transform: 'rotate(-15deg)' }} />
                                    <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 800, color: '#9CA3AF', letterSpacing: '0.05em' }}>TIME</Typography>
                                </Box>
                                {eachDayOfInterval({ start: startOfWeek(currentDate), end: endOfWeek(currentDate) }).map((day, idx) => (
                                    <Box key={idx} sx={{ flex: 1, height: 60, borderRight: '1px solid rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: isSameDay(day, new Date()) ? 'rgba(99, 102, 241, 0.05)' : '#FFFFFF' }}>
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{format(day, 'EEE')}</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: isSameDay(day, new Date()) ? 800 : 600, color: isSameDay(day, new Date()) ? '#6366F1' : '#111827' }}>{format(day, 'd')}</Typography>
                                    </Box>
                                ))}
                            </Box>
                            
                            {/* Grid Rows */}
                            {Array.from({ length: 24 }).map((_, hour) => (
                                <Box key={hour} sx={{ display: 'flex', minHeight: 90, borderBottom: '1px solid rgba(0,0,0,0.02)' }}>
                                    {/* Time Label Column */}
                                    <Box sx={{ width: 80, borderRight: '1px solid rgba(0,0,0,0.03)', display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#FAFAFA', flexShrink: 0 }}>
                                        <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 700, fontSize: '0.7rem' }}>{format(new Date().setHours(hour, 0, 0, 0), 'ha')}</Typography>
                                    </Box>
                                    
                                    {/* Day Cells */}
                                    {eachDayOfInterval({ start: startOfWeek(currentDate), end: endOfWeek(currentDate) }).map((day, idx) => (
                                        <Box key={idx} sx={{ flex: 1, borderRight: '1px solid rgba(0,0,0,0.03)', position: 'relative', px: 0.5 }}>
                                            {filteredEntries.filter((e: CalendarEntry) => isSameDay(e.date, day) && e.date.getHours() === hour).map((entry: CalendarEntry, i: number, arr: any[]) => {
                                                const cat = CATEGORIES.find(c => c.id === entry.category);
                                                const width = `calc(${100 / arr.length}% - 2px)`;
                                                const left = `calc(${(100 / arr.length) * i}% + 1px)`;
                                                return (
                                                    <Box 
                                                        key={entry.id} 
                                                        onClick={() => { if (entry.status !== 'routine') { setSelectedTask(entry); setDrawerOpen(true); } }}
                                                        sx={{ position: 'absolute', top: 2, bottom: 2, left, width, p: 0.5, borderRadius: 1.5, bgcolor: entry.status === 'routine' ? '#F1F5F9' : (entry.status === 'completed' ? '#F3F4F6' : `${cat?.color}15`), borderLeft: '3px solid', borderColor: entry.status === 'routine' ? '#CBD5E1' : (entry.status === 'completed' ? '#D1D5DB' : cat?.color), display: 'flex', flexDirection: 'column', cursor: entry.status === 'routine' ? 'default' : 'pointer', overflow: 'hidden', transition: 'all 0.2s', '&:hover': { transform: entry.status === 'routine' ? 'none' : 'translateY(-1px)', boxShadow: entry.status === 'routine' ? 'none' : '0 2px 4px rgba(0,0,0,0.05)', bgcolor: entry.status === 'routine' ? '#E2E8F0' : (entry.status === 'completed' ? '#E5E7EB' : `${cat?.color}25`) } }}
                                                    >
                                                        <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.65rem', lineHeight: 1.1, color: entry.status === 'routine' ? '#475569' : (entry.status === 'completed' ? '#9CA3AF' : '#111827'), textDecoration: entry.status === 'completed' ? 'line-through' : 'none', fontStyle: entry.status === 'routine' ? 'italic' : 'normal' }} noWrap>{entry.title}</Typography>
                                                    </Box>
                                                );
                                            })}
                                        </Box>
                                    ))}
                                </Box>
                            ))}
                        </Box>
                    )}

                    {view === 'month' && (
                         <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2, overflow: 'hidden' }}>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 2, flexShrink: 0 }}>
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                                    <Typography key={d} variant="caption" sx={{ textAlign: 'center', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</Typography>
                                ))}
                            </Box>
                            <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(140px, 1fr)', gap: 1, overflowY: 'auto', pr: 1, pb: 1, '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '6px' } }}>
                                {calendarDays.map((day, idx) => {
                                    // Sort entries by time
                                    const dayEntries = filteredEntries
                                        .filter((e: CalendarEntry) => isSameDay(e.date, day))
                                        .sort((a, b) => a.date.getTime() - b.date.getTime());
                                    const isCurrentMonth = isSameMonth(day, monthStart);
                                    const isToday = isSameDay(day, new Date());
                                    
                                    // Filter for upcoming tasks if it's today
                                    const now = new Date();
                                    const displayEntries = (isToday) 
                                        ? dayEntries.filter(e => e.date >= now || e.status !== 'completed') 
                                        : dayEntries;
                                        
                                    return (
                                        <Box key={idx} sx={{ 
                                            bgcolor: isCurrentMonth ? '#FFFFFF' : '#FAFAFA', 
                                            borderRadius: 3, 
                                            border: '1px solid', 
                                            borderColor: isToday ? 'rgba(99, 102, 241, 0.3)' : 'rgba(0,0,0,0.06)', 
                                            opacity: isCurrentMonth ? 1 : 0.6, 
                                            display: 'flex',
                                            flexDirection: 'column',
                                            overflow: 'hidden',
                                            transition: 'all 0.2s', 
                                            '&:hover': { borderColor: 'rgba(0,0,0,0.15)', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' } 
                                        }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, pb: 1 }}>
                                                <Typography variant="body2" sx={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: isToday ? 800 : 600, color: isToday ? '#FFFFFF' : '#0F172A', bgcolor: isToday ? '#6366F1' : 'transparent', fontSize: '0.9rem' }}>{format(day, 'd')}</Typography>
                                                {displayEntries.length > 0 && <Typography variant="caption" sx={{ color: isToday ? '#6366F1' : '#94A3B8', fontWeight: 700, bgcolor: isToday ? 'rgba(99, 102, 241, 0.1)' : 'rgba(0,0,0,0.04)', px: 1, py: 0.2, borderRadius: 2 }}>{displayEntries.length} tasks</Typography>}
                                            </Box>
                                            <Box sx={{ 
                                                flex: 1, 
                                                display: 'flex', 
                                                flexDirection: 'column', 
                                                gap: 0.5, 
                                                overflowY: 'auto', 
                                                px: 1, 
                                                pb: 1,
                                                '&::-webkit-scrollbar': { width: '4px' },
                                                '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '4px' }
                                            }}>
                                                {displayEntries.map((entry: CalendarEntry) => {
                                                    const cat = CATEGORIES.find(c => c.id === entry.category);
                                                    const isPast = entry.date < now;
                                                    return (
                                                        <Box key={entry.id} onClick={() => { setSelectedTask(entry); setDrawerOpen(true); }} sx={{ 
                                                            px: 1.5, 
                                                            py: 1, 
                                                            borderRadius: 2, 
                                                            bgcolor: `${cat?.color}10`, 
                                                            cursor: 'pointer', 
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 1,
                                                            opacity: isPast && isToday ? 0.6 : 1,
                                                            transition: 'all 0.15s', 
                                                            '&:hover': { bgcolor: `${cat?.color}20`, transform: 'translateX(2px)' }, 
                                                            borderLeft: '3px solid', 
                                                            borderColor: cat?.color 
                                                        }}>
                                                            <Typography variant="caption" sx={{ fontWeight: 800, color: cat?.color, fontSize: '0.65rem', minWidth: '32px' }}>{format(entry.date, 'HH:mm')}</Typography>
                                                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#374151', display: 'block', lineHeight: 1.2, flex: 1, textDecoration: entry.status === 'completed' ? 'line-through' : 'none' }} noWrap>{entry.title}</Typography>
                                                        </Box>
                                                    );
                                                })}
                                                {dayEntries.length === 0 && (
                                                    <Box sx={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                                        <Typography variant="caption" sx={{ color: 'rgba(0,0,0,0.2)', fontWeight: 600 }}>No tasks</Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>
                         </Box>
                    )}
                    </Box>
                </Box>

                {/* Right Task Drawer */}
                {drawerOpen && selectedTask && (
                    <Box sx={{ width: 420, borderLeft: '1px solid', borderColor: 'rgba(0,0,0,0.06)', bgcolor: '#FFFFFF', p: 4, display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto', boxShadow: '-10px 0 30px rgba(0,0,0,0.03)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827' }}>Task Details</Typography>
                            <IconButton size="small" onClick={() => setDrawerOpen(false)} sx={{ bgcolor: '#F3F4F6' }}><ChevronRight /></IconButton>
                        </Box>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            <Box>
                                <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Title</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 800, color: '#111827', fontSize: '1.1rem', mt: 0.5 }}>{selectedTask.title}</Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', gap: 4, p: 2, bgcolor: '#F9FAFB', borderRadius: 3, border: '1px solid rgba(0,0,0,0.04)' }}>
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date & Time</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#374151', mt: 0.5 }}>{format(selectedTask.date, 'MMM d, yyyy • h:mm a')}</Typography>
                                </Box>
                            </Box>
                            
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Chip label={CATEGORIES.find(c => c.id === selectedTask.category)?.label} size="small" sx={{ bgcolor: `${CATEGORIES.find(c => c.id === selectedTask.category)?.color}15`, color: CATEGORIES.find(c => c.id === selectedTask.category)?.color, fontWeight: 800, borderRadius: 2 }} />
                                {selectedTask.priority && <Chip label={selectedTask.priority} size="small" sx={{ fontWeight: 700, borderRadius: 2, bgcolor: '#F3F4F6', color: '#4B5563' }} />}
                                <Chip label={selectedTask.status === 'completed' ? 'Completed' : 'Pending'} size="small" sx={{ fontWeight: 700, borderRadius: 2, bgcolor: selectedTask.status === 'completed' ? '#D1FAE5' : '#FEF3C7', color: selectedTask.status === 'completed' ? '#059669' : '#D97706' }} />
                            </Box>

                            {selectedTask.description && (
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</Typography>
                                    <Typography variant="body2" sx={{ mt: 1, p: 2.5, bgcolor: '#F9FAFB', borderRadius: 3, color: '#4B5563', lineHeight: 1.6, border: '1px solid rgba(0,0,0,0.04)' }}>{selectedTask.description}</Typography>
                                </Box>
                            )}
                        </Box>
                        
                        <Box sx={{ mt: 'auto', display: 'flex', gap: 2, pt: 3, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                            <Button variant="outlined" fullWidth onClick={() => { handleEdit(selectedTask); setDrawerOpen(false); }} sx={{ borderRadius: 3, fontWeight: 700, color: '#374151', borderColor: 'rgba(0,0,0,0.1)' }}>Edit Task</Button>
                            <Button variant="contained" fullWidth disableElevation sx={{ borderRadius: 3, fontWeight: 700, bgcolor: selectedTask.status === 'completed' ? '#F59E0B' : '#10B981', '&:hover': { bgcolor: selectedTask.status === 'completed' ? '#D97706' : '#059669' } }} onClick={(e) => { toggleEntryStatus(e as any, selectedTask); setDrawerOpen(false); }}>
                                Mark {selectedTask.status === 'completed' ? 'Pending' : 'Complete'}
                            </Button>
                        </Box>
                    </Box>
                )}
            </Box>

            {/* Existing Dialogs for Create/Settings/Analytics etc... */}
            {/* Add Entry Dialog */}
            <Dialog open={openDialog} onClose={() => {
                setOpenDialog(false);
                setEditingEntry(null);
                setNewEntryTitle('');
                setCategoryData({});
                setSelectedPriority('Medium');
            }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)' } }}>
                <DialogTitle sx={{ pb: 2, fontWeight: 800, fontSize: '1.25rem', color: '#111827' }}>{editingEntry ? 'Edit Task' : 'Quick Add Task'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                        <TextField label="Title" fullWidth variant="outlined" value={newEntryTitle} onChange={(e) => setNewEntryTitle(e.target.value)} autoFocus sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField label="Date" type="date" fullWidth variant="outlined" value={newEntryDate} onChange={(e) => setNewEntryDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
                            <TextField label="Time" type="time" fullWidth variant="outlined" value={newEntryTime} onChange={(e) => setNewEntryTime(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
                        </Box>
                        <FormControl fullWidth variant="outlined">
                            <InputLabel>Category</InputLabel>
                            <Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} label="Category" sx={{ borderRadius: 3 }}>
                                {CATEGORIES.map(cat => <MenuItem key={cat.id} value={cat.id}>{cat.label}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth variant="outlined">
                            <InputLabel>Priority</InputLabel>
                            <Select value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)} label="Priority" sx={{ borderRadius: 3 }}>
                                <MenuItem value="Low">Low</MenuItem>
                                <MenuItem value="Medium">Medium</MenuItem>
                                <MenuItem value="High">High</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField type="number" label="Notify me before (mins)" fullWidth variant="outlined" value={beforePopupMinutes} onChange={(e) => setBeforePopupMinutes(parseInt(e.target.value) || 0)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button onClick={() => setOpenDialog(false)} sx={{ fontWeight: 700, color: '#6B7280' }}>Cancel</Button>
                    <Button variant="contained" onClick={handleAddEntry} disabled={!newEntryTitle} disableElevation sx={{ borderRadius: 3, fontWeight: 700, px: 3 }}>Save Task</Button>
                </DialogActions>
            </Dialog>

            {/* Other dialogs... keeping minimal to preserve functionality */}
        </Box>
    );
};

export default function PersonalPage() {
    return (
        <ProtectedLayout>
            <TimeEngineProvider>
                <PersonalCalendarPage />
            </TimeEngineProvider>
        </ProtectedLayout>
    );
}
