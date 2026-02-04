"use client"

import * as React from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Loader2, Github, Send, Image as ImageIcon, X } from "lucide-react"

interface Repo {
    id: number
    html_url: string
    full_name: string
}

export function CreatePost() {
    const [title, setTitle] = React.useState("")
    const [content, setContent] = React.useState("")
    const [repos, setRepos] = React.useState<Repo[]>([])
    const [selectedRepos, setSelectedRepos] = React.useState<string[]>([])
    const [isLoading, setIsLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [imageFile, setImageFile] = React.useState<File | null>(null)
    const [imagePreview, setImagePreview] = React.useState<string | null>(null)
    const fileInputRef = React.useRef<HTMLInputElement>(null)
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

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 2 * 1024 * 1024) {
            setError("Image size must be less than 2MB")
            return
        }

        setImageFile(file)
        const reader = new FileReader()
        reader.onloadend = () => {
            setImagePreview(reader.result as string)
        }
        reader.readAsDataURL(file)
        setError(null)
    }

    const removeImage = () => {
        setImageFile(null)
        setImagePreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title || !content) return

        setIsLoading(true)
        setError(null)
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            let imageUrl = null

            // 1. Upload image if selected
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop()
                const fileName = `${Math.random()}.${fileExt}`
                const filePath = `${user.id}/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('post_images')
                    .upload(filePath, imageFile)

                if (uploadError) {
                    setError(`Image upload failed: ${uploadError.message}`)
                    setIsLoading(false)
                    return
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('post_images')
                    .getPublicUrl(filePath)

                imageUrl = publicUrl
            }

            // 2. Create the post (with first repo as primary for backward compatibility)
            const { data: post, error: insertError } = await supabase.from('posts').insert({
                user_id: user.id,
                title,
                content,
                repo_link: selectedRepos[0] || null,
                image_url: imageUrl,
            }).select().single()

            if (!insertError && post) {
                // 3. If repos are attached, enable agent monitoring for ALL of them
                if (selectedRepos.length > 0) {
                    try {
                        const { toggleMonitoringAction } = await import("@/app/actions/agent")
                        for (const repoUrl of selectedRepos) {
                            await toggleMonitoringAction(post.id, repoUrl)
                        }
                    } catch (monitorErr) {
                        console.error("Failed to auto-enable monitoring:", monitorErr)
                    }
                }

                setTitle("")
                setContent("")
                setSelectedRepos([])
                removeImage()
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

                {imagePreview && (
                    <div className="relative border-2 border-black group">
                        <img src={imagePreview} alt="Preview" className="w-full h-auto grayscale hover:grayscale-0 transition-all" />
                        <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-2 right-2 bg-black text-white p-1 hover:bg-neutral-800 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Selected Repos Chips */}
                {selectedRepos.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-2 border-2 border-black bg-neutral-50">
                        {selectedRepos.map(repoUrl => {
                            const repo = repos.find(r => r.html_url === repoUrl)
                            return (
                                <div key={repoUrl} className="flex items-center gap-1 bg-black text-white px-2 py-1 text-[10px] font-black uppercase tracking-tight">
                                    <Github className="w-3 h-3" />
                                    {repo?.full_name.split('/').pop() || 'REPO'}
                                    <button
                                        type="button"
                                        onClick={() => setSelectedRepos(prev => prev.filter(r => r !== repoUrl))}
                                        className="ml-1 hover:text-red-400 transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                )}

                <div className="flex gap-2">
                    <div className="flex-1">
                        <select
                            className="w-full border-2 border-black bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-tight focus:outline-none focus:bg-neutral-50 appearance-none rounded-none h-full"
                            value=""
                            onChange={(e) => {
                                if (e.target.value && !selectedRepos.includes(e.target.value)) {
                                    setSelectedRepos(prev => [...prev, e.target.value])
                                }
                            }}
                            disabled={isLoading}
                        >
                            <option value="">ATTACH REPOSITORY (OPTIONAL)</option>
                            {repos.filter(repo => !selectedRepos.includes(repo.html_url)).map(repo => (
                                <option key={repo.id} value={repo.html_url}>
                                    {repo.full_name.toUpperCase()}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                        className="border-2 border-black p-2 hover:bg-neutral-50 transition-colors flex items-center justify-center aspect-square"
                        title="Add Image"
                    >
                        <ImageIcon className="w-5 h-5" />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/*"
                        className="hidden"
                    />
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
