"use client";

import { Users, Search, MapPin, Star, ExternalLink, Github, Filter } from "lucide-react";
import { useState } from "react";

type SkillFilter = "all" | "frontend" | "backend" | "fullstack" | "devops" | "mobile";

const MOCK_DEVELOPERS = [
    { id: 1, name: "Sarah Chen", handle: "@sarahdev", location: "San Francisco, CA", skills: ["React", "TypeScript", "Node.js"], type: "fullstack" as const, stars: 3420, repos: 47, contributions: 1892, sentiment: 9.3, avatar: "SC", active: true },
    { id: 2, name: "Marcus Rivera", handle: "@mrivera_code", location: "Austin, TX", skills: ["Rust", "Go", "gRPC"], type: "backend" as const, stars: 5100, repos: 32, contributions: 3201, sentiment: 8.9, avatar: "MR", active: true },
    { id: 3, name: "Aisha Patel", handle: "@aisha.dev", location: "London, UK", skills: ["Flutter", "Kotlin", "Swift"], type: "mobile" as const, stars: 2870, repos: 28, contributions: 1543, sentiment: 9.1, avatar: "AP", active: true },
    { id: 4, name: "James O'Brien", handle: "@jobrien_dev", location: "Dublin, IE", skills: ["Kubernetes", "Terraform", "AWS"], type: "devops" as const, stars: 1950, repos: 19, contributions: 876, sentiment: 8.4, avatar: "JO", active: false },
    { id: 5, name: "Yuki Tanaka", handle: "@yukidev", location: "Tokyo, JP", skills: ["Vue.js", "Nuxt", "TailwindCSS"], type: "frontend" as const, stars: 4200, repos: 55, contributions: 2734, sentiment: 9.5, avatar: "YT", active: true },
    { id: 6, name: "Carlos Mendez", handle: "@carlosm", location: "Mexico City, MX", skills: ["Python", "Django", "PostgreSQL"], type: "backend" as const, stars: 2340, repos: 41, contributions: 1654, sentiment: 8.7, avatar: "CM", active: true },
    { id: 7, name: "Emma Larsson", handle: "@emma_dev", location: "Stockholm, SE", skills: ["React Native", "GraphQL", "Firebase"], type: "fullstack" as const, stars: 3100, repos: 38, contributions: 2100, sentiment: 8.8, avatar: "EL", active: false },
    { id: 8, name: "David Kim", handle: "@dkim_ops", location: "Seoul, KR", skills: ["Docker", "CI/CD", "GCP"], type: "devops" as const, stars: 1670, repos: 22, contributions: 945, sentiment: 8.2, avatar: "DK", active: true },
];

const BG_COLORS = ["bg-[#4285F4]", "bg-[#0F9D58]", "bg-[#F4B400]", "bg-[#DB4437]", "bg-purple-500", "bg-pink-500", "bg-cyan-500", "bg-indigo-500"];

export default function DevelopersPage() {
    const [filter, setFilter] = useState<SkillFilter>("all");
    const [search, setSearch] = useState("");

    const filtered = MOCK_DEVELOPERS
        .filter(d => filter === "all" || d.type === filter)
        .filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.skills.some(s => s.toLowerCase().includes(search.toLowerCase())));

    return (
        <div className="space-y-8">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="size-2 bg-[#4285F4]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Network Intelligence</span>
                </div>
                <h1 className="text-3xl font-black uppercase tracking-tighter text-black">Developer Directory</h1>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex items-center gap-3 border-4 border-black bg-white px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <Search className="size-4 text-black/30" />
                    <input
                        type="text"
                        placeholder="Search developers or skills..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 bg-transparent text-sm font-bold text-black placeholder:text-black/30 outline-none tracking-wide"
                    />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Filter className="size-4 text-black/30" />
                    {(["all", "frontend", "backend", "fullstack", "devops", "mobile"] as SkillFilter[]).map((s) => (
                        <button key={s} onClick={() => setFilter(s)} className={`text-[10px] font-black uppercase tracking-widest px-3 py-2 border-2 border-black transition-all ${filter === s ? "bg-black text-white" : "bg-white text-black/40 hover:text-black"}`}>
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Developer Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map((dev, i) => (
                    <div key={dev.id} className="border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all group cursor-pointer">
                        <div className="p-5">
                            <div className="flex items-start gap-4">
                                <div className={`size-14 ${BG_COLORS[i % BG_COLORS.length]} border-2 border-black flex items-center justify-center text-white font-black text-lg shrink-0`}>
                                    {dev.avatar}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base font-black text-black group-hover:text-[#4285F4] transition-colors truncate">{dev.name}</h3>
                                        {dev.active && <span className="size-2 rounded-full bg-green-500 animate-pulse shrink-0" />}
                                    </div>
                                    <p className="text-[10px] font-bold text-black/40">{dev.handle}</p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <MapPin className="size-3 text-black/20" />
                                        <span className="text-[10px] font-bold text-black/30">{dev.location}</span>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-xl font-black text-black">{dev.sentiment}</p>
                                    <p className="text-[7px] font-black uppercase tracking-widest text-black/20">Score</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5 mt-4">
                                {dev.skills.map((skill) => (
                                    <span key={skill} className="text-[8px] font-black uppercase tracking-widest text-black/60 bg-neutral-100 border border-black/10 px-2 py-1">
                                        {skill}
                                    </span>
                                ))}
                            </div>

                            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-black/5">
                                <span className="text-[9px] font-black text-black/30"><Star className="size-3 inline mr-1" />{dev.stars.toLocaleString()} stars</span>
                                <span className="text-[9px] font-black text-black/30"><Github className="size-3 inline mr-1" />{dev.repos} repos</span>
                                <span className="text-[9px] font-black text-black/30">{dev.contributions.toLocaleString()} contributions</span>
                                <ExternalLink className="size-3 text-black/10 group-hover:text-[#4285F4] ml-auto transition-colors" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="border-4 border-black bg-white p-12 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <Users className="size-8 text-black/10 mx-auto mb-3" />
                    <p className="text-sm font-black uppercase tracking-widest text-black/30">No developers found</p>
                </div>
            )}
        </div>
    );
}
