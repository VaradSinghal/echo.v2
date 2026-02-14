"use client";

import { MessageSquareText, Tag, ChevronUp, Clock, Flame, CheckCircle2, AlertCircle, Circle } from "lucide-react";
import { useState } from "react";

type StatusType = "all" | "open" | "in-progress" | "resolved";
type PriorityType = "critical" | "high" | "medium" | "low";

interface FeedbackItem {
    id: number;
    title: string;
    description: string;
    category: string;
    priority: PriorityType;
    status: "open" | "in-progress" | "resolved";
    votes: number;
    source: string;
    mentions: number;
    createdAt: string;
}

const MOCK_FEEDBACK: FeedbackItem[] = [
    {
        id: 1,
        title: "Dark Mode API Support",
        description: "Multiple developers requesting a dedicated dark mode toggle API for the dashboard components. Current workaround involves manual CSS overrides.",
        category: "Feature Request",
        priority: "high",
        status: "in-progress",
        votes: 342,
        source: "Reddit + GitHub",
        mentions: 47,
        createdAt: "2d ago",
    },
    {
        id: 2,
        title: "WebSocket Connection Drops Under Load",
        description: "Users reporting intermittent WebSocket disconnections when handling 500+ concurrent connections. Affects production deployments.",
        category: "Bug Report",
        priority: "critical",
        status: "open",
        votes: 289,
        source: "GitHub Issues",
        mentions: 23,
        createdAt: "1d ago",
    },
    {
        id: 3,
        title: "Better TypeScript Type Inference",
        description: "SDK type definitions could be more granular. Generic types lose specificity in nested object scenarios.",
        category: "DX Improvement",
        priority: "medium",
        status: "open",
        votes: 178,
        source: "Twitter/X",
        mentions: 31,
        createdAt: "5d ago",
    },
    {
        id: 4,
        title: "Add GraphQL Support",
        description: "Growing demand for native GraphQL support alongside existing REST API. Community has started building unofficial adapters.",
        category: "Feature Request",
        priority: "high",
        status: "open",
        votes: 456,
        source: "Hacker News",
        mentions: 62,
        createdAt: "1w ago",
    },
    {
        id: 5,
        title: "Improve Onboarding Tutorial",
        description: "New users find the getting-started guide too advance. Need a simpler quickstart for beginners.",
        category: "Documentation",
        priority: "medium",
        status: "in-progress",
        votes: 134,
        source: "Dev.to",
        mentions: 18,
        createdAt: "3d ago",
    },
    {
        id: 6,
        title: "Rate Limiting Configuration",
        description: "Enterprise users need more granular rate limiting controls. Current per-key limit is too restrictive for high-traffic apps.",
        category: "Feature Request",
        priority: "high",
        status: "resolved",
        votes: 267,
        source: "Support Tickets",
        mentions: 15,
        createdAt: "2w ago",
    },
    {
        id: 7,
        title: "Python SDK v3 Migration Guide",
        description: "Breaking changes between v2 and v3 need a comprehensive migration guide. Many users stuck on v2.",
        category: "Documentation",
        priority: "low",
        status: "resolved",
        votes: 98,
        source: "GitHub Discussions",
        mentions: 12,
        createdAt: "3w ago",
    },
];

const PRIORITY_STYLES: Record<PriorityType, string> = {
    critical: "bg-red-600 text-white",
    high: "bg-orange-500 text-white",
    medium: "bg-yellow-400 text-black",
    low: "bg-neutral-200 text-black/60",
};

const STATUS_ICONS = {
    "open": <Circle className="size-3.5" />,
    "in-progress": <AlertCircle className="size-3.5 text-[#4285F4]" />,
    "resolved": <CheckCircle2 className="size-3.5 text-green-600" />,
};

export default function FeedbackPage() {
    const [statusFilter, setStatusFilter] = useState<StatusType>("all");
    const [sortBy, setSortBy] = useState<"votes" | "recent">("votes");

    const filtered = MOCK_FEEDBACK
        .filter(f => statusFilter === "all" || f.status === statusFilter)
        .sort((a, b) => sortBy === "votes" ? b.votes - a.votes : 0);

    const stats = {
        total: MOCK_FEEDBACK.length,
        open: MOCK_FEEDBACK.filter(f => f.status === "open").length,
        inProgress: MOCK_FEEDBACK.filter(f => f.status === "in-progress").length,
        resolved: MOCK_FEEDBACK.filter(f => f.status === "resolved").length,
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="size-2 bg-[#4285F4]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Product Intelligence</span>
                </div>
                <h1 className="text-3xl font-black uppercase tracking-tighter text-black">Aggregated Feedback</h1>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: "Total", value: stats.total, color: "bg-black text-white" },
                    { label: "Open", value: stats.open, color: "bg-white text-black" },
                    { label: "In Progress", value: stats.inProgress, color: "bg-[#4285F4]/10 text-[#4285F4]" },
                    { label: "Resolved", value: stats.resolved, color: "bg-green-50 text-green-700" },
                ].map((s) => (
                    <div key={s.label} className={`border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${s.color}`}>
                        <p className="text-3xl font-black">{s.value}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    {(["all", "open", "in-progress", "resolved"] as StatusType[]).map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 border-2 border-black transition-all ${statusFilter === s ? "bg-black text-white" : "bg-white text-black/40 hover:text-black"
                                }`}
                        >
                            {s.replace("-", " ")}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setSortBy("votes")}
                        className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-2 border-2 border-black transition-all ${sortBy === "votes" ? "bg-black text-white" : "bg-white text-black/40"
                            }`}
                    >
                        <Flame className="size-3" /> Top Voted
                    </button>
                    <button
                        onClick={() => setSortBy("recent")}
                        className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-2 border-2 border-black transition-all ${sortBy === "recent" ? "bg-black text-white" : "bg-white text-black/40"
                            }`}
                    >
                        <Clock className="size-3" /> Recent
                    </button>
                </div>
            </div>

            {/* Feedback List */}
            <div className="space-y-4">
                {filtered.map((item) => (
                    <div key={item.id} className="border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all group">
                        <div className="flex">
                            {/* Vote Column */}
                            <div className="flex flex-col items-center justify-center px-5 border-r-2 border-black bg-neutral-50 min-w-[80px]">
                                <ChevronUp className="size-5 text-black/30 group-hover:text-[#4285F4] transition-colors cursor-pointer" />
                                <span className="text-xl font-black text-black">{item.votes}</span>
                                <span className="text-[7px] font-black uppercase tracking-widest text-black/20">Votes</span>
                            </div>

                            {/* Content */}
                            <div className="flex-1 p-5">
                                <div className="flex items-center gap-3 mb-2">
                                    {STATUS_ICONS[item.status]}
                                    <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border border-black/20 ${PRIORITY_STYLES[item.priority]}`}>
                                        {item.priority}
                                    </span>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-black/30 border border-black/10 px-2 py-0.5">
                                        {item.category}
                                    </span>
                                </div>
                                <h3 className="text-base font-black text-black group-hover:text-[#4285F4] transition-colors cursor-pointer">{item.title}</h3>
                                <p className="text-xs text-black/60 mt-1 leading-relaxed">{item.description}</p>
                                <div className="flex items-center gap-4 mt-3">
                                    <span className="flex items-center gap-1 text-[9px] font-black text-black/30">
                                        <Tag className="size-3" /> {item.source}
                                    </span>
                                    <span className="flex items-center gap-1 text-[9px] font-black text-black/30">
                                        <MessageSquareText className="size-3" /> {item.mentions} mentions
                                    </span>
                                    <span className="text-[9px] font-bold text-black/20">{item.createdAt}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
