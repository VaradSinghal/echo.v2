import * as React from "react"
import { createClient } from "@/utils/supabase/client"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, TerminalSquare, X } from "lucide-react"
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
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Monitored Repositories</h3>
                    {monitoredPosts.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No posts are currently being monitored.</p>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(
                                monitoredPosts.reduce((acc: any, post: any) => {
                                    if (!acc[post.repo_id]) acc[post.repo_id] = [];
                                    acc[post.repo_id].push(post);
                                    return acc;
                                }, {})
                            ).map(([repoId, posts]: [string, any]) => (
                                <div key={repoId} className={cn(
                                    "border-2 border-black p-4 shadow-brutalist relative",
                                    selectedRepo === repoId ? "bg-black/5" : "bg-white"
                                )}>
                                    <div className="flex items-center justify-between mb-4 border-b-2 border-black pb-2">
                                        <p className="font-black uppercase tracking-widest text-[10px] md:text-xs truncate max-w-[150px] sm:max-w-[200px]">
                                            {repoId.split('/').pop()}
                                        </p>
                                        <Badge className="bg-black text-white rounded-none text-[7px] md:text-[8px]">
                                            {posts.length} {posts.length === 1 ? 'POST' : 'POSTS'}
                                        </Badge>
                                    </div>

                                    <div className="space-y-4 md:space-y-3">
                                        {posts.map((item: any) => (
                                            <div key={item.id} className="flex items-center justify-between gap-4">
                                                <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-tight text-black/60 truncate italic max-w-[180px] sm:max-w-none">
                                                    {item.posts?.title}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={item.is_active}
                                                        onCheckedChange={() => toggleMonitoring(item.id, item.is_active)}
                                                        className="data-[state=checked]:bg-black scale-90 md:scale-100"
                                                    />
                                                </div>
                                            </div>
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
