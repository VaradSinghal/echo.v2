"use client"

import * as React from "react"
import { createClient } from "@/utils/supabase/client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { Activity, MessageSquare, GitPullRequest, TrendingUp, AlertCircle } from "lucide-react"

export function AnalyticsDashboard({ selectedRepo }: { selectedRepo: string }) {
    const [stats, setStats] = React.useState<any>(null)
    const [loading, setLoading] = React.useState(true)
    const supabase = createClient()

    React.useEffect(() => {
        const fetchStats = async () => {
            setLoading(true)

            // Build filters
            let commentQuery = supabase.from('comments').select('*', { count: 'exact', head: true })
            let analysisQuery = supabase.from('feedback_analysis').select('category')
            let taskQuery = supabase.from('agent_tasks').select('*', { count: 'exact', head: true })
            let prQuery = supabase.from('github_prs').select('*', { count: 'exact', head: true })

            if (selectedRepo !== "all") {
                // To filter comments by repo, we need to join with posts
                // Note: supabase-js count head doesn't support complex joins easily, 
                // so we might need to fetch IDs or use a view. 
                // For now, let's filter related tables.

                const { data: repoPosts } = await supabase.from('posts').select('id').eq('repo_link', selectedRepo)
                const postIds = (repoPosts || []).map(p => p.id)

                if (postIds.length > 0) {
                    commentQuery = commentQuery.in('post_id', postIds)

                    // For analysis, we join comments -> feedback_analysis
                    // Actually feedback_analysis has comment_id
                    const { data: repoComments } = await supabase.from('comments').select('id').in('post_id', postIds)
                    const commentIds = (repoComments || []).map(c => c.id)

                    if (commentIds.length > 0) {
                        analysisQuery = analysisQuery.in('comment_id', commentIds)
                    } else {
                        analysisQuery = analysisQuery.eq('id', '00000000-0000-0000-0000-000000000000') // Force empty
                    }

                    // For tasks, monitored_posts has repo_id
                    taskQuery = taskQuery.filter('monitored_posts.repo_id', 'eq', selectedRepo)
                    // prQuery = prQuery.filter('repo_name', 'eq', selectedRepo) // adjust as per schema
                } else {
                    // Reset all if no posts found
                    setStats({ totalComments: 0, analyzed: 0, tasksRun: 0, prsOpened: 0, categories: [] })
                    setLoading(false)
                    return
                }
            }

            const { count: commentCount } = await commentQuery
            const { data: categories } = await analysisQuery
            const { count: taskCount } = await taskQuery
            const { count: prCount } = await prQuery

            const catMap = (categories || []).reduce((acc: any, curr: any) => {
                acc[curr.category] = (acc[curr.category] || 0) + 1
                return acc
            }, {})

            const chartData = Object.entries(catMap).map(([name, value]) => ({ name, value }))

            setStats({
                totalComments: commentCount || 0,
                analyzed: categories?.length || 0,
                tasksRun: taskCount || 0,
                prsOpened: prCount || 0,
                categories: chartData
            })
            setLoading(false)
        }

        fetchStats()
    }, [supabase, selectedRepo])

    if (loading) return null

    const metrics = [
        { label: "Comments", value: stats.totalComments, icon: MessageSquare, color: "text-blue-500" },
        { label: "Analysis Done", value: stats.analyzed, icon: Activity, color: "text-green-500" },
        { label: "Agent Tasks", value: stats.tasksRun, icon: TrendingUp, color: "text-purple-500" },
        { label: "PRs Opened", value: stats.prsOpened, icon: GitPullRequest, color: "text-orange-500" },
    ]

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {metrics.map((m, i) => (
                    <div key={i} className="rounded-lg border bg-card p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <m.icon className={`h-4 w-4 ${m.color}`} />
                            <span className="text-xs font-medium text-muted-foreground">{m.label}</span>
                        </div>
                        <p className="text-2xl font-bold mt-2">{m.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <h3 className="text-sm font-semibold mb-6 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" /> Feedback Categories
                    </h3>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.categories}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Bar dataKey="value" fill="currentColor" className="fill-primary" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="rounded-lg border bg-card p-6 shadow-sm border-dashed flex flex-col items-center justify-center text-center">
                    <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                    <h3 className="text-sm font-semibold">Agent Latency & Error Tracking</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                        Monitoring real-time API response times and Gemini quota usage.
                    </p>
                    <div className="mt-4 flex gap-2">
                        <div className="h-1.5 w-12 rounded-full bg-green-500" />
                        <div className="h-1.5 w-12 rounded-full bg-green-500" />
                        <div className="h-1.5 w-12 rounded-full bg-muted" />
                    </div>
                </div>
            </div>
        </div>
    )
}
