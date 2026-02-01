"use client"

import * as React from "react"
import { MonitoringPanel } from "@/components/agent/monitoring-panel"
import { SentimentChart } from "@/components/agent/sentiment-chart"
import { ActivityFeed } from "@/components/agent/activity-feed"
import { SemanticSearch } from "@/components/agent/semantic-search"
import { PRReviewPanel } from "@/components/agent/pr-review-panel"
import { AnalyticsDashboard } from "@/components/agent/analytics-dashboard"
import { createClient } from "@/utils/supabase/client"
import { Play, Loader2 } from "lucide-react"

export default function AgentDashboard() {
    const [selectedRepo, setSelectedRepo] = React.useState<string>("all")
    const [monitoredRepos, setMonitoredRepos] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(false)
    const supabase = createClient()

    React.useEffect(() => {
        const fetchRepos = async () => {
            const { data } = await supabase
                .from('monitored_posts')
                .select('id, repo_id')
                .eq('is_active', true)
            if (data) setMonitoredRepos(data)
        }
        fetchRepos()
    }, [supabase])

    const triggerAnalysis = async () => {
        setLoading(true)
        try {
            await fetch('/api/agent/run', { method: 'POST' })
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold tracking-tight">Agent Command Center</h1>

                <div className="flex items-center gap-3">
                    <select
                        value={selectedRepo}
                        onChange={(e) => setSelectedRepo(e.target.value)}
                        className="flex h-9 w-[200px] items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <option value="all">All Repositories</option>
                        {monitoredRepos.map(repo => (
                            <option key={repo.id} value={repo.repo_id}>
                                {repo.repo_id}
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={triggerAnalysis}
                        disabled={loading}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Run Full Audit
                    </button>
                </div>
            </div>

            <AnalyticsDashboard selectedRepo={selectedRepo} />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4 space-y-6">
                    <PRReviewPanel selectedRepo={selectedRepo} />
                    <SemanticSearch selectedRepo={selectedRepo} />
                    <SentimentChart selectedRepo={selectedRepo} />
                </div>
                <div className="col-span-3 space-y-6">
                    <ActivityFeed selectedRepo={selectedRepo} />
                    <MonitoringPanel selectedRepo={selectedRepo} />
                </div>
            </div>
        </div>
    )
}
