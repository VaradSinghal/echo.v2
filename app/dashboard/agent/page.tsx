"use client"

import * as React from "react"
import { MonitoringPanel } from "@/components/agent/monitoring-panel"
import { SentimentChart } from "@/components/agent/sentiment-chart"
import { ActivityFeed } from "@/components/agent/activity-feed"
import { SemanticSearch } from "@/components/agent/semantic-search"
import { PRReviewPanel } from "@/components/agent/pr-review-panel"
import { WorkHistoryPanel } from "@/components/agent/work-history-panel"
import { AnalyticsDashboard } from "@/components/agent/analytics-dashboard"
import { createClient } from "@/utils/supabase/client"
import { Play, Loader2 } from "lucide-react"

export default function AgentDashboard() {
    const [selectedRepo, setSelectedRepo] = React.useState<string>("")
    const [monitoredRepos, setMonitoredRepos] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(false)
    const supabase = createClient()

    React.useEffect(() => {
        const fetchRepos = async () => {
            const { data } = await supabase
                .from('monitored_posts')
                .select('id, repo_id')
                .eq('is_active', true)
            if (data && data.length > 0) {
                // Deduplicate by repo_id
                const uniqueRepos = Array.from(new Set(data.map(r => r.repo_id))).map(repoId => {
                    return data.find(r => r.repo_id === repoId)
                })
                setMonitoredRepos(uniqueRepos)
                if (uniqueRepos[0]) {
                    setSelectedRepo(uniqueRepos[0].repo_id)
                }
            }
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
        <div className="flex flex-col gap-12 pt-4">
            {/* Minimalist Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b-2 border-black pb-8">
                <div>
                    <div className="inline-flex items-center gap-2 mb-4">
                        <Play className="h-4 w-4 fill-black" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-black">Agent Subsystem</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-black">Mission Control</h1>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative w-full sm:w-[300px]">
                        <label className="absolute -top-6 left-0 text-[10px] font-black uppercase tracking-widest text-black/30">Select Active Node</label>
                        <select
                            value={selectedRepo}
                            onChange={(e) => setSelectedRepo(e.target.value)}
                            className="w-full border-2 border-black bg-white px-4 py-3 text-xs font-black uppercase tracking-widest focus:outline-none appearance-none rounded-none shadow-brutalist active:translate-y-[2px] active:shadow-none"
                        >
                            {monitoredRepos.length === 0 && <option value="">NO ACTIVE REPOS</option>}
                            {monitoredRepos.map(repo => (
                                <option key={repo.id} value={repo.repo_id}>
                                    {repo.repo_id.toUpperCase()}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={triggerAnalysis}
                        disabled={loading || monitoredRepos.length === 0}
                        className="btn-solid text-[10px] tracking-[0.2em] px-8 py-3 w-full sm:w-auto flex items-center justify-center gap-3"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-white" />}
                        SYNC AGENT
                    </button>
                </div>
            </div>

            {/* Focused Content Area */}
            <div className="max-w-6xl mx-auto w-full">
                {selectedRepo ? (
                    <div className="space-y-24">
                        <AnalyticsDashboard selectedRepo={selectedRepo} />

                        <div className="space-y-8">
                            <h2 className="text-2xl font-black uppercase tracking-tighter">Live Operations</h2>
                            <MonitoringPanel selectedRepo={selectedRepo} />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <PRReviewPanel selectedRepo={selectedRepo} />
                            <WorkHistoryPanel selectedRepo={selectedRepo} />
                        </div>
                    </div>
                ) : (
                    <div className="border-2 border-dashed border-black/10 p-24 text-center">
                        <p className="text-xs font-black uppercase tracking-widest text-black/10">
                            Initialize a repository from the feed to start monitoring.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
