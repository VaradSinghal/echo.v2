"use client"

import * as React from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Github, Loader2 } from "lucide-react"

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
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            const { error } = await supabase.from('posts').insert({
                user_id: user.id,
                title,
                content,
                repo_link: selectedRepo || null,
            })

            if (!error) {
                setTitle("")
                setContent("")
                setSelectedRepo("")
                router.refresh()
            } else {
                console.error("Error creating post:", error)
            }
        }
        setIsLoading(false)
    }

    return (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Create a New Post</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <input
                        className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Post Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
                <div>
                    <textarea
                        className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Write with Markdown..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
                <div>
                    <select
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
                        value={selectedRepo}
                        onChange={(e) => setSelectedRepo(e.target.value)}
                        disabled={isLoading}
                    >
                        <option value="">Link a GitHub Repository (Optional)</option>
                        {repos.map(repo => (
                            <option key={repo.id} value={repo.html_url}>
                                {repo.full_name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isLoading || !title || !content}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Post Update
                    </button>
                </div>
            </form>
        </div>
    )
}
