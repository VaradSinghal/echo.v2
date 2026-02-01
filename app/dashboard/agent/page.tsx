"use client"

import * as React from "react"
import { MonitoringPanel } from "@/components/agent/monitoring-panel"
import { SentimentChart } from "@/components/agent/sentiment-chart"
import { ActivityFeed } from "@/components/agent/activity-feed"
import { SemanticSearch } from "@/components/agent/semantic-search"
import { PRReviewPanel } from "@/components/agent/pr-review-panel"
import { AnalyticsDashboard } from "@/components/agent/analytics-dashboard"
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
            </div>

            <AnalyticsDashboard />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4 space-y-6">
                    <PRReviewPanel />
                    <SemanticSearch />
                    <SentimentChart />
                </div>
                <div className="col-span-3 space-y-6">
                    <ActivityFeed />
                    <MonitoringPanel />
                </div>
            </div>
        </div>
    )
}
