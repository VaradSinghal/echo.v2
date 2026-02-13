"use client";

import { PricingCard } from "@/components/subscription/pricing-card";
import { AgentCard } from "@/components/marketplace/agent-card";
import { Copy, Gift, Search, Filter } from "lucide-react";
import { useState } from "react";

const SAMPLE_AGENTS = [
    {
        name: "Code Reviewer",
        description: "Automated PR reviews with strict linting rules and security analysis. Supports TS, Python, and Go.",
        author: "Echo Official",
        rating: 4.9,
        downloads: "12k",
        category: "DevTools",
        color: "#000000"
    },
    {
        name: "UI Generator",
        description: "Converts text descriptions into Shadcn/Tailwind components instantly.",
        author: "DesignBot",
        rating: 4.7,
        downloads: "15k",
        category: "Design",
        color: "#9333EA"
    },
    {
        name: "Sentiment Analyst",
        description: "Real-time sentiment tracking for brand mentions across Reddit and Twitter.",
        author: "Echo Official",
        rating: 4.9,
        downloads: "9.8k",
        category: "Analytics",
        color: "#000000"
    }
];

export default function SubscriptionPage() {
    const [copied, setCopied] = useState(false);
    const referralLink = "https://echo.ai/ref/varad-s";

    const handleCopyReferral = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-20 pb-20">
            <div className="flex flex-col gap-2 border-b-2 border-black pb-8">
                <h1 className="text-5xl font-black uppercase tracking-tighter">Echo Store</h1>
                <p className="text-black/60 font-medium text-lg">Upgrade your plan, invite friends, and browse the agent marketplace.</p>
            </div>

            {/* Container 1: Freemium (Plans) */}
            <section className="space-y-8">
                <div className="flex items-center gap-4">
                    <div className="h-8 w-8 bg-black text-white flex items-center justify-center font-black rounded-full">1</div>
                    <h2 className="text-3xl font-black uppercase tracking-tight">Select Your Plan</h2>
                </div>

                <div className="grid md:grid-cols-3 gap-8 items-start">
                    <PricingCard
                        name="Hobby"
                        price="$0"
                        description="For personal testing"
                        buttonText="Current Plan"
                        features={[
                            { text: "5 Daily Scrapes", included: true },
                            { text: "1 Active Agent", included: true },
                            { text: "Community Support", included: true },
                            { text: "API Access", included: false },
                            { text: "Team Sandbox", included: false },
                        ]}
                    />

                    <PricingCard
                        name="Pro"
                        price="$29"
                        description="For power users"
                        popular={true}
                        buttonText="Upgrade to Pro"
                        features={[
                            { text: "Unlimited Scrapes", included: true },
                            { text: "5 Active Agents", included: true },
                            { text: "Priority Support", included: true },
                            { text: "API Access", included: true },
                            { text: "Team Sandbox", included: false },
                        ]}
                    />

                    <PricingCard
                        name="Teams"
                        price="$99"
                        description="For agencies & startups"
                        buttonText="Contact Sales"
                        features={[
                            { text: "Unlimited Everything", included: true },
                            { text: "Unlimited Agents", included: true },
                            { text: "24/7 Dedicated Support", included: true },
                            { text: "SSO & Audit Logs", included: true },
                            { text: "Team Sandbox", included: true },
                        ]}
                    />
                </div>
            </section>

            {/* Container 2: Business Partnership */}
            <section className="space-y-8">
                <div className="flex items-center gap-4">
                    <div className="h-8 w-8 bg-[#DA552F] text-white flex items-center justify-center font-black rounded-full">2</div>
                    <h2 className="text-3xl font-black uppercase tracking-tight">Partner & Save</h2>
                </div>

                <div className="border-2 border-black bg-[#DA552F] p-10 text-white shadow-brutalist relative overflow-hidden">
                    <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                        <Gift className="h-64 w-64" />
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                        <div className="flex-1 space-y-4">
                            <h3 className="text-3xl font-black uppercase leading-none">Collaborate w/ Business,<br />Get <span className="text-black bg-white px-2">Discounts</span></h3>
                            <p className="font-medium opacity-90 text-lg max-w-xl">
                                Tell your customers to come to our platform to submit reviews. In return, we provide exclusive discounts on your subscription plans.
                            </p>

                            <button className="mt-4 bg-white text-black px-8 py-4 text-xs font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors border-2 border-white">
                                Start Collaboration
                            </button>
                        </div>

                        <div className="bg-white/10 p-6 backdrop-blur-sm border-2 border-white/20 text-center w-full md:w-64 transform rotate-2">
                            <div className="text-5xl font-black mb-1">20%</div>
                            <div className="text-xs font-black uppercase tracking-widest opacity-75">Off Per 50 Reviews</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Container 3: Agent Marketplace */}
            <section className="space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-8 bg-blue-600 text-white flex items-center justify-center font-black rounded-full">3</div>
                        <h2 className="text-3xl font-black uppercase tracking-tight">Agent Marketplace</h2>
                    </div>
                    <button className="flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:underline">
                        Browsing All <Filter className="h-3 w-3" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {SAMPLE_AGENTS.map((agent, idx) => (
                        <AgentCard key={idx} {...agent} />
                    ))}

                    {/* Make Your Dream Echo CTA */}
                    <div className="md:col-span-2 lg:col-span-3 mt-8 border-2 border-dashed border-black bg-neutral-50 p-12 text-center relative overflow-hidden group">
                        <div className="relative z-10 space-y-6">
                            <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Make Your Dream Echo</h3>
                            <p className="text-black/60 font-medium max-w-lg mx-auto">
                                Need a custom agent tailored to your workflow? Our team of engineers will build it for you.
                            </p>
                            <button className="bg-black text-white px-10 py-5 text-sm font-black uppercase tracking-widest hover:bg-[#DA552F] transition-colors border-2 border-black">
                                Contact Sales
                            </button>
                        </div>

                        {/* Decorative BG */}
                        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    </div>
                </div>
            </section>
        </div>
    );
}
