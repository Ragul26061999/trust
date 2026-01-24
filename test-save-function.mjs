// Script to test the saveProfessionalInfo function
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testSaveFunction() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase environment variables are not properly configured.');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    console.log('🔍 Testing save function with sample data...');

    // Sample user ID - we'll use a test UUID for demonstration
    // In a real scenario, this would come from an authenticated user
    const testUserId = '12345678-1234-1234-1234-123456789012'; // Test UUID
    
    // Test data similar to what would be submitted from the form
    const testData = {
      user_id: testUserId,
      department: 'Engineering',
      role: 'Software Engineer',
      responsibilities: 'Develop and maintain web applications',
      experience: '5 years in software development'
    };

    console.log('📝 Inserting test data:', testData);

    // First, try to insert the data (simulate first-time user)
    const { data: insertData, error: insertError } = await supabase
      .from('professional_roles')
      .insert([{
        user_id: testData.user_id,
        role_name: testData.role,
        experience: testData.experience,
        responsibilities: testData.responsibilities,
        department: testData.department,
        schedule: {}
      }])
      .select()
      .single();

    if (insertError) {
      console.log('⚠️ Insert failed (likely because record already exists):', insertError.message);
      
      // Try to update instead (simulate returning user)
      console.log('🔄 Trying to update existing record...');
      const { data: updateData, error: updateError } = await supabase
        .from('professional_roles')
        .update({
          role_name: testData.role,
          experience: testData.experience,
          responsibilities: testData.responsibilities,
          department: testData.department,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', testData.user_id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Update also failed:', updateError.message);
        console.error('Error details:', {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code
        });
        return;
      }

      console.log('✅ Update successful:', updateData);
    } else {
      console.log('✅ Insert successful:', insertData);
    }

    // Now fetch the data back to verify it was saved
    console.log('\n📋 Fetching saved data to verify...');
    const { data: fetchData, error: fetchError } = await supabase
      .from('professional_roles')
      .select('department, role_name, responsibilities, experience')
      .eq('user_id', testData.user_id)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching saved data:', fetchError.message);
      return;
    }

    console.log('✅ Successfully retrieved saved data:', fetchData);

    // Clean up test data (optional - comment out if you want to keep the test record)
    /*
    console.log('\n🧹 Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('professional_roles')
      .delete()
      .eq('user_id', testData.user_id);

    if (deleteError) {
      console.log('⚠️ Could not clean up test data:', deleteError.message);
    } else {
      console.log('✅ Test data cleaned up successfully');
    }
    */

    console.log('\n🎉 Save function test completed successfully!');
    
  } catch (err) {
    console.error('❌ Unexpected error in test:', err);
  }
}

testSaveFunction();