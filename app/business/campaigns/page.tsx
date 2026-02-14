"use client";

import { Megaphone, Plus, Play, Pause, CheckCircle2, Clock, Users, Eye, MousePointerClick, Mail } from "lucide-react";
import { useState } from "react";

type CampaignStatus = "active" | "draft" | "completed" | "paused";

const MOCK_CAMPAIGNS = [
    { id: 1, name: "Echo SDK v3 Launch", description: "Announce the new Echo SDK v3 across developer communities.", status: "active" as CampaignStatus, type: "Product Launch", target: "Full-stack developers", reach: 24500, engagement: 3847, conversions: 892, start: "Feb 1", end: "Feb 28" },
    { id: 2, name: "Developer Appreciation Week", description: "Week-long campaign with community spotlights and contributor recognition.", status: "active" as CampaignStatus, type: "Community", target: "OSS contributors", reach: 18200, engagement: 5621, conversions: 1234, start: "Feb 10", end: "Feb 17" },
    { id: 3, name: "Enterprise Migration Guide", description: "Targeted outreach to enterprise teams using competitor products.", status: "draft" as CampaignStatus, type: "Outreach", target: "Engineering leads", reach: 0, engagement: 0, conversions: 0, start: "Mar 1", end: null },
    { id: 4, name: "API Performance Benchmarks", description: "Technical blog series comparing Echo API performance against competitors.", status: "completed" as CampaignStatus, type: "Content", target: "Backend devs", reach: 31200, engagement: 8934, conversions: 2103, start: "Jan 5", end: "Jan 31" },
    { id: 5, name: "Reddit AMA Series", description: "Monthly AMAs on r/webdev featuring Echo team members.", status: "paused" as CampaignStatus, type: "Community", target: "Reddit devs", reach: 12800, engagement: 4200, conversions: 567, start: "Jan 15", end: null },
];

const STATUS_STYLE: Record<CampaignStatus, { bg: string; text: string }> = {
    active: { bg: "bg-green-100", text: "text-green-700" },
    draft: { bg: "bg-neutral-100", text: "text-neutral-500" },
    completed: { bg: "bg-[#4285F4]/10", text: "text-[#4285F4]" },
    paused: { bg: "bg-yellow-100", text: "text-yellow-700" },
};

export default function CampaignsPage() {
    const [filter, setFilter] = useState<"all" | CampaignStatus>("all");
    const filtered = filter === "all" ? MOCK_CAMPAIGNS : MOCK_CAMPAIGNS.filter(c => c.status === filter);
    const totalReach = MOCK_CAMPAIGNS.reduce((s, c) => s + c.reach, 0);
    const totalEng = MOCK_CAMPAIGNS.reduce((s, c) => s + c.engagement, 0);
    const totalConv = MOCK_CAMPAIGNS.reduce((s, c) => s + c.conversions, 0);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="size-2 bg-[#4285F4]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Outreach Engine</span>
                    </div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-black">Campaign Manager</h1>
                </div>
                <button className="flex items-center gap-2 bg-[#4285F4] text-white border-4 border-black px-5 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all text-[10px] font-black uppercase tracking-widest active:translate-x-1 active:translate-y-1 active:shadow-none">
                    <Plus className="size-4" /> New Campaign
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { icon: Eye, color: "text-[#4285F4]", bg: "bg-[#4285F4]/10", val: totalReach, label: "Total Reach" },
                    { icon: MousePointerClick, color: "text-green-600", bg: "bg-green-50", val: totalEng, label: "Engagements" },
                    { icon: Mail, color: "text-purple-600", bg: "bg-purple-50", val: totalConv, label: "Conversions" },
                ].map((s) => (
                    <div key={s.label} className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-5">
                        <div className={`size-12 ${s.bg} border-2 border-black flex items-center justify-center`}>
                            <s.icon className={`size-5 ${s.color}`} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-black">{s.val.toLocaleString()}</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-black/40">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-2">
                {(["all", "active", "draft", "paused", "completed"] as const).map((s) => (
                    <button key={s} onClick={() => setFilter(s)} className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 border-2 border-black transition-all ${filter === s ? "bg-black text-white" : "bg-white text-black/40 hover:text-black"}`}>
                        {s}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                {filtered.map((c) => {
                    const st = STATUS_STYLE[c.status];
                    return (
                        <div key={c.id} className="border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all group cursor-pointer p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-2.5 py-1 text-[8px] font-black uppercase tracking-widest border border-black/20 ${st.bg} ${st.text}`}>{c.status}</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-black/30 border border-black/10 px-2 py-0.5">{c.type}</span>
                                    </div>
                                    <h3 className="text-lg font-black text-black group-hover:text-[#4285F4] transition-colors">{c.name}</h3>
                                    <p className="text-xs text-black/60 mt-1 leading-relaxed">{c.description}</p>
                                    <div className="flex items-center gap-4 mt-3">
                                        <span className="flex items-center gap-1.5 text-[9px] font-black text-black/30"><Users className="size-3" /> {c.target}</span>
                                        <span className="text-[9px] font-bold text-black/20">{c.start} {c.end ? `→ ${c.end}` : "→ Ongoing"}</span>
                                    </div>
                                </div>
                                {c.status !== "draft" && (
                                    <div className="flex gap-6 shrink-0">
                                        {[{ v: c.reach, l: "Reach" }, { v: c.engagement, l: "Engaged" }, { v: c.conversions, l: "Converted" }].map((m) => (
                                            <div key={m.l} className="text-center">
                                                <p className="text-xl font-black text-black">{m.v.toLocaleString()}</p>
                                                <p className="text-[8px] font-black uppercase tracking-widest text-black/30">{m.l}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {c.status === "active" && (
                                <div className="mt-4 pt-4 border-t-2 border-black/5">
                                    <div className="h-3 bg-neutral-100 border-2 border-black">
                                        <div className="h-full bg-[#4285F4]" style={{ width: `${Math.min((c.engagement / c.reach) * 100, 100)}%` }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
