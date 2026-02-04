"use client"

import * as React from "react"
import { createClient } from "@/utils/supabase/client"
import {
    GitPullRequest,
    CheckCircle,
    XCircle,
    AlertCircle,
    Clock,
    MessageSquare,
    Loader2,
    ChevronDown,
    ChevronUp,
    ExternalLink
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow, format } from "date-fns"

interface AgentHistoryTimelineProps {
    selectedRepo: string
    selectedPostId?: string
}

interface TimelineItem {
    id: string
    task_type: string
    status: string
    approval_status: string | null
    current_step: string | null
    created_at: string
    result: any
    logs: any[]
    monitored_posts: {
        repo_id: string
        posts: {
            title: string
        }
    }
    generated_code: Array<{
        file_path: string
        explanation: string
    }>
    github_prs: Array<{
        pr_url: string
        pr_number: number
        status: string
    }>
}

export function AgentHistoryTimeline({ selectedRepo, selectedPostId }: AgentHistoryTimelineProps) {
    const [items, setItems] = React.useState<TimelineItem[]>([])
    const [loading, setLoading] = React.useState(true)
    const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set())
    const supabase = createClient()

    React.useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true)

            // Build query to get all tasks for the selected repo
            let query = supabase
                .from('agent_tasks')
                .select(`
                    id,
                    task_type,
                    status,
                    approval_status,
                    current_step,
                    created_at,
                    result,
                    logs,
                    monitored_posts!inner (
                        repo_id,
                        posts (title)
                    ),
                    generated_code (
                        file_path,
                        explanation
                    )
                `)
                .eq('monitored_posts.repo_id', selectedRepo)
                .order('created_at', { ascending: false })
                .limit(20)

            if (selectedPostId) {
                query = query.eq('monitored_posts.post_id', selectedPostId)
            }

            const { data, error } = await query

            if (data && !error) {
                // Fetch PRs for each task's generated code
                const tasksWithPRs = await Promise.all(
                    data.map(async (task: any) => {
                        const codeIds = task.generated_code?.map((gc: any) => gc.id) || []
                        let prs: any[] = []
                        if (codeIds.length > 0) {
                            const { data: prData } = await supabase
                                .from('github_prs')
                                .select('*')
                                .in('generated_code_id', codeIds)
                            prs = prData || []
                        }
                        return { ...task, github_prs: prs }
                    })
                )
                setItems(tasksWithPRs)
            }

            setLoading(false)
        }

        if (selectedRepo) {
            fetchHistory()
        }
    }, [selectedRepo, selectedPostId, supabase])

    const toggleExpand = (id: string) => {
        setExpandedItems(prev => {
            const newSet = new Set(prev)
            if (newSet.has(id)) {
                newSet.delete(id)
            } else {
                newSet.add(id)
            }
            return newSet
        })
    }

    const getStatusIcon = (status: string, approvalStatus: string | null) => {
        if (status === 'completed') return <CheckCircle className="size-5 text-green-600" />
        if (status === 'failed') return <XCircle className="size-5 text-red-600" />
        if (status === 'rejected' || approvalStatus === 'rejected') return <XCircle className="size-5 text-orange-500" />
        if (status === 'pending_approval') return <Clock className="size-5 text-yellow-600" />
        if (status === 'processing' || status === 'pending') return <Loader2 className="size-5 text-blue-600 animate-spin" />
        return <AlertCircle className="size-5 text-neutral-400" />
    }

    const getStatusLabel = (status: string, approvalStatus: string | null) => {
        if (status === 'completed') return 'PR Created'
        if (status === 'failed') return 'Failed'
        if (status === 'rejected' || approvalStatus === 'rejected') return 'Rejected'
        if (status === 'pending_approval') return 'Awaiting Approval'
        if (status === 'processing') return 'Processing'
        if (status === 'pending') return 'Queued'
        return status
    }

    if (loading) {
        return (
            <div className="border-2 border-black bg-white p-8 text-center">
                <Loader2 className="size-6 animate-spin mx-auto mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest text-black/40">Loading history...</p>
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className="border-2 border-black bg-white p-8 text-center">
                <Clock className="size-6 mx-auto mb-2 text-black/20" />
                <p className="text-[10px] font-black uppercase tracking-widest text-black/40">No agent activity yet</p>
            </div>
        )
    }

    return (
        <div className="border-2 border-black bg-white shadow-brutalist">
            {/* Header */}
            <div className="border-b-2 border-black bg-neutral-50 px-6 py-4 flex items-center gap-3">
                <Clock className="size-5" />
                <span className="text-xs font-black uppercase tracking-widest">Agent History Timeline</span>
                <span className="ml-auto text-[10px] font-bold text-black/40 uppercase">{items.length} events</span>
            </div>

            {/* Timeline */}
            <div className="divide-y-2 divide-black">
                {items.map((item, index) => {
                    const isExpanded = expandedItems.has(item.id)
                    const postTitle = Array.isArray(item.monitored_posts?.posts)
                        ? item.monitored_posts.posts[0]?.title
                        : (item.monitored_posts?.posts as any)?.title
                    const triggerComment = item.result?.comment_id

                    return (
                        <div key={item.id} className="hover:bg-neutral-50 transition-colors">
                            {/* Main Row */}
                            <button
                                onClick={() => toggleExpand(item.id)}
                                className="w-full px-6 py-4 flex items-center gap-4 text-left"
                            >
                                {/* Timeline Indicator */}
                                <div className="flex flex-col items-center">
                                    <div className={cn(
                                        "size-10 rounded-full border-2 flex items-center justify-center",
                                        item.status === 'completed' ? "border-green-600 bg-green-50" :
                                            item.status === 'failed' ? "border-red-600 bg-red-50" :
                                                item.status === 'rejected' ? "border-orange-500 bg-orange-50" :
                                                    item.status === 'pending_approval' ? "border-yellow-600 bg-yellow-50" :
                                                        "border-neutral-300 bg-neutral-50"
                                    )}>
                                        {getStatusIcon(item.status, item.approval_status)}
                                    </div>
                                    {index < items.length - 1 && (
                                        <div className="w-0.5 h-8 bg-neutral-200 -mb-4" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={cn(
                                            "px-2 py-0.5 text-[9px] font-black uppercase tracking-widest",
                                            item.status === 'completed' ? "bg-green-600 text-white" :
                                                item.status === 'failed' ? "bg-red-600 text-white" :
                                                    item.status === 'rejected' ? "bg-orange-500 text-white" :
                                                        item.status === 'pending_approval' ? "bg-yellow-400 text-black" :
                                                            "bg-neutral-200 text-black"
                                        )}>
                                            {getStatusLabel(item.status, item.approval_status)}
                                        </span>
                                        <span className="text-[10px] font-bold text-black/40 uppercase">
                                            {item.task_type.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <p className="text-xs font-bold text-black truncate">
                                        {item.current_step || 'Task initialized'}
                                    </p>
                                    <p className="text-[10px] text-black/40 mt-1">
                                        {format(new Date(item.created_at), 'MMM d, yyyy HH:mm')} • {postTitle?.substring(0, 30)}...
                                    </p>
                                </div>

                                {/* PR Link if exists */}
                                {item.github_prs?.[0] && (
                                    <a
                                        href={item.github_prs[0].pr_url}
                                        target="_blank"
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex items-center gap-1 px-3 py-1 bg-black text-white text-[10px] font-black uppercase hover:bg-neutral-800 transition-colors"
                                    >
                                        <GitPullRequest className="size-3" />
                                        PR #{item.github_prs[0].pr_number}
                                        <ExternalLink className="size-3" />
                                    </a>
                                )}

                                {/* Expand/Collapse */}
                                {isExpanded ? <ChevronUp className="size-5 text-black/40" /> : <ChevronDown className="size-5 text-black/40" />}
                            </button>

                            {/* Expanded Details */}
                            {isExpanded && (
                                <div className="px-6 pb-4 pl-20 animate-in fade-in slide-in-from-top-2 duration-200">
                                    {/* Files Modified */}
                                    {item.generated_code?.length > 0 && (
                                        <div className="mb-3">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-2">Files Modified</p>
                                            <div className="flex flex-wrap gap-2">
                                                {item.generated_code.map((gc, idx) => (
                                                    <span key={idx} className="px-2 py-1 bg-neutral-100 border border-black text-[10px] font-mono">
                                                        {gc.file_path}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Error Message */}
                                    {item.status === 'failed' && item.result?.error && (
                                        <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                                            <span className="font-black">Error:</span> {item.result.error}
                                        </div>
                                    )}

                                    {/* Logs Preview */}
                                    {item.logs?.length > 0 && (
                                        <div className="mt-3">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-2">Execution Log</p>
                                            <div className="bg-neutral-900 p-3 max-h-32 overflow-y-auto text-[10px] font-mono text-green-400">
                                                {item.logs.slice(-5).map((log, idx) => (
                                                    <div key={idx} className="mb-1">
                                                        <span className="text-neutral-500">{log.timestamp?.split('T')[1]?.split('.')[0] || '...'}</span>
                                                        {' '}{log.message}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
