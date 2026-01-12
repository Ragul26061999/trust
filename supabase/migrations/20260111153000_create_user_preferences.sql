-- Create user_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'Users can view their own preferences'
    ) THEN
        CREATE POLICY "Users can view their own preferences"
            ON public.user_preferences FOR SELECT
            USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'Users can insert their own preferences'
    ) THEN
        CREATE POLICY "Users can insert their own preferences"
            ON public.user_preferences FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'Users can update their own preferences'
    ) THEN
        CREATE POLICY "Users can update their own preferences"
            ON public.user_preferences FOR UPDATE
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS user_preferences_user_id_idx ON public.user_preferences(user_id);
