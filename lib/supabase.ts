import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if environment variables are properly set
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not properly configured. Please check your .env.local file.')
  console.warn('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!supabaseAnonKey)
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