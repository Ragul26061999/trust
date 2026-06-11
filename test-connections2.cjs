const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: users } = await supabase.auth.admin.listUsers();
  const ragul = users.users.find(u => u.email === 'ragul26061999@gmail.com');
  const anandan = users.users.find(u => u.email === 'anandans0007@gmail.com');
  console.log("Ragul ID:", ragul?.id);
  console.log("Anandan ID:", anandan?.id);
  
  if (ragul) {
    const { data } = await supabase.from('user_preferences').select('preferences').eq('user_id', ragul.id).single();
    console.log("Ragul connections:", data?.preferences?.connections);
  }
  
  if (anandan) {
    const { data } = await supabase.from('user_preferences').select('preferences').eq('user_id', anandan.id).single();
    console.log("Anandan connections:", data?.preferences?.connections);
  }
}

run();
