"use client"

import * as React from "react"
import ReactMarkdown from "react-markdown"
import { formatDistanceToNow } from "date-fns"
import { Github, MessageSquare, Share2, ExternalLink, Bot, ShieldCheck, ShieldAlert } from "lucide-react"
import { LikeButton } from "./like-button"
import { CommentSection } from "./comment-section"
import { toggleMonitoringAction } from "@/app/actions/agent"

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
        comments_count: number
        user_has_liked: boolean
        is_monitored: boolean
    }
    currentUserId: string
}

export function PostCard({ post, currentUserId }: PostProps) {
    const [showComments, setShowComments] = React.useState(false)
    const [isMonitored, setIsMonitored] = React.useState(post.is_monitored)
    const [isToggling, setIsToggling] = React.useState(false)

    const handleToggleMonitoring = async () => {
        setIsToggling(true)
        const result = await toggleMonitoringAction(post.id, post.repo_link)
        if (result.success) {
            setIsMonitored(result.active!)
        }
        setIsToggling(false)
    }

    return (
        <div className="border-2 border-black bg-white shadow-brutalist-large overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <div className="border-b-2 border-black bg-neutral-50 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img
                        src={post.profiles.avatar_url}
                        className="size-8 border border-black grayscale"
                        alt={post.profiles.username}
                    />
                    <div>
                        <p className="text-xs font-black uppercase tracking-tight text-black">{post.profiles.username}</p>
                        <p className="text-[10px] font-bold text-black/40 uppercase tracking-tighter">
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </p>
                    </div>
                </div>
                {post.repo_link && (
                    <a
                        href={post.repo_link}
                        target="_blank"
                        className="group flex items-center gap-2 border border-black bg-white px-2 py-1 text-[10px] font-black uppercase tracking-widest text-black hover:bg-black hover:text-white transition-all"
                    >
                        <Github className="h-3 w-3" />
                        Repository
                    </a>
                )}
            </div>

            <div className="p-8">
                <h3 className="text-2xl font-black uppercase tracking-tight mb-4 text-black italic">
                    {post.title}
                </h3>
                <div className="prose prose-sm max-w-none text-black/70 font-medium leading-relaxed prose-headings:font-black prose-headings:uppercase prose-code:bg-neutral-100 prose-code:px-1 prose-code:rounded-none">
                    <ReactMarkdown>{post.content}</ReactMarkdown>
                </div>
            </div>

            <div className="border-t-2 border-black px-6 py-4 flex items-center justify-between bg-white">
                <div className="flex items-center gap-8">
                    <LikeButton
                        postId={post.id}
                        userId={currentUserId}
                        initialLikes={post.likes_count}
                        initialLiked={post.user_has_liked}
                    />
                    <button
                        onClick={() => setShowComments(!showComments)}
                        className="group flex items-center gap-2 text-xs font-black uppercase tracking-widest text-black/30 hover:text-black transition-colors"
                    >
                        <MessageSquare className="h-4 w-4" />
                        <span>Discuss ({post.comments_count})</span>
                    </button>

                    <button
                        onClick={handleToggleMonitoring}
                        disabled={isToggling}
                        className={`group flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${isMonitored
                                ? "text-[#00FF41] hover:text-[#00FF41]/70"
                                : "text-black/30 hover:text-black"
                            }`}
                        title={isMonitored ? "Agent is monitoring this post" : "Enable Echo Agent for this post"}
                    >
                        <Bot className={`h-4 w-4 ${isMonitored ? "animate-pulse" : ""}`} />
                        <span>{isMonitored ? "Agent Active" : "Enable Agent"}</span>
                    </button>
                </div>
                <button className="text-black/30 hover:text-black">
                    <Share2 className="h-4 w-4" />
                </button>
            </div>

            {showComments && (
                <div className="border-t-2 border-black bg-neutral-50/50 p-6">
                    <div className="max-w-2xl mx-auto">
                        <CommentSection postId={post.id} currentUserId={currentUserId} />
                    </div>
                </div>
            )}
        </div>
    )
}
