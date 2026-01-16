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
