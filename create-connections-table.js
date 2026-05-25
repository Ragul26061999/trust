const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://zkezubbjstrixkpqjias.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprZXp1YmJqc3RyaXhrcHFqaWFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzc5NTMxNiwiZXhwIjoyMDgzMzcxMzE2fQ.9A9AiGDAWc-vAvIvg0-RoI5frwbue6YGKrKmJ_95cjE';
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function createTable() {
  const { data, error } = await supabase.rpc('execute_sql', {
    query: `
      CREATE TABLE IF NOT EXISTS user_connections (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL,
        connected_user_id UUID NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        UNIQUE(user_id, connected_user_id)
      );
    `
  });
  console.log('Result:', data, error);
}

createTable();
