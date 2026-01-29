-- Create alarms table
CREATE TABLE IF NOT EXISTS public.alarms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('Personal Task', 'Professional Task', 'Note', 'Custom')),
    source_id UUID, -- ID of the source entity (task/note ID)
    trigger_time_utc TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Snoozed', 'Completed', 'Disabled')),
    timezone TEXT NOT NULL,
    repeat_pattern JSONB, -- For recurring alarms: {"frequency": "daily/weekly", "interval": 1, "days": [1,3,5]}
    snooze_duration_minutes INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE alarms ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own alarms" ON alarms
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alarms" ON alarms
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alarms" ON alarms
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alarms" ON alarms
    FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_alarms_user_id ON alarms(user_id);
CREATE INDEX idx_alarms_trigger_time ON alarms(trigger_time_utc);
CREATE INDEX idx_alarms_status ON alarms(status);
CREATE INDEX idx_alarms_source ON alarms(source_type, source_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_alarms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_alarms_updated_at
    BEFORE UPDATE ON alarms
    FOR EACH ROW
    EXECUTE FUNCTION update_alarms_updated_at();