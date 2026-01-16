-- Create custom_calendars table
CREATE TABLE IF NOT EXISTS public.custom_calendars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6366f1',
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_calendars ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'custom_calendars' AND policyname = 'Users can view their own calendars'
    ) THEN
        CREATE POLICY "Users can view their own calendars"
            ON public.custom_calendars FOR SELECT
            USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'custom_calendars' AND policyname = 'Users can insert their own calendars'
    ) THEN
        CREATE POLICY "Users can insert their own calendars"
            ON public.custom_calendars FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'custom_calendars' AND policyname = 'Users can update their own calendars'
    ) THEN
        CREATE POLICY "Users can update their own calendars"
            ON public.custom_calendars FOR UPDATE
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'custom_calendars' AND policyname = 'Users can delete their own calendars'
    ) THEN
        CREATE POLICY "Users can delete their own calendars"
            ON public.custom_calendars FOR DELETE
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS custom_calendars_user_id_idx ON public.custom_calendars(user_id);