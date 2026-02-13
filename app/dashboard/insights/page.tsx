"use client"

import * as React from "react"
import { LocalInsights } from "@/components/dashboard/LocalInsights"
import { Sparkles, Brain } from "lucide-react"

export default function InsightsPage() {
    return (
        <div className="flex flex-col gap-16 py-8">
            {/* Header Section */}
            <div className="relative">
                <div className="absolute -left-12 top-0 bottom-0 w-2 bg-black hidden lg:block" />
                <div className="inline-flex items-center gap-3 mb-6 group bg-black text-white px-4 py-1">
                    <Brain className="h-4 w-4 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">Neural Core Active</span>
                </div>
                <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase text-black leading-none mb-6">
                    AI<br />Insights
                </h1>
                <div className="max-w-2xl border-l-8 border-black pl-8 py-2">
                    <p className="text-sm font-black uppercase tracking-widest text-black/60 leading-relaxed">
                        HEURISTIC DATA STREAM // SECTOR 7G // LATENCY 24ms<br />
                        AUTONOMOUS ANALYSIS OF GLOBAL SIGNAL FEED
                    </p>
                </div>
            </div>

            {/* Content Section */}
            <div className="flex flex-col gap-12">
                <section className="relative">
                    <div className="mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="size-4 bg-black" />
                            <h2 className="text-xl font-black uppercase tracking-widest text-black">Intelligence Deck</h2>
                        </div>
                        <div className="hidden md:flex items-center gap-1 font-black text-[10px] tracking-widest uppercase text-black/20">
                            <span>STABLE</span>
                            <span className="size-1 bg-black/20 rounded-full" />
                            <span>ENCRYPTED</span>
                        </div>
                    </div>

                    <div className="bg-white">
                        <LocalInsights />
                    </div>
                </section>

                <div className="border-4 border-black bg-neutral-100 p-8 flex items-center justify-center gap-8 group hover:bg-black hover:text-white transition-colors cursor-help">
                    <Sparkles className="h-10 w-10 opacity-20 group-hover:opacity-100 transition-opacity" />
                    <div className="flex flex-col">
                        <p className="text-xl font-black uppercase tracking-tighter italic">Deep Learning in Progress</p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40 group-hover:opacity-60">Expansion modules being calculated by neural net</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
