import { supabase, isSupabaseConfigured } from './supabase';

export interface Note {
    id: string;
    user_id: string;
    title: string;
    content: string;
    created_at: string;
    updated_at: string;
    converted_to_task?: boolean; // Track if note has been converted to task
    color?: string; // Custom color for the note
}

// Function to get notes for a specific user
export const getNotes = async (userId: string) => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured() || !supabase) {
        console.warn('Supabase is not configured. Returning empty notes for development.');
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('user_id', userId)
            .is('converted_to_task', null) // Only get notes that haven't been converted
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching notes:', error);
            return [];
        }

        return data as Note[];
    } catch (error) {
        console.error('Unexpected error fetching notes:', error);
        return [];
    }
};

// Function to add a new note
export const addNote = async (note: Omit<Note, 'id' | 'created_at' | 'updated_at'>) => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured() || !supabase) {
        console.warn('Supabase is not configured. Simulating note addition for development.');
        // For development, simulate adding a note with a temporary ID
        return {
            ...note,
            id: `temp-${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        } as Note;
    }

    try {
        const { data, error } = await supabase
            .from('notes')
            .insert([note])
            .select()
            .single();

        if (error) {
            console.error('Error adding note:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
                fullError: error
            });
            return null;
        }

        return data as Note;
    } catch (error) {
        console.error('Unexpected error adding note:', error);
        return null;
    }
};

// Function to update a note
export const updateNote = async (noteId: string, updates: Partial<Omit<Note, 'id' | 'user_id' | 'created_at'>>) => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured() || !supabase) {
        console.warn('Supabase is not configured. Simulating note update for development.');
        // For development, simulate successful update
        return true;
    }

    try {
        const { error } = await supabase
            .from('notes')
            .update(updates)
            .eq('id', noteId);

        if (error) {
            console.error('Error updating note:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Unexpected error updating note:', error);
        return false;
    }
};

// Function to delete a note
export const deleteNote = async (noteId: string) => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured() || !supabase) {
        console.warn('Supabase is not configured. Simulating note deletion for development.');
        // For development, simulate successful deletion
        return true;
    }

    try {
        const { error } = await supabase
            .from('notes')
            .delete()
            .eq('id', noteId);

        if (error) {
            console.error('Error deleting note:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Unexpected error deleting note:', error);
        return false;
    }
};

// Function to mark a note as converted to task
export const markNoteAsConverted = async (noteId: string) => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured() || !supabase) {
        console.warn('Supabase is not configured. Simulating note conversion for development.');
        return true;
    }

    try {
        const { error } = await supabase
            .from('notes')
            .update({ converted_to_task: true })
            .eq('id', noteId);

        if (error) {
            console.error('Error marking note as converted:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Unexpected error marking note as converted:', error);
        return false;
    }
};