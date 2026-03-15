-- Add gender column to user_profiles table
-- This will store the user's gender information

ALTER TABLE user_profiles 
ADD COLUMN gender VARCHAR(10);

-- Add comment to describe the new column
COMMENT ON COLUMN user_profiles.gender IS 'User gender (Male, Female, Other, Prefer not to say)';

-- Add check constraint to ensure only valid gender values are stored
ALTER TABLE user_profiles 
ADD CONSTRAINT check_gender 
CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say', NULL));

-- Create an index on this column for potential queries
CREATE INDEX idx_user_profiles_gender ON user_profiles(gender);
