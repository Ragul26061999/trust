import { supabase, isSupabaseConfigured } from './supabase';

export interface StopwatchSession {
    id: string;
    user_id: string;
    heading: string;
    purpose: string;
    start_time_utc: string;
    end_time_utc: string;
    duration_ms: number;
    timezone: string;
    created_at: string;
    updated_at: string;
}

export const createStopwatchSession = async (
    userId: string,
    heading: string,
    purpose: string,
    startTimeUtc: string,
    endTimeUtc: string,
    timezone: string
): Promise<StopwatchSession | null> => {
    if (!isSupabaseConfigured() || !supabase) return null;

    try {
        const durationMs = new Date(endTimeUtc).getTime() - new Date(startTimeUtc).getTime();
        
        const { data, error } = await supabase
            .from('stopwatch_sessions')
            .insert([{
                user_id: userId,
                heading,
                purpose,
                start_time_utc: startTimeUtc,
                end_time_utc: endTimeUtc,
                duration_ms: durationMs,
                timezone
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating stopwatch session:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Unexpected error creating stopwatch session:', error);
        return null;
    }
};

export const getStopwatchSessions = async (userId: string): Promise<StopwatchSession[]> => {
    if (!isSupabaseConfigured() || !supabase) return [];

    try {
        const { data, error } = await supabase
            .from('stopwatch_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching stopwatch sessions:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Unexpected error fetching stopwatch sessions:', error);
        return [];
    }
};

export const deleteStopwatchSession = async (userId: string, sessionId: string): Promise<boolean> => {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
        const { error } = await supabase
            .from('stopwatch_sessions')
            .delete()
            .eq('id', sessionId)
            .eq('user_id', userId);

        if (error) {
            console.error('Error deleting stopwatch session:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Unexpected error deleting stopwatch session:', error);
        return false;
    }
};