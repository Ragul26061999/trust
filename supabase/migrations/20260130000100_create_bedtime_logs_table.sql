-- Create bedtime_logs table
CREATE TABLE IF NOT EXISTS public.bedtime_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sleep_time_utc TIMESTAMPTZ NOT NULL,
    wake_time_utc TIMESTAMPTZ NOT NULL,
    duration_ms BIGINT NOT NULL,
    date_label TEXT NOT NULL,
    timezone TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE bedtime_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own bedtime logs" ON bedtime_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bedtime logs" ON bedtime_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bedtime logs" ON bedtime_logs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bedtime logs" ON bedtime_logs
    FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_bedtime_logs_user_id ON bedtime_logs(user_id);
CREATE INDEX idx_bedtime_logs_date_label ON bedtime_logs(date_label);
CREATE INDEX idx_bedtime_logs_created_at ON bedtime_logs(created_at DESC);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_bedtime_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bedtime_logs_updated_at
    BEFORE UPDATE ON bedtime_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_bedtime_updated_at();