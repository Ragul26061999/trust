-- Create feedback table for user feedback submissions
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('bug', 'feature', 'general', 'performance')),
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed', 'in_progress', 'resolved', 'closed')),
    response TEXT,
    response_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$ 
BEGIN
    -- Users can view their own feedback
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'feedback' AND policyname = 'Users can view their own feedback'
    ) THEN
        CREATE POLICY "Users can view their own feedback"
            ON public.feedback FOR SELECT
            USING (auth.uid() = user_id);
    END IF;

    -- Users can insert their own feedback
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'feedback' AND policyname = 'Users can insert their own feedback'
    ) THEN
        CREATE POLICY "Users can insert their own feedback"
            ON public.feedback FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Admins can view all feedback (assuming admin role exists)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'feedback' AND policyname = 'Admins can view all feedback'
    ) THEN
        CREATE POLICY "Admins can view all feedback"
            ON public.feedback FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM auth.users 
                    WHERE id = auth.uid() 
                    AND raw_user_meta_data->>'role' = 'admin'
                )
            );
    END IF;

    -- Admins can update feedback status and add responses
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'feedback' AND policyname = 'Admins can update feedback'
    ) THEN
        CREATE POLICY "Admins can update feedback"
            ON public.feedback FOR UPDATE
            USING (
                EXISTS (
                    SELECT 1 FROM auth.users 
                    WHERE id = auth.uid() 
                    AND raw_user_meta_data->>'role' = 'admin'
                )
            );
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS feedback_user_id_idx ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS feedback_category_idx ON public.feedback(category);
CREATE INDEX IF NOT EXISTS feedback_status_idx ON public.feedback(status);
CREATE INDEX IF NOT EXISTS feedback_created_at_idx ON public.feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS feedback_priority_status_idx ON public.feedback(priority, status);

-- Create or replace the update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the trigger to automatically update the updated_at timestamp if it doesn't exist
DO $$
BEGIN
    DROP TRIGGER IF EXISTS update_feedback_updated_at ON public.feedback;
    CREATE TRIGGER update_feedback_updated_at 
        BEFORE UPDATE ON public.feedback 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN
        -- Trigger already exists, continue
        NULL;
END $$;