import { supabase, isSupabaseConfigured } from './supabase';
import { getCalendarEntries, CalendarEntry } from './personal-calendar-db';
import { getProfessionalTasks, ProfessionalTask, getProfessionalInfo } from './professional-db';
import { getNotes, Note } from './notes-db';

// ─── Task History Log Interface ───
export interface TaskHistoryEntry {
    id: string;
    user_id: string;
    task_id: string;
    task_source: 'personal' | 'professional' | 'note';
    action: 'created' | 'rescheduled' | 'completed' | 'status_changed' | 'priority_changed' | 'deleted' | 'converted_from_note';
    old_value: Record<string, any>;
    new_value: Record<string, any>;
    metadata: Record<string, any>;
    created_at: string;
}

// ─── Unified Search Result ───
export interface UnifiedSearchResult {
    id: string;
    title: string;
    description?: string;
    source: 'personal' | 'professional' | 'note';
    status?: string;
    priority?: string;
    category?: string;
    date: string;
    created_at?: string;
    updated_at?: string;
    // Additional fields depending on source
    department?: string;
    role?: string;
    completion_feedback?: string;
    rescheduled_from?: string;
    converted_to_task?: boolean;
    color?: string;
    tags?: string[];
}

// ─── Analytics Summary ───
export interface AnalyticsSummary {
    // KPI Metrics
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    rescheduledTasks: number;
    completionRate: number;
    rescheduleRatio: number;
    totalNotes: number;
    notesConvertedToTasks: number;
    noteConversionRate: number;
    activeStreak: number;
    productivityScore: number;

    // Breakdowns
    personalTasks: CalendarEntry[];
    professionalTasks: ProfessionalTask[];
    notes: Note[];

    // Category Distribution
    categoryDistribution: { name: string; value: number; color: string }[];

    // Priority Distribution
    priorityDistribution: { name: string; value: number; color: string }[];

    // Status Distribution
    statusDistribution: { name: string; value: number; color: string }[];

    // Daily Completion Trend (last N days)
    dailyCompletionTrend: { date: string; completed: number; created: number; rescheduled: number }[];

    // Source Distribution
    sourceDistribution: { name: string; value: number; color: string }[];

    // Today's tasks
    todaysTasks: {
        id: string;
        title: string;
        source: 'personal' | 'professional';
        status: string;
        priority: string;
        time: string;
    }[];
    todaysCompleted: number;
    todaysTotal: number;

    // Upcoming deadlines (next 7 days)
    upcomingDeadlines: {
        id: string;
        title: string;
        source: 'personal' | 'professional';
        date: string;
        priority: string;
    }[];
}

// ─── HISTORY LOG FUNCTIONS ───

export const logTaskAction = async (
    userId: string,
    taskId: string,
    taskSource: TaskHistoryEntry['task_source'],
    action: TaskHistoryEntry['action'],
    oldValue: Record<string, any> = {},
    newValue: Record<string, any> = {},
    metadata: Record<string, any> = {}
): Promise<TaskHistoryEntry | null> => {
    if (!isSupabaseConfigured() || !supabase) {
        console.warn('Supabase not configured - skipping task history log');
        return null;
    }

    try {
        const { data, error } = await supabase
            .from('task_history_log')
            .insert([{
                user_id: userId,
                task_id: taskId,
                task_source: taskSource,
                action,
                old_value: oldValue,
                new_value: newValue,
                metadata
            }])
            .select()
            .single();

        if (error) {
            if (error.code === '42P01' || error.code === 'PGRST205') {
                console.warn('task_history_log table does not exist yet. Please apply the migration.');
                return null;
            }
            console.error('Error logging task action:', error);
            return null;
        }

        return data as TaskHistoryEntry;
    } catch (error) {
        console.error('Unexpected error logging task action:', error);
        return null;
    }
};

export const getTaskHistory = async (
    userId: string,
    taskId?: string,
    options?: { limit?: number; action?: string; taskSource?: string; startDate?: string; endDate?: string }
): Promise<TaskHistoryEntry[]> => {
    if (!isSupabaseConfigured() || !supabase) {
        return [];
    }

    try {
        let query = supabase
            .from('task_history_log')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (taskId) query = query.eq('task_id', taskId);
        if (options?.action) query = query.eq('action', options.action);
        if (options?.taskSource) query = query.eq('task_source', options.taskSource);
        if (options?.startDate) query = query.gte('created_at', options.startDate);
        if (options?.endDate) query = query.lte('created_at', options.endDate);
        if (options?.limit) query = query.limit(options.limit);

        const { data, error } = await query;

        if (error) {
            if (error.code === '42P01' || error.code === 'PGRST205') {
                console.warn('task_history_log table does not exist yet. Please apply the migration.');
                return [];
            }
            console.error('Error fetching task history:', error);
            return [];
        }

        return data as TaskHistoryEntry[];
    } catch (error) {
        console.error('Unexpected error fetching task history:', error);
        return [];
    }
};

// ─── CATEGORY COLORS ───
const CATEGORY_COLORS: Record<string, string> = {
    health: '#10b981',
    wealth: '#f59e0b',
    event: '#6366f1',
    task: '#3b82f6',
    goal: '#8b5cf6',
    adls: '#14b8a6',
    family: '#f97316',
    entertainment: '#ec4899',
    household: '#f43f5e',
    other: '#6b7280'
};

const PRIORITY_COLORS: Record<string, string> = {
    High: '#ef4444',
    Urgent: '#dc2626',
    Medium: '#f59e0b',
    Low: '#10b981',
    high: '#ef4444',
    urgent: '#dc2626',
    medium: '#f59e0b',
    low: '#10b981'
};

const STATUS_COLORS: Record<string, string> = {
    completed: '#10b981',
    pending: '#f59e0b',
    rescheduled: '#6366f1',
    'in-progress': '#3b82f6',
    routine: '#8b5cf6'
};

// ─── FULL ANALYTICS DATA FETCH ───

export const getFullAnalytics = async (
    userId: string,
    timeRange: string = '30days'
): Promise<AnalyticsSummary> => {
    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
        case '7days': startDate = new Date(now.getTime() - 7 * 86400000); break;
        case '30days': startDate = new Date(now.getTime() - 30 * 86400000); break;
        case '90days': startDate = new Date(now.getTime() - 90 * 86400000); break;
        case '1year': startDate = new Date(now.getTime() - 365 * 86400000); break;
        case 'all': startDate = new Date(2020, 0, 1); break;
        default: startDate = new Date(now.getTime() - 30 * 86400000);
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];

    // Fetch all data in parallel
    const [personalEntries, professionalTasks, allNotes, historyLog] = await Promise.all([
        getCalendarEntries(userId, { startDate: startDateStr }),
        getProfessionalTasks(userId, { startDate: startDateStr }),
        getNotes(userId),
        getTaskHistory(userId, undefined, { startDate: startDate.toISOString() })
    ]);

    // ─── KPI METRICS ───
    const totalTasks = personalEntries.length + professionalTasks.length;
    const completedPersonal = personalEntries.filter(e => e.status === 'completed').length;
    const completedProfessional = professionalTasks.filter(t => t.status === 'completed').length;
    const completedTasks = completedPersonal + completedProfessional;
    const pendingPersonal = personalEntries.filter(e => e.status === 'pending' || !e.status).length;
    const pendingProfessional = professionalTasks.filter(t => t.status === 'pending' || !t.status).length;
    const pendingTasks = pendingPersonal + pendingProfessional;
    const rescheduledTasks = professionalTasks.filter(t => t.status === 'rescheduled').length +
        historyLog.filter(h => h.action === 'rescheduled').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const rescheduleRatio = totalTasks > 0 ? Math.round((rescheduledTasks / totalTasks) * 100) : 0;

    // Notes
    const notesInRange = allNotes.filter(n => new Date(n.created_at) >= startDate);
    const totalNotes = notesInRange.length;
    const notesConvertedToTasks = allNotes.filter(n => n.converted_to_task).length;
    const noteConversionRate = allNotes.length > 0 ? Math.round((notesConvertedToTasks / allNotes.length) * 100) : 0;

    // Active streak (count consecutive days with at least 1 completion going backward from today)
    let activeStreak = 0;
    const allCompletedDates = new Set<string>();
    personalEntries.filter(e => e.status === 'completed').forEach(e => {
        if (e.updated_at || e.entry_date) allCompletedDates.add((e.updated_at || e.entry_date).split('T')[0]);
    });
    professionalTasks.filter(t => t.status === 'completed').forEach(t => {
        if (t.updated_at || t.task_date) allCompletedDates.add((t.updated_at || t.task_date).split('T')[0]);
    });
    for (let i = 0; i < 365; i++) {
        const checkDate = new Date(now.getTime() - i * 86400000).toISOString().split('T')[0];
        if (allCompletedDates.has(checkDate)) {
            activeStreak++;
        } else if (i > 0) {
            break;
        }
    }

    // Productivity score
    const productivityScore = Math.min(100, Math.round(
        (completionRate * 0.5) +
        (Math.min(activeStreak, 30) / 30 * 25) +
        (Math.max(0, 100 - rescheduleRatio) * 0.25)
    ));

    // ─── CATEGORY DISTRIBUTION ───
    const categoryCounts: Record<string, number> = {};
    personalEntries.forEach(e => {
        const cat = e.category || 'other';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    const categoryDistribution = Object.entries(categoryCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: CATEGORY_COLORS[name.toLowerCase()] || '#6b7280'
    }));

    // ─── PRIORITY DISTRIBUTION ───
    const priorityCounts: Record<string, number> = {};
    [...personalEntries, ...professionalTasks].forEach((t: any) => {
        const p = t.priority || 'Medium';
        priorityCounts[p] = (priorityCounts[p] || 0) + 1;
    });
    const priorityDistribution = Object.entries(priorityCounts).map(([name, value]) => ({
        name,
        value,
        color: PRIORITY_COLORS[name] || '#6b7280'
    }));

    // ─── STATUS DISTRIBUTION ───
    const statusCounts: Record<string, number> = {};
    [...personalEntries, ...professionalTasks].forEach((t: any) => {
        const s = t.status || 'pending';
        statusCounts[s] = (statusCounts[s] || 0) + 1;
    });
    const statusDistribution = Object.entries(statusCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: STATUS_COLORS[name.toLowerCase()] || '#6b7280'
    }));

    // ─── DAILY COMPLETION TREND ───
    const daysToShow = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : timeRange === '90days' ? 90 : 30;
    const dailyCompletionTrend: AnalyticsSummary['dailyCompletionTrend'] = [];
    for (let i = daysToShow - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const dateStr = d.toISOString().split('T')[0];
        const dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        const completedOnDay = [
            ...personalEntries.filter(e => e.status === 'completed' && (e.updated_at || e.entry_date || '').startsWith(dateStr)),
            ...professionalTasks.filter(t => t.status === 'completed' && (t.updated_at || t.task_date || '').startsWith(dateStr))
        ].length;

        const createdOnDay = [
            ...personalEntries.filter(e => (e.created_at || e.entry_date || '').startsWith(dateStr)),
            ...professionalTasks.filter(t => (t.created_at || t.task_date || '').startsWith(dateStr))
        ].length;

        const rescheduledOnDay = historyLog.filter(h =>
            h.action === 'rescheduled' && h.created_at.startsWith(dateStr)
        ).length;

        dailyCompletionTrend.push({
            date: dayLabel,
            completed: completedOnDay,
            created: createdOnDay,
            rescheduled: rescheduledOnDay
        });
    }

    // ─── SOURCE DISTRIBUTION ───
    const sourceDistribution = [
        { name: 'Personal', value: personalEntries.length, color: '#6366f1' },
        { name: 'Professional', value: professionalTasks.length, color: '#3b82f6' },
        { name: 'Notes', value: totalNotes, color: '#10b981' }
    ].filter(s => s.value > 0);

    // ─── TODAY'S TASKS ───
    const todaysPersonal = personalEntries.filter(e => (e.entry_date || '').startsWith(todayStr));
    const todaysProfessional = professionalTasks.filter(t => (t.task_date || '').startsWith(todayStr));
    const todaysTasks = [
        ...todaysPersonal.map(e => ({
            id: e.id,
            title: e.title,
            source: 'personal' as const,
            status: e.status || 'pending',
            priority: e.priority || 'medium',
            time: e.entry_date
        })),
        ...todaysProfessional.map(t => ({
            id: t.id,
            title: t.title,
            source: 'professional' as const,
            status: t.status || 'pending',
            priority: t.priority || 'Medium',
            time: t.task_date
        }))
    ].sort((a, b) => a.time.localeCompare(b.time));

    const todaysCompleted = todaysTasks.filter(t => t.status === 'completed').length;
    const todaysTotal = todaysTasks.length;

    // ─── UPCOMING DEADLINES (next 7 days) ───
    const nextWeek = new Date(now.getTime() + 7 * 86400000).toISOString().split('T')[0];
    const upcomingPersonal = personalEntries.filter(e =>
        e.entry_date > todayStr && e.entry_date <= nextWeek && e.status !== 'completed'
    );
    const upcomingProfessional = professionalTasks.filter(t =>
        t.task_date > todayStr && t.task_date <= nextWeek && t.status !== 'completed'
    );
    const upcomingDeadlines = [
        ...upcomingPersonal.map(e => ({
            id: e.id,
            title: e.title,
            source: 'personal' as const,
            date: e.entry_date,
            priority: e.priority || 'medium'
        })),
        ...upcomingProfessional.map(t => ({
            id: t.id,
            title: t.title,
            source: 'professional' as const,
            date: t.task_date,
            priority: t.priority || 'Medium'
        }))
    ].sort((a, b) => a.date.localeCompare(b.date));

    return {
        totalTasks,
        completedTasks,
        pendingTasks,
        rescheduledTasks,
        completionRate,
        rescheduleRatio,
        totalNotes,
        notesConvertedToTasks,
        noteConversionRate,
        activeStreak,
        productivityScore,
        personalTasks: personalEntries,
        professionalTasks,
        notes: notesInRange,
        categoryDistribution,
        priorityDistribution,
        statusDistribution,
        dailyCompletionTrend,
        sourceDistribution,
        todaysTasks,
        todaysCompleted,
        todaysTotal,
        upcomingDeadlines
    };
};

// ─── SEARCH FUNCTION ───

export const searchAllItems = async (
    userId: string,
    searchQuery: string
): Promise<UnifiedSearchResult[]> => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase().trim();

    // Fetch all data sources
    const [personalEntries, professionalTasks, allNotes] = await Promise.all([
        getCalendarEntries(userId),
        getProfessionalTasks(userId),
        getNotes(userId)
    ]);

    const results: UnifiedSearchResult[] = [];

    // Search personal entries
    personalEntries.forEach(entry => {
        if (
            entry.title?.toLowerCase().includes(query) ||
            entry.description?.toLowerCase().includes(query) ||
            entry.category?.toLowerCase().includes(query)
        ) {
            results.push({
                id: entry.id,
                title: entry.title,
                description: entry.description,
                source: 'personal',
                status: entry.status,
                priority: entry.priority,
                category: entry.category,
                date: entry.entry_date,
                created_at: entry.created_at,
                updated_at: entry.updated_at,
                completion_feedback: entry.completion_feedback
            });
        }
    });

    // Search professional tasks
    professionalTasks.forEach(task => {
        if (
            task.title?.toLowerCase().includes(query) ||
            task.description?.toLowerCase().includes(query) ||
            task.department?.toLowerCase().includes(query) ||
            task.role?.toLowerCase().includes(query)
        ) {
            results.push({
                id: task.id,
                title: task.title,
                description: task.description,
                source: 'professional',
                status: task.status,
                priority: task.priority,
                date: task.task_date,
                created_at: task.created_at,
                updated_at: task.updated_at,
                department: task.department,
                role: task.role,
                completion_feedback: task.completion_feedback,
                rescheduled_from: task.rescheduled_from
            });
        }
    });

    // Search notes
    allNotes.forEach(note => {
        if (
            note.title?.toLowerCase().includes(query) ||
            note.content?.toLowerCase().includes(query)
        ) {
            results.push({
                id: note.id,
                title: note.title,
                description: note.content?.substring(0, 200),
                source: 'note',
                date: note.created_at,
                created_at: note.created_at,
                updated_at: note.updated_at,
                converted_to_task: note.converted_to_task,
                color: note.color,
                tags: note.tags
            });
        }
    });

    // Sort by relevance: exact title match first, then by date
    results.sort((a, b) => {
        const aExact = a.title?.toLowerCase() === query ? 1 : 0;
        const bExact = b.title?.toLowerCase() === query ? 1 : 0;
        if (aExact !== bExact) return bExact - aExact;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return results;
};

// ─── GET INSIGHTS / RECOMMENDATIONS ───

export const getInsights = (analytics: AnalyticsSummary): string[] => {
    const insights: string[] = [];

    if (analytics.completionRate >= 80) {
        insights.push(`🏆 Excellent! Your completion rate is ${analytics.completionRate}% — you're crushing it.`);
    } else if (analytics.completionRate >= 50) {
        insights.push(`📊 Your completion rate is ${analytics.completionRate}%. Try to close ${analytics.pendingTasks} pending tasks.`);
    } else if (analytics.totalTasks > 0) {
        insights.push(`⚠️ Your completion rate is ${analytics.completionRate}%. Focus on completing your ${analytics.pendingTasks} pending tasks.`);
    }

    if (analytics.activeStreak > 0) {
        insights.push(`🔥 You're on a ${analytics.activeStreak}-day streak! Keep the momentum going.`);
    } else {
        insights.push(`💡 Start your streak by completing at least one task today.`);
    }

    if (analytics.rescheduleRatio > 30) {
        insights.push(`🔄 ${analytics.rescheduleRatio}% of your tasks get rescheduled. Consider setting more realistic deadlines.`);
    }

    if (analytics.noteConversionRate > 0) {
        insights.push(`📝 ${analytics.noteConversionRate}% of your notes become actionable tasks. Great idea capture!`);
    } else if (analytics.totalNotes > 5) {
        insights.push(`📝 You have ${analytics.totalNotes} notes but none converted to tasks yet. Review your notes for action items.`);
    }

    const healthTasks = analytics.categoryDistribution.find(c => c.name.toLowerCase() === 'health');
    if (healthTasks && analytics.totalTasks > 0) {
        const healthRatio = (healthTasks.value / analytics.totalTasks) * 100;
        if (healthRatio < 10) {
            insights.push(`❤️ Health-related tasks make up only ${Math.round(healthRatio)}% of your activities. Consider adding more wellness tasks.`);
        }
    }

    if (analytics.todaysTotal > 0 && analytics.todaysCompleted === analytics.todaysTotal) {
        insights.push(`✅ All ${analytics.todaysTotal} tasks for today are done! You can relax now.`);
    } else if (analytics.todaysTotal > 0) {
        const remaining = analytics.todaysTotal - analytics.todaysCompleted;
        insights.push(`⏰ ${remaining} task${remaining > 1 ? 's' : ''} remaining for today out of ${analytics.todaysTotal}.`);
    }

    if (insights.length === 0) {
        insights.push('🚀 Start adding tasks and notes to see personalized insights here.');
    }

    return insights;
};
