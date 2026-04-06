import { getCalendarEntries, CalendarEntry } from './personal-calendar-db';
import { getProfessionalTasks, ProfessionalTask } from './professional-db';
import { parseISO, addMinutes, isWithinInterval, startOfDay, endOfDay, format } from 'date-fns';

export interface UnifiedTask {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    type: 'personal' | 'professional';
    original_task: CalendarEntry | ProfessionalTask;
    status: string;
}

export const getAllTasks = async (userId: string, date: Date): Promise<UnifiedTask[]> => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Fetch personal and professional tasks
    const personalEntries = await getCalendarEntries(userId);
    const professionalTasks = await getProfessionalTasks(userId);
    
    // Filter by date and map to unified format
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    
    const unifiedPersonal: UnifiedTask[] = personalEntries
        .filter(entry => {
            const entryDate = parseISO(entry.entry_date);
            return isWithinInterval(entryDate, { start: dayStart, end: dayEnd });
        })
        .map(entry => {
            const startTime = parseISO(entry.entry_date);
            const duration = 60; // Default 1 hour if not specified
            return {
                id: entry.id,
                title: entry.title,
                start_time: entry.entry_date,
                end_time: addMinutes(startTime, duration).toISOString(),
                type: 'personal',
                original_task: entry,
                status: entry.status || 'pending'
            };
        });
        
    const unifiedProfessional: UnifiedTask[] = professionalTasks
        .filter(task => {
            const taskDate = parseISO(task.task_date);
            return isWithinInterval(taskDate, { start: dayStart, end: dayEnd });
        })
        .map(task => {
            const startTime = parseISO(task.task_date);
            const duration = task.duration_minutes || 60;
            return {
                id: task.id,
                title: task.title,
                start_time: task.task_date,
                end_time: addMinutes(startTime, duration).toISOString(),
                type: 'professional',
                original_task: task,
                status: task.status || 'pending'
            };
        });
        
    return [...unifiedPersonal, ...unifiedProfessional].sort((a, b) => 
        parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime()
    );
};

export const checkConflicts = async (userId: string, startTime: string, durationMinutes: number = 60): Promise<UnifiedTask[]> => {
    const start = parseISO(startTime);
    const end = addMinutes(start, durationMinutes);
    
    const allTasks = await getAllTasks(userId, start);
    
    return allTasks.filter(task => {
        const taskStart = parseISO(task.start_time);
        const taskEnd = parseISO(task.end_time);
        
        return (
            (start >= taskStart && start < taskEnd) || // Start overlaps
            (end > taskStart && end <= taskEnd) ||     // End overlaps
            (start <= taskStart && end >= taskEnd)     // New task encompasses old task
        );
    });
};

export const getSuggestedFreeSlots = async (userId: string, date: Date, durationMinutes: number = 60): Promise<string[]> => {
    const allTasks = await getAllTasks(userId, date);
    const suggestions: string[] = [];
    
    // Check gaps between 9 AM and 9 PM
    let currentPointer = new Date(date);
    currentPointer.setHours(9, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(21, 0, 0, 0);
    
    while (currentPointer < dayEnd && suggestions.length < 3) {
        const potentialStart = currentPointer.toISOString();
        const overlaps = await checkConflicts(userId, potentialStart, durationMinutes);
        
        if (overlaps.length === 0) {
            suggestions.push(potentialStart);
            currentPointer = addMinutes(currentPointer, durationMinutes + 30); // Move forward
        } else {
            // Move to the end of the last overlapping task
            const lastEnd = Math.max(...overlaps.map(o => parseISO(o.end_time).getTime()));
            currentPointer = new Date(lastEnd);
        }
    }
    
    return suggestions;
};
