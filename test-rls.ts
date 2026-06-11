import './load-env';
import { supabase } from './lib/supabase'; // Anon client
import { supabaseServer } from './lib/supabase-server'; // Admin client

async function test() {
  const userIds = ['39361df2-ad11-490b-a42c-11a648d280be', '7d658a1a-21b0-4292-ab4f-0e6b213003a1'];

  // 1. Try with admin client
  const { data: adminData } = await supabaseServer.from('notes').select('id').in('user_id', userIds).is('converted_to_task', null);
  console.log("Admin can see:", adminData?.length);

  // 2. Try with anon client
  const { data: anonData, error } = await supabase!.from('notes').select('id').in('user_id', userIds).is('converted_to_task', null);
  console.log("Anon can see:", anonData?.length, error?.message || '');
}
test();
