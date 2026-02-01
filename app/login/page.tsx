import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

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

        // We need to construct the URL dynamically or use a fixed env var
        // Since we are in a server action, let's use the origin header or ENV
        const headersList = headers();
        const host = headersList.get("host");
        const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
        const origin = `${protocol}://${host}`;

        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "github",
            options: {
                redirectTo: `${origin}/auth/callback`,
                scopes: "read:user repo", // Request repo access
            },
        });

        if (data.url) {
            redirect(data.url);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-2">
            <div className="w-full max-w-md space-y-8 px-4 sm:px-0">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
                        Sign in to your account
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Manage your GitHub repositories with Echo
                    </p>
                </div>

                <form action={signIn} className="mt-8 space-y-6">
                    <button
                        type="submit"
                        className="group relative flex w-full justify-center rounded-md bg-black py-2 px-4 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                    >
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <svg
                                className="h-5 w-5 text-gray-500 group-hover:text-gray-400"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </span>
                        Sign in with GitHub
                    </button>

                    {searchParams?.message && (
                        <p className="mt-4 text-center text-sm font-medium text-destructive">
                            {searchParams.message}
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}
