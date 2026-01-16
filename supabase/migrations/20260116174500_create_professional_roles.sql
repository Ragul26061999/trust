-- Create professional_roles table
CREATE TABLE IF NOT EXISTS professional_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    role_name TEXT NOT NULL,
    experience TEXT,
    responsibilities TEXT,
    schedule JSONB, -- Stores the generated schedule and tasks
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE professional_roles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own professional roles"
    ON professional_roles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own professional roles"
    ON professional_roles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own professional roles"
    ON professional_roles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own professional roles"
    ON professional_roles FOR DELETE
    USING (auth.uid() = user_id);
