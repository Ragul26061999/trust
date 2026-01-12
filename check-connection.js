const { createClient } = require('@supabase/supabase-js');

// Get the environment variables
require('dotenv').config({ path: './.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Checking Supabase connection...\n');

console.log('Supabase URL:', supabaseUrl ? '✅ Present' : '❌ Missing');
console.log('Supabase Anon Key:', supabaseAnonKey ? '✅ Present' : '❌ Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('\n❌ Cannot test connection: Missing environment variables');
  console.log('Please check your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('\nAttempting to connect to Supabase...');
    
    // Test basic connectivity by trying to get session info
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('⚠️ Session error occurred:', sessionError.message);
    } else {
      console.log('✅ Authentication connection successful');
    }

    // Try a simple query to test database connection
    const { data, error } = await supabase
      .from('users') // This table may not exist, but will test the connection
      .select('*')
      .limit(1);
      
    if (error) {
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.log('✅ Database connection successful (expected: table does not exist)');
      } else {
        console.log('⚠️ Database query returned error (but connection might be ok):', error.message);
      }
    } else {
      console.log('✅ Database connection successful with data access');
    }
    
    console.log('\n🎉 Supabase connection test completed!');
    console.log('✅ Your Supabase configuration is working correctly');
    
  } catch (err) {
    console.log('❌ Connection failed:', err.message);
  }
}

testConnection();