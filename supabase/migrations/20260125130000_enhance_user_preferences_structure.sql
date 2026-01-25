-- Enhance user_preferences table structure for settings management
-- This migration adds structured settings columns while maintaining backward compatibility

-- Add structured settings columns to user_preferences table
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{"email": true, "push": true, "daily_reminders": false, "frequency": "daily"}'::jsonb,
ADD COLUMN IF NOT EXISTS calendar_integrations JSONB DEFAULT '[]'::jsonb;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS user_preferences_timezone_idx ON public.user_preferences(timezone);
CREATE INDEX IF NOT EXISTS user_preferences_notification_settings_idx ON public.user_preferences USING GIN (notification_settings);

-- Update existing records to have default values
UPDATE public.user_preferences 
SET timezone = 'UTC',
    notification_settings = '{"email": true, "push": true, "daily_reminders": false, "frequency": "daily"}'::jsonb,
    calendar_integrations = '[]'::jsonb
WHERE timezone IS NULL;

-- Ensure the preferences column still works for backward compatibility
-- The new structured columns take precedence over the preferences JSON field

-- Refresh policies to ensure they still work with new columns
-- The existing policies should continue to work since we're only adding columns