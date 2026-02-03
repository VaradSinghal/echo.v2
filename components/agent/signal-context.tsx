"use client"

import * as React from "react"
import { createClient } from "@/utils/supabase/client"
import { MessageSquare, ThumbsUp, Activity, Database, Radio, ToggleLeft, ToggleRight, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"

interface SignalContextProps {
    selectedRepo: string
}

export function SignalContext({ selectedRepo }: SignalContextProps) {
    const [signals, setSignals] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)
    const supabase = createClient()

    const fetchSignals = React.useCallback(async () => {
        if (!selectedRepo) return
        setLoading(true)

        const { data, error } = await supabase
            .from('monitored_posts')
            .select(`
                *,
                posts!inner (
                    id,
                    title,
                    content,
                    created_at,
                    likes_count:likes(count),
                    comments_count:comments(count)
                )
            `)
            .eq('repo_id', selectedRepo)
            .order('created_at', { ascending: false })

        if (error) {
            console.error("🤖 SignalContext: Error fetching signals:", error)
        } else {
            const processed = data.map(item => ({
                ...item,
                posts: Array.isArray(item.posts) ? item.posts[0] : item.posts
            })).map(item => ({
                ...item,
                likes: item.posts?.likes_count?.[0]?.count || 0,
                comments: item.posts?.comments_count?.[0]?.count || 0
            }))
            setSignals(processed)
        }
        setLoading(false)
    }, [selectedRepo, supabase])

    React.useEffect(() => {
        fetchSignals()
    }, [fetchSignals])

    const toggleSignal = async (id: string, currentState: boolean) => {
        setSignals(prev => prev.map(s => s.id === id ? { ...s, is_active: !currentState } : s))
        const { error } = await supabase
            .from('monitored_posts')
            .update({ is_active: !currentState })
            .eq('id', id)

        if (error) {
            console.error("🤖 SignalContext: Error toggling signal:", error)
            // Revert on error
            setSignals(prev => prev.map(s => s.id === id ? { ...s, is_active: currentState } : s))
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-black/10" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                    <Radio className="size-5 text-black" />
                    Active Signals for {selectedRepo.split('/').pop()}
                </h3>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-black/40 bg-neutral-100 px-3 py-1">
                    <Database className="size-3" />
                    Context Nodes: {signals.length}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {signals.map((signal) => (
                    <div
                        key={signal.id}
                        className={cn(
                            "border-2 border-black p-6 transition-all relative group",
                            signal.is_active ? "bg-white shadow-brutalist" : "bg-neutral-50 grayscale opacity-60"
                        )}
                    >
                        <div className="absolute -top-3 -right-3">
                            <Switch
                                checked={signal.is_active}
                                onCheckedChange={() => toggleSignal(signal.id, signal.is_active)}
                                className="data-[state=checked]:bg-black border-2 border-black shadow-brutalist-small"
                            />
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2">
                                <div className={cn(
                                    "size-2 animate-pulse",
                                    signal.is_active ? "bg-[#00FF41]" : "bg-black/20"
                                )} />
                                <span className="text-[10px] font-black uppercase tracking-widest text-black/40">
                                    {signal.is_active ? "Monitoring" : "Dormant"}
                                </span>
                            </div>

                            <h4 className="text-sm font-black uppercase tracking-tight line-clamp-2 leading-tight min-h-[2.5rem]">
                                {signal.posts?.title}
                            </h4>

                            <div className="flex items-center gap-6 mt-2 border-t-2 border-black/5 pt-4">
                                <div className="flex items-center gap-2">
                                    <ThumbsUp className="size-3 text-black/30" />
                                    <span className="text-xs font-black">{signal.likes}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="size-3 text-black/30" />
                                    <span className="text-xs font-black">{signal.comments}</span>
                                </div>
                                <div className="flex-1" />
                                <div className={cn(
                                    "px-2 py-1 text-[8px] font-black uppercase tracking-widest border border-black",
                                    (signal.likes >= 1 && signal.comments >= 1) ? "bg-black text-white" : "text-black/20 border-black/10"
                                )}>
                                    {(signal.likes >= 1 && signal.comments >= 1) ? "HI-IMPACT" : "LOW-SIG"}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {signals.length === 0 && (
                    <div className="col-span-full border-2 border-dashed border-black/10 p-12 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-black/20 leading-loose">
                            No signals detected for this node.<br />
                            Connect a post to trigger autonomous engineering.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
