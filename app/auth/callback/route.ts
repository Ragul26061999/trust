import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in search params, use it as the redirect URL
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        cookieStore.set({ name, value, ...options })
                    },
                    remove(name: string, options: CookieOptions) {
                        cookieStore.set({ name, value: '', ...options })
                    },
                },
            }
        )
        
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (!error) {
            // Validate that the user's email is a real Gmail account
            const userEmail = data.session?.user.email;
            
            if (userEmail) {
                // Check if the email ends with @gmail.com
                if (!userEmail.endsWith('@gmail.com')) {
                    // If not a Gmail account, sign out the user and redirect with error
                    await supabase.auth.signOut();
                    return NextResponse.redirect(`${origin}/login?error=invalid_email_domain&email=${encodeURIComponent(userEmail)}`);
                }
            }
            
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`)
}
