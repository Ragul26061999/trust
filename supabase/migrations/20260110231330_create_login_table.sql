-- Create the 'login' table
CREATE TABLE IF NOT EXISTS login (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for the login table
ALTER TABLE login ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON login
    FOR ALL USING (auth.role() = 'authenticated');