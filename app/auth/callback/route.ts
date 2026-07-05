import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in search params, use it as the redirect URL
    const next = searchParams.get('next') ?? '/home'

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
        
        if (!error && data.session) {
            const user = data.session.user;
            const userEmail = user.email;
            
            // Validate that the user's email is a real Gmail account
            if (userEmail) {
                // Check if the email ends with @gmail.com
                if (!userEmail.endsWith('@gmail.com')) {
                    // If not a Gmail account, sign out the user and redirect with error
                    await supabase.auth.signOut();
                    return NextResponse.redirect(`${origin}/login?error=invalid_email_domain&email=${encodeURIComponent(userEmail)}`);
                }
            }

            // Handle Calendar Sync Token Capturing
            const syncProvider = searchParams.get('sync');
            if (syncProvider === 'google') {
                const providerToken = data.session.provider_token;
                const providerRefreshToken = data.session.provider_refresh_token;
                const expiresAt = data.session.expires_at;

                if (providerToken) {
                    // Update the calendar_integration table
                    // We use the service role client if we want to bypass RLS or just use the user client if RLS allows
                    // The user-client we just created should have the session, so it should work with RLS
                    await supabase
                        .from('calendar_integration')
                        .upsert({
                            user_id: user.id,
                            provider: 'google',
                            display_name: 'Google Calendar', // Default name
                            email: userEmail,
                            access_token: providerToken,
                            refresh_token: providerRefreshToken,
                            token_expires_at: expiresAt ? new Date(expiresAt * 1000).toISOString() : null,
                            sync_status: 'connected',
                            sync_enabled: true,
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'user_id, provider' });
                }
            }
            
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`)
}
