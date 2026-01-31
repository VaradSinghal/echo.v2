"use client"

import * as React from "react"
import ReactMarkdown from "react-markdown"
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Github, MessageSquare, Share2 } from "lucide-react"
import { LikeButton } from "./like-button"
import { CommentSection } from "./comment-section"

interface PostProps {
    post: {
        id: string
        title: string
        content: string
        repo_link: string | null
        created_at: string
        profiles: {
            username: string
            avatar_url: string
        }
        likes_count: number
        comments_count: number // Simplified, could be exact count
        user_has_liked: boolean
    }
    currentUserId: string
}

export function PostCard({ post, currentUserId }: PostProps) {
    const [showComments, setShowComments] = React.useState(false)

    return (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={post.profiles.avatar_url} />
                            <AvatarFallback>{post.profiles.username[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-sm font-medium leading-none">{post.profiles.username}</p>
                            <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p>
                        </div>
                    </div>
                    {post.repo_link && (
                        <a href={post.repo_link} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                            <Github className="h-5 w-5 py-px" />
                        </a>
                    )}
                </div>

                <div className="mt-4 space-y-2">
                    <h3 className="text-xl font-semibold leading-none tracking-tight">{post.title}</h3>
                    <div className="text-sm text-muted-foreground prose dark:prose-invert max-w-none">
                        <ReactMarkdown>{post.content}</ReactMarkdown>
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t pt-4">
                    <div className="flex items-center gap-6">
                        <LikeButton
                            postId={post.id}
                            userId={currentUserId}
                            initialLikes={post.likes_count}
                            initialLiked={post.user_has_liked}
                        />
                        <button
                            onClick={() => setShowComments(!showComments)}
                            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <MessageSquare className="h-4 w-4" />
                            <span>Discuss</span>
                        </button>
                    </div>
                    <button className="text-muted-foreground hover:text-foreground">
                        <Share2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {showComments && (
                <div className="bg-muted/30 p-4 border-t">
                    <CommentSection postId={post.id} currentUserId={currentUserId} />
                </div>
            )}
        </div>
    )
}
