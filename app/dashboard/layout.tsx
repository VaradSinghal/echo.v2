import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, LogOut, User, Activity, Bot } from "lucide-react";

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
        { href: "/dashboard/agent", label: "Echo Agent", icon: <Bot className="h-5 w-5" /> },
        { href: "/dashboard/profile", label: "Profile", icon: <User className="h-5 w-5" /> },
    ];

    return (
        <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr] bg-white selection:bg-black selection:text-white">
            {/* Sidebar */}
            <div className="hidden border-r border-black bg-white lg:block sticky top-0 h-screen overflow-y-auto">
                <div className="flex h-full max-h-screen flex-col">
                    <div className="flex h-20 items-center justify-center border-b border-black px-6">
                        <Link className="flex items-center gap-2" href="/">
                            <img src="/logo.png" alt="Echo" className="h-8 w-8" />
                            <span className="text-2xl font-black uppercase tracking-tighter text-black">Echo</span>
                        </Link>
                    </div>

                    <div className="flex-1 overflow-auto py-8">
                        <nav className="grid items-start px-4 gap-2">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    className="flex items-center gap-4 border-2 border-transparent px-4 py-3 text-sm font-bold uppercase tracking-widest text-black/40 transition-all hover:text-black hover:border-black active:shadow-brutalist"
                                    href={item.href}
                                >
                                    {item.icon}
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    <div className="mt-auto p-4 border-t border-black">
                        <form action={signOut}>
                            <button className="flex w-full items-center justify-center gap-3 border-2 border-black bg-white py-3 text-xs font-black uppercase tracking-widest text-black transition-all hover:bg-black hover:text-white">
                                <LogOut className="h-4 w-4" />
                                Sign Out
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col">
                <header className="flex h-20 items-center justify-between border-b border-black bg-white px-8">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="size-2 bg-black" />
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-black">Signal Portal</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 border border-black bg-neutral-50 px-3 py-1.5">
                            <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-tight text-black">{session.user.email}</span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto bg-neutral-50 p-8">
                    <div className="max-w-5xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
