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
            .from('timetable_entries')
            .select('*')
            .eq('user_id', userId)
            .order('entry_date', { ascending: true });

        if (error) {
            console.error('Error fetching calendar entries:', error);
            return [];
        }

        // Map the data to CalendarEntry format, handling different field names
        const mappedData = data.map(item => {
            // Use entry_date if available, otherwise use start_time
            const entryDate = item.entry_date || item.start_time || item.created_at;
            
            return {
                ...item,
                entry_date: entryDate,
                date: new Date(entryDate) // Add a date field for compatibility
            } as CalendarEntry;
        });

        return mappedData;
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

        // Prepare the entry for timetable_entries table
        // Convert entry_date to start_time and end_time for compatibility
        const entryDateTime = entry.entry_date || new Date().toISOString();
        
        // For calendar entries, set start_time and end_time to the same date
        // or parse the entry_date to create appropriate start/end times
        const dbEntry = {
            user_id: entry.user_id,
            title: entry.title,
            description: entry.description || '',
            start_time: entryDateTime, // Use entry_date as start_time
            end_time: entryDateTime,   // Use entry_date as end_time (same day)
            category: entry.category,
            priority: entry.priority || 'medium',
            entry_date: entryDateTime,  // Keep entry_date for backward compatibility
            category_data: entry.category_data || {},
            status: entry.status || 'pending'
        };
        
        console.log('Prepared database entry:', dbEntry);
        
        const { data, error } = await supabase
            .from('timetable_entries')
            .insert([dbEntry])
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

        console.log('Successfully added calendar entry:', data);
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
        // Prepare the updates for timetable_entries table
        const preparedUpdates: any = {
            category_data: updates.category_data || {},
        };

        // Map the fields appropriately
        if (updates.title) preparedUpdates.title = updates.title;
        if (updates.description) preparedUpdates.description = updates.description;
        if (updates.category) preparedUpdates.category = updates.category;
        if (updates.priority) preparedUpdates.priority = updates.priority;
        if (updates.status) preparedUpdates.status = updates.status;
        
        // Handle date fields - update both start_time, end_time, and entry_date
        if (updates.entry_date) {
            preparedUpdates.start_time = updates.entry_date;
            preparedUpdates.end_time = updates.entry_date;
            preparedUpdates.entry_date = updates.entry_date;
        }

        // Add updated_at timestamp
        preparedUpdates.updated_at = new Date().toISOString();

        const { error } = await supabase
            .from('timetable_entries')
            .update(preparedUpdates)
            .eq('id', entryId);

        if (error) {
            console.error('Error updating calendar entry:', {
                error: error,
                entryId: entryId,
                updates: updates
            });
            return false;
        }

        return true;
    } catch (error) {
        console.error('Unexpected error updating calendar entry:', {
            error: error,
            entryId: entryId,
            updates: updates
        });
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
            .from('timetable_entries')
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
