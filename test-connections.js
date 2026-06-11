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
    const { data } = await supabase.from('user_preferences').select('*').eq('user_id', ragul.id);
    console.log("Ragul Prefs:", JSON.stringify(data, null, 2));
  }
  
  if (anandan) {
    const { data } = await supabase.from('user_preferences').select('*').eq('user_id', anandan.id);
    console.log("Anandan Prefs:", JSON.stringify(data, null, 2));
  }

  const { data: notes } = await supabase.from('notes').select('*');
  console.log("Notes count:", notes?.length);
  const anandanNotes = notes?.filter(n => n.user_id === anandan?.id);
  console.log("Anandan Notes:", anandanNotes?.map(n => ({ id: n.id, tags: n.tags })));
}

run();
