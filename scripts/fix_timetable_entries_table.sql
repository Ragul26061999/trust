-- Ensure the timetable_entries table exists with the correct schema
-- If the table exists with a different name (personal_calendar_entries), rename it

-- First, check if the old table exists and rename it if needed
DO $$
BEGIN
    -- Check if personal_calendar_entries table exists and timetable_entries doesn't
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'personal_calendar_entries' 
        AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'timetable_entries' 
        AND table_schema = 'public'
    ) THEN
        -- Rename the table from personal_calendar_entries to timetable_entries
        ALTER TABLE personal_calendar_entries RENAME TO timetable_entries;
        RAISE NOTICE 'Renamed table from personal_calendar_entries to timetable_entries';
    END IF;
END $$;

-- Create the timetable_entries table if it doesn't exist
CREATE TABLE IF NOT EXISTS timetable_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    entry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    category TEXT DEFAULT 'event',
    category_data JSONB DEFAULT '{}',
    priority TEXT DEFAULT 'Medium',
    status TEXT DEFAULT 'pending',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add any missing columns if they don't exist
DO $$
BEGIN
    -- Add description column if it doesn't exist
    BEGIN
        ALTER TABLE timetable_entries ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION
        WHEN duplicate_column THEN
            -- Column already exists, continue
            NULL;
    END;

    -- Add created_at column if it doesn't exist
    BEGIN
        ALTER TABLE timetable_entries ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    EXCEPTION
        WHEN duplicate_column THEN
            -- Column already exists, continue
            NULL;
    END;

    -- Add updated_at column if it doesn't exist
    BEGIN
        ALTER TABLE timetable_entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    EXCEPTION
        WHEN duplicate_column THEN
            -- Column already exists, continue
            NULL;
    END;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_timetable_entries_user_id ON timetable_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_timetable_entries_entry_date ON timetable_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_timetable_entries_category ON timetable_entries(category);
CREATE INDEX IF NOT EXISTS idx_timetable_entries_created_at ON timetable_entries(created_at DESC);

-- Enable row level security if not already enabled
ALTER TABLE timetable_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
    -- Drop existing policies if they exist
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'timetable_entries' 
        AND policyname = 'Users can view own calendar entries'
    ) THEN
        DROP POLICY IF EXISTS "Users can view own calendar entries" ON timetable_entries;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'timetable_entries' 
        AND policyname = 'Users can insert own calendar entries'
    ) THEN
        DROP POLICY IF EXISTS "Users can insert own calendar entries" ON timetable_entries;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'timetable_entries' 
        AND policyname = 'Users can update own calendar entries'
    ) THEN
        DROP POLICY IF EXISTS "Users can update own calendar entries" ON timetable_entries;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'timetable_entries' 
        AND policyname = 'Users can delete own calendar entries'
    ) THEN
        DROP POLICY IF EXISTS "Users can delete own calendar entries" ON timetable_entries;
    END IF;
END $$;

-- Create policies to allow users to manage only their own entries
CREATE POLICY "Users can view own calendar entries" ON timetable_entries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar entries" ON timetable_entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar entries" ON timetable_entries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar entries" ON timetable_entries
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policy to restrict access based on authentication
CREATE POLICY "Allow authenticated users" ON timetable_entries
    AS PERMISSIVE FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create or replace the update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the trigger to automatically update the updated_at timestamp
CREATE TRIGGER update_timetable_entries_updated_at 
    BEFORE UPDATE ON timetable_entries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();