import * as React from "react"
import { createClient } from "@/utils/supabase/client"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, TerminalSquare, X, Database } from "lucide-react"
import { cn } from "@/lib/utils"
import { AgentTerminal } from "./agent-terminal"

export function MonitoringPanel({ selectedRepo }: { selectedRepo: string }) {
    const [monitoredPosts, setMonitoredPosts] = React.useState<any[]>([])
    const [recentTasks, setRecentTasks] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)
    const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null)
    const supabase = createClient()

    React.useEffect(() => {
        fetchData()

        // Subscribe to new tasks
        const taskChannel = supabase
            .channel('agent-tasks-monitor')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_tasks' }, (payload) => {
                setRecentTasks(prev => [payload.new, ...prev].slice(0, 5))
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'agent_tasks' }, (payload) => {
                setRecentTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new : t))
            })
            .subscribe()

        return () => {
            supabase.removeChannel(taskChannel)
        }
    }, [])

    const fetchData = async () => {
        setLoading(true)
        const [postsRes, tasksRes] = await Promise.all([
            supabase.from('monitored_posts').select(`*, posts (title)`),
            supabase.from('agent_tasks').select('*').order('created_at', { ascending: false }).limit(5)
        ])

        if (postsRes.data) setMonitoredPosts(postsRes.data)
        if (tasksRes.data) setRecentTasks(tasksRes.data)
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

    // If a task is selected, show the terminal overlay
    if (selectedTaskId) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Live Agent Protocol</h3>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedTaskId(null)}>
                        <X className="w-4 h-4 mr-2" /> Close Terminal
                    </Button>
                </div>
                <AgentTerminal taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Monitored Repos */}
            <div className="border-4 border-black bg-white shadow-brutalist overflow-hidden">
                <div className="border-b-4 border-black bg-black p-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white flex items-center gap-3">
                        <Database className="size-4" />
                        Global Node status
                    </h3>
                </div>
                <div className="p-6">
                    {monitoredPosts.length === 0 ? (
                        <p className="text-[10px] font-bold uppercase tracking-widest text-black/20 text-center py-10">
                            Zero nodes active in current sector.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {Object.entries(
                                monitoredPosts.reduce((acc: any, post: any) => {
                                    if (!acc[post.repo_id]) acc[post.repo_id] = [];
                                    acc[post.repo_id].push(post);
                                    return acc;
                                }, {})
                            ).map(([repoId, posts]: [string, any]) => (
                                <div key={repoId} className={cn(
                                    "border-2 border-black p-4 transition-all",
                                    selectedRepo === repoId ? "bg-neutral-50 border-l-[12px]" : "bg-white"
                                )}>
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="font-black uppercase tracking-tighter text-xs truncate max-w-[150px]">
                                            {repoId}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-black/30">Signals: {posts.length}</span>
                                            <div className={cn(
                                                "size-2 rounded-full",
                                                posts.some((p: any) => p.is_active) ? "bg-[#00FF41]" : "bg-black/10"
                                            )} />
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {posts.map((item: any) => (
                                            <Badge
                                                key={item.id}
                                                variant="outline"
                                                className={cn(
                                                    "rounded-none border-black text-[8px] font-black uppercase tracking-tighter",
                                                    item.is_active ? "bg-black text-white" : "bg-white text-black/20 border-neutral-100"
                                                )}
                                            >
                                                {item.is_active ? "Active" : "Bypassed"}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Agent Tasks */}
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Recent Agent Activity</h3>
                    {recentTasks.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No recent agent runs.</p>
                    ) : (
                        <div className="space-y-3">
                            {recentTasks.map((task) => (
                                <div key={task.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 cursor-pointer" onClick={() => setSelectedTaskId(task.id)}>
                                    <div className="flex items-center gap-3">
                                        <TerminalSquare className="w-4 h-4 text-primary" />
                                        <div>
                                            <p className="text-sm font-medium capitalize">{task.task_type || 'Agent Run'}</p>
                                            <p className="text-xs text-muted-foreground">{new Date(task.created_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={task.status === 'completed' ? 'default' : task.status === 'failed' ? 'destructive' : 'secondary'}>
                                            {task.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
