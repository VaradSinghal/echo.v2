import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Github, Mail, ShieldCheck, Zap, Activity, GitPullRequest } from "lucide-react";

export default async function ProfilePage() {
    const supabase = createClient();

    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
        redirect("/login");
    }

    // Fetch profile from DB
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

    // Fetch stats
    const { count: postCount } = await supabase
        .from("posts")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", session.user.id);

    // In a real app, you'd fetch PR counts from github_prs linked to this user's generated code
    // For now, we'll use actual PR count if possible or a placeholder
    const { count: prCount } = await supabase
        .from("github_prs")
        .select("*", { count: 'exact', head: true });

    const user = session.user;
    const name = profile?.username || user.user_metadata.full_name || "Unknown Entity";

    return (
        <div className="flex flex-col gap-12 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b-2 border-black pb-8">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-black">Verified Identity</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase text-black italic leading-none">
                        Identity: {name.split(' ')[0]}
                    </h1>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-black/20">
                    ID-CORE // {user.id.substring(0, 12).toUpperCase()}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                {/* Left: Identity Card */}
                <div className="lg:col-span-12">
                    <div className="border-4 border-black bg-white shadow-brutalist-large flex flex-col md:flex-row">
                        {/* Avatar Column */}
                        <div className="w-full md:w-[300px] border-b-4 md:border-b-0 md:border-r-4 border-black flex items-center justify-center p-12 bg-neutral-50 relative group overflow-hidden">
                            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <img
                                src={profile?.avatar_url || user.user_metadata.avatar_url}
                                className="size-48 border-4 border-black grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-105"
                                alt="Avatar"
                            />
                            <div className="absolute bottom-4 right-4 bg-black text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                                REV-02
                            </div>
                        </div>

                        {/* Info Column */}
                        <div className="flex-1 p-12 space-y-12">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30 border-b border-black/10 pb-2">Technical Alias</h3>
                                    <p className="text-2xl font-black uppercase tracking-tight">{name}</p>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30 border-b border-black/10 pb-2">Communication Node</h3>
                                    <div className="flex items-center gap-3">
                                        <Mail className="h-5 w-5" />
                                        <p className="text-lg font-bold tracking-tight">{user.email}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t-2 border-dashed border-black/10">
                                <div className="space-y-6">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30">Auth Context</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold uppercase text-black/60">GitHub Interface</span>
                                            <span className="text-xs font-black uppercase tracking-widest border border-black px-2 py-0.5">{profile?.github_id || "LINKED"}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold uppercase text-black/60">Session Integrity</span>
                                            <div className="flex items-center gap-2">
                                                <div className="size-2 rounded-full bg-green-500" />
                                                <span className="text-xs font-black uppercase text-green-600">STABLE</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30">Mission Activity</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-black text-white p-4">
                                            <Activity className="h-4 w-4 mb-2 opacity-50" />
                                            <p className="text-3xl font-black leading-none">{postCount || 0}</p>
                                            <span className="text-[8px] font-black uppercase tracking-widest mt-1 block">Echoes Cast</span>
                                        </div>
                                        <div className="border-2 border-black p-4">
                                            <GitPullRequest className="h-4 w-4 mb-2 text-black/20" />
                                            <p className="text-3xl font-black leading-none text-black">{prCount || 0}</p>
                                            <span className="text-[8px] font-black uppercase tracking-widest mt-1 block text-black/40">PRs Merged</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Polish */}
                <div className="lg:col-span-12 py-12 flex flex-col items-center gap-6 border-t-2 border-black">
                    <div className="flex gap-1">
                        {[...Array(20)].map((_, i) => (
                            <div key={i} className="h-8 w-1 bg-black/5" />
                        ))}
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-black/20">
                        Operational Transparency // Pulse Verified // {new Date().getFullYear()}
                    </p>
                </div>
            </div>
        </div>
    );
}
