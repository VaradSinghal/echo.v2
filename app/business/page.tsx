"use client";

import { BarChart3, TrendingUp, Users, MessageSquareText, Eye, ArrowUpRight, ArrowDownRight, Zap } from "lucide-react";

const MOCK_STATS = [
    { label: "Developer Reach", value: "12,847", change: "+18.3%", up: true, icon: Users },
    { label: "Sentiment Score", value: "8.4/10", change: "+0.7", up: true, icon: TrendingUp },
    { label: "Feedback Signals", value: "2,391", change: "+42.1%", up: true, icon: MessageSquareText },
    { label: "Product Mentions", value: "847", change: "-3.2%", up: false, icon: Eye },
];

const MOCK_ACTIVITY = [
    { time: "2m ago", event: "New positive mention on r/webdev", type: "positive" },
    { time: "14m ago", event: "Feature request: Dark mode API support", type: "neutral" },
    { time: "28m ago", event: "GitHub issue #432 trending in community", type: "neutral" },
    { time: "1h ago", event: "Competitor comparison thread detected", type: "warning" },
    { time: "2h ago", event: "Developer blog post mentions Echo SDK", type: "positive" },
    { time: "3h ago", event: "Bug report spike on v2.3.1 release", type: "negative" },
    { time: "5h ago", event: "Community milestone: 10k GitHub stars", type: "positive" },
    { time: "6h ago", event: "API latency complaints on Twitter/X", type: "warning" },
];

const MOCK_CHART_DATA = [65, 72, 58, 80, 92, 87, 95, 78, 88, 94, 82, 91];
const CHART_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const MOCK_TOP_REPOS = [
    { name: "echo-sdk-js", stars: 3420, forks: 287, sentiment: 9.1 },
    { name: "echo-python-client", stars: 1890, forks: 143, sentiment: 8.7 },
    { name: "echo-cli", stars: 956, forks: 89, sentiment: 7.9 },
    { name: "echo-vscode-ext", stars: 2100, forks: 198, sentiment: 8.5 },
];

export default function BusinessOverview() {
    const maxChartVal = Math.max(...MOCK_CHART_DATA);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="size-2 bg-[#4285F4]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Business Intelligence</span>
                    </div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-black">Overview Dashboard</h1>
                </div>
                <div className="flex items-center gap-2 border-2 border-black px-3 py-1.5 bg-white">
                    <Zap className="size-3 text-[#4285F4]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-black/60">Live Data</span>
                    <span className="size-2 rounded-full bg-green-500 animate-pulse" />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {MOCK_STATS.map((stat) => (
                    <div key={stat.label} className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <stat.icon className="size-5 text-black/30" />
                            <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${stat.up ? "text-green-600" : "text-red-500"}`}>
                                {stat.up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                                {stat.change}
                            </span>
                        </div>
                        <p className="text-3xl font-black text-black tracking-tight">{stat.value}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-black/40 mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Chart + Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart */}
                <div className="lg:col-span-2 border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-black">Developer Engagement</h3>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mt-1">Monthly Trend // 2025</p>
                        </div>
                        <BarChart3 className="size-5 text-black/20" />
                    </div>
                    <div className="flex items-end justify-between gap-2 h-48">
                        {MOCK_CHART_DATA.map((val, i) => (
                            <div key={i} className="flex flex-col items-center gap-2 flex-1">
                                <div className="w-full relative group">
                                    <div
                                        className="w-full bg-[#4285F4] border-2 border-black transition-all group-hover:bg-black"
                                        style={{ height: `${(val / maxChartVal) * 160}px` }}
                                    />
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[8px] font-black px-2 py-1">
                                        {val}%
                                    </div>
                                </div>
                                <span className="text-[8px] font-black uppercase tracking-widest text-black/30">{CHART_LABELS[i]}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <div className="p-4 border-b-2 border-black bg-black">
                        <h3 className="text-sm font-black uppercase tracking-widest text-white">Live Activity</h3>
                    </div>
                    <div className="divide-y-2 divide-black/10 max-h-[320px] overflow-y-auto">
                        {MOCK_ACTIVITY.map((item, i) => (
                            <div key={i} className="p-4 hover:bg-neutral-50 transition-colors">
                                <div className="flex items-start gap-3">
                                    <span className={`size-2 mt-1.5 shrink-0 ${item.type === "positive" ? "bg-green-500" :
                                            item.type === "negative" ? "bg-red-500" :
                                                item.type === "warning" ? "bg-yellow-500" :
                                                    "bg-black/20"
                                        }`} />
                                    <div>
                                        <p className="text-[11px] font-bold text-black leading-tight">{item.event}</p>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-black/30 mt-1">{item.time}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top Repositories */}
            <div className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <div className="p-4 border-b-2 border-black flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-widest text-black">Top Monitored Repositories</h3>
                    <span className="text-[10px] font-black uppercase tracking-widest text-black/30">{MOCK_TOP_REPOS.length} repos</span>
                </div>
                <div className="divide-y-2 divide-black/10">
                    {MOCK_TOP_REPOS.map((repo) => (
                        <div key={repo.name} className="p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors group cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="size-10 bg-black/5 border-2 border-black flex items-center justify-center">
                                    <BarChart3 className="size-4 text-black/40" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-black group-hover:text-[#4285F4] transition-colors">{repo.name}</p>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-black/30 mt-0.5">
                                        ★ {repo.stars.toLocaleString()} · ⑂ {repo.forks}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-lg font-black text-black">{repo.sentiment}</p>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-black/30">Sentiment</p>
                                </div>
                                <ArrowUpRight className="size-4 text-black/20 group-hover:text-[#4285F4] transition-colors" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
