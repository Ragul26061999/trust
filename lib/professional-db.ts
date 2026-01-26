import { supabase, isSupabaseConfigured } from './supabase';

export interface ProfessionalRole {
    id: string;
    user_id: string;
    role_name: string;
    experience: string;
    responsibilities: string;
    schedule: any;
    created_at?: string;
    updated_at?: string;
}

export interface ProfessionalTask {
    id: string;
    user_id: string;
    title: string;
    description?: string;
    department?: string;
    role?: string;
    responsibilities?: string;
    experience?: string;
    task_date: string; // ISO date string
    scheduled_for?: string; // ISO date string
    priority?: string;
    status?: string; // pending, completed, rescheduled
    rescheduled_from?: string;
    created_at?: string;
    updated_at?: string;
    // Multimedia fields for converted notes
    drawing_data?: any;
    drawing_thumbnail?: string;
    audio_recording_url?: string;
    attachments?: any[];
    is_drawing?: boolean;
    is_recording?: boolean;
    original_note_id?: string;
    conversion_date?: string;
    multimedia_content?: {
        has_attachments: boolean;
        attachments: any[];
        has_drawing: boolean;
        has_recording: boolean;
        tags: string[];
    }; // Legacy field for backward compatibility
}

export const getProfessionalRole = async (userId: string) => {
    if (!isSupabaseConfigured() || !supabase) {
        return null;
    }

    try {
        const { data, error } = await supabase
            .from('professional_roles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
            console.error('Error fetching professional role:', error);
            return null;
        }

        return data as ProfessionalRole;
    } catch (error) {
        console.error('Unexpected error fetching professional role:', error);
        return null;
    }
};

export const saveProfessionalRole = async (role: Omit<ProfessionalRole, 'id' | 'created_at' | 'updated_at'>) => {
    if (!isSupabaseConfigured() || !supabase) {
        return null;
    }

    try {
        // Upsert based on user_id
        const { data, error } = await supabase
            .from('professional_roles')
            .upsert([role], { onConflict: 'user_id' })
            .select()
            .single();

        if (error) {
            console.error('Error saving professional role:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            return null;
        }

        return data as ProfessionalRole;
    } catch (error) {
        console.error('Unexpected error saving professional role:', error);
        return null;
    }
};

// New Professional Tasks Functions

interface ProfessionalInfo {
    department: string;
    role: string;
    responsibilities: string;
    experience: string;
}

export const getProfessionalInfo = async (userId: string): Promise<ProfessionalInfo | null> => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured() || !supabase) {
        console.warn('Supabase not configured - returning null for development');
        return null;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    // Be flexible with user ID format in development
    const isProperUUID = uuidRegex.test(userId);
    if (!isProperUUID && isSupabaseConfigured()) {
        console.error('Invalid user ID format for getProfessionalInfo:', userId);
        return null;
    }

    try {
        console.log('Fetching professional info for user:', userId);
        
        // First, try to get the professional info for the user from professional_roles table
        const { data, error } = await supabase
            .from('professional_roles')
            .select('department, role_name, responsibilities, experience')
            .eq('user_id', userId)
            .maybeSingle();
        
        if (error) {
            console.error('Error fetching professional info:', error);
            console.error('Error details:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            // Return null if there's an error, which will trigger the setup form
            return null;
        }

        console.log('Successfully fetched professional info:', data);
        
        // Map the returned data to match the expected format
        if (data) {
            return {
                department: data.department || '',
                role: data.role_name || '',
                responsibilities: data.responsibilities || '',
                experience: data.experience || ''
            };
        }
        
        // Return null if no data is found
        return null;
    } catch (error) {
        console.error('Unexpected error fetching professional info:', error);
        return null;
    }
};

// Function to check if professional_tasks table exists and create it if needed
export const ensureProfessionalTasksTable = async () => {
    if (!isSupabaseConfigured() || !supabase) {
        console.error('Supabase not configured');
        return false;
    }

    try {
        console.log('Checking if professional_tasks table exists...');
        
        // Try to query the table to check if it exists
        const { data, error } = await supabase
            .from('professional_tasks')
            .select('id')
            .limit(1);
        
        // If no error occurred, the table exists
        if (!error) {
            console.log('✅ professional_tasks table exists and is accessible');
            console.log('Sample data check result:', data);
            return true;
        }
        
        // Log the specific error
        console.error('❌ Error accessing professional_tasks table:', error);
        console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
        });
        
        // If error indicates table doesn't exist, we can't create it from client-side
        // In a real implementation, you'd run the SQL migration on the server side
        console.warn('professional_tasks table may not exist. Please ensure the migration has been run.');
        return false;
    } catch (error) {
        console.error('Unexpected error checking professional_tasks table:', error);
        return false;
    }
};

export const saveProfessionalInfo = async (info: {
    user_id: string;
    department: string;
    role: string;
    responsibilities: string;
    experience: string;
}) => {
    if (!isSupabaseConfigured() || !supabase) {
        console.error('Supabase not configured');
        return null;
    }

    try {
        console.log('Saving professional info for user:', info.user_id);
        console.log('Input data:', info);
        
        // Check if Supabase is configured
        if (!isSupabaseConfigured()) {
            console.warn('Supabase not configured - simulating save operation for development');
            // In development mode without Supabase, return mock data
            return {
                id: 'mock-id-' + Date.now(),
                user_id: info.user_id,
                role_name: info.role,
                experience: info.experience,
                responsibilities: info.responsibilities,
                department: info.department,
                schedule: {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            } as ProfessionalRole;
        }
        
        // Validate required fields
        if (!info.user_id || !info.department || !info.role) {
            throw new Error('Missing required fields: user_id, department, or role');
        }
        
        // Validate UUID format for user_id, but be flexible in development
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        // In development/demo mode, we might have non-UUID user IDs, so we'll allow them
        // but in production with proper Supabase setup, UUIDs are required
        const isProperUUID = uuidRegex.test(info.user_id);
        
        if (!isProperUUID && isSupabaseConfigured()) {
            // Only throw error if Supabase is properly configured
            throw new Error(`Invalid user_id format. Expected UUID, got: ${info.user_id}`);
        } else if (!isProperUUID && !isSupabaseConfigured()) {
            console.warn(`User ID format is not a standard UUID: ${info.user_id}. This is OK in development mode.`);
        }

        // Use the professional_roles table for profile information instead of professional_tasks
        const { data: existingRecord, error: selectError } = await supabase
            .from('professional_roles')
            .select('id')
            .eq('user_id', info.user_id)
            .limit(1)
            .maybeSingle();

        console.log('Existing record check result:', { data: existingRecord, error: selectError });

        if (selectError) {
            console.error('Error checking existing record:', selectError);
            console.error('Error details:', {
                message: selectError.message,
                details: selectError.details,
                hint: selectError.hint,
                code: selectError.code
            });
            throw selectError;
        }

        let result;
        if (existingRecord) {
            console.log('Updating existing record for user:', info.user_id);
            const updateData = {
                role_name: info.role,
                experience: info.experience,
                responsibilities: info.responsibilities,
                department: info.department,
                updated_at: new Date().toISOString()
            };
            console.log('Update data:', updateData);
            // Update the existing record in professional_roles table
            const { data, error } = await supabase
                .from('professional_roles')
                .update(updateData)
                .eq('user_id', info.user_id)
                .select()
                .single();
            
            if (error) {
                console.error('Error updating record:', error);
                console.error('Update error details:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
                throw error;
            }
            result = data;
        } else {
            console.log('Creating new record for user:', info.user_id);
            // Insert a new record in professional_roles table
            const roleData = {
                user_id: info.user_id,
                role_name: info.role,
                experience: info.experience,
                responsibilities: info.responsibilities,
                department: info.department,
                schedule: {} // Initialize with empty schedule
            };
            
            console.log('Insert data:', roleData);
            
            const { data, error } = await supabase
                .from('professional_roles')
                .insert([roleData])
                .select()
                .single();
            
            if (error) {
                console.error('Error inserting record:', error);
                console.error('Insert error details:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
                throw error;
            }
            result = data;
        }

        console.log('Successfully saved professional info:', result);
        return result as ProfessionalRole;
    } catch (error: any) {
        console.error('Error in saveProfessionalInfo:', error);
        
        // Provide more detailed error information
        const errorInfo = {
            message: error.message || 'Unknown error occurred',
            details: error.details || 'No details provided',
            hint: error.hint || 'No hint provided',
            code: error.code || 'UNKNOWN_ERROR',
            stack: error.stack || 'No stack trace available'
        };
        
        console.error('Detailed error information:', errorInfo);
        return null;
    }
};

export const getProfessionalTasks = async (userId: string, dateFilter?: string) => {
    if (!isSupabaseConfigured() || !supabase) {
        console.warn('Supabase is not configured. Returning empty tasks for development.');
        return [];
    }

    try {
        let query = supabase
            .from('professional_tasks')
            .select('*')
            .eq('user_id', userId)
            .order('task_date', { ascending: true });

        if (dateFilter) {
            query = query.eq('task_date', dateFilter);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching professional tasks:', error);
            return [];
        }

        return data as ProfessionalTask[];
    } catch (error) {
        console.error('Unexpected error fetching professional tasks:', error);
        return [];
    }
};

export const addProfessionalTask = async (task: Omit<ProfessionalTask, 'id' | 'created_at' | 'updated_at'>) => {
    if (!isSupabaseConfigured() || !supabase) {
        console.warn('Supabase is not configured. Simulating task addition for development.');
        return {
            ...task,
            id: `temp-${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        } as ProfessionalTask;
    }

    try {
        console.log('Adding professional task:', task);
        
        // Ensure required fields are provided
        const taskWithDefaults = {
            ...task,
            department: task.department || '',
            role: task.role || '',
            responsibilities: task.responsibilities || '',
            experience: task.experience || '',
            priority: task.priority || 'Medium',
            status: task.status || 'pending',
        };
        
        console.log('Task with defaults:', taskWithDefaults);
        
        // Validate that we have the required fields
        if (!taskWithDefaults.user_id || !taskWithDefaults.title || !taskWithDefaults.task_date) {
            console.error('Missing required fields for professional task:', {
                user_id: !!taskWithDefaults.user_id,
                title: !!taskWithDefaults.title,
                task_date: !!taskWithDefaults.task_date
            });
            return null;
        }
        
        const { data, error } = await supabase
            .from('professional_tasks')
            .insert([taskWithDefaults])
            .select()
            .single();

        if (error) {
            console.error('Error adding professional task:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            return null;
        }

        console.log('Successfully added professional task:', data);
        return data as ProfessionalTask;
    } catch (error) {
        console.error('Unexpected error adding professional task:', error);
        return null;
    }
};

export const updateProfessionalTask = async (taskId: string, updates: Partial<Omit<ProfessionalTask, 'id' | 'user_id' | 'created_at'>>) => {
    if (!isSupabaseConfigured() || !supabase) {
        console.warn('Supabase is not configured. Simulating task update for development.');
        return true;
    }

    try {
        const { error } = await supabase
            .from('professional_tasks')
            .update(updates)
            .eq('id', taskId);

        if (error) {
            console.error('Error updating professional task:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Unexpected error updating professional task:', error);
        return false;
    }
};

export const rescheduleProfessionalTask = async (taskId: string, newDate: string) => {
    if (!isSupabaseConfigured() || !supabase) {
        console.warn('Supabase is not configured. Simulating task rescheduling for development.');
        return true;
    }

    try {
        const { error } = await supabase
            .from('professional_tasks')
            .update({ 
                scheduled_for: newDate,
                status: 'rescheduled',
                rescheduled_from: taskId
            })
            .eq('id', taskId);

        if (error) {
            console.error('Error rescheduling professional task:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Unexpected error rescheduling professional task:', error);
        return false;
    }
};

export const deleteProfessionalTask = async (taskId: string) => {
    if (!isSupabaseConfigured() || !supabase) {
        console.warn('Supabase is not configured. Simulating task deletion for development.');
        return true;
    }

    try {
        const { error } = await supabase
            .from('professional_tasks')
            .delete()
            .eq('id', taskId);

        if (error) {
            console.error('Error deleting professional task:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Unexpected error deleting professional task:', error);
        return false;
    }
};
