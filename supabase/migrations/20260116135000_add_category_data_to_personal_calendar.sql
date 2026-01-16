-- Add category_data column to personal_calendar_entries
ALTER TABLE public.personal_calendar_entries 
ADD COLUMN IF NOT EXISTS category_data JSONB DEFAULT '{}'::jsonb;
