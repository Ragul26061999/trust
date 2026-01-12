import { supabase } from './supabase';

// Function to check if Supabase is properly configured
const isSupabaseConfigured = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
};

// Helper to check if a string is a valid UUID
const isValidUUID = (id: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

// Function to get user preferences from the database
export const getUserPreferencesFromDB = async (userId: string) => {
  // Check if Supabase is properly configured
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, using local storage only');
    return null;
  }

  // Return null early if userId is not a valid UUID (e.g., demo users)
  if (!isValidUUID(userId)) {
    return null;
  }

  if (!supabase) {
    console.error('Supabase client not available');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('preferences')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      // Handle known non-critical cases:
      // 42P01: undefined_table (table doesn't exist yet)
      // PGRST116: maybeSingle() found no rows
      // 22P02: invalid_text_representation (happens with demo-user-id strings)
      if (
        error.code === '42P01' ||
        error.code === 'PGRST116' ||
        error.code === '22P02' ||
        error.message?.includes('does not exist')
      ) {
        return null;
      }

      // Log only real, unexpected errors with descriptive information
      console.error('Error fetching user preferences:', {
        message: error.message,
        code: error.code,
        details: error.details
      });
      return null;
    }

    // maybeSingle() returns { preferences: ... } or null if no record exists
    return data ? data.preferences : null;
  } catch (error: any) {
    // Only log error if it's not a known case
    if (error && error.code !== '22P02') {
      console.error('Unexpected error fetching user preferences:', error?.message || error);
    }
    return null;
  }
};
// Function to save user preferences to the database
export const saveUserPreferencesToDB = async (userId: string, preferences: any) => {
  // Check if Supabase is properly configured
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, using local storage only');
    return true; // Return true to allow local storage to still work
  }

  // Return true early if userId is not a valid UUID (e.g., demo users)
  if (!isValidUUID(userId)) {
    return true;
  }

  if (!supabase) {
    console.error('Supabase client not available');
    return false;
  }

  try {
    // Check if preferences record exists
    const { data: existingData, error: selectError } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (selectError && selectError.code !== 'PGRST116' && !(selectError as any).message?.includes('does not exist')) {
      // Only log error if it's a real error (not an empty object)
      if (selectError && Object.keys(selectError).length > 0) {
        console.error('Error checking user preferences:', selectError);
      }
      return false;
    }

    let result;
    if (existingData && !(selectError as any)?.message?.includes('does not exist')) {
      // Update existing preferences
      result = await supabase
        .from('user_preferences')
        .update({ preferences })
        .eq('user_id', userId);
    } else {
      // Insert new preferences
      result = await supabase
        .from('user_preferences')
        .insert([{ user_id: userId, preferences }]);
    }

    if (result.error) {
      // Handle table not existing error or invalid UUIDs (demo users)
      if (
        result.error.code === '42P01' ||
        result.error.code === '22P02' ||
        result.error.message?.includes('does not exist')
      ) {
        if (result.error.code === '42P01') {
          console.warn('user_preferences table does not exist, skipping save to DB');
        }
        return true; // Return true to allow local storage to still work
      }

      console.error('Error saving user preferences:', {
        message: result.error.message,
        code: result.error.code,
        details: result.error.details
      });
      return false;
    }

    return true;
  } catch (error: any) {
    // Only log if not a known case
    if (error && error.code !== '22P02') {
      console.error('Unexpected error saving user preferences:', error?.message || error);
    }
    return false;
  }
};