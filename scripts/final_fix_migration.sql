/*
Final migration to ensure all tables are properly named and structured
*/

-- Fix the timetable_entries table (was previously named personal_calendar_entries)
-- This statement will handle renaming if needed and ensure proper structure

-- First, ensure the correct table exists with all required columns
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

-- Ensure all required columns exist (in case they were missing)
DO $$
BEGIN
    ALTER TABLE timetable_entries ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE timetable_entries ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    ALTER TABLE timetable_entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
EXCEPTION
    WHEN duplicate_column THEN
        -- Column already exists, continue
        NULL;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_timetable_entries_user_id ON timetable_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_timetable_entries_entry_date ON timetable_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_timetable_entries_category ON timetable_entries(category);
CREATE INDEX IF NOT EXISTS idx_timetable_entries_created_at ON timetable_entries(created_at DESC);

-- Enable row level security
ALTER TABLE timetable_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid duplicates
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own calendar entries" ON timetable_entries;
    DROP POLICY IF EXISTS "Users can insert own calendar entries" ON timetable_entries;
    DROP POLICY IF EXISTS "Users can update own calendar entries" ON timetable_entries;
    DROP POLICY IF EXISTS "Users can delete own calendar entries" ON timetable_entries;
    DROP POLICY IF EXISTS "Allow authenticated users" ON timetable_entries;
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