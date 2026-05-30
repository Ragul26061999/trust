import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Testing execute_sql...');
  const { data, error } = await supabase.rpc('execute_sql', {
    query: 'SELECT 1;'
  });
  console.log('RPC result:', data, error);

  console.log('Testing user_connections table...');
  const { data: tableData, error: tableError } = await supabase.from('user_connections').select('id').limit(1);
  console.log('Table result:', tableData, tableError);
}

test();
