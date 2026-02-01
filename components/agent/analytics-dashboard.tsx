"use client"

import * as React from "react"
import { createClient } from "@/utils/supabase/client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { Activity, MessageSquare, GitPullRequest, TrendingUp, AlertCircle } from "lucide-react"

export function AnalyticsDashboard() {
    const [stats, setStats] = React.useState<any>(null)
    const [loading, setLoading] = React.useState(true)
    const supabase = createClient()

    React.useEffect(() => {
        const fetchStats = async () => {
            // Fetch various metrics
            const { count: commentCount } = await supabase.from('comments').select('*', { count: 'exact', head: true })
            const { count: analysisCount } = await supabase.from('feedback_analysis').select('*', { count: 'exact', head: true })
            const { count: taskCount } = await supabase.from('agent_tasks').select('*', { count: 'exact', head: true })
            const { count: prCount } = await supabase.from('github_prs').select('*', { count: 'exact', head: true })

            // Category breakdown
            const { data: categories } = await supabase.from('feedback_analysis').select('category')
            const catMap = (categories || []).reduce((acc: any, curr: any) => {
                acc[curr.category] = (acc[curr.category] || 0) + 1
                return acc
            }, {})

            const chartData = Object.entries(catMap).map(([name, value]) => ({ name, value }))

            setStats({
                totalComments: commentCount || 0,
                analyzed: analysisCount || 0,
                tasksRun: taskCount || 0,
                prsOpened: prCount || 0,
                categories: chartData
            })
            setLoading(false)
        }

        fetchStats()
    }, [supabase])

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
