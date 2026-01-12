-- Update policy for ragul table to allow public access
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON ragul;

-- Create a new policy to allow all operations for all users (for testing)
CREATE POLICY "Allow all operations for all users" ON ragul
    FOR ALL USING (true) WITH CHECK (true);
