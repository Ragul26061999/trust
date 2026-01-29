import { supabase, isSupabaseConfigured } from './supabase';

export interface BedtimeLog {
    id: string;
    user_id: string;
    sleep_time_utc: string;
    wake_time_utc: string;
    duration_ms: number;
    date_label: string;
    timezone: string;
    notes: string;
    created_at: string;
    updated_at: string;
}

export const createBedtimeLog = async (
    userId: string,
    sleepTimeUtc: string,
    wakeTimeUtc: string,
    timezone: string,
    notes?: string
): Promise<BedtimeLog | null> => {
    if (!isSupabaseConfigured() || !supabase) return null;

    try {
        const sleepDate = new Date(sleepTimeUtc);
        const wakeDate = new Date(wakeTimeUtc);
        const durationMs = wakeDate.getTime() - sleepDate.getTime();
        const dateLabel = sleepDate.toISOString().split('T')[0]; // YYYY-MM-DD
        
        const { data, error } = await supabase
            .from('bedtime_logs')
            .insert([{
                user_id: userId,
                sleep_time_utc: sleepTimeUtc,
                wake_time_utc: wakeTimeUtc,
                duration_ms: durationMs,
                date_label: dateLabel,
                timezone,
                notes
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating bedtime log:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Unexpected error creating bedtime log:', error);
        return null;
    }
};

export const getBedtimeLogs = async (userId: string): Promise<BedtimeLog[]> => {
    if (!isSupabaseConfigured() || !supabase) return [];

    try {
        const { data, error } = await supabase
            .from('bedtime_logs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching bedtime logs:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Unexpected error fetching bedtime logs:', error);
        return [];
    }
};

export const getBedtimeStats = async (userId: string, days: number = 30): Promise<{
    averageDuration: number;
    averageSleepTime: string;
    averageWakeTime: string;
    consistencyScore: number;
}> => {
    if (!isSupabaseConfigured() || !supabase) {
        return {
            averageDuration: 0,
            averageSleepTime: '00:00',
            averageWakeTime: '00:00',
            consistencyScore: 0
        };
    }

    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const { data, error } = await supabase
            .from('bedtime_logs')
            .select('sleep_time_utc, wake_time_utc, duration_ms')
            .eq('user_id', userId)
            .gte('created_at', cutoffDate.toISOString())
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching bedtime stats:', error);
            return {
                averageDuration: 0,
                averageSleepTime: '00:00',
                averageWakeTime: '00:00',
                consistencyScore: 0
            };
        }

        if (!data || data.length === 0) {
            return {
                averageDuration: 0,
                averageSleepTime: '00:00',
                averageWakeTime: '00:00',
                consistencyScore: 0
            };
        }

        // Calculate averages
        const totalDuration = data.reduce((sum, log) => sum + log.duration_ms, 0);
        const averageDuration = totalDuration / data.length;

        // Calculate time consistency (simplified)
        const sleepTimes = data.map(log => new Date(log.sleep_time_utc).getHours() * 60 + new Date(log.sleep_time_utc).getMinutes());
        const wakeTimes = data.map(log => new Date(log.wake_time_utc).getHours() * 60 + new Date(log.wake_time_utc).getMinutes());
        
        const sleepVariance = calculateVariance(sleepTimes);
        const wakeVariance = calculateVariance(wakeTimes);
        const consistencyScore = Math.max(0, 100 - (sleepVariance + wakeVariance) / 30); // Simplified scoring

        // Average times in HH:MM format
        const avgSleepMinutes = sleepTimes.reduce((a, b) => a + b, 0) / sleepTimes.length;
        const avgWakeMinutes = wakeTimes.reduce((a, b) => a + b, 0) / wakeTimes.length;
        
        const formatTime = (minutes: number) => {
            const hours = Math.floor(minutes / 60);
            const mins = Math.floor(minutes % 60);
            return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        };

        return {
            averageDuration,
            averageSleepTime: formatTime(avgSleepMinutes),
            averageWakeTime: formatTime(avgWakeMinutes),
            consistencyScore
        };
    } catch (error) {
        console.error('Unexpected error calculating bedtime stats:', error);
        return {
            averageDuration: 0,
            averageSleepTime: '00:00',
            averageWakeTime: '00:00',
            consistencyScore: 0
        };
    }
};

const calculateVariance = (numbers: number[]): number => {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
};