-- Ensure professional_roles table has all required columns
-- Add department column if it doesn't exist (in case the previous migration wasn't applied)
ALTER TABLE professional_roles 
ADD COLUMN IF NOT EXISTS department TEXT;

-- Add role_name column if it doesn't exist (should already exist based on original migration)
ALTER TABLE professional_roles 
ADD COLUMN IF NOT EXISTS role_name TEXT;

-- Ensure the necessary RLS policies are in place
-- Note: We don't need to recreate policies if they already exist, but we'll make sure they're correct

-- Make sure RLS is enabled
ALTER TABLE professional_roles ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to ensure they're up-to-date
DROP POLICY IF EXISTS "Users can view their own professional roles" ON professional_roles;
DROP POLICY IF EXISTS "Users can insert their own professional roles" ON professional_roles;
DROP POLICY IF EXISTS "Users can update their own professional roles" ON professional_roles;
DROP POLICY IF EXISTS "Users can delete their own professional roles" ON professional_roles;

-- Recreate policies
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