-- Migration to add Time Engine features

-- 1. Add onboarding flag and default sleep times to user_preferences
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS is_onboarded_routines BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS default_sleep_start TIME,
ADD COLUMN IF NOT EXISTS default_sleep_end TIME;

-- 2. Create user_breaks table
CREATE TABLE IF NOT EXISTS user_breaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for user_breaks
ALTER TABLE user_breaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own breaks"
    ON user_breaks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own breaks"
    ON user_breaks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own breaks"
    ON user_breaks FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own breaks"
    ON user_breaks FOR DELETE
    USING (auth.uid() = user_id);

-- 3. Create daily_sleep_adjustments table
CREATE TABLE IF NOT EXISTS daily_sleep_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    adjusted_sleep_start TIME NOT NULL,
    adjusted_sleep_end TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, date)
);

-- RLS for daily_sleep_adjustments
ALTER TABLE daily_sleep_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sleep adjustments"
    ON daily_sleep_adjustments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sleep adjustments"
    ON daily_sleep_adjustments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sleep adjustments"
    ON daily_sleep_adjustments FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sleep adjustments"
    ON daily_sleep_adjustments FOR DELETE
    USING (auth.uid() = user_id);

-- 4. Update personal_calendar table with reschedule_count
-- Assuming table is named 'personal_calendar' or 'timetable_entries'. 
-- Let's add it safely to timetable_entries based on previous context.
ALTER TABLE timetable_entries 
ADD COLUMN IF NOT EXISTS reschedule_count INTEGER DEFAULT 0;
