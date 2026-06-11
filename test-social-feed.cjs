const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const ragulId = '39361df2-ad11-490b-a42c-11a648d280be';
  const anandanId = '7d658a1a-21b0-4292-ab4f-0e6b213003a1';
  const userIds = [ragulId, anandanId];
  
  const { data: networkPosts, error: networkError } = await supabase
      .from('notes')
      .select(`*`)
      .in('user_id', userIds)
      .is('converted_to_task', null)
      .order('created_at', { ascending: false });
      
  console.log("Network posts error:", networkError);
  console.log("Network posts count:", networkPosts?.length);
  if (networkPosts?.length > 0) {
     console.log("Network posts from Anandan:", networkPosts.filter(p => p.user_id === anandanId).length);
  }
}
run();
