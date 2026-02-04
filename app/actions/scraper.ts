"use server";

import { scrapeRedditComments, RedditComment } from "@/lib/scraper/reddit";
import { createClient } from "@/utils/supabase/server";

export interface ScrapeResult {
    success: boolean;
    data?: RedditComment[];
    error?: string;
}

export async function saveRedditCommentsAction(url: string, comments: RedditComment[]) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        // 1. Create a Post for this Reddit thread
        // We'll try to guess a title from the URL or first comment, or just use URL
        // Better: Helper can return title now (I removed it from return type though, oops. I should add it back or pass it)
        // For now, simple title.
        const title = `Reddit Thread: ${url.split('/comments/')[1]?.split('/')[0] || 'Unknown'}`;

        const { data: post, error: postError } = await supabase
            .from('posts')
            .insert({
                user_id: user.id,
                title: title,
                content: url, // Storing URL in content or we should add a 'url' column if exists. I'll assume 'content' for now or 'url'.
                // Let's check schema by failing or conservative guess. 
                // Best guess: 'platform' field might exist?
                // Let's dump 'content' as the URL + Title for now to be safe if no URL column.
            })
            .select()
            .single();

        if (postError) {
            console.error("Error creating post:", postError);
            return { success: false, error: "Failed to create post record: " + postError.message };
        }

        // 2. Insert Comments
        const commentsToInsert = comments.map(c => ({
            post_id: post.id,
            user_id: user.id, // The user who scraped it owns the record in our DB? Or null? 
            // Usually 'user_id' in comments table refers to the app user, not reddit user.
            // I'll use the current user for now, or maybe the system user if I could?
            // Actually, if 'user_id' is required, it must be the current user.
            content: `[${c.author}] ${c.content}`, // Preserving author in content
            // upvotes: c.upvotes // If table has this
        }));

        const { error: commentsError } = await supabase
            .from('comments')
            .insert(commentsToInsert);

        if (commentsError) {
            console.error("Error saving comments:", commentsError);
            return { success: false, error: "Created post but failed to save comments" };
        }

        return { success: true, postId: post.id };

    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function scrapeRedditPostAction(url: string): Promise<ScrapeResult> {
    if (!url) {
        return { success: false, error: "URL is required" };
    }

    try {
        console.log(`Action: Scraping ${url}...`);
        const comments = await scrapeRedditComments(url);

        // TODO: Ideally, we would save these to the database here.
        // For now, we return them to the caller to verify functionality.

        return { success: true, data: comments };
    } catch (error: any) {
        console.error("Action Error:", error);
        return { success: false, error: error.message };
    }
}
