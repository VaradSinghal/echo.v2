"use client";

import { useEffect, useState, useRef } from "react";
import { Terminal, ChevronRight, Loader2 } from "lucide-react";

export function LogTerminal() {
    const [logs, setLogs] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchLogs = async () => {
        try {
            const res = await fetch("http://localhost:8000/logs");
            const data = await res.json();
            if (data.logs) {
                setLogs(data.logs);
            }
        } catch (e) {
            console.error("Failed to fetch logs:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 2000); // Poll every 2s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="group relative">
            <div className="absolute inset-0 bg-black translate-x-1.5 translate-y-1.5 transition-transform group-hover:translate-x-3 group-hover:translate-y-3" />
            <div className="relative border-4 border-black bg-[#121212] flex flex-col h-[400px]">
                {/* Terminal Header */}
                <div className="border-b-4 border-black bg-black p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Terminal className="h-4 w-4 text-white" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">System Telemetry</span>
                    </div>
                    <div className="flex gap-2">
                        <div className="size-2 bg-red-500 border border-black" />
                        <div className="size-2 bg-yellow-500 border border-black" />
                        <div className="size-2 bg-green-500 border border-black" />
                    </div>
                </div>

                {/* Terminal Content */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 md:p-6 font-mono text-xs md:text-sm selection:bg-white selection:text-black custom-scrollbar bg-grid-white/[0.02]"
                >
                    {loading && !logs ? (
                        <div className="flex items-center gap-3 text-white/40">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="uppercase tracking-widest text-[10px] font-black">Establishing Neural Link...</span>
                        </div>
                    ) : logs ? (
                        <div className="space-y-1">
                            {logs.split("\n").map((line, i) => {
                                const isError = line.includes("ERROR") || line.includes("❌");
                                const isWarning = line.includes("WARNING") || line.includes("⚠️");
                                const isSuccess = line.includes("INFO") || line.includes("✅") || line.includes("📡") || line.includes("🚀");

                                return (
                                    <div key={i} className="flex gap-4">
                                        <span className="text-white/20 select-none hidden sm:inline">{(i + 1).toString().padStart(3, '0')}</span>
                                        <span className={`break-all ${isError ? "text-red-400 font-bold" :
                                                isWarning ? "text-yellow-400" :
                                                    isSuccess ? "text-green-400" : "text-white/80"
                                            }`}>
                                            {line}
                                        </span>
                                    </div>
                                );
                            })}
                            <div className="flex items-center gap-2 text-white animate-pulse mt-4">
                                <ChevronRight className="h-4 w-4" />
                                <span className="w-2 h-4 bg-white" />
                            </div>
                        </div>
                    ) : (
                        <div className="text-white/20 italic">Awaiting signal transmission...</div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="p-3 border-t-4 border-black bg-black flex items-center justify-between text-[8px] font-black text-white/40 uppercase tracking-widest">
                    <div className="flex items-center gap-4">
                        <span>Status: Online</span>
                        <span className="hidden sm:inline">|</span>
                        <span className="hidden sm:inline">Frequency: 8.4GHz</span>
                    </div>
                    <span>Loc: Edge-Node-Beta</span>
                </div>
            </div>
        </div>
    );
}
