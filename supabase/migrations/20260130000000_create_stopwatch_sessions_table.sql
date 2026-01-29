-- Create stopwatch_sessions table
CREATE TABLE IF NOT EXISTS public.stopwatch_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    heading TEXT NOT NULL,
    purpose TEXT,
    start_time_utc TIMESTAMPTZ NOT NULL,
    end_time_utc TIMESTAMPTZ NOT NULL,
    duration_ms BIGINT NOT NULL,
    timezone TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE stopwatch_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own stopwatch sessions" ON stopwatch_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stopwatch sessions" ON stopwatch_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stopwatch sessions" ON stopwatch_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stopwatch sessions" ON stopwatch_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_stopwatch_sessions_user_id ON stopwatch_sessions(user_id);
CREATE INDEX idx_stopwatch_sessions_created_at ON stopwatch_sessions(created_at DESC);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_stopwatch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stopwatch_sessions_updated_at
    BEFORE UPDATE ON stopwatch_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_stopwatch_updated_at();