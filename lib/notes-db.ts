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
    // New multimedia fields
    drawing_data?: any; // JSON data for drawings
    drawing_thumbnail?: string; // Base64 thumbnail of drawing
    audio_recording_url?: string; // URL for audio recordings
    video_recording_url?: string; // URL for video recordings
    tags?: string[]; // Array of tags
    is_drawing?: boolean; // Flag for drawings
    is_recording?: boolean; // Flag for recordings
}

// Interface for note attachments
export interface NoteAttachment {
    id: string;
    note_id: string;
    file_name: string;
    file_type: 'image' | 'video' | 'audio' | 'document' | 'drawing';
    file_size?: number;
    file_url?: string;
    file_data?: string; // Base64 encoded data
    mime_type?: string;
    created_at: string;
    updated_at: string;
}

// Function to get note attachments for a specific note
export const getNoteAttachments = async (noteId: string) => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured() || !supabase) {
        console.warn('Supabase is not configured. Returning empty attachments for development.');
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('note_attachments')
            .select('*')
            .eq('note_id', noteId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching note attachments:', error);
            return [];
        }

        return data as NoteAttachment[];
    } catch (error) {
        console.error('Unexpected error fetching note attachments:', error);
        return [];
    }
};

// Function to add a note attachment
export const addNoteAttachment = async (attachment: Omit<NoteAttachment, 'id' | 'created_at' | 'updated_at'>) => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured() || !supabase) {
        console.warn('Supabase is not configured. Simulating attachment addition for development.');
        return {
            ...attachment,
            id: `temp-${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        } as NoteAttachment;
    }

    try {
        const { data, error } = await supabase
            .from('note_attachments')
            .insert([attachment])
            .select()
            .single();

        if (error) {
            console.error('Error adding note attachment:', error);
            return null;
        }

        return data as NoteAttachment;
    } catch (error) {
        console.error('Unexpected error adding note attachment:', error);
        return null;
    }
};

// Function to delete a note attachment
export const deleteNoteAttachment = async (attachmentId: string) => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured() || !supabase) {
        console.warn('Supabase is not configured. Simulating attachment deletion for development.');
        return true;
    }

    try {
        const { error } = await supabase
            .from('note_attachments')
            .delete()
            .eq('id', attachmentId);

        if (error) {
            console.error('Error deleting note attachment:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Unexpected error deleting note attachment:', error);
        return false;
    }
};
// Function to add a note with attachments
export const addNoteWithAttachments = async (note: Omit<Note, 'id' | 'created_at' | 'updated_at'>, attachments: Omit<NoteAttachment, 'id' | 'note_id' | 'created_at' | 'updated_at'>[]) => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured() || !supabase) {
        console.warn('Supabase is not configured. Simulating note addition for development.');
        // For development, simulate adding a note with temporary ID
        const tempNote = {
            ...note,
            id: `temp-${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        } as Note;

        // Simulate adding attachments
        const tempAttachments = attachments.map((att, index) => ({
            ...att,
            id: `temp-att-${Date.now()}-${index}`,
            note_id: tempNote.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        } as NoteAttachment));

        return { note: tempNote, attachments: tempAttachments };
    }

    try {
        // First, add the note
        const { data: noteData, error: noteError } = await supabase
            .from('notes')
            .insert([note])
            .select()
            .single();

        if (noteError) {
            console.error('Error adding note:', noteError);
            return null;
        }

        // Then add attachments if any
        let attachmentData: NoteAttachment[] = [];
        if (attachments.length > 0) {
            const attachmentsWithNoteId = attachments.map(att => ({
                ...att,
                note_id: noteData.id
            }));

            const { data: attData, error: attError } = await supabase
                .from('note_attachments')
                .insert(attachmentsWithNoteId)
                .select();

            if (attError) {
                console.error('Error adding attachments:', attError);
                // Note was created but attachments failed, still return the note
                return { note: noteData as Note, attachments: [] };
            }

            attachmentData = attData as NoteAttachment[];
        }

        return { note: noteData as Note, attachments: attachmentData };
    } catch (error) {
        console.error('Unexpected error adding note with attachments:', error);
        return null;
    }
};

// Function to get notes with their attachments
export const getNotesWithAttachments = async (userId: string) => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured() || !supabase) {
        console.warn('Supabase is not configured. Returning empty notes for development.');
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('notes')
            .select(`
                *,
                note_attachments (*)
            `)
            .eq('user_id', userId)
            .is('converted_to_task', null)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching notes with attachments:', error);
            return [];
        }

        return data as (Note & { note_attachments: NoteAttachment[] })[];
    } catch (error) {
        console.error('Unexpected error fetching notes with attachments:', error);
        return [];
    }
};

// Function to update a note with attachments
export const updateNoteWithAttachments = async (
    noteId: string, 
    noteUpdates: Partial<Omit<Note, 'id' | 'user_id' | 'created_at'>>,
    newAttachments?: Omit<NoteAttachment, 'id' | 'note_id' | 'created_at' | 'updated_at'>[]
) => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured() || !supabase) {
        console.warn('Supabase is not configured. Simulating note update for development.');
        return true;
    }

    try {
        // Update the note
        const { error: noteError } = await supabase
            .from('notes')
            .update(noteUpdates)
            .eq('id', noteId);

        if (noteError) {
            console.error('Error updating note:', noteError);
            return false;
        }

        // Add new attachments if provided
        if (newAttachments && newAttachments.length > 0) {
            const attachmentsWithNoteId = newAttachments.map(att => ({
                ...att,
                note_id: noteId
            }));

            const { error: attError } = await supabase
                .from('note_attachments')
                .insert(attachmentsWithNoteId);

            if (attError) {
                console.error('Error adding new attachments:', attError);
                // Note was updated but attachments failed
            }
        }

        return true;
    } catch (error) {
        console.error('Unexpected error updating note with attachments:', error);
        return false;
    }
};

// Function to delete a note and all its attachments
export const deleteNoteWithAttachments = async (noteId: string) => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured() || !supabase) {
        console.warn('Supabase is not configured. Simulating note deletion for development.');
        return true;
    }

    try {
        // Delete attachments first (they have foreign key constraint)
        const { error: attError } = await supabase
            .from('note_attachments')
            .delete()
            .eq('note_id', noteId);

        if (attError) {
            console.error('Error deleting note attachments:', attError);
            return false;
        }

        // Then delete the note
        const { error: noteError } = await supabase
            .from('notes')
            .delete()
            .eq('id', noteId);

        if (noteError) {
            console.error('Error deleting note:', noteError);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Unexpected error deleting note with attachments:', error);
        return false;
    }
};

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