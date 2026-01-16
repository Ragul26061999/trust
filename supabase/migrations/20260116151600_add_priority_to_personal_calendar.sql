-- Add priority column to personal_calendar_entries
ALTER TABLE public.personal_calendar_entries 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Medium';
