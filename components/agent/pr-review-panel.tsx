"use client"

import * as React from "react"
import { createClient } from "@/utils/supabase/client"
import { Check, X, Code2, Github, Loader2, ChevronDown, ChevronUp } from "lucide-react"

export function PRReviewPanel() {
    const [tasks, setTasks] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)
    const [processing, setProcessing] = React.useState<string | null>(null)
    const [expandedTask, setExpandedTask] = React.useState<string | null>(null)

    const supabase = createClient()

    const fetchTasks = React.useCallback(async () => {
        const { data, error } = await supabase
            .from('agent_tasks')
            .select(`
                *,
                monitored_posts (repo_id)
            `)
            .eq('task_type', 'generate_code')
            .order('created_at', { ascending: false });

        if (data) setTasks(data);
        setLoading(false);
    }, [supabase]);

    React.useEffect(() => {
        fetchTasks();
        const channel = supabase
            .channel('agent_tasks_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'agent_tasks' }, () => {
                fetchTasks();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); }
    }, [fetchTasks, supabase]);

    const handleApprove = async (taskId: string) => {
        setProcessing(taskId);

        try {
            const { createPullRequestAction } = await import("@/app/actions/agent");
            const result = await createPullRequestAction(taskId);

            if (result.success) {
                await supabase.from('agent_tasks').update({ status: 'completed' }).eq('id', taskId);
                window.open(result.url, '_blank');
            } else {
                console.error(result.error);
                await supabase.from('agent_tasks').update({ status: 'failed' }).eq('id', taskId);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setProcessing(null);
            fetchTasks();
        }
    }

    if (loading) return null;

    return (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Code Proposas (PR Queue)</h3>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                        {tasks.filter(t => t.status === 'pending').length} Pending
                    </span>
                </div>

                <div className="space-y-3">
                    {tasks.map((task) => (
                        <div key={task.id} className="border rounded-md overflow-hidden bg-background/50">
                            <div
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-accent/5 transition-colors"
                                onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-md ${task.status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                        <Code2 className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Implementation Proposa for {task.monitored_posts?.repo_id || 'Unknown Repo'}</p>
                                        <p className="text-xs text-muted-foreground">ID: {task.id.substring(0, 8)} • {task.status}</p>
                                    </div>
                                </div>
                                {expandedTask === task.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </div>

                            {expandedTask === task.id && (
                                <div className="px-4 pb-4 border-t pt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                    <div className="bg-black/5 rounded p-3">
                                        <p className="text-xs font-mono text-muted-foreground mb-1 uppercase tracking-tighter">Proposed Logic Change</p>
                                        <p className="text-sm text-foreground/80">
                                            {task.result?.reason || "Analyzing community feedback for optimal PR strategy..."}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            disabled={task.status !== 'pending' || !!processing}
                                            onClick={() => handleApprove(task.id)}
                                            className="flex-1 flex items-center justify-center gap-2 bg-black text-white px-3 py-2 rounded text-xs font-medium hover:bg-gray-800 disabled:opacity-50"
                                        >
                                            {processing === task.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                            Approve & Generate PR
                                        </button>
                                        <button
                                            disabled={task.status !== 'pending' || !!processing}
                                            className="flex items-center justify-center gap-2 border px-3 py-2 rounded text-xs font-medium hover:bg-accent disabled:opacity-50"
                                        >
                                            <X className="h-3 w-3" />
                                            Dismiss
                                        </button>
                                        <button className="p-2 border rounded hover:bg-accent transition-colors">
                                            <Github className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {tasks.length === 0 && (
                        <div className="text-center py-8 bg-accent/5 rounded-md border border-dashed">
                            <p className="text-sm text-muted-foreground">No pending code proposals in the queue.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
