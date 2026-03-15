-- Add date_of_birth column to user_profiles table
-- This will store the user's date of birth for automatic age calculation

ALTER TABLE user_profiles 
ADD COLUMN date_of_birth DATE;

-- Add comment to describe the new column
COMMENT ON COLUMN user_profiles.date_of_birth IS 'User date of birth for automatic age calculation';

-- Create an index on this column for potential queries
CREATE INDEX idx_user_profiles_date_of_birth ON user_profiles(date_of_birth);
