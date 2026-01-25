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

// Timezone Management Functions
export const getTimezonePreference = async (userId: string): Promise<string | null> => {
  if (!isSupabaseConfigured() || !isValidUUID(userId) || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('timezone')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST116' || error.code === '22P02') {
        return null;
      }
      console.error('Error fetching timezone preference:', error);
      return null;
    }

    return data?.timezone || 'UTC';
  } catch (error: any) {
    if (error?.code !== '22P02') {
      console.error('Unexpected error fetching timezone:', error?.message || error);
    }
    return null;
  }
};

export const setTimezonePreference = async (userId: string, timezone: string): Promise<boolean> => {
  if (!isSupabaseConfigured() || !isValidUUID(userId) || !supabase) {
    return false;
  }

  try {
    // Check if preferences record exists
    const { data: existingData, error: selectError } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', userId)
      .single();

    let result;
    if (existingData && !(selectError as any)?.message?.includes('does not exist')) {
      // Update existing preferences
      result = await supabase
        .from('user_preferences')
        .update({ timezone })
        .eq('user_id', userId);
    } else {
      // Insert new preferences
      result = await supabase
        .from('user_preferences')
        .insert([{ user_id: userId, timezone }]);
    }

    if (result.error) {
      if (result.error.code === '42P01' || result.error.code === '22P02') {
        return false;
      }
      console.error('Error saving timezone preference:', result.error);
      return false;
    }

    return true;
  } catch (error: any) {
    if (error?.code !== '22P02') {
      console.error('Unexpected error saving timezone:', error?.message || error);
    }
    return false;
  }
};

// Notification Settings Functions
export const getNotificationSettings = async (userId: string): Promise<any | null> => {
  if (!isSupabaseConfigured() || !isValidUUID(userId) || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('notification_settings')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST116' || error.code === '22P02') {
        return null;
      }
      console.error('Error fetching notification settings:', error);
      return null;
    }

    return data?.notification_settings || {
      email: true,
      push: true,
      daily_reminders: false,
      frequency: 'daily'
    };
  } catch (error: any) {
    if (error?.code !== '22P02') {
      console.error('Unexpected error fetching notification settings:', error?.message || error);
    }
    return null;
  }
};

export const updateNotificationSettings = async (userId: string, settings: any): Promise<boolean> => {
  if (!isSupabaseConfigured() || !isValidUUID(userId) || !supabase) {
    return false;
  }

  try {
    // Check if preferences record exists
    const { data: existingData, error: selectError } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', userId)
      .single();

    let result;
    if (existingData && !(selectError as any)?.message?.includes('does not exist')) {
      // Update existing preferences
      result = await supabase
        .from('user_preferences')
        .update({ notification_settings: settings })
        .eq('user_id', userId);
    } else {
      // Insert new preferences
      result = await supabase
        .from('user_preferences')
        .insert([{ user_id: userId, notification_settings: settings }]);
    }

    if (result.error) {
      if (result.error.code === '42P01' || result.error.code === '22P02') {
        return false;
      }
      console.error('Error saving notification settings:', result.error);
      return false;
    }

    return true;
  } catch (error: any) {
    if (error?.code !== '22P02') {
      console.error('Unexpected error saving notification settings:', error?.message || error);
    }
    return false;
  }
};

// Comprehensive settings getter
export const getAllUserSettings = async (userId: string): Promise<{
  timezone: string;
  notificationSettings: any;
  calendarIntegrations: any[];
} | null> => {
  if (!isSupabaseConfigured() || !isValidUUID(userId) || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('timezone, notification_settings, calendar_integrations')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST116' || error.code === '22P02') {
        return null;
      }
      console.error('Error fetching user settings:', error);
      return null;
    }

    return {
      timezone: data?.timezone || 'UTC',
      notificationSettings: data?.notification_settings || {
        email: true,
        push: true,
        daily_reminders: false,
        frequency: 'daily'
      },
      calendarIntegrations: data?.calendar_integrations || []
    };
  } catch (error: any) {
    if (error?.code !== '22P02') {
      console.error('Unexpected error fetching user settings:', error?.message || error);
    }
    return null;
  }
};

// Timezone utility functions
export const getTimezoneOptions = () => [
  { value: 'UTC', label: '(GMT+00:00) Coordinated Universal Time' },
  { value: 'America/New_York', label: '(GMT-05:00) Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: '(GMT-06:00) Central Time (US & Canada)' },
  { value: 'America/Denver', label: '(GMT-07:00) Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: '(GMT-08:00) Pacific Time (US & Canada)' },
  { value: 'America/Anchorage', label: '(GMT-09:00) Alaska Time' },
  { value: 'Pacific/Honolulu', label: '(GMT-10:00) Hawaii Time' },
  { value: 'Europe/London', label: '(GMT+00:00) London, Dublin, Lisbon' },
  { value: 'Europe/Paris', label: '(GMT+01:00) Paris, Berlin, Rome, Madrid' },
  { value: 'Asia/Tokyo', label: '(GMT+09:00) Tokyo, Osaka, Sapporo' },
  { value: 'Asia/Shanghai', label: '(GMT+08:00) Beijing, Shanghai, Hong Kong' },
  { value: 'Australia/Sydney', label: '(GMT+10:00) Sydney, Melbourne, Brisbane' }
];

export const detectUserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};