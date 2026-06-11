const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const ragulId = '39361df2-ad11-490b-a42c-11a648d280be';
  const { data } = await supabase.from('user_preferences').select('preferences').eq('user_id', ragulId).single();
  console.log("Ragul (ragul@gmail.com) pref:", JSON.stringify(data?.preferences, null, 2));
}
run();
