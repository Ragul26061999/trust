-- Create professional_tasks table
CREATE TABLE IF NOT EXISTS professional_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    department TEXT,
    role TEXT,
    responsibilities TEXT,
    experience TEXT,
    task_date DATE NOT NULL,
    scheduled_for DATE DEFAULT CURRENT_DATE,
    priority TEXT DEFAULT 'Medium',
    status TEXT DEFAULT 'pending', -- pending, completed, rescheduled
    rescheduled_from UUID REFERENCES professional_tasks(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.professional_tasks ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'professional_tasks' AND policyname = 'Users can view their own tasks'
    ) THEN
        CREATE POLICY "Users can view their own tasks"
            ON public.professional_tasks FOR SELECT
            USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'professional_tasks' AND policyname = 'Users can insert their own tasks'
    ) THEN
        CREATE POLICY "Users can insert their own tasks"
            ON public.professional_tasks FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'professional_tasks' AND policyname = 'Users can update their own tasks'
    ) THEN
        CREATE POLICY "Users can update their own tasks"
            ON public.professional_tasks FOR UPDATE
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'professional_tasks' AND policyname = 'Users can delete their own tasks'
    ) THEN
        CREATE POLICY "Users can delete their own tasks"
            ON public.professional_tasks FOR DELETE
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS professional_tasks_user_id_idx ON public.professional_tasks(user_id);
CREATE INDEX IF NOT EXISTS professional_tasks_task_date_idx ON public.professional_tasks(task_date);
CREATE INDEX IF NOT EXISTS professional_tasks_status_idx ON public.professional_tasks(status);