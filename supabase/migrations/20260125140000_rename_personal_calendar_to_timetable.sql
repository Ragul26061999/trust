-- Rename personal_calendar_entries to timetable_entries for consistency
DO $$
BEGIN
    -- Check if personal_calendar_entries exists and timetable_entries doesn't
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'personal_calendar_entries' 
        AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'timetable_entries' 
        AND table_schema = 'public'
    ) THEN
        -- Rename the table
        ALTER TABLE public.personal_calendar_entries RENAME TO timetable_entries;
        RAISE NOTICE 'Renamed table from personal_calendar_entries to timetable_entries';
        
        -- Rename the indexes
        ALTER INDEX IF EXISTS personal_calendar_entries_user_id_idx RENAME TO idx_timetable_entries_user_id;
        ALTER INDEX IF EXISTS personal_calendar_entries_entry_date_idx RENAME TO idx_timetable_entries_entry_date;
    END IF;
END $$;