import { supabase, isSupabaseConfigured } from './supabase';

export interface Alarm {
    id: string;
    user_id: string;
    title: string;
    source_type: 'Personal Task' | 'Professional Task' | 'Note' | 'Custom';
    source_id?: string;
    trigger_time_utc: string;
    status: 'Active' | 'Snoozed' | 'Completed' | 'Disabled';
    timezone: string;
    repeat_pattern?: {
        frequency: 'daily' | 'weekly' | 'monthly';
        interval: number;
        days?: number[]; // 0-6 for Sunday-Saturday
    };
    snooze_duration_minutes: number;
    created_at: string;
    updated_at: string;
}

export const createAlarm = async (
    userId: string,
    title: string,
    sourceType: Alarm['source_type'],
    triggerTimeUtc: string,
    timezone: string,
    sourceId?: string,
    repeatPattern?: Alarm['repeat_pattern']
): Promise<Alarm | null> => {
    if (!isSupabaseConfigured() || !supabase) return null;

    try {
        const { data, error } = await supabase
            .from('alarms')
            .insert([{
                user_id: userId,
                title,
                source_type: sourceType,
                source_id: sourceId,
                trigger_time_utc: triggerTimeUtc,
                timezone,
                repeat_pattern: repeatPattern,
                status: 'Active'
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating alarm:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Unexpected error creating alarm:', error);
        return null;
    }
};

export const getAlarms = async (userId: string): Promise<Alarm[]> => {
    if (!isSupabaseConfigured() || !supabase) return [];

    try {
        const { data, error } = await supabase
            .from('alarms')
            .select('*')
            .eq('user_id', userId)
            .order('trigger_time_utc', { ascending: true });

        if (error) {
            console.error('Error fetching alarms:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Unexpected error fetching alarms:', error);
        return [];
    }
};

export const getUpcomingAlarms = async (userId: string, hoursAhead: number = 24): Promise<Alarm[]> => {
    if (!isSupabaseConfigured() || !supabase) return [];

    try {
        const now = new Date();
        const future = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

        const { data, error } = await supabase
            .from('alarms')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'Active')
            .gte('trigger_time_utc', now.toISOString())
            .lte('trigger_time_utc', future.toISOString())
            .order('trigger_time_utc', { ascending: true });

        if (error) {
            console.error('Error fetching upcoming alarms:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Unexpected error fetching upcoming alarms:', error);
        return [];
    }
};

export const updateAlarmStatus = async (
    userId: string,
    alarmId: string,
    status: Alarm['status'],
    newTriggerTimeUtc?: string
): Promise<boolean> => {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
        const updateData: any = { status };
        if (newTriggerTimeUtc) {
            updateData.trigger_time_utc = newTriggerTimeUtc;
        }

        const { error } = await supabase
            .from('alarms')
            .update(updateData)
            .eq('id', alarmId)
            .eq('user_id', userId);

        if (error) {
            console.error('Error updating alarm status:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Unexpected error updating alarm status:', error);
        return false;
    }
};

export const deleteAlarm = async (userId: string, alarmId: string): Promise<boolean> => {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
        const { error } = await supabase
            .from('alarms')
            .delete()
            .eq('id', alarmId)
            .eq('user_id', userId);

        if (error) {
            console.error('Error deleting alarm:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Unexpected error deleting alarm:', error);
        return false;
    }
};

// Integration with other services
export const createAlarmForTask = async (
    userId: string,
    taskId: string,
    taskType: 'Personal Task' | 'Professional Task',
    taskTitle: string,
    alarmTimeUtc: string,
    timezone: string
): Promise<Alarm | null> => {
    return createAlarm(userId, taskTitle, taskType, alarmTimeUtc, timezone, taskId);
};

export const createAlarmForNote = async (
    userId: string,
    noteId: string,
    noteTitle: string,
    alarmTimeUtc: string,
    timezone: string
): Promise<Alarm | null> => {
    return createAlarm(userId, noteTitle, 'Note', alarmTimeUtc, timezone, noteId);
};