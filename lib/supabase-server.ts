import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zkezubbjstrixkpqjias.supabase.co'
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprZXp1YmJqc3RyaXhrcHFqaWFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzc5NTMxNiwiZXhwIjoyMDgzMzcxMzE2fQ.9A9AiGDAWc-vAvIvg0-RoI5frwbue6YGKrKmJ_95cjE'
export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey)

// Helper function for server-side authentication
export async function getCurrentUserFromToken(token: string | undefined) {
  if (!token) {
    return null
  }

  try {
    const { data: { user }, error } = await supabaseServer.auth.getUser(token)

    if (error) {
      console.error('Error getting user:', error)
      return null
    }

    return user
  } catch (error) {
    console.error('Unexpected error getting user:', error)
    return null
  }
}
