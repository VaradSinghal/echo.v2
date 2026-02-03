"use client"

import * as React from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Loader2, Github, Send } from "lucide-react"

interface Repo {
    id: number
    html_url: string
    full_name: string
}

export function CreatePost() {
    const [title, setTitle] = React.useState("")
    const [content, setContent] = React.useState("")
    const [repos, setRepos] = React.useState<Repo[]>([])
    const [selectedRepo, setSelectedRepo] = React.useState<string>("")
    const [isLoading, setIsLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    React.useEffect(() => {
        fetch('/api/github/repos')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setRepos(data)
            })
            .catch(err => console.error("Failed to load repos", err))
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title || !content) return

        setIsLoading(true)
        setError(null)
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            // 1. Create the post
            const { data: post, error: insertError } = await supabase.from('posts').insert({
                user_id: user.id,
                title,
                content,
                repo_link: selectedRepo || null,
            }).select().single()

            if (!insertError && post) {
                // 2. If a repo is attached, automatically enable agent monitoring
                if (selectedRepo) {
                    try {
                        const { toggleMonitoringAction } = await import("@/app/actions/agent")
                        await toggleMonitoringAction(post.id, selectedRepo)
                    } catch (monitorErr) {
                        console.error("Failed to auto-enable monitoring:", monitorErr)
                    }
                }

                setTitle("")
                setContent("")
                setSelectedRepo("")
                router.refresh()
            } else {
                setError(insertError?.message || "Failed to create post.")
            }
        } else {
            setError("You must be logged in to post.")
        }
        setIsLoading(false)
    }

    return (
        <div className="border-2 border-black bg-white p-6 shadow-brutalist">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <span className="size-2 bg-black" />
                New Signal
            </h3>

            {error && (
                <div className="mb-6 border border-black bg-red-50 p-3 text-[10px] font-bold uppercase tracking-tight text-red-600">
                    ERR: {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <input
                        className="w-full border-2 border-black bg-white px-3 py-2 text-xs font-bold uppercase tracking-tight placeholder:text-black/20 focus:outline-none focus:bg-neutral-50"
                        placeholder="OBJECTIVE TITLE..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={isLoading}
                    />
                </div>

                <div>
                    <textarea
                        className="w-full min-h-[100px] border-2 border-black bg-white px-3 py-2 text-xs font-medium placeholder:text-black/20 focus:outline-none focus:bg-neutral-50 resize-none"
                        placeholder="TECHNICAL CONTEXT (MARKDOWN)..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        disabled={isLoading}
                    />
                </div>

                <div>
                    <select
                        className="w-full border-2 border-black bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-tight focus:outline-none focus:bg-neutral-50 appearance-none rounded-none"
                        value={selectedRepo}
                        onChange={(e) => setSelectedRepo(e.target.value)}
                        disabled={isLoading}
                    >
                        <option value="">ATTACH REPOSITORY (OPTIONAL)</option>
                        {repos.map(repo => (
                            <option key={repo.id} value={repo.html_url}>
                                {repo.full_name.toUpperCase()}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    type="submit"
                    disabled={isLoading || !title || !content}
                    className="w-full bg-black text-white py-3 text-[10px] font-black uppercase tracking-[0.3em] transition-all hover:bg-neutral-800 flex items-center justify-center gap-2 disabled:opacity-30"
                >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                        <>
                            <Send className="h-3 w-3" />
                            BROADCAST
                        </>
                    )}
                </button>
            </form>
        </div>
    )
}
