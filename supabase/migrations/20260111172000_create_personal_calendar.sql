-- Create personal_calendar_entries table
CREATE TABLE IF NOT EXISTS public.personal_calendar_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    entry_date TIMESTAMPTZ NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.personal_calendar_entries ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'personal_calendar_entries' AND policyname = 'Users can view their own entries'
    ) THEN
        CREATE POLICY "Users can view their own entries"
            ON public.personal_calendar_entries FOR SELECT
            USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'personal_calendar_entries' AND policyname = 'Users can insert their own entries'
    ) THEN
        CREATE POLICY "Users can insert their own entries"
            ON public.personal_calendar_entries FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'personal_calendar_entries' AND policyname = 'Users can update their own entries'
    ) THEN
        CREATE POLICY "Users can update their own entries"
            ON public.personal_calendar_entries FOR UPDATE
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'personal_calendar_entries' AND policyname = 'Users can delete their own entries'
    ) THEN
        CREATE POLICY "Users can delete their own entries"
            ON public.personal_calendar_entries FOR DELETE
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS personal_calendar_entries_user_id_idx ON public.personal_calendar_entries(user_id);
CREATE INDEX IF NOT EXISTS personal_calendar_entries_entry_date_idx ON public.personal_calendar_entries(entry_date);
