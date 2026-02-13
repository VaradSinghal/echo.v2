"use client";

import { useState } from "react";
import { generateReportAction, getTopCommentAction } from "@/app/actions/agent";
import { Sparkles, FileText, MessageSquare, Loader2, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";

export function LocalInsights() {
    const [report, setReport] = useState<string | null>(null);
    const [topComment, setTopComment] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingTop, setLoadingTop] = useState(false);

    const handleGenerateReport = async () => {
        setLoading(true);
        setReport(null);
        try {
            const res = await generateReportAction();
            if (res.error) {
                setReport(`⚠️ Error: ${res.error}`);
            } else {
                setReport(res.report || "No report generated.");
            }
        } catch (e) {
            setReport("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const handleGetTopComment = async () => {
        setLoadingTop(true);
        setTopComment(null);
        try {
            const res = await getTopCommentAction();
            if (res.error) {
                // handle error silently or show toast
                console.error(res.error);
            } else {
                setTopComment(res.top_comment);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingTop(false);
        }
    };

    return (
        <div className="grid gap-8 md:grid-cols-2 mt-8">
            {/* Daily Report Card */}
            <div className="group relative">
                <div className="absolute inset-0 bg-black translate-x-1.5 translate-y-1.5 transition-transform group-hover:translate-x-3 group-hover:translate-y-3" />
                <div className="relative border-4 border-black bg-white p-6 md:p-8 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="size-12 bg-black flex items-center justify-center">
                                <FileText className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">Daily Insight</h3>
                                <div className="flex items-center gap-2">
                                    <span className="size-2 bg-indigo-500 animate-pulse" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-black/40">Neural Analysis Active</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleGenerateReport}
                            disabled={loading}
                            className="bg-black text-white px-6 py-3 font-black text-xs uppercase tracking-widest transition-all hover:bg-indigo-600 disabled:opacity-50 flex items-center gap-3 active:translate-x-1 active:translate-y-1"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            Decode
                        </button>
                    </div>

                    <div className="flex-1 bg-neutral-100 border-2 border-black p-6 relative overflow-hidden group/content">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 -rotate-12 translate-x-16 -translate-y-16" />

                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full py-12 space-y-4">
                                <Loader2 className="h-10 w-10 animate-spin text-black" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Scanning Frequencies...</span>
                            </div>
                        ) : report ? (
                            <div className="prose prose-sm max-w-none text-black selection:bg-indigo-500 selection:text-white max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                                <ReactMarkdown>{report}</ReactMarkdown>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-black/20 py-12">
                                <FileText className="h-16 w-16 mb-4 opacity-10" />
                                <p className="text-[10px] font-black uppercase tracking-[0.3em]">No telemetry data processed</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 pt-6 border-t-2 border-black/10 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-black/40">
                        <span>Sector: AI-01</span>
                        <span>Level: Deep Intelligence</span>
                    </div>
                </div>
            </div>

            {/* Top Comment Card */}
            <div className="group relative">
                <div className="absolute inset-0 bg-black translate-x-1.5 translate-y-1.5 transition-transform group-hover:translate-x-3 group-hover:translate-y-3" />
                <div className="relative border-4 border-black bg-white p-6 md:p-8 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="size-12 bg-black flex items-center justify-center">
                                <MessageSquare className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">Community Spotlight</h3>
                                <div className="flex items-center gap-2">
                                    <span className="size-2 bg-amber-500 animate-pulse" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-black/40">High Resonance Detected</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleGetTopComment}
                            disabled={loadingTop}
                            className="border-4 border-black p-3 hover:bg-black hover:text-white transition-all active:translate-x-1 active:translate-y-1"
                        >
                            <RefreshCw className={`h-4 w-4 ${loadingTop ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    <div className="flex-1 border-4 border-black bg-amber-50 p-8 flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 p-2 text-black/5 opacity-20 pointer-events-none select-none italic font-black text-6xl">VOICE</div>

                        {loadingTop ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-10 w-10 animate-spin text-black" />
                            </div>
                        ) : topComment ? (
                            <div className="space-y-8 relative z-10">
                                <div className="relative">
                                    <span className="text-black font-medium text-xl leading-relaxed tracking-tight italic">
                                        "{topComment.content}"
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <div className="border-2 border-black bg-black text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                                        PRIORITY {topComment.priority?.toFixed(2)}
                                    </div>
                                    <div className="border-2 border-black bg-white text-black px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                                        {topComment.category || 'GENERAL'}
                                    </div>
                                    <div className="border-2 border-black bg-indigo-500 text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                                        SENTIMENT {topComment.score?.toFixed(2)}
                                    </div>
                                </div>

                                {topComment.summary && (
                                    <div className="mt-4 p-4 border-l-4 border-black bg-black/5">
                                        <p className="text-xs font-bold uppercase tracking-tight text-black/60 mb-1 italic">Actionable Summary:</p>
                                        <p className="text-sm font-black text-black leading-tight italic">
                                            {topComment.summary}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/20 mb-6">Awaiting Signal Isolation</p>
                                <button
                                    onClick={handleGetTopComment}
                                    className="text-black font-black uppercase tracking-widest text-xs border-b-4 border-black hover:bg-black hover:text-white px-2 transition-colors"
                                >
                                    Isolate Frequency
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 pt-6 border-t-2 border-black/10 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-black/40">
                        <span>Node: Community-E01</span>
                        <span>Protocol: Spotlight-V3</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
