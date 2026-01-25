-- Create professional_tasks table for professional task management
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
    scheduled_for DATE DEFAULT NULL,  -- For rescheduled tasks
    priority TEXT DEFAULT 'Medium',
    status TEXT DEFAULT 'pending', -- pending, completed, rescheduled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_professional_tasks_user_id ON professional_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_professional_tasks_task_date ON professional_tasks(task_date);
CREATE INDEX IF NOT EXISTS idx_professional_tasks_status ON professional_tasks(status);
CREATE INDEX IF NOT EXISTS idx_professional_tasks_priority ON professional_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_professional_tasks_created_at ON professional_tasks(created_at DESC);

-- Enable row level security
ALTER TABLE professional_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies to allow users to manage only their own tasks
CREATE POLICY "Users can view own professional tasks" ON professional_tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own professional tasks" ON professional_tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own professional tasks" ON professional_tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own professional tasks" ON professional_tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policy to restrict access based on authentication
CREATE POLICY "Allow authenticated users" ON professional_tasks
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

CREATE TRIGGER update_professional_tasks_updated_at 
    BEFORE UPDATE ON professional_tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();