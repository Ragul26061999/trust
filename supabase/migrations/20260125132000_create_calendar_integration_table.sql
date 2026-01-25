-- Create calendar_integration table for tracking calendar sync connections
CREATE TABLE IF NOT EXISTS public.calendar_integration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('google', 'apple', 'outlook', 'custom')),
    provider_id TEXT, -- External calendar ID from provider
    display_name TEXT NOT NULL,
    email TEXT,
    access_token TEXT, -- Encrypted token storage
    refresh_token TEXT, -- Encrypted refresh token
    token_expires_at TIMESTAMPTZ,
    sync_enabled BOOLEAN DEFAULT true,
    sync_frequency TEXT DEFAULT 'hourly' CHECK (sync_frequency IN ('realtime', 'hourly', 'daily', 'manual')),
    last_sync_at TIMESTAMPTZ,
    next_sync_at TIMESTAMPTZ,
    sync_status TEXT DEFAULT 'disconnected' CHECK (sync_status IN ('connected', 'disconnected', 'syncing', 'error')),
    error_message TEXT,
    calendar_color TEXT DEFAULT '#3b82f6',
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, provider) -- One integration per provider per user
);

-- Enable RLS
ALTER TABLE public.calendar_integration ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$ 
BEGIN
    -- Users can view their own calendar integrations
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'calendar_integration' AND policyname = 'Users can view their own calendar integrations'
    ) THEN
        CREATE POLICY "Users can view their own calendar integrations"
            ON public.calendar_integration FOR SELECT
            USING (auth.uid() = user_id);
    END IF;

    -- Users can insert their own calendar integrations
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'calendar_integration' AND policyname = 'Users can insert their own calendar integrations'
    ) THEN
        CREATE POLICY "Users can insert their own calendar integrations"
            ON public.calendar_integration FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Users can update their own calendar integrations
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'calendar_integration' AND policyname = 'Users can update their own calendar integrations'
    ) THEN
        CREATE POLICY "Users can update their own calendar integrations"
            ON public.calendar_integration FOR UPDATE
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Users can delete their own calendar integrations
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'calendar_integration' AND policyname = 'Users can delete their own calendar integrations'
    ) THEN
        CREATE POLICY "Users can delete their own calendar integrations"
            ON public.calendar_integration FOR DELETE
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS calendar_integration_user_id_idx ON public.calendar_integration(user_id);
CREATE INDEX IF NOT EXISTS calendar_integration_provider_idx ON public.calendar_integration(provider);
CREATE INDEX IF NOT EXISTS calendar_integration_sync_status_idx ON public.calendar_integration(sync_status);
CREATE INDEX IF NOT EXISTS calendar_integration_next_sync_at_idx ON public.calendar_integration(next_sync_at);
CREATE INDEX IF NOT EXISTS calendar_integration_created_at_idx ON public.calendar_integration(created_at DESC);

-- Create the trigger to automatically update the updated_at timestamp if it doesn't exist
DO $$
BEGIN
    DROP TRIGGER IF EXISTS update_calendar_integration_updated_at ON public.calendar_integration;
    CREATE TRIGGER update_calendar_integration_updated_at 
        BEFORE UPDATE ON public.calendar_integration 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN
        -- Trigger already exists, continue
        NULL;
END $$;

-- Create function to update next_sync_at based on sync_frequency
CREATE OR REPLACE FUNCTION update_next_sync_time()
RETURNS TRIGGER AS $$
BEGIN
    CASE NEW.sync_frequency
        WHEN 'realtime' THEN
            NEW.next_sync_at = NOW();
        WHEN 'hourly' THEN
            NEW.next_sync_at = NOW() + INTERVAL '1 hour';
        WHEN 'daily' THEN
            NEW.next_sync_at = NOW() + INTERVAL '1 day';
        WHEN 'manual' THEN
            NEW.next_sync_at = NULL;
        ELSE
            NEW.next_sync_at = NOW() + INTERVAL '1 hour';
    END CASE;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the trigger to automatically set next_sync_at if it doesn't exist
DO $$
BEGIN
    DROP TRIGGER IF EXISTS set_next_sync_time_trigger ON public.calendar_integration;
    CREATE TRIGGER set_next_sync_time_trigger
        BEFORE INSERT OR UPDATE OF sync_frequency ON public.calendar_integration
        FOR EACH ROW
        EXECUTE FUNCTION update_next_sync_time();
EXCEPTION
    WHEN duplicate_object THEN
        -- Trigger already exists, continue
        NULL;
END $$;