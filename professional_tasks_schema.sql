-- ==============================================================================
-- 🚀 Professional Tasks Table Schema (Full Creation Script + AI Automation Features)
-- ==============================================================================
-- Run this in your Supabase SQL Editor to create or update the professional_tasks table.

-- 1. Create the professional_tasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.professional_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    department TEXT,
    role TEXT,
    responsibilities TEXT,
    experience TEXT,
    task_date DATE NOT NULL,
    scheduled_for DATE,
    priority TEXT DEFAULT 'Medium',
    status TEXT DEFAULT 'pending',
    completion_feedback TEXT,
    duration_minutes INTEGER,
    rescheduled_from UUID,
    
    -- Notifications
    before_popup_minutes INTEGER DEFAULT 0,
    after_popup_minutes INTEGER DEFAULT 0,
    
    -- Multimedia & Notes Conversion
    drawing_data JSONB,
    drawing_thumbnail TEXT,
    audio_recording_url TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    is_drawing BOOLEAN DEFAULT false,
    is_recording BOOLEAN DEFAULT false,
    original_note_id UUID,
    conversion_date TIMESTAMP WITH TIME ZONE,
    multimedia_content JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 2. Add AI Automation & Efficiency Tracking Columns (Phase 1 & 2 Planning)
-- ==============================================================================
DO $$ 
BEGIN
    -- Expected vs Actual Duration
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'professional_tasks' AND column_name = 'expected_duration_minutes') THEN
        ALTER TABLE public.professional_tasks ADD COLUMN expected_duration_minutes INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'professional_tasks' AND column_name = 'actual_duration_minutes') THEN
        ALTER TABLE public.professional_tasks ADD COLUMN actual_duration_minutes INTEGER;
    END IF;

    -- Chronological Timeline Integration (Drag & Drop Scheduling)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'professional_tasks' AND column_name = 'scheduled_start_time') THEN
        ALTER TABLE public.professional_tasks ADD COLUMN scheduled_start_time TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'professional_tasks' AND column_name = 'scheduled_end_time') THEN
        ALTER TABLE public.professional_tasks ADD COLUMN scheduled_end_time TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Analytics & Smart Suggestions
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'professional_tasks' AND column_name = 'efficiency_percentage') THEN
        ALTER TABLE public.professional_tasks ADD COLUMN efficiency_percentage DECIMAL(5,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'professional_tasks' AND column_name = 'ai_suggested_time') THEN
        ALTER TABLE public.professional_tasks ADD COLUMN ai_suggested_time TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 3. Row Level Security (RLS) setup
ALTER TABLE public.professional_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own professional tasks."
    ON public.professional_tasks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own professional tasks."
    ON public.professional_tasks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own professional tasks."
    ON public.professional_tasks FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own professional tasks."
    ON public.professional_tasks FOR DELETE
    USING (auth.uid() = user_id);
