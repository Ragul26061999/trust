import { supabase, isSupabaseConfigured } from './supabase';

export interface CalendarEntry {
    id: string;
    user_id: string;
    title: string;
    category: string;
    entry_date: string;
    description?: string;
    category_data?: any;
    priority?: string;
    status?: string;
    created_at?: string;
    updated_at?: string;
}

export interface CustomCalendar {
    id: string;
    user_id: string;
    name: string;
    color: string;
    is_visible: boolean;
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
        console.log('Attempting to insert calendar entry:', entry);

        // Prepare the entry to ensure proper data types
        const preparedEntry = {
            ...entry,
            category_data: entry.category_data || {},
        };

        const { data, error } = await supabase
            .from('personal_calendar_entries')
            .insert([preparedEntry])
            .select()
            .single();

        if (error) {
            console.error('Error adding calendar entry:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
                fullError: error
            });
            return null;
        }

        return data as CalendarEntry;
    } catch (error) {
        console.error('Unexpected error adding calendar entry:', error);
        return null;
    }
};

// Function to update a calendar entry
export const updateCalendarEntry = async (entryId: string, updates: Partial<Omit<CalendarEntry, 'id' | 'user_id' | 'created_at'>>) => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured() || !supabase) {
        console.warn('Supabase is not configured. Simulating calendar entry update for development.');
        // For development, simulate successful update
        return true;
    }

    try {
        // Prepare the updates to ensure proper data types
        const preparedUpdates = {
            ...updates,
            category_data: updates.category_data || {},
        };

        const { error } = await supabase
            .from('personal_calendar_entries')
            .update(preparedUpdates)
            .eq('id', entryId);

        if (error) {
            console.error('Error updating calendar entry:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Unexpected error updating calendar entry:', error);
        return false;
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

// Function to get custom calendars for a specific user
export const getCustomCalendars = async (userId: string) => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured() || !supabase) {
        console.warn('Supabase is not configured. Returning empty custom calendars for development.');
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('custom_calendars')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching custom calendars:', error);
            return [];
        }

        return data as CustomCalendar[];
    } catch (error) {
        console.error('Unexpected error fetching custom calendars:', error);
        return [];
    }
};

// Function to add a new custom calendar
export const addCustomCalendar = async (calendar: Omit<CustomCalendar, 'id' | 'created_at' | 'updated_at'>) => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured() || !supabase) {
        console.warn('Supabase is not configured. Simulating custom calendar addition for development.');
        // For development, simulate adding a calendar with a temporary ID
        return {
            ...calendar,
            id: `temp-${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        } as CustomCalendar;
    }

    try {
        const { data, error } = await supabase
            .from('custom_calendars')
            .insert([calendar])
            .select()
            .single();

        if (error) {
            console.error('Error adding custom calendar:', error);
            return null;
        }

        return data as CustomCalendar;
    } catch (error) {
        console.error('Unexpected error adding custom calendar:', error);
        return null;
    }
};

// Function to update a custom calendar
export const updateCustomCalendar = async (calendarId: string, updates: Partial<Omit<CustomCalendar, 'id' | 'user_id'>>) => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured() || !supabase) {
        console.warn('Supabase is not configured. Simulating custom calendar update for development.');
        // For development, simulate successful update
        return true;
    }

    try {
        const { error } = await supabase
            .from('custom_calendars')
            .update(updates)
            .eq('id', calendarId);

        if (error) {
            console.error('Error updating custom calendar:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Unexpected error updating custom calendar:', error);
        return false;
    }
};

// Function to delete a custom calendar
export const deleteCustomCalendar = async (calendarId: string) => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured() || !supabase) {
        console.warn('Supabase is not configured. Simulating custom calendar deletion for development.');
        // For development, simulate successful deletion
        return true;
    }

    try {
        const { error } = await supabase
            .from('custom_calendars')
            .delete()
            .eq('id', calendarId);

        if (error) {
            console.error('Error deleting custom calendar:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Unexpected error deleting custom calendar:', error);
        return false;
    }
};
