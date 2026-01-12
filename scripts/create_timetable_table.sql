-- Create timetable_entries table for Time OS functionality
CREATE TABLE IF NOT EXISTS timetable_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    category VARCHAR(50) CHECK (category IN ('work', 'personal', 'study', 'meeting', 'other')) DEFAULT 'other',
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE timetable_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own timetable entries" ON timetable_entries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own timetable entries" ON timetable_entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own timetable entries" ON timetable_entries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own timetable entries" ON timetable_entries
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_timetable_entries_user_id ON timetable_entries(user_id);
CREATE INDEX idx_timetable_entries_start_time ON timetable_entries(start_time);
CREATE INDEX idx_timetable_entries_category ON timetable_entries(category);
CREATE INDEX idx_timetable_entries_priority ON timetable_entries(priority);

-- Create a function to update the 'updated_at' column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to update the 'updated_at' column
CREATE TRIGGER update_timetable_entries_updated_at 
    BEFORE UPDATE ON timetable_entries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();