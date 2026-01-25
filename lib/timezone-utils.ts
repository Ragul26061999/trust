import { format as formatDate, parseISO } from 'date-fns';
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';

// Function to format a date in a specific timezone
export const formatInUserTimezone = (date: Date | string, formatString: string, userTimezone: string = 'UTC'): string => {
  try {
    // Convert to Date object if it's a string
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    // Format the date in the user's timezone
    return formatInTimeZone(dateObj, userTimezone, formatString);
  } catch (error) {
    console.error('Error formatting date in timezone:', error);
    // Fallback to original date-fns format if timezone fails
    return formatDate(typeof date === 'string' ? parseISO(date) : date, formatString);
  }
};

// Function to convert a date from user's timezone to UTC
export const convertToUTC = (date: Date, userTimezone: string = 'UTC'): Date => {
  try {
    return fromZonedTime(date, userTimezone);
  } catch (error) {
    console.error('Error converting date to UTC:', error);
    return date;
  }
};

// Function to convert a UTC date to user's timezone
export const convertFromUTC = (date: Date, userTimezone: string = 'UTC'): Date => {
  try {
    return toZonedTime(date, userTimezone);
  } catch (error) {
    console.error('Error converting date from UTC:', error);
    return date;
  }
};

// Function to get the user's current timezone
export const getCurrentUserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

// Function to get a list of common timezones
export const getCommonTimezones = () => [
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