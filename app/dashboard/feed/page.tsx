"use client"

import * as React from "react"
import { createClient } from "@/utils/supabase/client"
import { CreatePost } from "@/components/feed/create-post"
import { PostCard } from "@/components/feed/post-card"
import { Loader2, Activity, User, Globe, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export default function FeedPage() {
    const [posts, setPosts] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)
    const [userId, setUserId] = React.useState<string>("")
    const [filter, setFilter] = React.useState<"community" | "personal">("community")
    const supabase = createClient()

    const fetchPosts = React.useCallback(async () => {
        setLoading(true)
        let query = supabase
            .from('posts')
            .select(`
                *,
                profiles:profiles!user_id (username, avatar_url),
                likes:likes!post_id (user_id),
                likes_count:likes!post_id (count),
                comments_count:comments!post_id (count),
                monitored_posts:monitored_posts(is_active)
            `)
            .order('created_at', { ascending: false })
            .limit(20)

        if (filter === "personal" && userId) {
            query = query.eq('user_id', userId)
        }

        const { data, error } = await query

        if (!error && data) {
            const processed = data.map(post => ({
                ...post,
                likes_count: post.likes_count?.[0]?.count || 0,
                comments_count: post.comments_count?.[0]?.count || 0,
                user_has_liked: post.likes.some((l: any) => l.user_id === userId),
                is_monitored: post.monitored_posts?.[0]?.is_active ?? false
            }))
            setPosts(processed)
        }
        setLoading(false)
    }, [supabase, userId, filter])

    React.useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) setUserId(data.user.id)
        })
    }, [supabase])

    React.useEffect(() => {
        if (userId) {
            fetchPosts()

            const channel = supabase
                .channel('public:posts')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => {
                    if (filter === "community") fetchPosts()
                })
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }
    }, [userId, fetchPosts, supabase, filter])

    return (
        <div className="flex flex-col gap-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 mb-4 group">
                        <Activity className="h-5 w-5 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-black">Signal Stream</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-black">Portal Feed</h1>
                </div>

                <div className="flex items-center gap-1 border-2 border-black p-1 bg-white shadow-brutalist">
                    <button
                        onClick={() => setFilter("community")}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                            filter === "community" ? "bg-black text-white" : "text-black/40 hover:text-black"
                        )}
                    >
                        <Globe className="h-3 w-3" />
                        Global
                    </button>
                    <button
                        onClick={() => setFilter("personal")}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                            filter === "personal" ? "bg-black text-white" : "text-black/40 hover:text-black"
                        )}
                    >
                        <User className="h-3 w-3" />
                        Private
                    </button>
                </div>
            </div>

            {/* Content Section: Two Column Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">

                {/* Right: Signal Stream (Main) - 8 columns on Desktop */}
                <div className="xl:col-span-8 order-2 xl:order-1">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-6 bg-white border-2 border-dashed border-black/10">
                            <Loader2 className="h-12 w-12 animate-spin text-black" />
                            <span className="text-xs font-black uppercase tracking-[0.3em] opacity-20">Syncing Frequencies...</span>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {posts.map(post => (
                                <PostCard key={post.id} post={post} currentUserId={userId} />
                            ))}

                            {posts.length === 0 && (
                                <div className="border-2 border-dashed border-black/10 p-24 text-center bg-white">
                                    <MessageCircle className="h-12 w-12 text-black/5 mx-auto mb-4" />
                                    <p className="text-xs font-black uppercase tracking-widest text-black/20">
                                        No signals detected in this sector.
                                    </p>
                                </div>
                            )}

                            {posts.length > 0 && (
                                <div className="pt-8 flex justify-center">
                                    <button className="btn-outline px-12 py-4 text-[10px] tracking-[0.3em]">
                                        DECODE OLDER SIGNALS
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Left: Control Panel (Post Creation) - 4 columns on Desktop */}
                <div className="xl:col-span-4 order-1 xl:order-2">
                    <div className="sticky top-8 flex flex-col gap-8">
                        <section>
                            <div className="mb-4 flex items-center gap-3">
                                <span className="h-px flex-1 bg-black/10" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-black/40 whitespace-nowrap">Broadcast Station</span>
                                <span className="h-px flex-1 bg-black/10" />
                            </div>
                            <CreatePost />
                        </section>

                        <div className="border-2 border-black bg-white p-6 shadow-brutalist">
                            <h4 className="text-[10px] font-black uppercase tracking-widest mb-4">Frequency Stats</h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end border-b border-dashed border-black/10 pb-2">
                                    <span className="text-[10px] font-bold text-black/40 uppercase">Active Nodes</span>
                                    <span className="text-lg font-black leading-none">248</span>
                                </div>
                                <div className="flex justify-between items-end border-b border-dashed border-black/10 pb-2">
                                    <span className="text-[10px] font-bold text-black/40 uppercase">Echoes Today</span>
                                    <span className="text-lg font-black leading-none">{posts.length}+</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
