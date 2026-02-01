
"use client"

import * as React from "react"
import { Terminal, ChevronRight, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Log {
    timestamp: string;
    message: string;
}

export function ExecutionTrace({ logs, status, currentStep }: { logs: Log[], status: string, currentStep?: string }) {
    const scrollRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [logs])

    return (
        <div className="border-4 border-black bg-[#0A0A0A] text-[#EDEDED] font-mono shadow-brutalist overflow-hidden flex flex-col h-[300px]">
            {/* Header */}
            <div className="bg-black border-b-2 border-white/10 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Terminal className="size-3 text-white/40" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Live Execution Trace</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "size-1.5 rounded-full animate-pulse",
                            status === 'completed' ? "bg-green-500" : status === 'failed' ? "bg-red-500" : "bg-blue-400"
                        )} />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{status}</span>
                    </div>
                </div>
            </div>

            {/* Logs Window */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
            >
                {logs.length === 0 && (
                    <div className="flex items-center gap-2 text-white/20 italic text-[10px]">
                        <ChevronRight className="size-3" />
                        Waiting for agent initialization...
                    </div>
                )}
                {logs.map((log, i) => (
                    <div key={i} className="flex gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                        <span className="text-white/20 text-[9px] mt-0.5 shrink-0">
                            [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                        </span>
                        <p className={cn(
                            "text-xs leading-relaxed",
                            log.message.includes('ERROR') ? "text-red-400" :
                                log.message.includes('PR #') ? "text-green-400" : "text-white/80"
                        )}>
                            <span className="text-white/40 mr-2">$</span>
                            {log.message}
                        </p>
                    </div>
                ))}
            </div>

            {/* Status Bar */}
            <div className="bg-white/5 px-4 py-2 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-[9px] font-bold uppercase text-white/30 italic">Current Node:</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                        {currentStep || "Idle"}
                    </span>
                </div>
                <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
                    v2.0 // SYNC_ACTIVE
                </div>
            </div>
        </div>
    )
}
