import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    // Fetch token from database
    const { data: tokenData, error: tokenError } = await supabase
        .from('github_tokens')
        .select('access_token')
        .eq('user_id', session.user.id)
        .single()

    if (tokenError || !tokenData?.access_token) {
        return new NextResponse('No GitHub token found', { status: 404 })
    }

    try {
        const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
                Accept: 'application/vnd.github.v3+json',
            },
        })

        if (!response.ok) {
            // Check for 401 to handle token expiry if needed
            return new NextResponse(`GitHub API error: ${response.statusText}`, { status: response.status })
        }

        const repos = await response.json()
        return NextResponse.json(repos)

    } catch (error) {
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
