import React from "react"
import Link from "next/link"
import { ArrowRight, Building2 } from "lucide-react"
import { signInWithGithub } from "@/lib/actions/auth"

export function LandingHero() {
    return (
        <header className="relative pt-48 pb-32 bg-white selection:bg-black selection:text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

                <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9] text-black">
                    SOCIAL FEEDBACK,<br /><span className="text-neutral-400">AUTOMATED PRs.</span>
                </h1>

                <p className="max-w-2xl mx-auto text-lg md:text-2xl text-neutral-600 mb-12 font-medium">
                    The AI-powered social platform for developers. <br className="hidden md:block" />Turn community insights into code.
                </p>

                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                    <form action={signInWithGithub}>
                        <button type="submit" className="btn-solid text-xl px-12 py-5 w-full sm:w-auto">
                            START ECHOING
                            <ArrowRight className="h-6 w-6" />
                        </button>
                    </form>
                    <Link
                        href="/login?type=business"
                        className="inline-flex items-center justify-center gap-3 bg-[#4285F4] text-white border-2 border-black px-12 py-5 text-lg md:text-xl font-black uppercase tracking-widest hover:bg-[#3367D6] transition-colors shadow-brutalist active:translate-y-1 active:shadow-none"
                    >
                        <Building2 className="h-5 w-5" />
                        FOR BUSINESSES
                    </Link>
                </div>
            </div>
        </header>
    )
}
