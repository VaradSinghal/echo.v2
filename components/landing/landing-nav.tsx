import React from "react"
import Link from "next/link"
import { Github } from "lucide-react"
import { signInWithGithub } from "@/lib/actions/auth"

export function LandingNav() {
    return (
        <nav className="fixed top-0 w-full z-50 border-b border-black bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20 items-center">
                    <Link href="/" className="flex items-center gap-2 group">
                        <img
                            alt="Echo Logo"
                            className="h-8 w-8"
                            src="/logo.png"
                        />
                        <span className="text-2xl font-black tracking-tighter uppercase text-black">Echo</span>
                    </Link>

                    <div className="hidden md:flex items-center space-x-10">
                        <Link href="#features" className="text-sm font-bold tracking-widest uppercase hover:underline underline-offset-4 text-black">Features</Link>
                        <Link href="#feed" className="text-sm font-bold tracking-widest uppercase hover:underline underline-offset-4 text-black">Live Echoes</Link>
                        <Link href="/docs" className="text-sm font-bold tracking-widest uppercase hover:underline underline-offset-4 text-black">Docs</Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <form action={signInWithGithub}>
                            <button type="submit" className="bg-black text-white px-6 py-2 text-xs font-black tracking-widest uppercase flex items-center gap-2 hover:bg-neutral-800 transition-colors">
                                <Github className="w-4 h-4" />
                                Continue with GitHub
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </nav>
    )
}
