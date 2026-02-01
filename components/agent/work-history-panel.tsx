"use client"

import * as React from "react"
import { createClient } from "@/utils/supabase/client"
import { GitPullRequest, ExternalLink, Calendar, CheckCircle2, CircleDashed, XCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface WorkHistoryItem {
    id: string
    pr_number: number
    pr_url: string
    status: string
    created_at: string
    generated_code: {
        explanation: string
        agent_tasks: {
            monitored_posts: {
                repo_id: string
            }
        }
    }
}

export function WorkHistoryPanel({ selectedRepo }: { selectedRepo: string }) {
    const [history, setHistory] = React.useState<WorkHistoryItem[]>([])
    const [loading, setLoading] = React.useState(true)
    const supabase = createClient()

    const fetchHistory = React.useCallback(async () => {
        setLoading(true)
        try {
            let query = supabase
                .from('github_prs')
                .select(`
                    id,
                    pr_number,
                    pr_url,
                    status,
                    created_at,
                    generated_code!inner (
                        explanation,
                        agent_tasks!inner (
                            monitored_posts!inner (
                                repo_id
                            )
                        )
                    )
                `)
                .order('created_at', { ascending: false })

            if (selectedRepo && selectedRepo !== "all") {
                query = query.eq('generated_code.agent_tasks.monitored_posts.repo_id', selectedRepo)
            }

            const { data, error } = await query

            if (error) {
                console.error("Error fetching work history:", error)
                return
            }

            setHistory(data as any[])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }, [supabase, selectedRepo])

    React.useEffect(() => {
        fetchHistory()

        const channel = supabase
            .channel('github_prs_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'github_prs' }, () => {
                fetchHistory()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [fetchHistory, supabase])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-black/20" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b-2 border-black pb-4">
                <h3 className="text-xl font-black uppercase tracking-widest italic flex items-center gap-3">
                    <GitPullRequest className="size-6" />
                    Work Realized
                </h3>
                <span className="text-[10px] font-black bg-black text-white px-3 py-1 uppercase tracking-widest">
                    {history.length} Total PRs
                </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {history.length === 0 ? (
                    <div className="border-2 border-dashed border-black/10 p-12 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-black/20">
                            No contributions recorded for this node.
                        </p>
                    </div>
                ) : (
                    history.map((item) => (
                        <div key={item.id} className="group border-2 border-black bg-white p-6 shadow-brutalist hover:translate-x-[2px] hover:-translate-y-[2px] hover:shadow-brutalist-large transition-all">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="space-y-4 flex-1">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "px-2 py-1 text-[10px] font-black uppercase tracking-widest border-2 border-black",
                                            item.status === 'merged' ? "bg-purple-500 text-white" :
                                                item.status === 'closed' ? "bg-red-500 text-white" :
                                                    "bg-green-500 text-white"
                                        )}>
                                            {item.status}
                                        </div>
                                        <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest flex items-center gap-1">
                                            <Calendar className="size-3" />
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </span>
                                        <span className="text-[10px] font-black text-black uppercase tracking-widest">
                                            PR #{item.pr_number}
                                        </span>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-black uppercase tracking-tight text-black mb-1">
                                            {item.generated_code?.agent_tasks?.monitored_posts?.repo_id || "Unknown Repository"}
                                        </h4>
                                        <p className="text-xs font-bold text-black/60 line-clamp-2 leading-relaxed">
                                            {item.generated_code?.explanation || "Automatic patch generated based on community feedback signals."}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center md:flex-col justify-end gap-2">
                                    <a
                                        href={item.pr_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-solid text-[10px] px-4 py-2 flex items-center gap-2 whitespace-nowrap"
                                    >
                                        VIEW ON GITHUB
                                        <ExternalLink className="size-3" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
