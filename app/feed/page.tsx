"use client"

import * as React from "react"
import { createClient } from "@/utils/supabase/client"
import { CreatePost } from "@/components/feed/create-post"
import { PostCard } from "@/components/feed/post-card"
import { Loader2 } from "lucide-react"

export default function FeedPage() {
    const [posts, setPosts] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)
    const [userId, setUserId] = React.useState<string>("")
    const supabase = createClient()

    const fetchPosts = React.useCallback(async () => {
        // Basic fetch, ideally needs pagination (cursor-based)
        const { data, error } = await supabase
            .from('posts')
            .select(`
        *,
        profiles (username, avatar_url),
        likes (user_id),
        likes_count:likes(count),
        comments_count:comments(count)
      `)
            .order('created_at', { ascending: false })
            .limit(20)

        if (!error && data) {
            // Process data to check if current user liked
            const processed = data.map(post => ({
                ...post,
                likes_count: post.likes_count?.[0]?.count || 0,
                comments_count: post.comments_count?.[0]?.count || 0,
                user_has_liked: post.likes.some((l: any) => l.user_id === userId)
            }))
            setPosts(processed)
        }
        setLoading(false)
    }, [supabase, userId])

    React.useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) setUserId(data.user.id)
        })
    }, [supabase])

    React.useEffect(() => {
        if (userId) {
            fetchPosts()

            // Realtime Subscription for new posts
            const channel = supabase
                .channel('public:posts')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
                    // Optimistic prepending or re-fetch
                    // For simplicity, we re-fetch to get profile data
                    fetchPosts()
                })
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }
    }, [userId, fetchPosts, supabase])

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-8">Community Feed</h1>

            <CreatePost />

            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="space-y-6">
                    {posts.map(post => (
                        <PostCard key={post.id} post={post} currentUserId={userId} />
                    ))}
                    {posts.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            No posts yet. Be the first to share something!
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
