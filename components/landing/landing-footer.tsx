import React from "react"
import Link from "next/link"

export function LandingFooter() {
    return (
        <footer className="border-t border-black py-20 bg-black text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-start gap-12">
                    <div className="max-w-xs">
                        <div className="flex items-center gap-2 mb-6">
                            <img
                                alt="Echo Logo"
                                className="h-8 w-8 invert"
                                src="/logo.png"
                            />
                            <span className="text-2xl font-black uppercase tracking-tighter">Echo</span>
                        </div>
                        <p className="text-neutral-400 text-sm font-medium">
                            The ultimate feedback loop for modern engineering teams. Driven by AI, powered by community.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
                        <div>
                            <h5 className="font-black uppercase text-xs tracking-widest mb-6">Platform</h5>
                            <ul className="space-y-4 text-sm text-neutral-400 font-medium">
                                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                                <li><Link href="#feed" className="hover:text-white transition-colors">Feed</Link></li>
                                <li><Link href="#" className="hover:text-white transition-colors">Integrations</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h5 className="font-black uppercase text-xs tracking-widest mb-6">Legal</h5>
                            <ul className="space-y-4 text-sm text-neutral-400 font-medium">
                                <li><Link href="#" className="hover:text-white transition-colors">Privacy</Link></li>
                                <li><Link href="#" className="hover:text-white transition-colors">Terms</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h5 className="font-black uppercase text-xs tracking-widest mb-6">Social</h5>
                            <ul className="space-y-4 text-sm text-neutral-400 font-medium">
                                <li><Link href="#" className="hover:text-white transition-colors">GitHub</Link></li>
                                <li><Link href="#" className="hover:text-white transition-colors">Twitter</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="mt-20 pt-8 border-t border-neutral-800 text-xs font-bold text-neutral-500 uppercase tracking-widest text-center">
                    © {new Date().getFullYear()} ECHO AI PLATFORM. BUILT FOR DEVELOPERS.
                </div>
            </div>
        </footer>
    )
}
