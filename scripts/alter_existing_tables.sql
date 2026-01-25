-- Update existing timetable_entries table to ensure it has all required columns
DO $$ 
BEGIN
    -- Add missing columns if they don't exist
    BEGIN
        ALTER TABLE timetable_entries ADD COLUMN IF NOT EXISTS description TEXT;
        ALTER TABLE timetable_entries ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        ALTER TABLE timetable_entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    EXCEPTION
        WHEN undefined_table THEN
            -- Table doesn't exist, will be created by the main script
            RAISE NOTICE 'timetable_entries table does not exist, will be created separately';
    END;
END $$;

-- Update existing professional_tasks table to ensure it has all required columns
DO $$
BEGIN
    -- Add missing columns if they don't exist
    BEGIN
        ALTER TABLE professional_tasks ADD COLUMN IF NOT EXISTS scheduled_for DATE DEFAULT NULL;
        ALTER TABLE professional_tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        ALTER TABLE professional_tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    EXCEPTION
        WHEN undefined_table THEN
            -- Table doesn't exist, will be created by the main script
            RAISE NOTICE 'professional_tasks table does not exist, will be created separately';
    END;
END $$;

-- Create/update the update timestamp triggers if they don't exist
DO $$
DECLARE
    trigger_exists BOOLEAN;
BEGIN
    -- Check if the trigger exists for timetable_entries
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_timetable_entries_updated_at'
    ) INTO trigger_exists;

    IF NOT trigger_exists THEN
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
    END IF;
END $$;

DO $$
DECLARE
    trigger_exists BOOLEAN;
BEGIN
    -- Check if the trigger exists for professional_tasks
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_professional_tasks_updated_at'
    ) INTO trigger_exists;

    IF NOT trigger_exists THEN
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
    END IF;
END $$;

-- Ensure RLS policies exist for all tables
DO $$
DECLARE
    policy_exists BOOLEAN;
BEGIN
    -- Check if RLS policy exists for timetable_entries
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'timetable_entries' 
        AND policyname = 'Users can view own calendar entries'
    ) INTO policy_exists;

    IF NOT policy_exists THEN
        -- Enable RLS if not already enabled
        ALTER TABLE timetable_entries ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Users can view own calendar entries" ON timetable_entries
            FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can insert own calendar entries" ON timetable_entries
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update own calendar entries" ON timetable_entries
            FOR UPDATE USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can delete own calendar entries" ON timetable_entries
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
DECLARE
    policy_exists BOOLEAN;
BEGIN
    -- Check if RLS policy exists for professional_tasks
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'professional_tasks' 
        AND policyname = 'Users can view own professional tasks'
    ) INTO policy_exists;

    IF NOT policy_exists THEN
        -- Enable RLS if not already enabled
        ALTER TABLE professional_tasks ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Users can view own professional tasks" ON professional_tasks
            FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can insert own professional tasks" ON professional_tasks
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update own professional tasks" ON professional_tasks
            FOR UPDATE USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can delete own professional tasks" ON professional_tasks
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;