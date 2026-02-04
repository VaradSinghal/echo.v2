import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, LogOut, User, Activity, Bot, MessageSquare } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = createClient();
    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
        redirect("/login");
    }

    const signOut = async () => {
        "use server";
        const supabase = createClient();
        await supabase.auth.signOut();
        redirect("/");
    };

    const navItems = [
        { href: "/dashboard/feed", label: "Community Feed", icon: <Activity className="h-5 w-5" /> },
        { href: "/dashboard/reddit", label: "Reddit", icon: <MessageSquare className="h-5 w-5" /> },
        { href: "/dashboard/agent", label: "Echo Agent", icon: <Bot className="h-5 w-5" /> },
        { href: "/dashboard/profile", label: "Profile", icon: <User className="h-5 w-5" /> },
    ];

    return (
        <div className="flex flex-col lg:flex-row min-h-screen w-full bg-white selection:bg-black selection:text-white">
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
                            <span className="size-2 bg-black" />
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-black">Signal Portal</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 border-2 border-black bg-neutral-50 px-3 py-1.5">
                            <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-tight text-black">{session.user.email}</span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto bg-neutral-50 p-4 md:p-8">
                    <div className="max-w-5xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
