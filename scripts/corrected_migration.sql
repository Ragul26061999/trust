/*
Corrected migration to handle the timetable_entries table structure properly
*/

-- First, check the current structure of the timetable_entries table
-- The existing table uses start_time/end_time, but we need entry_date for personal calendar entries

-- Add the entry_date column if it doesn't exist (this is what personal calendar uses)
DO $$
BEGIN
    -- Check if entry_date column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'timetable_entries' 
        AND column_name = 'entry_date'
    ) THEN
        -- Add the entry_date column
        ALTER TABLE timetable_entries ADD COLUMN entry_date TIMESTAMP WITH TIME ZONE;
        
        -- Populate entry_date from start_time if start_time exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'timetable_entries' 
            AND column_name = 'start_time'
        ) THEN
            UPDATE timetable_entries SET entry_date = start_time;
        ELSE
            -- If no start_time, set to current timestamp
            UPDATE timetable_entries SET entry_date = NOW();
        END IF;
    END IF;
END $$;

-- Add other required columns for personal calendar entries if they don't exist
DO $$
BEGIN
    -- Add category_data column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'timetable_entries' 
        AND column_name = 'category_data'
    ) THEN
        ALTER TABLE timetable_entries ADD COLUMN category_data JSONB DEFAULT '{}';
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'timetable_entries' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE timetable_entries ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_timetable_entries_user_id ON timetable_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_timetable_entries_entry_date ON timetable_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_timetable_entries_category ON timetable_entries(category);

-- Enable row level security if not already enabled
ALTER TABLE timetable_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own calendar entries" ON timetable_entries;
    DROP POLICY IF EXISTS "Users can insert own calendar entries" ON timetable_entries;
    DROP POLICY IF EXISTS "Users can update own calendar entries" ON timetable_entries;
    DROP POLICY IF EXISTS "Users can delete own calendar entries" ON timetable_entries;
    DROP POLICY IF EXISTS "Users can access own entries" ON timetable_entries;
EXCEPTION
    WHEN undefined_table THEN
        -- Table doesn't exist yet, will be handled when created
        NULL;
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

-- Create or replace the update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the trigger to automatically update the updated_at timestamp
DROP TRIGGER IF EXISTS update_timetable_entries_updated_at ON timetable_entries;
CREATE TRIGGER update_timetable_entries_updated_at 
    BEFORE UPDATE ON timetable_entries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

/*
Ensure professional_tasks table is properly set up
*/
-- Create professional_tasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS professional_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    department TEXT DEFAULT 'General',
    role TEXT DEFAULT 'General',
    responsibilities TEXT,
    experience TEXT,
    task_date DATE NOT NULL,
    scheduled_for DATE DEFAULT NULL,
    priority TEXT DEFAULT 'Medium',
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure all required columns exist
DO $$
BEGIN
    ALTER TABLE professional_tasks ADD COLUMN IF NOT EXISTS scheduled_for DATE DEFAULT NULL;
    ALTER TABLE professional_tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    ALTER TABLE professional_tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
EXCEPTION
    WHEN duplicate_column THEN
        -- Column already exists, continue
        NULL;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_professional_tasks_user_id ON professional_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_professional_tasks_task_date ON professional_tasks(task_date);
CREATE INDEX IF NOT EXISTS idx_professional_tasks_status ON professional_tasks(status);
CREATE INDEX IF NOT EXISTS idx_professional_tasks_priority ON professional_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_professional_tasks_created_at ON professional_tasks(created_at DESC);

-- Enable row level security
ALTER TABLE professional_tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid duplicates
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own professional tasks" ON professional_tasks;
    DROP POLICY IF EXISTS "Users can insert own professional tasks" ON professional_tasks;
    DROP POLICY IF EXISTS "Users can update own professional tasks" ON professional_tasks;
    DROP POLICY IF EXISTS "Users can delete own professional tasks" ON professional_tasks;
EXCEPTION
    WHEN undefined_table THEN
        -- Table doesn't exist yet, will be handled when created
        NULL;
END $$;

-- Create policies to allow users to manage only their own tasks
CREATE POLICY "Users can view own professional tasks" ON professional_tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own professional tasks" ON professional_tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own professional tasks" ON professional_tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own professional tasks" ON professional_tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Create the trigger to automatically update the updated_at timestamp for professional_tasks
DROP TRIGGER IF EXISTS update_professional_tasks_updated_at ON professional_tasks;
CREATE TRIGGER update_professional_tasks_updated_at 
    BEFORE UPDATE ON professional_tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

/*
Create notes table if it doesn't exist
*/
CREATE TABLE IF NOT EXISTS notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);

-- Enable row level security
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid duplicates
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own notes" ON notes;
    DROP POLICY IF EXISTS "Users can insert own notes" ON notes;
    DROP POLICY IF EXISTS "Users can update own notes" ON notes;
    DROP POLICY IF EXISTS "Users can delete own notes" ON notes;
EXCEPTION
    WHEN undefined_table THEN
        -- Table doesn't exist yet, will be handled when created
        NULL;
END $$;

-- Create policies to allow users to manage only their own notes
CREATE POLICY "Users can view own notes" ON notes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes" ON notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON notes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON notes
    FOR DELETE USING (auth.uid() = user_id);

-- Create the trigger to automatically update the updated_at timestamp for notes
DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
CREATE TRIGGER update_notes_updated_at 
    BEFORE UPDATE ON notes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();