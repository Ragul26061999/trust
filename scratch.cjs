const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://zkezubbjstrixkpqjias.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprZXp1YmJqc3RyaXhrcHFqaWFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzc5NTMxNiwiZXhwIjoyMDgzMzcxMzE2fQ.9A9AiGDAWc-vAvIvg0-RoI5frwbue6YGKrKmJ_95cjE';
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function test() {
  const { data, error } = await supabase.from('notes').select('id, user_id, title').limit(5);
  console.log(data);
}
test();
