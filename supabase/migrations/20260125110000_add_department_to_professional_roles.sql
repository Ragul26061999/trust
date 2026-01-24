-- Add department column to professional_roles table
ALTER TABLE professional_roles 
ADD COLUMN IF NOT EXISTS department TEXT;

-- Update the RLS policies if needed (they should already be sufficient)
-- The existing policies should cover the new column