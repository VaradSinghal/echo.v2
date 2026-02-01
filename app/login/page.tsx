import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Github, Shield, Lock, ArrowRight, Terminal } from "lucide-react";

export default async function LoginPage({
    searchParams,
}: {
    searchParams: { message: string };
}) {
    const supabase = createClient();

    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (session) {
        return redirect("/dashboard/feed");
    }

    const signIn = async () => {
        "use server";

        const headersList = headers();
        const host = headersList.get("host");
        const protocol = headersList.get("x-forwarded-proto") || "https";
        // On localhost, we might not have x-forwarded-proto, so fallback to http if host contains localhost
        const isLocal = host?.includes("localhost") || host?.includes("127.0.0.1");
        const origin = isLocal ? `http://${host}` : `https://${host}`;

        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "github",
            options: {
                redirectTo: `${origin}/auth/callback`,
                scopes: "read:user repo",
            },
        });

        if (data.url) {
            redirect(data.url);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center relative overflow-hidden font-display selection:bg-[#00FF41] selection:text-black">
            {/* Geometric Background Overlay */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(#1A1A1A 1px, transparent 1px), linear-gradient(90deg, #1A1A1A 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, #00FF41 1px, transparent 0)`,
                    backgroundSize: '24px 24px'
                }}
            />

            <div className="relative z-10 w-full max-w-[480px] p-4 lg:p-0">
                {/* Branding Block */}
                <div className="mb-12 text-center">
                    <div className="inline-flex items-center gap-3 bg-white px-4 py-2 border-2 border-black mb-6 rotate-[-1deg] shadow-brutalist">
                        <Terminal className="size-4 text-black" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-black">Authentication Node // Echo v2.0</span>
                    </div>
                </div>

                {/* Main Card */}
                <div className="border-[6px] border-black bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8 md:p-12 relative overflow-hidden group">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Shield className="size-32 rotate-12" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="size-2 bg-[#00FF41]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Secure Access</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter text-black mb-4 leading-[0.9]">
                            System Access <br />
                            <span className="text-black/20">Sign In</span>
                        </h1>
                        <p className="text-xs font-bold uppercase tracking-widest text-black/60 mb-12 leading-relaxed max-w-[280px]">
                            Connect your security credentials to access the agent monitoring dashboard.
                        </p>

                        <form action={signIn} className="space-y-6">
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

                            {searchParams?.message && (
                                <div className="p-4 border-2 border-black bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                                    <Lock className="size-4 shrink-0" />
                                    {searchParams.message}
                                </div>
                            )}
                        </form>
                    </div>

                    <div className="mt-12 flex items-center justify-between pt-8 border-t-2 border-black/5">
                        <div className="flex flex-col gap-1">
                            <span className="text-[8px] font-black text-black/30 uppercase tracking-[0.2em]">Connection Status</span>
                            <span className="text-[10px] font-black text-[#00FF41] uppercase tracking-widest flex items-center gap-2">
                                <span className="size-1.5 rounded-full bg-[#00FF41] animate-pulse" />
                                Ready
                            </span>
                        </div>
                        <div className="text-right">
                            <p className="text-[8px] font-black text-black/20 uppercase tracking-[0.2em]">Protocol</p>
                            <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">TLS 1.3 / GH_OAUTH</p>
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
