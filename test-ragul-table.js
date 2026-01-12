import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testRagulTable() {
  console.log('Testing the "ragul" table...\n');

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Environment variables not set properly');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Insert a test record
    const { data: insertData, error: insertError } = await supabase
      .from('ragul')
      .insert([
        {
          name: 'Test User',
          email: 'test@example.com'
        }
      ]);

    if (insertError) {
      console.error('❌ Error inserting test record:', insertError.message);
      return;
    }

    console.log('✅ Successfully inserted test record:', insertData);

    // Query the table
    const { data: selectData, error: selectError } = await supabase
      .from('ragul')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (selectError) {
      console.error('❌ Error querying table:', selectError.message);
      return;
    }

    console.log('✅ Successfully queried "ragul" table');
    console.log('Records in table:', selectData.length);
    if (selectData.length > 0) {
      console.log('Latest record:', selectData[0]);
    }

    // Clean up the test record
    if (insertData && insertData[0]?.id) {
      const { error: deleteError } = await supabase
        .from('ragul')
        .delete()
        .eq('id', insertData[0].id);

      if (deleteError) {
        console.warn('⚠️ Warning: Could not clean up test record:', deleteError.message);
      } else {
        console.log('✅ Successfully cleaned up test record');
      }
    }

    console.log('\n🎉 The "ragul" table is working properly!');
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

// For Node.js environment, we need to load environment variables differently
if (typeof process !== 'undefined' && process.env) {
  // In Node.js environment
  require('dotenv').config({ path: './.env.local' });
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Reassign the values
  global.process.env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl;
  global.process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = supabaseAnonKey;
  
  testRagulTable().catch(console.error);
}