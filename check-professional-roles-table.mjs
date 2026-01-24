// Script to check the professional_roles table structure and connection
import { createClient } from '@supabase/supabase-js';

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function checkTableStructure() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase environment variables are not properly configured.');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!supabaseAnonKey);
    return;
  }

  console.log('✅ Supabase environment variables are configured.');

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    console.log('\n🔍 Checking if professional_roles table exists and its structure...');

    // Test basic connection first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.log('⚠️ Authentication check failed (this is normal for anonymous access):', authError.message);
    } else {
      console.log('👤 Auth check successful, user ID:', user?.id);
    }

    // Check table structure by attempting to select from it
    const { data, error } = await supabase
      .from('professional_roles')
      .select('id, user_id, role_name, department, experience, responsibilities, created_at, updated_at')
      .limit(1);

    if (error) {
      console.error('❌ Error accessing professional_roles table:', error);
      console.error('Error details:');
      console.error('- Message:', error.message);
      console.error('- Details:', error.details);
      console.error('- Hint:', error.hint);
      console.error('- Code:', error.code);
      
      if (error.code === '42P01') {
        console.log('\n💡 The table does not exist. You need to run the database migrations.');
      } else if (error.code === '42703') {
        console.log('\n💡 A column does not exist. You may need to run the migration to add missing columns.');
      }
      return;
    }

    console.log('✅ Successfully accessed professional_roles table.');
    console.log('📊 Table has', data.length > 0 ? 'records' : 'no records', '(showing first record structure):');
    if (data.length > 0) {
      console.log(data[0]);
    }

    // Check if department column exists by testing a query that uses it
    const { error: deptTestError } = await supabase
      .from('professional_roles')
      .select('department')
      .limit(1);

    if (deptTestError) {
      if (deptTestError.code === '42703') {
        console.log('❌ The department column does not exist in professional_roles table.');
        console.log('💡 You need to run the migration to add the department column.');
      } else {
        console.log('❌ Error testing department column:', deptTestError.message);
      }
    } else {
      console.log('✅ The department column exists in professional_roles table.');
    }

    console.log('\n✅ Table structure check completed successfully!');

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

// Run the check
checkTableStructure();