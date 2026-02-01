"use client"

import * as React from "react"
import { createClient } from "@/utils/supabase/client"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { triggerAgentRunAction } from "@/app/actions/agent"

interface LikeButtonProps {
    postId: string
    userId: string
    initialLikes?: number
    initialLiked?: boolean
}

export function LikeButton({ postId, userId, initialLikes = 0, initialLiked = false }: LikeButtonProps) {
    const [liked, setLiked] = React.useState(initialLiked)
    const [likes, setLikes] = React.useState(initialLikes)
    const [isPending, setIsPending] = React.useState(false) // Debouncing could be added
    const supabase = createClient()

    // Subscribe to changes for real-time updates (Optional enhancement for exact count)
    // For now, we do optimistic UI.

    const handleToggle = async () => {
        if (isPending) return
        setIsPending(true)

        const nextLiked = !liked
        const nextLikes = nextLiked ? likes + 1 : likes - 1

        // Optimistic update
        setLiked(nextLiked)
        setLikes(nextLikes)

        try {
            if (nextLiked) {
                await supabase.from('likes').insert({ post_id: postId, user_id: userId })
                // Trigger agent check proactively
                triggerAgentRunAction()
            } else {
                await supabase.from('likes').delete().match({ post_id: postId, user_id: userId })
            }
        } catch (err) {
            console.error("Error toggling like:", err)
            // Revert on error
            setLiked(!nextLiked)
            setLikes(likes)
        } finally {
            setIsPending(false)
        }
    }

    return (
        <button
            onClick={handleToggle}
            className={cn("flex items-center gap-1.5 text-sm transition-colors", liked ? "text-red-500" : "text-muted-foreground hover:text-foreground")}
        >
            <Heart className={cn("h-4 w-4", liked && "fill-current")} />
            <span>{likes}</span>
        </button>
    )
}
