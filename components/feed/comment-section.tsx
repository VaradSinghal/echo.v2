"use client"

import * as React from "react"
import { createClient } from "@/utils/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { Loader2, Reply } from "lucide-react"
import { triggerAgentRunAction } from "@/app/actions/agent"

interface Comment {
    id: string
    content: string
    created_at: string
    parent_id: string | null
    profiles: {
        username: string
        avatar_url: string
    }
}

interface CommentSectionProps {
    postId: string
    currentUserId: string
}

export function CommentSection({ postId, currentUserId }: CommentSectionProps) {
    const [comments, setComments] = React.useState<Comment[]>([])
    const [loading, setLoading] = React.useState(true)
    const [newComment, setNewComment] = React.useState("")
    const [replyingTo, setReplyingTo] = React.useState<string | null>(null)
    const supabase = createClient()

    const fetchComments = React.useCallback(async () => {
        const { data, error } = await supabase
            .from('comments')
            .select(`
        *,
        profiles (username, avatar_url)
      `)
            .eq('post_id', postId)
            .order('created_at', { ascending: true })

        if (!error && data) {
            setComments(data as any)
        }
        setLoading(false)
    }, [postId, supabase])

    React.useEffect(() => {
        fetchComments()

        // Realtime subscription
        const channel = supabase
            .channel(`comments:${postId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` }, (payload) => {
                fetchComments() // Re-fetch to get user details properly, could be optimized
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [fetchComments, postId, supabase])

    const handleSubmit = async (e: React.FormEvent, parentId: string | null = null) => {
        e.preventDefault()
        if (!newComment.trim()) return

        const { error } = await supabase.from('comments').insert({
            post_id: postId,
            user_id: currentUserId,
            content: newComment,
            parent_id: parentId
        })

        if (!error) {
            setNewComment("")
            setReplyingTo(null)
            // Trigger agent check proactively
            triggerAgentRunAction()
        }
    }

    // Recursive rendering (can be extracted if complex)
    const renderComments = (parentId: string | null) => {
        return comments
            .filter(c => c.parent_id === parentId)
            .map(comment => (
                <div key={comment.id} className={`flex gap-3 ${parentId ? 'ml-8 mt-3' : 'mt-4'}`}>
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.profiles.avatar_url} />
                        <AvatarFallback>{comment.profiles.username[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{comment.profiles.username}</span>
                            <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.created_at))} ago</span>
                        </div>
                        <p className="text-sm text-foreground">{comment.content}</p>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                            >
                                <Reply className="h-3 w-3" /> Reply
                            </button>
                        </div>

                        {replyingTo === comment.id && (
                            <form onSubmit={(e) => handleSubmit(e, comment.id)} className="mt-2 flex gap-2">
                                <input
                                    className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm shadow-black transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Write a reply..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    autoFocus
                                />
                                <button type="submit" className="text-xs bg-primary text-primary-foreground px-2 rounded-md">Post</button>
                            </form>
                        )}

                        {/* Render nested replies */}
                        {renderComments(comment.id)}
                    </div>
                </div>
            ))
    }

    if (loading) return <div className="py-4 text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" /></div>

    return (
        <div className="space-y-4">
            {/* New top-level comment */}
            <form onSubmit={(e) => handleSubmit(e, null)} className="flex gap-3">
                <Avatar className="h-8 w-8">
                    <AvatarFallback>Me</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <input
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Write a comment..."
                        value={!replyingTo ? newComment : ""}
                        onChange={(e) => {
                            setReplyingTo(null)
                            setNewComment(e.target.value)
                        }}
                    />
                </div>
            </form>

            <div className="pl-1">
                {renderComments(null)}
            </div>
        </div>
    )
}
