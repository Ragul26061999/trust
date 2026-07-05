import { getCalendarEntries, CalendarEntry } from './personal-calendar-db';
import { getProfessionalTasks, ProfessionalTask } from './professional-db';
import { parseISO, addMinutes, isWithinInterval, startOfDay, endOfDay, format } from 'date-fns';
import { supabase } from './supabase';

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
        
    // Generate Routine Tasks (Sleep and Breaks)
    const routineTasks: UnifiedTask[] = [];
    if (supabase) {
        const [prefsRes, breaksRes] = await Promise.all([
            supabase.from('user_preferences').select('default_sleep_start, default_sleep_end').eq('user_id', userId).single(),
            supabase.from('user_breaks').select('*').eq('user_id', userId)
        ]);

        if (prefsRes.data && prefsRes.data.default_sleep_start && prefsRes.data.default_sleep_end) {
            // Sleep Start
            const [sh, sm] = prefsRes.data.default_sleep_start.split(':');
            const sleepStart = new Date(date);
            sleepStart.setHours(parseInt(sh), parseInt(sm), 0, 0);
            
            // Sleep End
            const [eh, em] = prefsRes.data.default_sleep_end.split(':');
            const sleepEnd = new Date(date);
            sleepEnd.setHours(parseInt(eh), parseInt(em), 0, 0);
            
            // If sleep ends before it starts, it means it crosses midnight
            // We'll create two blocks for the day: 00:00 to sleepEnd, and sleepStart to 23:59:59
            if (sleepEnd < sleepStart) {
                const sleepEndBlock1 = new Date(date);
                sleepEndBlock1.setHours(parseInt(eh), parseInt(em), 0, 0);
                const sleepStartBlock1 = startOfDay(date);
                
                routineTasks.push({
                    id: `routine-sleep-1-${dateStr}`,
                    title: 'Sleep (Wake Up)',
                    start_time: sleepStartBlock1.toISOString(),
                    end_time: sleepEndBlock1.toISOString(),
                    type: 'personal',
                    original_task: {} as any,
                    status: 'routine'
                });

                const sleepStartBlock2 = new Date(date);
                sleepStartBlock2.setHours(parseInt(sh), parseInt(sm), 0, 0);
                const sleepEndBlock2 = endOfDay(date);
                
                routineTasks.push({
                    id: `routine-sleep-2-${dateStr}`,
                    title: 'Sleep (Bed Time)',
                    start_time: sleepStartBlock2.toISOString(),
                    end_time: sleepEndBlock2.toISOString(),
                    type: 'personal',
                    original_task: {} as any,
                    status: 'routine'
                });
            } else {
                routineTasks.push({
                    id: `routine-sleep-${dateStr}`,
                    title: 'Sleep',
                    start_time: sleepStart.toISOString(),
                    end_time: sleepEnd.toISOString(),
                    type: 'personal',
                    original_task: {} as any,
                    status: 'routine'
                });
            }
        }

        if (breaksRes.data) {
            breaksRes.data.forEach(brk => {
                const [bsh, bsm] = brk.start_time.split(':');
                const breakStart = new Date(date);
                breakStart.setHours(parseInt(bsh), parseInt(bsm), 0, 0);

                const [beh, bem] = brk.end_time.split(':');
                const breakEnd = new Date(date);
                breakEnd.setHours(parseInt(beh), parseInt(bem), 0, 0);

                routineTasks.push({
                    id: `routine-break-${brk.id}-${dateStr}`,
                    title: `Break: ${brk.name}`,
                    start_time: breakStart.toISOString(),
                    end_time: breakEnd.toISOString(),
                    type: 'personal',
                    original_task: {} as any,
                    status: 'routine'
                });
            });
        }
    }
        
    return [...unifiedPersonal, ...unifiedProfessional, ...routineTasks].sort((a, b) => 
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
