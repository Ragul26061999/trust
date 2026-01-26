import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if environment variables are properly set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase environment variables are not properly configured.');
  console.error('📋 Missing variables:');
  if (!supabaseUrl) console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.error('🔧 Please check your environment variables in .env.local (local) or deployment platform (production)');
} else {
  console.log('✅ Supabase environment variables configured successfully');
}

// Create client for client-side usage
export const supabase = typeof window !== 'undefined' ? (
  supabaseUrl && supabaseAnonKey ? 
    createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null
) : (
  supabaseUrl && supabaseAnonKey ?
    createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null
);

// Function to create a new client (useful for server components)
export function createSupabaseServerClient() {
  if (supabaseUrl && supabaseAnonKey) {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }
  return null;
}

// Helper function to check if Supabase is properly configured
export function isSupabaseConfigured() {
  return !!(supabaseUrl && supabaseAnonKey);
}