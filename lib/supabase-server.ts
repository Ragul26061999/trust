import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Note: Use service role key for server-side operations

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
