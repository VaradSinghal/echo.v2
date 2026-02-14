"use client";

import { useState } from "react";
import { Github, Shield, ArrowRight, Terminal, Building2, Code2 } from "lucide-react";
import { signInWithGithub, signInWithGoogle } from "@/lib/actions/auth";

export default function LoginPage({
    searchParams,
}: {
    searchParams: { message?: string; type?: string };
}) {
    return <LoginClient initialType={searchParams?.type || "developer"} message={searchParams?.message} />;
}

function LoginClient({ initialType, message }: { initialType: string; message?: string }) {
    const [mode, setMode] = useState<"developer" | "business">(
        initialType === "business" ? "business" : "developer"
    );

    return (
        <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center relative overflow-hidden font-display selection:bg-[#00FF41] selection:text-black">
            {/* Grid Background */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(#1A1A1A 1px, transparent 1px), linear-gradient(90deg, #1A1A1A 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, ${mode === "developer" ? "#00FF41" : "#4285F4"} 1px, transparent 0)`,
                    backgroundSize: '24px 24px'
                }}
            />

            <div className="relative z-10 w-full max-w-[520px] p-4 lg:p-0">
                {/* Branding Block */}
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center gap-3 bg-white px-4 py-2 border-2 border-black mb-6 rotate-[-1deg] shadow-brutalist">
                        <Terminal className="size-4 text-black" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-black">Authentication Node // Echo v2.0</span>
                    </div>
                </div>

                {/* Role Toggle */}
                <div className="flex mb-6 border-[4px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <button
                        onClick={() => setMode("developer")}
                        className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-200 ${mode === "developer"
                                ? "bg-black text-[#00FF41]"
                                : "bg-white text-black/40 hover:bg-neutral-50"
                            }`}
                    >
                        <Code2 className="size-4" />
                        Developer
                    </button>
                    <div className="w-[4px] bg-black" />
                    <button
                        onClick={() => setMode("business")}
                        className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-200 ${mode === "business"
                                ? "bg-black text-[#4285F4]"
                                : "bg-white text-black/40 hover:bg-neutral-50"
                            }`}
                    >
                        <Building2 className="size-4" />
                        Business
                    </button>
                </div>

                {/* Main Card */}
                <div className="border-[6px] border-black bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8 md:p-12 relative overflow-hidden group">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Shield className="size-32 rotate-12" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`size-2 ${mode === "developer" ? "bg-[#00FF41]" : "bg-[#4285F4]"}`} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-black/40">
                                {mode === "developer" ? "Developer Access" : "Business Access"}
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-black mb-3 leading-[0.9]">
                            {mode === "developer" ? (
                                <>System Access <br /><span className="text-black/20">Developer</span></>
                            ) : (
                                <>Business Portal <br /><span className="text-black/20">Enterprise</span></>
                            )}
                        </h1>
                        <p className="text-xs font-bold uppercase tracking-widest text-black/60 mb-10 leading-relaxed max-w-[320px]">
                            {mode === "developer"
                                ? "Connect your GitHub to access the agent monitoring dashboard and automate PRs."
                                : "Sign in with Google to access analytics, monitor community signals, and track developer sentiment."
                            }
                        </p>

                        {mode === "developer" ? (
                            <form action={signInWithGithub} className="space-y-6">
                                <button
                                    type="submit"
                                    className="group relative w-full flex items-center justify-between bg-black text-white px-8 py-6 text-sm font-black uppercase tracking-[0.2em] transition-all hover:bg-[#00FF41] hover:text-black active:translate-y-1"
                                >
                                    <div className="flex items-center gap-4">
                                        <Github className="size-6 transition-transform group-hover:scale-110" />
                                        <span>Sign in with GitHub</span>
                                    </div>
                                    <ArrowRight className="size-5 opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0" />
                                </button>
                            </form>
                        ) : (
                            <form action={signInWithGoogle} className="space-y-6">
                                <button
                                    type="submit"
                                    className="group relative w-full flex items-center justify-between bg-[#4285F4] text-white px-8 py-6 text-sm font-black uppercase tracking-[0.2em] transition-all hover:bg-[#3367D6] active:translate-y-1 border-2 border-black"
                                >
                                    <div className="flex items-center gap-4">
                                        <svg className="size-6" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#fff" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" />
                                        </svg>
                                        <span>Sign in with Google</span>
                                    </div>
                                    <ArrowRight className="size-5 opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0" />
                                </button>
                            </form>
                        )}

                        {message && (
                            <div className="mt-6 p-4 border-2 border-black bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                                <Shield className="size-4 shrink-0" />
                                {message}
                            </div>
                        )}
                    </div>

                    <div className="mt-12 flex items-center justify-between pt-8 border-t-2 border-black/5">
                        <div className="flex flex-col gap-1">
                            <span className="text-[8px] font-black text-black/30 uppercase tracking-[0.2em]">Connection Status</span>
                            <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${mode === "developer" ? "text-[#00FF41]" : "text-[#4285F4]"}`}>
                                <span className={`size-1.5 rounded-full animate-pulse ${mode === "developer" ? "bg-[#00FF41]" : "bg-[#4285F4]"}`} />
                                Ready
                            </span>
                        </div>
                        <div className="text-right">
                            <p className="text-[8px] font-black text-black/20 uppercase tracking-[0.2em]">Protocol</p>
                            <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">
                                {mode === "developer" ? "TLS 1.3 / GH_OAUTH" : "TLS 1.3 / GOOGLE_OAUTH"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Metadata */}
                <div className="mt-8 flex items-center justify-center gap-8 opacity-20 hover:opacity-100 transition-opacity">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white">
                        Proprietary Agent Subsystem // 2026
                    </p>
                </div>
            </div>
        </div>
    );
}
