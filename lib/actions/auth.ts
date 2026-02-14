"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function signInWithGithub() {
    const headersList = headers();
    const host = headersList.get("host");
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const origin = `${protocol}://${host}`;

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
            redirectTo: `${origin}/auth/callback?next=/dashboard/feed&user_type=developer`,
            scopes: "read:user repo",
        },
    });

    if (data.url) {
        redirect(data.url);
    }
}

export async function signInWithGoogle() {
    const headersList = headers();
    const host = headersList.get("host");
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const origin = `${protocol}://${host}`;

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: `${origin}/auth/callback?next=/business&user_type=business`,
            queryParams: {
                access_type: "offline",
                prompt: "consent",
            },
        },
    });

    if (data.url) {
        redirect(data.url);
    }
}
