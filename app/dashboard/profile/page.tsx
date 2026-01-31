import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

    const user = session.user;

    return (
        <div className="flex flex-col gap-6">
            <h2 className="text-2xl font-bold tracking-tight">Your Profile</h2>

            <div className="rounded-lg border bg-card text-card-foreground shadow-sm max-w-2xl">
                <div className="flex flex-col space-y-1.5 p-6">
                    <div className="flex items-center gap-4">
                        <div className="relative flex h-20 w-20 shrink-0 overflow-hidden rounded-full">
                            <img className="aspect-square h-full w-full" src={profile?.avatar_url || user.user_metadata.avatar_url} alt="Avatar" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold">{profile?.username || user.user_metadata.full_name}</h3>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 pt-0 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">User ID</p>
                            <p className="text-sm text-muted-foreground break-all">{user.id}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">GitHub ID</p>
                            <p className="text-sm text-muted-foreground">{profile?.github_id || "N/A"}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">Last Sign In</p>
                            <p className="text-sm text-muted-foreground">{new Date(user.last_sign_in_at || "").toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
