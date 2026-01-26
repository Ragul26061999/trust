import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zkezubbjstrixkpqjias.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprZXp1YmJqc3RyaXhrcHFqaWFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3OTUzMTYsImV4cCI6MjA4MzM3MTMxNn0.MgNnEbpZ-WM_W7ehpQtlBEnKYYMbFMhhvPDOTUo8jR4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper functions for authentication
// Note: For server-side auth, you'll need to handle session tokens differently

// Sign up function
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

// Sign in function
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

// Sign out function
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    throw new Error(error.message)
  }
}