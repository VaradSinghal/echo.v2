"use client"

import * as React from "react"
import { createClient } from "@/utils/supabase/client"
import { MessageSquare, GitPullRequest, AlertCircle, Loader2, CheckCircle, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

export function AnalyticsDashboard({ selectedRepo }: { selectedRepo: string }) {
    const [stats, setStats] = React.useState<any>(null)
    const [tasks, setTasks] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)
    const supabase = createClient()

    React.useEffect(() => {
        const fetchData = async () => {
            if (!selectedRepo) return
            setLoading(true)

            // 1. Get Repo Posts
            const { data: repoPosts } = await supabase.from('posts').select('id').eq('repo_link', selectedRepo)
            const postIds = (repoPosts || []).map(p => p.id)

            if (postIds.length === 0) {
                setStats({ totalComments: 0, prsOpened: 0, issuesOpened: 0 })
                setTasks([])
                setLoading(false)
                return
            }

            // 2. Counts
            const { count: commentCount } = await supabase.from('comments').select('*', { count: 'exact', head: true }).in('post_id', postIds)

            // Issues (mapped to feature requests and bugs)
            const { data: repoComments } = await supabase.from('comments').select('id').in('post_id', postIds)
            const commentIds = (repoComments || []).map(c => c.id)
            const { count: issueCount } = await supabase.from('feedback_analysis')
                .select('*', { count: 'exact', head: true })
                .in('comment_id', commentIds)
                .in('category', ['feature_request', 'bug'])

            // PRs
            const { count: prCount } = await supabase.from('github_prs').select('*', { count: 'exact', head: true }) // Adjust if github_prs has repo_id

            // 3. Agent Stage (Tasks)
            const { data: activeTasks } = await supabase
                .from('agent_tasks')
                .select(`
                    id, 
                    task_type, 
                    status, 
                    monitored_posts!inner (repo_id)
                `)
                .eq('monitored_posts.repo_id', selectedRepo)
                .order('created_at', { ascending: false })
                .limit(5)

            setStats({
                totalComments: commentCount || 0,
                prsOpened: prCount || 0,
                issuesOpened: issueCount || 0
            })
            setTasks(activeTasks || [])
            setLoading(false)
        }

        fetchData()

        // Polling or Realtime would be better here for "Working Stage"
        const interval = setInterval(fetchData, 10000)
        return () => clearInterval(interval)
    }, [supabase, selectedRepo])

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-black/10" />
        </div>
    )

    // Derive Agent Stage
    const currentTask = tasks[0]
    let stage = "monitoring"
    if (currentTask) {
        if (currentTask.status === 'processing') {
            stage = currentTask.task_type === 'generate_code' ? "coding" : "pr_dispatch"
        } else if (currentTask.status === 'pending') {
            stage = "queue"
        }
    }

    const stages = [
        { id: "monitoring", label: "Monitoring Thresholds", icon: Zap, description: "Scanning community signals for impact" },
        { id: "coding", label: "Code Generation", icon: Loader2, description: "Gemini is synthesizing technical solutions" },
        { id: "pr_dispatch", label: "PR Dispatch", icon: CheckCircle, description: "Verifying patches and opening pull requests" }
    ]

    const metrics = [
        { label: "Community Signals", value: stats.totalComments, icon: MessageSquare },
        { label: "Open Pull Requests", value: stats.prsOpened, icon: GitPullRequest },
        { label: "Impact Issues", value: stats.issuesOpened, icon: AlertCircle },
    ]

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {metrics.map((m, i) => (
                    <div key={i} className="border-4 border-black bg-white p-8 shadow-brutalist relative overflow-hidden group">
                        <m.icon className="absolute -right-4 -top-4 size-24 text-black/5 rotate-12 transition-transform group-hover:rotate-0" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40 mb-2 block">{m.label}</span>
                        <p className="text-6xl font-black text-black leading-none">{m.value}</p>
                    </div>
                ))}
            </div>

            {/* Agent Stage Indicator */}
            <div className="border-4 border-black bg-white p-12 shadow-brutalist-large">
                <div className="flex items-center justify-between mb-12">
                    <h3 className="text-xl font-black uppercase tracking-widest italic">Agent Operational Pipeline</h3>
                    <div className="flex items-center gap-2 px-3 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-widest">
                        Live Status
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-2 border-black">
                    {stages.map((s, i) => {
                        const isActive = stage === s.id || (stage === "coding" && s.id === "monitoring") || (stage === "pr_dispatch" && (s.id === "monitoring" || s.id === "coding"))
                        const isCurrent = stage === s.id

                        return (
                            <div
                                key={s.id}
                                className={cn(
                                    "p-8 border-black md:border-r-2 last:border-r-0 border-b-2 md:border-b-0 transition-colors",
                                    isCurrent ? "bg-black text-white" : isActive ? "bg-neutral-50" : "opacity-30"
                                )}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <s.icon className={cn("size-5", isCurrent && s.id === "coding" && "animate-spin")} />
                                    <span className="text-xs font-black uppercase tracking-widest">{s.label}</span>
                                </div>
                                <p className={cn("text-[10px] font-bold uppercase tracking-tight leading-relaxed", isCurrent ? "text-white/60" : "text-black/40")}>
                                    {s.description}
                                </p>
                                {isCurrent && (
                                    <div className="mt-6 flex gap-1">
                                        <div className="size-1 bg-white animate-bounce" />
                                        <div className="size-1 bg-white animate-bounce [animation-delay:0.2s]" />
                                        <div className="size-1 bg-white animate-bounce [animation-delay:0.4s]" />
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Footer Polish */}
            <div className="flex justify-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-black/20">
                    Proprietary Agent Subsystem v2.0 // Secured Connection
                </p>
            </div>
        </div>
    )
}
