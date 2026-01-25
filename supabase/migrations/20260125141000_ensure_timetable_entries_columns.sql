-- Ensure timetable_entries table has all required columns for personal calendar functionality
DO $$
BEGIN
    -- Add missing columns if they don't exist
    ALTER TABLE timetable_entries ADD COLUMN IF NOT EXISTS category_data JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE timetable_entries ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Medium';
    ALTER TABLE timetable_entries ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
    ALTER TABLE timetable_entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
    
    -- Ensure created_at exists (should already exist from earlier migrations)
    ALTER TABLE timetable_entries ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
    
    RAISE NOTICE 'Ensured all required columns exist in timetable_entries table';
EXCEPTION
    WHEN duplicate_column THEN
        -- Columns already exist, continue
        NULL;
END $$;