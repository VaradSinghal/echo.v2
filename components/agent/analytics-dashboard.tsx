"use client"

import * as React from "react"
import { createClient } from "@/utils/supabase/client"
import { MessageSquare, GitPullRequest, AlertCircle, Loader2, CheckCircle, Zap, Terminal } from "lucide-react"
import { cn } from "@/lib/utils"
import { ExecutionTrace } from "./execution-trace"

export function AnalyticsDashboard({ selectedRepo }: { selectedRepo: string }) {
    const [stats, setStats] = React.useState<any>(null)
    const [tasks, setTasks] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)
    const [showTrace, setShowTrace] = React.useState(true)
    const supabase = createClient()

    const fetchData = React.useCallback(async () => {
        if (!selectedRepo) return

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

        const { data: repoComments } = await supabase.from('comments').select('id').in('post_id', postIds)
        const commentIds = (repoComments || []).map(c => c.id)

        const { count: issueCount } = await supabase.from('feedback_analysis')
            .select('*', { count: 'exact', head: true })
            .in('comment_id', commentIds)
            .in('category', ['feature_request', 'bug'])

        const { count: prCount } = await supabase
            .from('github_prs')
            .select(`
                id,
                generated_code!inner (
                    agent_tasks!inner (
                        monitored_posts!inner (repo_id)
                    )
                )
            `, { count: 'exact', head: true })
            .eq('generated_code.agent_tasks.monitored_posts.repo_id', selectedRepo)

        // 3. Agent Stage (Tasks)
        const { data: activeTasks } = await supabase
            .from('agent_tasks')
            .select(`
                id, 
                task_type, 
                status, 
                current_step,
                logs,
                monitored_posts!inner (repo_id)
            `)
            .eq('monitored_posts.repo_id', selectedRepo)
            .order('created_at', { ascending: false })
            .limit(1)

        setStats({
            totalComments: commentCount || 0,
            prsOpened: prCount || 0,
            issuesOpened: issueCount || 0
        })
        setTasks(activeTasks || [])
        setLoading(false)
    }, [supabase, selectedRepo])

    React.useEffect(() => {
        fetchData()

        // 4. Realtime Subscription
        const channel = supabase
            .channel('agent_tasks_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'agent_tasks'
                },
                (payload) => {
                    console.log('🔄 Agent Task Change detected:', payload)
                    fetchData()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [fetchData, supabase])

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-black/10" />
        </div>
    )

    const currentTask = tasks[0]
    let stage = "monitoring"
    if (currentTask) {
        if (currentTask.status === 'processing' || currentTask.status === 'pending') {
            if (currentTask.current_step?.includes('Synthesizing') || currentTask.current_step?.includes('Analyzing')) {
                stage = "coding"
            } else if (currentTask.current_step?.includes('Dispatching')) {
                stage = "pr_dispatch"
            }
        } else if (currentTask.status === 'completed' && currentTask.current_step?.includes('PR Link')) {
            stage = "pr_dispatch"
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
                    <h3 className="text-xl font-black uppercase tracking-widest italic flex items-center gap-4">
                        Agent Operational Pipeline
                        {stage !== 'monitoring' && <Loader2 className="size-5 animate-spin text-black/20" />}
                    </h3>
                    <button
                        onClick={() => setShowTrace(!showTrace)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 border-2 border-black text-[10px] font-bold uppercase tracking-widest transition-colors",
                            showTrace ? "bg-black text-white" : "bg-white text-black hover:bg-neutral-50 shadow-brutalist active:translate-y-[2px] active:shadow-none"
                        )}
                    >
                        <Terminal className="size-3" />
                        {showTrace ? "Hide Trace" : "View Trace"}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-2 border-black mb-12">
                    {stages.map((s, i) => {
                        const isPast = (stage === "coding" && s.id === "monitoring") || (stage === "pr_dispatch" && (s.id === "monitoring" || s.id === "coding"))
                        const isCurrent = stage === s.id
                        const isActive = isCurrent || isPast

                        return (
                            <div
                                key={s.id}
                                className={cn(
                                    "p-8 border-black md:border-r-2 last:border-r-0 border-b-2 md:border-b-0 transition-all duration-500",
                                    isCurrent ? "bg-black text-white" : isPast ? "bg-neutral-50 text-black/40" : "opacity-30 bg-white"
                                )}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <s.icon className={cn("size-5", isCurrent && (s.id === "coding" || s.id === "monitoring") && "animate-spin")} />
                                    <span className="text-xs font-black uppercase tracking-widest">
                                        {s.label}
                                        {isPast && s.id !== "pr_dispatch" && <CheckCircle className="inline ml-2 size-3 text-green-500" />}
                                    </span>
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

                {/* Execution Trace Terminal */}
                {showTrace && currentTask && (
                    <div className="animate-in fade-in zoom-in-95 duration-300">
                        <ExecutionTrace
                            logs={currentTask.logs || []}
                            status={currentTask.status}
                            currentStep={currentTask.current_step}
                        />
                    </div>
                )}
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
