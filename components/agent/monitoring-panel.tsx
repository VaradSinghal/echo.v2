"use client"

import * as React from "react"
import { createClient } from "@/utils/supabase/client"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"

export function MonitoringPanel() {
    const [monitoredPosts, setMonitoredPosts] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)
    const supabase = createClient()

    React.useEffect(() => {
        fetchMonitored()
    }, [])

    const fetchMonitored = async () => {
        const { data, error } = await supabase
            .from('monitored_posts')
            .select(`
        *,
        posts (title)
      `)

        if (data) setMonitoredPosts(data)
        setLoading(false)
    }

    const toggleMonitoring = async (id: string, currentState: boolean) => {
        // Optimistic
        setMonitoredPosts(prev => prev.map(p => p.id === id ? { ...p, is_active: !currentState } : p))

        await supabase
            .from('monitored_posts')
            .update({ is_active: !currentState })
            .eq('id', id)
    }

    if (loading) return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />

    return (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Monitored Repositories</h3>
                {monitoredPosts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No posts are currently being monitored.</p>
                ) : (
                    <div className="space-y-4">
                        {monitoredPosts.map((item) => (
                            <div key={item.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                                <div>
                                    <p className="font-medium">{item.repo_id || "Unknown Repo"}</p>
                                    <p className="text-sm text-muted-foreground">Linked Post: {item.posts?.title}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">{item.is_active ? 'Active' : 'Paused'}</span>
                                    <Switch
                                        checked={item.is_active}
                                        onCheckedChange={() => toggleMonitoring(item.id, item.is_active)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
