/**
 * Service for interacting with the Google Calendar API
 */

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
}

/**
 * Fetches events from the user's primary Google Calendar
 * @param accessToken The Google OAuth access token
 * @param timeMin The start time to fetch events from (ISO string)
 * @param timeMax The end time to fetch events until (ISO string)
 */
export const fetchGoogleCalendarEvents = async (
  accessToken: string,
  timeMin?: string,
  timeMax?: string
): Promise<GoogleCalendarEvent[]> => {
  try {
    const params = new URLSearchParams({
      maxResults: '250',
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    if (timeMin) params.append('timeMin', timeMin);
    if (timeMax) params.append('timeMax', timeMax);

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Calendar API Error:', errorData);
      
      if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
      }
      
      throw new Error(errorData.error?.message || 'Failed to fetch Google Calendar events');
    }

    const data = await response.json();
    return data.items || [];
  } catch (error: any) {
    console.error('Error fetching Google Calendar events:', error);
    throw error;
  }
};

/**
 * Refresh the Google access token using a refresh token
 * Note: This usually requires a server-side route for security, but for a client-side demo
 * we'll document it here. In a real production app, this should be handled via a proxy.
 */
export const refreshGoogleToken = async (refreshToken: string): Promise<{ access_token: string; expires_in: number }> => {
  // In a real implementation with Supabase, we would call a Supabase Edge Function
  // or a server-side route that has the GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
  // since these should not be expose on the client.
  
  throw new Error('Refresh token handling requires server-side implementation');
};
