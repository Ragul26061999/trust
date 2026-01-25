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

// Calendar provider types
export type CalendarProvider = 'google' | 'apple' | 'outlook' | 'custom';
export type SyncFrequency = 'realtime' | 'hourly' | 'daily' | 'manual';
export type SyncStatus = 'connected' | 'disconnected' | 'syncing' | 'error';

// Calendar integration interface
export interface CalendarIntegration {
  id: string;
  user_id: string;
  provider: CalendarProvider;
  provider_id?: string;
  display_name: string;
  email?: string;
  sync_enabled: boolean;
  sync_frequency: SyncFrequency;
  last_sync_at?: string;
  next_sync_at?: string;
  sync_status: SyncStatus;
  error_message?: string;
  calendar_color: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

// Get all calendar integrations for a user
export const getUserCalendarIntegrations = async (userId: string): Promise<CalendarIntegration[] | null> => {
  if (!isSupabaseConfigured() || !isValidUUID(userId) || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('calendar_integration')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === '42P01' || error.code === '22P02') {
        return null;
      }
      console.error('Error fetching calendar integrations:', error);
      return null;
    }

    return data || [];
  } catch (error: any) {
    if (error?.code !== '22P02') {
      console.error('Unexpected error fetching calendar integrations:', error?.message || error);
    }
    return null;
  }
};

// Get specific calendar integration
export const getCalendarIntegration = async (integrationId: string, userId: string): Promise<CalendarIntegration | null> => {
  if (!isSupabaseConfigured() || !isValidUUID(userId) || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('calendar_integration')
      .select('*')
      .eq('id', integrationId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      if (error.code === '42P01' || error.code === '22P02' || error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching calendar integration:', error);
      return null;
    }

    return data;
  } catch (error: any) {
    if (error?.code !== '22P02') {
      console.error('Unexpected error fetching calendar integration:', error?.message || error);
    }
    return null;
  }
};

// Create new calendar integration
export const createCalendarIntegration = async (
  userId: string,
  provider: CalendarProvider,
  displayName: string,
  email?: string,
  calendarColor: string = '#3b82f6'
): Promise<{ success: boolean; integration?: CalendarIntegration; error?: string }> => {
  if (!isSupabaseConfigured() || !isValidUUID(userId) || !supabase) {
    return { success: false, error: 'Database not configured' };
  }

  // Validation
  if (!displayName.trim()) {
    return { success: false, error: 'Display name is required' };
  }

  try {
    const { data, error } = await supabase
      .from('calendar_integration')
      .insert([
        {
          user_id: userId,
          provider,
          display_name: displayName.trim(),
          email: email?.trim() || null,
          calendar_color: calendarColor,
          sync_status: 'disconnected'
        }
      ])
      .select('*')
      .single();

    if (error) {
      if (error.code === '42P01' || error.code === '22P02') {
        return { success: false, error: 'Calendar integration system not available' };
      }
      // Check for duplicate provider constraint
      if (error.code === '23505') {
        return { success: false, error: `Already connected to ${provider} calendar` };
      }
      console.error('Error creating calendar integration:', error);
      return { success: false, error: 'Failed to create calendar integration' };
    }

    return { success: true, integration: data };
  } catch (error: any) {
    if (error?.code !== '22P02') {
      console.error('Unexpected error creating calendar integration:', error?.message || error);
    }
    return { success: false, error: 'Failed to create calendar integration' };
  }
};

// Update calendar integration
export const updateCalendarIntegration = async (
  integrationId: string,
  userId: string,
  updates: Partial<Omit<CalendarIntegration, 'id' | 'user_id' | 'provider' | 'created_at' | 'updated_at'>>
): Promise<boolean> => {
  if (!isSupabaseConfigured() || !isValidUUID(userId) || !supabase) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('calendar_integration')
      .update(updates)
      .eq('id', integrationId)
      .eq('user_id', userId);

    if (error) {
      if (error.code === '42P01' || error.code === '22P02') {
        return false;
      }
      console.error('Error updating calendar integration:', error);
      return false;
    }

    return true;
  } catch (error: any) {
    if (error?.code !== '22P02') {
      console.error('Unexpected error updating calendar integration:', error?.message || error);
    }
    return false;
  }
};

// Delete calendar integration
export const deleteCalendarIntegration = async (integrationId: string, userId: string): Promise<boolean> => {
  if (!isSupabaseConfigured() || !isValidUUID(userId) || !supabase) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('calendar_integration')
      .delete()
      .eq('id', integrationId)
      .eq('user_id', userId);

    if (error) {
      if (error.code === '42P01' || error.code === '22P02') {
        return false;
      }
      console.error('Error deleting calendar integration:', error);
      return false;
    }

    return true;
  } catch (error: any) {
    if (error?.code !== '22P02') {
      console.error('Unexpected error deleting calendar integration:', error?.message || error);
    }
    return false;
  }
};

// Toggle sync status
export const toggleCalendarSync = async (integrationId: string, userId: string): Promise<boolean> => {
  if (!isSupabaseConfigured() || !isValidUUID(userId) || !supabase) {
    return false;
  }

  try {
    // First get current sync status
    const { data: integration, error: fetchError } = await supabase
      .from('calendar_integration')
      .select('sync_enabled')
      .eq('id', integrationId)
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError || !integration) {
      return false;
    }

    // Toggle the sync status
    const newSyncEnabled = !integration.sync_enabled;
    
    const { error } = await supabase
      .from('calendar_integration')
      .update({ 
        sync_enabled: newSyncEnabled,
        sync_status: newSyncEnabled ? 'connected' : 'disconnected'
      })
      .eq('id', integrationId)
      .eq('user_id', userId);

    if (error) {
      if (error.code === '42P01' || error.code === '22P02') {
        return false;
      }
      console.error('Error toggling calendar sync:', error);
      return false;
    }

    return true;
  } catch (error: any) {
    if (error?.code !== '22P02') {
      console.error('Unexpected error toggling calendar sync:', error?.message || error);
    }
    return false;
  }
};

// Update sync frequency
export const updateSyncFrequency = async (
  integrationId: string, 
  userId: string, 
  frequency: SyncFrequency
): Promise<boolean> => {
  return updateCalendarIntegration(integrationId, userId, { sync_frequency: frequency });
};

// Simulate calendar sync (placeholder for actual sync logic)
export const syncCalendarIntegration = async (integrationId: string, userId: string): Promise<boolean> => {
  if (!isSupabaseConfigured() || !isValidUUID(userId) || !supabase) {
    return false;
  }

  try {
    // Update sync status to syncing
    await supabase
      .from('calendar_integration')
      .update({ 
        sync_status: 'syncing',
        last_sync_at: new Date().toISOString()
      })
      .eq('id', integrationId)
      .eq('user_id', userId);

    // Simulate sync process (in real implementation, this would call external APIs)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update with success status
    const { error } = await supabase
      .from('calendar_integration')
      .update({ 
        sync_status: 'connected',
        error_message: null
      })
      .eq('id', integrationId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating sync status:', error);
      return false;
    }

    return true;
  } catch (error: any) {
    // Update with error status
    await supabase
      .from('calendar_integration')
      .update({ 
        sync_status: 'error',
        error_message: error?.message || 'Sync failed'
      })
      .eq('id', integrationId)
      .eq('user_id', userId);
    
    if (error?.code !== '22P02') {
      console.error('Unexpected error during calendar sync:', error?.message || error);
    }
    return false;
  }
};

// Calendar provider information
export const CALENDAR_PROVIDERS = [
  {
    id: 'google' as CalendarProvider,
    name: 'Google Calendar',
    icon: 'G',
    color: '#4285F4',
    description: 'Sync with your Google Calendar account'
  },
  {
    id: 'apple' as CalendarProvider,
    name: 'Apple Calendar',
    icon: '🍎',
    color: '#A2AAAD',
    description: 'Connect with Apple Calendar (iCloud)'
  },
  {
    id: 'outlook' as CalendarProvider,
    name: 'Outlook Calendar',
    icon: 'O',
    color: '#0078D4',
    description: 'Sync with Microsoft Outlook Calendar'
  }
];

// Sync frequency options
export const SYNC_FREQUENCIES = [
  { value: 'realtime' as SyncFrequency, label: 'Real-time', description: 'Sync immediately when changes occur' },
  { value: 'hourly' as SyncFrequency, label: 'Hourly', description: 'Sync once every hour' },
  { value: 'daily' as SyncFrequency, label: 'Daily', description: 'Sync once per day' },
  { value: 'manual' as SyncFrequency, label: 'Manual', description: 'Sync only when triggered manually' }
];