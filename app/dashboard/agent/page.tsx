"use client"

import * as React from "react"
import { MonitoringPanel } from "@/components/agent/monitoring-panel"
import { SentimentChart } from "@/components/agent/sentiment-chart"
import { ActivityFeed } from "@/components/agent/activity-feed"
import { createClient } from "@/utils/supabase/client"
import { Play } from "lucide-react"

export default function AgentDashboard() {
    const [loading, setLoading] = React.useState(false)

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
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Agent Command Center</h1>
                <button
                    onClick={triggerAnalysis}
                    disabled={loading}
                    className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50"
                >
                    <Play className="h-4 w-4" />
                    {loading ? 'Running Analysis...' : 'Run Analysis Now'}
                </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4 space-y-6">
                    <SentimentChart />
                    <MonitoringPanel />
                </div>
                <div className="col-span-3">
                    <ActivityFeed />
                </div>
            </div>
        </div>
    )
}
