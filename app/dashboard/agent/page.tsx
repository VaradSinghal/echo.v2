"use client"

import * as React from "react"
import { WorkHistoryPanel } from "@/components/agent/work-history-panel"
import { AnalyticsDashboard } from "@/components/agent/analytics-dashboard"
import { AgentHistoryTimeline } from "@/components/agent/agent-history-timeline"
import { createClient } from "@/utils/supabase/client"
import { Play, Loader2, Bot } from "lucide-react"

export default function AgentDashboard() {
    const [selectedRepo, setSelectedRepo] = React.useState<string>("")
    const [selectedPostId, setSelectedPostId] = React.useState<string>("")
    const [monitoredItems, setMonitoredItems] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(false)
    const supabase = createClient()

    React.useEffect(() => {
        const fetchMonitoredItems = async () => {
            console.log("🤖 AgentDashboard: Fetching monitored items for user...");

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('monitored_posts')
                .select(`
                    id, 
                    repo_id,
                    post_id,
                    posts!inner (user_id, title)
                `)
                .eq('is_active', true)
                .eq('posts.user_id', user.id)

            if (error) console.error("🤖 AgentDashboard: Fetch Error:", error);

            if (data && data.length > 0) {
                console.log(`🤖 AgentDashboard: Found ${data.length} monitored records.`, data);
                setMonitoredItems(data)

                // Select first item if nothing selected
                if (!selectedRepo) {
                    const first = data[0]
                    setSelectedRepo(first.repo_id)
                    setSelectedPostId(first.post_id)
                }
            } else {
                console.log("🤖 AgentDashboard: No monitored repos found.");
            }
        }
        fetchMonitoredItems()
    }, [supabase, selectedRepo]) // We keep selectedRepo in dep array but maybe not needed if we fetch once

    const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const postId = e.target.value
        setSelectedPostId(postId)
        if (postId) {
            const item = monitoredItems.find(i => i.post_id === postId)
            if (item) setSelectedRepo(item.repo_id)
        } else {
            setSelectedRepo("")
        }
    }

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
        <div className="flex flex-col gap-8 md:gap-12 pt-4">
            {/* Minimalist Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b-2 border-black pb-8">
                <div>
                    <div className="inline-flex items-center gap-2 mb-4">
                        <Play className="h-3 w-3 md:h-4 md:w-4 fill-black" />
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-black">Agent Subsystem</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase text-black">Mission Control</h1>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                    <div className="relative w-full sm:w-[300px]">
                        <label className="absolute -top-6 left-0 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-black/30">Select Active Node</label>
                        <select
                            value={selectedPostId}
                            onChange={handleSelectionChange}
                            className="w-full border-2 border-black bg-white px-4 py-3 text-[10px] md:text-xs font-black uppercase tracking-widest focus:outline-none appearance-none rounded-none shadow-brutalist active:translate-y-[2px] active:shadow-none"
                        >
                            {monitoredItems.length === 0 && <option value="">NO ACTIVE REPOS</option>}
                            {monitoredItems.map(item => (
                                <option key={item.post_id} value={item.post_id}>
                                    {item.repo_id.split('/').pop()?.toUpperCase()} • {item.posts.title.substring(0, 15)}...
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={triggerAnalysis}
                        disabled={loading || monitoredItems.length === 0}
                        className="btn-solid text-[8px] md:text-[10px] tracking-[0.2em] px-6 md:px-8 py-3 w-full sm:w-auto flex items-center justify-center gap-3"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-3 w-3 md:h-4 md:w-4 fill-white" />}
                        SYNC AGENT
                    </button>
                </div>
            </div>

            {/* Focused Content Area */}
            <div className="max-w-6xl mx-auto w-full px-0 sm:px-4">
                {selectedRepo ? (
                    <div className="space-y-16 md:space-y-24">
                        <AnalyticsDashboard selectedRepo={selectedRepo} selectedPostId={selectedPostId} />

                        <div className="grid grid-cols-1 gap-8 md:gap-12">
                            <WorkHistoryPanel selectedRepo={selectedRepo} selectedPostId={selectedPostId} />
                        </div>

                        {/* Agent History Timeline */}
                        <AgentHistoryTimeline selectedRepo={selectedRepo} selectedPostId={selectedPostId} />
                    </div>
                ) : (
                    <div className="border-2 border-black/10 p-24 text-center bg-white/50 backdrop-blur-sm">
                        <div className="size-16 border-2 border-black/10 mx-auto mb-8 flex items-center justify-center rotate-45">
                            <Bot className="size-8 text-black/20 -rotate-45" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-black mb-2">No Active Nodes Detected</h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-black/30 mb-8 max-w-xs mx-auto leading-loose">
                            Connect a GitHub repository to a post in the feed to initialize autonomous monitoring.
                        </p>
                        <div className="inline-flex items-center gap-4 py-2 px-4 border border-black/10 rounded-full">
                            <span className="size-2 rounded-full bg-black/10" />
                            <p className="text-[10px] font-bold text-black/20 uppercase tracking-tighter">
                                Found {monitoredItems.length} active monitors in total
                            </p>
                            <span className="size-2 rounded-full bg-black/10" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
