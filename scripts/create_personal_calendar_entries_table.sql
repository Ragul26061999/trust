-- Create timetable_entries table for personal calendar entries
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_timetable_entries_user_id ON timetable_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_timetable_entries_entry_date ON timetable_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_timetable_entries_category ON timetable_entries(category);
CREATE INDEX IF NOT EXISTS idx_timetable_entries_created_at ON timetable_entries(created_at DESC);

-- Enable row level security
ALTER TABLE timetable_entries ENABLE ROW LEVEL SECURITY;

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

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_timetable_entries_updated_at 
    BEFORE UPDATE ON timetable_entries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();