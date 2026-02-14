import React from "react"
import Link from "next/link"
import { Github, Building2 } from "lucide-react"

export function LandingNav() {
    return (
        <nav className="fixed top-0 w-full z-50 border-b border-black bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20 items-center">
                    <Link href="/" className="flex items-center gap-2 group">
                        <img
                            alt="Echo Logo"
                            className="h-24 w-auto"
                            src="/echo_logo.svg"
                        />
                    </Link>

                    <div className="hidden md:flex items-center space-x-10">
                        <Link href="#features" className="text-sm font-bold tracking-widest uppercase hover:underline underline-offset-4 text-black">Features</Link>
                        <Link href="#feed" className="text-sm font-bold tracking-widest uppercase hover:underline underline-offset-4 text-black">Live Echoes</Link>
                        <Link href="/docs" className="text-sm font-bold tracking-widest uppercase hover:underline underline-offset-4 text-black">Docs</Link>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/login?type=developer"
                            className="hidden sm:flex bg-black text-white px-5 py-2 text-xs font-black tracking-widest uppercase items-center gap-2 hover:bg-neutral-800 transition-colors"
                        >
                            <Github className="w-4 h-4" />
                            <span className="hidden lg:inline">Developer Login</span>
                            <span className="lg:hidden">Dev</span>
                        </Link>

                        <Link
                            href="/login?type=business"
                            className="hidden sm:flex bg-[#4285F4] text-white px-5 py-2 text-xs font-black tracking-widest uppercase items-center gap-2 hover:bg-[#3367D6] transition-colors border-2 border-black"
                        >
                            <Building2 className="w-4 h-4" />
                            <span className="hidden lg:inline">Business Login</span>
                            <span className="lg:hidden">Biz</span>
                        </Link>

                        {/* Mobile Menu Trigger */}
                        <button className="md:hidden border-2 border-black p-1 hover:bg-black hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-xl">menu</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    )
}
