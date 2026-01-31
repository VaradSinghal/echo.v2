"use client"

import * as React from "react"
import { createClient } from "@/utils/supabase/client"
import { formatDistanceToNow } from "date-fns"
import { Activity } from "lucide-react"

export function ActivityFeed() {
    const [tasks, setTasks] = React.useState<any[]>([])
    const supabase = createClient()

    React.useEffect(() => {
        // Initial fetch
        supabase.from('agent_tasks').select('*').order('created_at', { ascending: false }).limit(10)
            .then(({ data }) => {
                if (data) setTasks(data)
            })

        // Realtime
        const channel = supabase.channel('agent-activity')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_tasks' }, (payload) => {
                setTasks(prev => [payload.new, ...prev].slice(0, 10))
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase])

    return (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    Live Agent Activity
                </h3>
                <div className="space-y-4">
                    {tasks.map(task => (
                        <div key={task.id} className="flex flex-col gap-1 border-l-2 border-muted pl-4 py-1">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium capitalize">{task.task_type.replace('_', ' ')}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${task.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {task.status}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}</p>
                        </div>
                    ))}
                    {tasks.length === 0 && <p className="text-sm text-muted-foreground">No recent activity.</p>}
                </div>
            </div>
        </div>
    )
}
