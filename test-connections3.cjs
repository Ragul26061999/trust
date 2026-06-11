const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const ragulId = 'e6c1af52-4965-4b55-826c-65f3cd474deb';
  const { data } = await supabase.from('user_preferences').select('preferences').eq('user_id', ragulId).single();
  console.log("Ragul pref:", data?.preferences);
}
run();
