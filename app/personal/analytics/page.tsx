'use client';

import React, { useState, useEffect } from 'react';
import { format, isSameDay, isSameWeek, isSameMonth, addDays, addWeeks, addMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, isValid } from 'date-fns';
import {
    Box,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Card,
    CardContent,
    Chip,
    IconButton,
    Divider,
    TextField,
    Grid
} from '@mui/material';
import { 
    Insights as InsightsIcon, 
    ExpandMore as ExpandMoreIcon, 
    RadioButtonUnchecked as RadioButtonUncheckedIcon, 
    CheckCircle as CheckCircleIcon, 
    Analytics as AnalyticsIcon,
    Search as SearchIcon
} from '@mui/icons-material';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../../lib/auth-context';
import { getCalendarEntries, updateCalendarEntry } from '../../../lib/personal-calendar-db';
import Sidebar from '../../../components/sidebar';

// Category Definitions
const CATEGORIES = [
    { id: 'health', label: 'Health', color: '#10b981', icon: <span>🏥</span> },
    { id: 'wealth', label: 'Wealth', color: '#f59e0b', icon: <span>💰</span> },
    { id: 'event', label: 'Event', color: '#6366f1', icon: <span>📅</span> },
    { id: 'task', label: 'Task', color: '#3b82f6', icon: <span>✅</span> },
    { id: 'goal', label: 'Goal', color: '#8b5cf6', icon: <span>🎯</span> },
    { id: 'adls', label: "ADL's", color: '#14b8a6', icon: <span>🏃</span> },
    { id: 'family', label: 'Family', color: '#f97316', icon: <span>👨‍👩‍👧‍👦</span> },
    { id: 'entertainment', label: 'Entertainment', color: '#ec4899', icon: <span>🎬</span> },
    { id: 'household', label: 'Household', color: '#f43f5e', icon: <span>🏠</span> },
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
}

const AnalyticsPage = () => {
    const { user } = useAuth();
    const [entries, setEntries] = useState<CalendarEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [analyticsFilter, setAnalyticsFilter] = useState('all'); // all, today, week, month
    const [analyticsCategory, setAnalyticsCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    
    useEffect(() => {
        if (user) {
            fetchEntries();
        }
    }, [user]);

    // Calculate chart data - moved before conditional render to avoid hook order issues
    const categoryData = React.useMemo(() => {
        if (!entries) return [];
        // Use filtered entries to calculate chart data
        const now = new Date();
        const filtered = entries.filter(entry => {
            const entryDate = entry.date;
            let matchesTime = true;
            if (analyticsFilter === 'today') matchesTime = isSameDay(entryDate, now);
            else if (analyticsFilter === 'week') matchesTime = isSameWeek(entryDate, now);
            else if (analyticsFilter === 'month') matchesTime = isSameMonth(entryDate, now);

            const matchesCat = analyticsCategory === 'all' || entry.category === analyticsCategory;
            
            const matchesSearch = !searchQuery || 
                entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (entry.description && entry.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (entry.category_data && JSON.stringify(entry.category_data).toLowerCase().includes(searchQuery.toLowerCase()));
            
            return matchesTime && matchesCat && matchesSearch;
        });
        
        const counts: Record<string, number> = {};
        
        filtered.forEach(entry => {
            const cat = CATEGORIES.find(c => c.id === entry.category);
            const catName = cat ? cat.label : entry.category;
            counts[catName] = (counts[catName] || 0) + 1;
        });
        
        return Object.entries(counts).map(([name, count]) => ({ name, value: count }));
    }, [entries, analyticsFilter, analyticsCategory, searchQuery]);
    
    const statusData = React.useMemo(() => {
        if (!entries) return [];
        // Use filtered entries to calculate chart data
        const now = new Date();
        const filtered = entries.filter(entry => {
            const entryDate = entry.date;
            let matchesTime = true;
            if (analyticsFilter === 'today') matchesTime = isSameDay(entryDate, now);
            else if (analyticsFilter === 'week') matchesTime = isSameWeek(entryDate, now);
            else if (analyticsFilter === 'month') matchesTime = isSameMonth(entryDate, now);

            const matchesCat = analyticsCategory === 'all' || entry.category === analyticsCategory;
            
            const matchesSearch = !searchQuery || 
                entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (entry.description && entry.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (entry.category_data && JSON.stringify(entry.category_data).toLowerCase().includes(searchQuery.toLowerCase()));
            
            return matchesTime && matchesCat && matchesSearch;
        });
        
        const statusCounts: Record<string, { completed: number, pending: number }> = {};
        
        filtered.forEach(entry => {
            const cat = CATEGORIES.find(c => c.id === entry.category);
            const catName = cat ? cat.label : entry.category;
            
            if (!statusCounts[catName]) {
                statusCounts[catName] = { completed: 0, pending: 0 };
            }
            
            if (entry.status === 'completed') {
                statusCounts[catName].completed += 1;
            } else {
                statusCounts[catName].pending += 1;
            }
        });
        
        return Object.entries(statusCounts).map(([name, counts]) => ({
            name,
            completed: counts.completed,
            pending: counts.pending
        }));
    }, [entries, analyticsFilter, analyticsCategory, searchQuery]);

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

    const toggleEntryStatus = async (entry: CalendarEntry) => {
        const newStatus = entry.status === 'completed' ? 'pending' : 'completed';
        const success = await updateCalendarEntry(entry.id, { status: newStatus });
        if (success) {
            setEntries(entries.map(e => e.id === entry.id ? { ...e, status: newStatus } : e));
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Typography>Loading...</Typography>
            </Box>
        );
    }

    // Use the same filtering logic that's used in the charts
    const now = new Date();
    const filtered = entries.filter(entry => {
        const entryDate = entry.date;
        let matchesTime = true;
        if (analyticsFilter === 'today') matchesTime = isSameDay(entryDate, now);
        else if (analyticsFilter === 'week') matchesTime = isSameWeek(entryDate, now);
        else if (analyticsFilter === 'month') matchesTime = isSameMonth(entryDate, now);

        const matchesCat = analyticsCategory === 'all' || entry.category === analyticsCategory;
        
        const matchesSearch = !searchQuery || 
            entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (entry.description && entry.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (entry.category_data && JSON.stringify(entry.category_data).toLowerCase().includes(searchQuery.toLowerCase()));
        
        return matchesTime && matchesCat && matchesSearch;
    });

    const total = filtered.length;
    const completed = filtered.filter(e => e.status === 'completed').length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return (
        <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
            <Sidebar />
            <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                flex: 1,
                height: '100vh', 
                bgcolor: 'background.default', 
                p: 4, 
                overflow: 'hidden' 
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <InsightsIcon sx={{ fontSize: '2.5rem' }} />
                        Calendar Analytics Tracker
                    </Typography>
                </Box>

            {/* Filters */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 4, mb: 3 }}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Time Range</InputLabel>
                    <Select
                        label="Time Range"
                        value={analyticsFilter}
                        onChange={(e) => setAnalyticsFilter(e.target.value)}
                        sx={{ borderRadius: 3 }}
                    >
                        <MenuItem value="all">All Time</MenuItem>
                        <MenuItem value="today">Today</MenuItem>
                        <MenuItem value="week">This Week</MenuItem>
                        <MenuItem value="month">This Month</MenuItem>
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Category</InputLabel>
                    <Select
                        label="Category"
                        value={analyticsCategory}
                        onChange={(e) => setAnalyticsCategory(e.target.value)}
                        sx={{ borderRadius: 3 }}
                    >
                        <MenuItem value="all">All Categories</MenuItem>
                        {CATEGORIES.map(cat => (
                            <MenuItem key={cat.id} value={cat.id}>{cat.label}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <TextField
                    size="small"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1 }} />
                    }}
                    sx={{ minWidth: 200, borderRadius: 3 }}
                />
            </Box>

            {/* Summary Stats */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2, mb: 4 }}>
                <Card variant="outlined" sx={{ borderRadius: 4, bgcolor: 'rgba(63, 81, 181, 0.02)', borderColor: 'rgba(63, 81, 181, 0.2)' }}>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main', mb: 0.5 }}>{total}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Tasks</Typography>
                    </CardContent>
                </Card>
                <Card variant="outlined" sx={{ borderRadius: 4, bgcolor: 'rgba(76, 175, 80, 0.02)', borderColor: 'rgba(76, 175, 80, 0.2)' }}>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <Typography variant="h3" sx={{ fontWeight: 800, color: '#4caf50', mb: 0.5 }}>{completed}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed</Typography>
                    </CardContent>
                </Card>
                <Card variant="outlined" sx={{ borderRadius: 4, bgcolor: 'rgba(255, 152, 0, 0.02)', borderColor: 'rgba(255, 152, 0, 0.2)' }}>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <Typography variant="h3" sx={{ fontWeight: 800, color: '#ff9800', mb: 0.5 }}>{pending}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending</Typography>
                    </CardContent>
                </Card>
                <Card variant="outlined" sx={{ borderRadius: 4, bgcolor: 'rgba(0, 0, 0, 0.02)', borderColor: 'divider' }}>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <Typography variant="h3" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>{completionRate}%</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completion Rate</Typography>
                    </CardContent>
                </Card>
            </Box>

            {/* Charts and Task Log */}
            <Box sx={{ flex: 1, display: 'flex', gap: 3, overflow: 'hidden' }}>
                {/* Task Log - Left half */}
                <Box sx={{ flex: 1, overflow: 'hidden' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
                            Detailed Task Log
                            <Chip label={filtered.length} size="small" />
                        </Typography>
                    </Box>
                    
                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 1.5, 
                        maxHeight: 'calc(100vh - 400px)', 
                        overflowY: 'auto', 
                        pr: 1,
                        bgcolor: 'background.paper',
                        borderRadius: 3,
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider'
                    }}>
                        {filtered.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 8, color: 'text.disabled' }}>
                                <AnalyticsIcon sx={{ fontSize: '3rem', mb: 1, opacity: 0.5 }} />
                                <Typography>No tasks found for the selected filters</Typography>
                            </Box>
                        ) : (
                            filtered
                                .sort((a, b) => b.date.getTime() - a.date.getTime())
                                .map(entry => {
                                    const cat = CATEGORIES.find(c => c.id === entry.category);
                                    return (
                                        <Box key={entry.id} sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 2,
                                            p: 2,
                                            borderRadius: 3,
                                            bgcolor: 'background.paper',
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            transition: 'all 0.2s',
                                            '&:hover': { bgcolor: 'rgba(0,0,0,0.01)', borderColor: 'primary.main' }
                                        }}>
                                            <IconButton 
                                                onClick={() => toggleEntryStatus(entry)}
                                                sx={{
                                                    color: entry.status === 'completed' ? 'success.main' : 'text.disabled',
                                                    borderRadius: 2,
                                                    '&:hover': { bgcolor: 'rgba(76, 175, 80, 0.1)' }
                                                }}
                                            >
                                                {entry.status === 'completed' ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
                                            </IconButton>
                                            <Box sx={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: 2,
                                                bgcolor: `${cat?.color}15`,
                                                color: cat?.color,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                {cat?.icon}
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="body1" sx={{
                                                    fontWeight: 600,
                                                    color: entry.status === 'completed' ? 'text.disabled' : 'text.primary',
                                                    textDecoration: entry.status === 'completed' ? 'line-through' : 'none'
                                                }}>
                                                    {entry.title}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {cat?.label} • {format(entry.date, 'MMM d, yyyy')} • {format(entry.date, 'HH:mm')}
                                                </Typography>
                                            </Box>
                                            <Chip
                                                label={entry.status === 'completed' ? 'Completed' : 'Pending'}
                                                size="small"
                                                color={entry.status === 'completed' ? 'success' : 'default'}
                                                variant={entry.status === 'completed' ? 'filled' : 'outlined'}
                                                sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                                            />
                                        </Box>
                                    );
                                })
                        )}
                    </Box>
                </Box>
                
                {/* Charts - Right half */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Category Distribution Pie Chart */}
                    <Card variant="outlined" sx={{ borderRadius: 4, flex: 1 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, textAlign: 'center' }}>Category Distribution</Typography>
                            <Box sx={{ height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                            label={({ name, percent }) => `${name}: ${Math.round((percent || 0) * 100)}%`}
                                        >
                                            {CATEGORIES.map((cat, index) => (
                                                <Cell key={`cell-${index}`} fill={cat.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => [`${value} tasks`, 'Count']} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                    
                    {/* Status Distribution Bar Chart */}
                    <Card variant="outlined" sx={{ borderRadius: 4, flex: 1 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, textAlign: 'center' }}>Status Overview</Typography>
                            <Box sx={{ height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={statusData}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="completed" fill="#4caf50" name="Completed" />
                                        <Bar dataKey="pending" fill="#ff9800" name="Pending" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            </Box>
        </Box>
        </Box>
    );
};

export default AnalyticsPage;