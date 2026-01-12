-- Create the 'ragul' table
CREATE TABLE IF NOT EXISTS ragul (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for the ragul table
ALTER TABLE ragul ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON ragul
    FOR ALL USING (auth.role() = 'authenticated');