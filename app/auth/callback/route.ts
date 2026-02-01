import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const supabase = createClient()
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && data.session) {
            const { session } = data
            const { user } = session

            // Sync Profile Data
            try {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: user.id,
                        email: user.email,
                        username: user.user_metadata.user_name || user.user_metadata.full_name || user.email?.split('@')[0],
                        avatar_url: user.user_metadata.avatar_url,
                        github_id: user.user_metadata.provider_id,
                        updated_at: new Date().toISOString(),
                    }, { onConflict: 'id' })

                if (profileError) {
                    console.error('Error syncing profile:', profileError)
                }
            } catch (e) {
                console.error('Unexpected error during profile sync:', e)
            }

            // Store GitHub tokens
            if (session.provider_token) {
                const { error: tokenError } = await supabase
                    .from('github_tokens')
                    .upsert({
                        user_id: user.id,
                        access_token: session.provider_token,
                        refresh_token: session.provider_refresh_token,
                        expires_at: session.expires_at,
                    }, { onConflict: 'user_id' })

                if (tokenError) {
                    console.error('Error storing token:', tokenError)
                }
            }

            return NextResponse.redirect(`${origin}${next}`)
        }

        // Handle case where code might have been used already but session is established (double hit)
        const { data: { session: existingSession } } = await supabase.auth.getSession()
        if (existingSession) {
            return NextResponse.redirect(`${origin}${next}`)
        }

        if (error) {
            console.error('Auth exchange error:', error)
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
