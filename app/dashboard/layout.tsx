import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Github, LogOut, User, Activity, Bot } from "lucide-react";

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
        redirect("/login");
    };

    return (
        <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
            <div className="hidden border-r bg-muted/40 lg:block dark:bg-gray-800/40">
                <div className="flex h-full max-h-screen flex-col gap-2">
                    <div className="flex h-[60px] items-center border-b px-6">
                        <Link className="flex items-center gap-2 font-semibold" href="#">
                            <Github className="h-6 w-6" />
                            <span className="">Echo V2</span>
                        </Link>
                    </div>
                    <div className="flex-1 overflow-auto py-2">
                        <nav className="grid items-start px-4 text-sm font-medium">
                            <Link
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                                href="/dashboard"
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                Repositories
                            </Link>
                            <Link
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                                href="/feed"
                            >
                                <Activity className="h-4 w-4" />
                                Feed
                            </Link>
                            <Link
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                                href="/dashboard/agent"
                            >
                                <Bot className="h-4 w-4" />
                                Agent
                            </Link>
                            <Link
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                                href="/dashboard/profile"
                            >
                                <User className="h-4 w-4" />
                                Profile
                            </Link>
                        </nav>
                    </div>
                    <div className="mt-auto p-4">
                        <form action={signOut}>
                            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:text-primary">
                                <LogOut className="h-4 w-4" />
                                Sign Out
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            <div className="flex flex-col">
                <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-6 lg:h-[60px] lg:px-8 dark:bg-gray-800/40">
                    {/* Mobile Menu Trigger would go here */}
                    <div className="w-full flex-1">
                        <h1 className="font-semibold text-lg">Dashboard</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">{session.user.email}</span>
                    </div>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
