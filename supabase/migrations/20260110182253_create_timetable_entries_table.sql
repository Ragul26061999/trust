-- Create the timetable_entries table
CREATE TABLE IF NOT EXISTS timetable_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    category VARCHAR(50) DEFAULT 'other',
    priority VARCHAR(20) DEFAULT 'medium',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for the timetable_entries table
ALTER TABLE timetable_entries ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow users to access their own entries
CREATE POLICY "Users can access own entries" ON timetable_entries
    FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_timetable_entries_user_id ON timetable_entries(user_id);
CREATE INDEX idx_timetable_entries_start_time ON timetable_entries(start_time);
