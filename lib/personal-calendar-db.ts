import { supabase, isSupabaseConfigured } from './supabase';

export interface CalendarEntry {
    id: string;
    user_id: string;
    title: string;
    category: string;
    entry_date: string;
    description?: string;
    created_at?: string;
    updated_at?: string;
}

// Function to get calendar entries for a specific user
export const getCalendarEntries = async (userId: string) => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured() || !supabase) {
        console.warn('Supabase is not configured. Returning empty calendar entries for development.');
        return [];
    }
    
    try {
        const { data, error } = await supabase
            .from('personal_calendar_entries')
            .select('*')
            .eq('user_id', userId)
            .order('entry_date', { ascending: true });

        if (error) {
            console.error('Error fetching calendar entries:', error);
            return [];
        }

        return data as CalendarEntry[];
    } catch (error) {
        console.error('Unexpected error fetching calendar entries:', error);
        return [];
    }
};

// Function to add a new calendar entry
export const addCalendarEntry = async (entry: Omit<CalendarEntry, 'id' | 'created_at'>) => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured() || !supabase) {
        console.warn('Supabase is not configured. Simulating calendar entry addition for development.');
        // For development, simulate adding an entry with a temporary ID
        return {
            ...entry,
            id: `temp-${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        } as CalendarEntry;
    }
    
    try {
        const { data, error } = await supabase
            .from('personal_calendar_entries')
            .insert([entry])
            .select()
            .single();

        if (error) {
            console.error('Error adding calendar entry:', error);
            return null;
        }

        return data as CalendarEntry;
    } catch (error) {
        console.error('Unexpected error adding calendar entry:', error);
        return null;
    }
};

// Function to delete a calendar entry
export const deleteCalendarEntry = async (entryId: string) => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured() || !supabase) {
        console.warn('Supabase is not configured. Simulating calendar entry deletion for development.');
        // For development, simulate successful deletion
        return true;
    }
    
    try {
        const { error } = await supabase
            .from('personal_calendar_entries')
            .delete()
            .eq('id', entryId);

        if (error) {
            console.error('Error deleting calendar entry:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Unexpected error deleting calendar entry:', error);
        return false;
    }
};
