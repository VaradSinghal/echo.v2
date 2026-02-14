import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BarChart3, MessageSquareText, Users, Megaphone, Sparkles, Building2 } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

export default async function BusinessLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = createClient();
    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
        redirect("/login?type=business");
    }

    const signOut = async () => {
        "use server";
        const supabase = createClient();
        await supabase.auth.signOut();
        redirect("/");
    };

    const navItems = [
        { href: "/business", label: "Overview", icon: <BarChart3 className="h-5 w-5" /> },
        { href: "/business/sentiment", label: "Sentiment", icon: <Sparkles className="h-5 w-5" /> },
        { href: "/business/feedback", label: "Feedback", icon: <MessageSquareText className="h-5 w-5" /> },
        { href: "/business/campaigns", label: "Campaigns", icon: <Megaphone className="h-5 w-5" /> },
        { href: "/business/developers", label: "Developers", icon: <Users className="h-5 w-5" /> },
    ];

    return (
        <div className="flex flex-col lg:flex-row min-h-screen w-full bg-white selection:bg-[#4285F4] selection:text-white">
            <DashboardSidebar
                session={session}
                navItems={navItems}
                signOut={signOut}
            />

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 min-w-0">
                <header className="hidden lg:flex h-20 items-center justify-between border-b-2 border-black bg-white px-8">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Building2 className="size-4 text-[#4285F4]" />
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-black">Business Portal</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 bg-[#4285F4] text-white border-2 border-black px-4 py-2 shadow-brutalist">
                            <Sparkles className="size-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Enterprise Plan</span>
                        </div>

                        <div className="flex items-center gap-3 border-2 border-black bg-neutral-50 px-3 py-1.5">
                            <div className="size-2 rounded-full bg-[#4285F4] animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-tight text-black">{session.user.email}</span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto bg-neutral-50 p-4 md:p-8">
                    <div className="max-w-6xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
