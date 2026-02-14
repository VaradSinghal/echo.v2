"use client";

import { Sparkles, TrendingUp, TrendingDown, Minus, Filter, ArrowUpRight } from "lucide-react";
import { useState } from "react";

type SentimentType = "all" | "positive" | "neutral" | "negative";

const MOCK_SENTIMENT_OVERVIEW = {
    overall: 8.4,
    positive: 67,
    neutral: 24,
    negative: 9,
    totalMentions: 4782,
    weeklyChange: "+12.3%",
};

const MOCK_PLATFORMS = [
    { name: "Reddit", score: 8.7, mentions: 1243, trend: "up" },
    { name: "Twitter/X", score: 7.9, mentions: 2103, trend: "up" },
    { name: "Hacker News", score: 8.1, mentions: 487, trend: "down" },
    { name: "Dev.to", score: 9.2, mentions: 312, trend: "up" },
    { name: "GitHub Discussions", score: 8.5, mentions: 637, trend: "up" },
];

const MOCK_MENTIONS = [
    {
        id: 1,
        platform: "Reddit",
        subreddit: "r/webdev",
        author: "dev_sarah_92",
        content: "Just migrated our entire pipeline to Echo SDK and the developer experience is incredible. Documentation is top-notch and the API is super intuitive.",
        sentiment: "positive" as const,
        score: 9.3,
        time: "12m ago",
        upvotes: 234,
    },
    {
        id: 2,
        platform: "Twitter/X",
        subreddit: null,
        author: "@techbuilder",
        content: "Echo v2.3.1 has some serious latency issues when handling concurrent WebSocket connections. Anyone else seeing this?",
        sentiment: "negative" as const,
        score: 3.2,
        time: "28m ago",
        upvotes: 89,
    },
    {
        id: 3,
        platform: "Hacker News",
        subreddit: null,
        author: "pg_fan_2024",
        content: "Comparing Echo vs Firebase for real-time features. Echo seems more flexible but Firebase has better ecosystem integration.",
        sentiment: "neutral" as const,
        score: 5.8,
        time: "1h ago",
        upvotes: 156,
    },
    {
        id: 4,
        platform: "Reddit",
        subreddit: "r/javascript",
        author: "fullstack_ninja",
        content: "The new Echo CLI tool is a game-changer for scaffolding projects. Saved me hours of setup time. Highly recommend!",
        sentiment: "positive" as const,
        score: 9.1,
        time: "2h ago",
        upvotes: 312,
    },
    {
        id: 5,
        platform: "Dev.to",
        subreddit: null,
        author: "code_craftsman",
        content: "Writing a tutorial on Echo SDK integration patterns. The plugin architecture is really well designed.",
        sentiment: "positive" as const,
        score: 8.7,
        time: "3h ago",
        upvotes: 78,
    },
    {
        id: 6,
        platform: "GitHub",
        subreddit: null,
        author: "open-source-wizard",
        content: "Issue #891: Memory leak when using event listeners in batch mode. Reproducible with the attached test case.",
        sentiment: "negative" as const,
        score: 2.9,
        time: "4h ago",
        upvotes: 45,
    },
    {
        id: 7,
        platform: "Twitter/X",
        subreddit: null,
        author: "@devops_daily",
        content: "Echo's monitoring dashboard is decent but could use more customization options. Standard stuff works well though.",
        sentiment: "neutral" as const,
        score: 6.0,
        time: "5h ago",
        upvotes: 23,
    },
    {
        id: 8,
        platform: "Reddit",
        subreddit: "r/programming",
        author: "rust_enthusiast",
        content: "Impressed with Echo's Rust bindings. Performance benchmarks are looking really solid compared to competitors.",
        sentiment: "positive" as const,
        score: 9.5,
        time: "6h ago",
        upvotes: 445,
    },
];

export default function SentimentPage() {
    const [filter, setFilter] = useState<SentimentType>("all");

    const filteredMentions = filter === "all"
        ? MOCK_MENTIONS
        : MOCK_MENTIONS.filter(m => m.sentiment === filter);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="size-2 bg-[#4285F4]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Sentiment Intelligence</span>
                </div>
                <h1 className="text-3xl font-black uppercase tracking-tighter text-black">Developer Sentiment</h1>
            </div>

            {/* Sentiment Overview */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Main Score */}
                <div className="md:col-span-2 border-4 border-black bg-black p-8 shadow-[6px_6px_0px_0px_rgba(66,133,244,0.5)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 opacity-5">
                        <Sparkles className="size-40 -translate-y-8 translate-x-8" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Overall Score</p>
                    <p className="text-7xl font-black text-white tracking-tighter">
                        {MOCK_SENTIMENT_OVERVIEW.overall}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#4285F4] mt-2">
                        {MOCK_SENTIMENT_OVERVIEW.weeklyChange} this week
                    </p>
                    <div className="mt-6 flex gap-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/30 bg-white/10 px-3 py-1">
                            {MOCK_SENTIMENT_OVERVIEW.totalMentions.toLocaleString()} mentions
                        </span>
                    </div>
                </div>

                {/* Breakdown */}
                <div className="md:col-span-3 grid grid-cols-3 gap-4">
                    <div className="border-4 border-black bg-green-50 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
                        <TrendingUp className="size-5 text-green-600" />
                        <div className="mt-4">
                            <p className="text-4xl font-black text-green-700">{MOCK_SENTIMENT_OVERVIEW.positive}%</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-green-600/60 mt-1">Positive</p>
                        </div>
                    </div>
                    <div className="border-4 border-black bg-neutral-50 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
                        <Minus className="size-5 text-neutral-500" />
                        <div className="mt-4">
                            <p className="text-4xl font-black text-neutral-600">{MOCK_SENTIMENT_OVERVIEW.neutral}%</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mt-1">Neutral</p>
                        </div>
                    </div>
                    <div className="border-4 border-black bg-red-50 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
                        <TrendingDown className="size-5 text-red-500" />
                        <div className="mt-4">
                            <p className="text-4xl font-black text-red-600">{MOCK_SENTIMENT_OVERVIEW.negative}%</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-red-400 mt-1">Negative</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Platform Breakdown */}
            <div className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <div className="p-4 border-b-2 border-black">
                    <h3 className="text-sm font-black uppercase tracking-widest text-black">Platform Breakdown</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 divide-y-2 md:divide-y-0 md:divide-x-2 divide-black/10">
                    {MOCK_PLATFORMS.map((p) => (
                        <div key={p.name} className="p-5 text-center hover:bg-neutral-50 transition-colors">
                            <p className="text-[10px] font-black uppercase tracking-widest text-black/40">{p.name}</p>
                            <p className="text-3xl font-black text-black mt-2">{p.score}</p>
                            <p className="text-[9px] font-bold text-black/30 mt-1">{p.mentions.toLocaleString()} mentions</p>
                            <span className={`inline-flex items-center gap-1 mt-2 text-[9px] font-black uppercase ${p.trend === "up" ? "text-green-600" : "text-red-500"}`}>
                                {p.trend === "up" ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                                {p.trend}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Filter + Mentions */}
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <Filter className="size-4 text-black/30" />
                    {(["all", "positive", "neutral", "negative"] as SentimentType[]).map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 border-2 border-black transition-all ${filter === type
                                    ? "bg-black text-white"
                                    : "bg-white text-black/40 hover:text-black"
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                <div className="space-y-3">
                    {filteredMentions.map((mention) => (
                        <div key={mention.id} className="border-4 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all group cursor-pointer">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border-2 border-black ${mention.sentiment === "positive" ? "bg-green-100 text-green-700" :
                                                mention.sentiment === "negative" ? "bg-red-100 text-red-600" :
                                                    "bg-neutral-100 text-neutral-600"
                                            }`}>
                                            {mention.sentiment}
                                        </span>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-black/30">{mention.platform}</span>
                                        {mention.subreddit && (
                                            <span className="text-[9px] font-bold text-[#4285F4]">{mention.subreddit}</span>
                                        )}
                                        <span className="text-[9px] font-bold text-black/20">{mention.time}</span>
                                    </div>
                                    <p className="text-sm text-black/80 leading-relaxed">{mention.content}</p>
                                    <div className="flex items-center gap-4 mt-3">
                                        <span className="text-[9px] font-black text-black/30">@{mention.author}</span>
                                        <span className="text-[9px] font-black text-black/30">▲ {mention.upvotes}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center gap-1 shrink-0">
                                    <span className={`text-2xl font-black ${mention.score >= 7 ? "text-green-600" :
                                            mention.score >= 4 ? "text-yellow-600" :
                                                "text-red-500"
                                        }`}>{mention.score}</span>
                                    <span className="text-[7px] font-black uppercase tracking-widest text-black/20">Score</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
