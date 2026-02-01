"use client"

import React from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { signInWithGithub } from "@/lib/actions/auth"

export function LandingHero() {
    return (
        <header className="relative pt-48 pb-32 bg-white selection:bg-black selection:text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div className="mb-12 inline-block">
                    <img
                        alt="Echo Hero Logo"
                        className="h-32 w-32 mx-auto grayscale"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAcgoPddMSLCh1YtmSffugRyrBIoYqAh1EPGo-c93JPBtSHxB2JZiEhZ6zqildB0egPUmWk-6F5HfP9pkzF44mPHC4NlvB3Z9ckjStn9PyPtRfdkVMuzasaFCBFd0gCCrvUXt0eSTVqa8t8teM0F-1bmkoce0rKO_HAb5jNLygOYzu80jf0EKbGNNNnB4odHzg0zOMYfWWkBcsnYtZYNzeEq1q2059Jweb0O326qEtdPClPoFcC8PTmydZmNlPaBwjbcJ1HjPkSKL8j"
                    />
                </div>

                <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9] text-black">
                    SOCIAL FEEDBACK,<br /><span className="text-neutral-400">AUTOMATED PRs.</span>
                </h1>

                <p className="max-w-2xl mx-auto text-xl md:text-2xl text-neutral-600 mb-12 font-medium">
                    The AI-powered social platform for developers. <br />Turn community insights into code.
                </p>

                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                    <form action={signInWithGithub}>
                        <button type="submit" className="btn-solid text-xl px-12 py-5 w-full sm:w-auto">
                            START ECHOING
                            <ArrowRight className="h-6 w-6" />
                        </button>
                    </form>
                    <Link href="#feed" className="btn-outline text-xl px-12 py-5">
                        VIEW LIVE FEED
                    </Link>
                </div>
            </div>
        </header>
    )
}
