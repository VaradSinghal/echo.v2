"use client"

import * as React from "react"
import { createClient } from "@/utils/supabase/client"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Terminal, CheckCircle2, XCircle, Loader2, Code, FileText, ExternalLink } from "lucide-react"

interface LogEntry {
    timestamp: string
    message: string
    status?: 'processing' | 'success' | 'failed'
}

interface AgentTerminalProps {
    taskId: string
    onClose?: () => void
}

export function AgentTerminal({ taskId, onClose }: AgentTerminalProps) {
    const [logs, setLogs] = React.useState<LogEntry[]>([])
    const [status, setStatus] = React.useState<string>('initializing')
    const [currentStep, setCurrentStep] = React.useState<string>('')
    const [generatedCode, setGeneratedCode] = React.useState<any>(null)
    const [result, setResult] = React.useState<any>(null)
    const supabase = createClient()
    const scrollRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        if (!taskId) return

        // Initial fetch
        const fetchTask = async () => {
            const { data } = await supabase
                .from('agent_tasks')
                .select('*, generated_code(*)')
                .eq('id', taskId)
                .single()

            if (data) {
                setLogs(data.logs || [])
                setStatus(data.status)
                setCurrentStep(data.current_step)
                setResult(data.result)
                if (data.generated_code && data.generated_code.length > 0) {
                    setGeneratedCode(data.generated_code[0])
                }
            }
        }

        fetchTask()

        // Realtime subscription
        const channel = supabase
            .channel(`agent-task-${taskId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'agent_tasks',
                    filter: `id=eq.${taskId}`
                },
                (payload) => {
                    const newData = payload.new as any
                    setLogs(newData.logs || [])
                    setStatus(newData.status)
                    setCurrentStep(newData.current_step)
                    setResult(newData.result)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [taskId, supabase])

    // Auto-scroll to bottom
    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [logs])

    const getStatusColor = (s: string) => {
        switch (s) {
            case 'completed': return 'text-green-500'
            case 'failed': return 'text-red-500'
            default: return 'text-yellow-500'
        }
    }

    return (
        <div className="flex flex-col h-[500px] bg-black text-green-400 font-mono text-sm rounded-lg border border-gray-800 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900/50">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    <span className="font-semibold">Agent Terminal</span>
                    <Badge variant="outline" className={`ml-2 capitalize ${getStatusColor(status)} bg-transparent border-current`}>
                        {status}
                    </Badge>
                </div>
                {onClose && (
                    <button onClick={onClose} className="text-gray-500 hover:text-white">
                        <XCircle className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Logs Column */}
                <div className="flex-1 flex flex-col min-w-0 border-r border-gray-800">
                    <div className="bg-gray-900/30 p-2 text-xs text-gray-400 border-b border-gray-800 flex justify-between">
                        <span>Output Log</span>
                        <span>{taskId.split('-')[0]}...</span>
                    </div>
                    <ScrollArea className="flex-1 p-4">
                        <div className="space-y-1">
                            {logs.map((log, i) => (
                                <div key={i} className="flex gap-2">
                                    <span className="text-gray-500 shrink-0">
                                        [{new Date(log.timestamp).toLocaleTimeString()}]
                                    </span>
                                    <span className={log.message.includes('ERROR') ? 'text-red-400' : 'text-green-300'}>
                                        {log.message.startsWith('>') ? log.message : `> ${log.message}`}
                                    </span>
                                </div>
                            ))}
                            <div ref={scrollRef} />
                        </div>
                    </ScrollArea>
                </div>

                {/* Status/Details Column (if space permits) */}
                <div className="w-[300px] bg-gray-900/20 flex flex-col border-l border-gray-800 hidden md:flex">
                    <div className="bg-gray-900/30 p-2 text-xs text-gray-400 border-b border-gray-800">
                        Task Context
                    </div>
                    <div className="p-4 space-y-6">
                        {/* Current Step */}
                        <div>
                            <h4 className="text-gray-500 text-xs uppercase tracking-wider mb-2">Current Activity</h4>
                            <div className="flex items-center gap-2 p-2 bg-gray-900/50 rounded border border-gray-800">
                                {status === 'processing' && <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />}
                                {status === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                {status === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
                                <span className="text-white truncate">{currentStep || "Initializing..."}</span>
                            </div>
                        </div>

                        {/* Result / PR */}
                        {status === 'completed' && currentStep.includes('PR Link') && (
                            <div>
                                <h4 className="text-gray-500 text-xs uppercase tracking-wider mb-2">Result</h4>
                                <a
                                    href={currentStep.split('PR Link: ')[1]}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-800/50 rounded hover:bg-green-900/30 transition-colors text-green-400"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    <span>View Pull Request</span>
                                </a>
                            </div>
                        )}

                        {/* Generated Code Preview (Simplified) */}
                        {/* We won't show the full code here to keep it clean, maybe just a stat */}
                        {generatedCode && (
                            <div>
                                <h4 className="text-gray-500 text-xs uppercase tracking-wider mb-2">Generated Artifacts</h4>
                                <div className="flex items-center gap-2 text-gray-300">
                                    <FileText className="w-4 h-4" />
                                    <span className="text-sm">{generatedCode.file_path}</span>
                                </div>
                            </div>
                        )}

                        {/* Error Details */}
                        {status === 'failed' && result?.error && (
                            <div className="mt-4 p-3 bg-red-900/20 border border-red-800/50 rounded text-red-300 text-xs break-words">
                                ERROR: {result.error}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
