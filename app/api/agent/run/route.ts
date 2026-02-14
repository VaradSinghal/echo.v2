import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/service";
import { checkRateLimit } from "@/lib/redis";
import { generateViaCliAction } from "@/app/actions/agent";

export async function POST(request: Request) {
    // Rate Limit check
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const { success } = await checkRateLimit(ip);
    if (!success) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const supabase = createServiceRoleClient();

    // 0. Recovery & Maintenance Phase
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 120 * 60 * 1000).toISOString();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();

    // A. ORPHAN CLEANUP: Mark tasks older than 2 hours as FAILED
    const { error: orphanError } = await supabase
        .from('agent_tasks')
        .update({
            status: 'failed',
            current_step: 'Failed: Orphaned task timed out (2h limit)',
            logs: [{ timestamp: new Date().toISOString(), message: "Marked as failed: Task exceeded maximum lifetime (2h).", status: "failed" }]
        })
        .in('status', ['processing', 'pending'])
        .lt('created_at', twoHoursAgo);

    if (orphanError) console.error("🤖 Maintenance Error (Orphans):", orphanError);

    // B. STALL RECOVERY: Reset processing tasks without heartbeats for 5m
    const { data: stalledTasks, error: stalledError } = await supabase
        .from('agent_tasks')
        .update({
            status: 'pending',
            current_step: 'Recovered: Resuming from stall',
            last_heartbeat: new Date().toISOString()
        })
        .eq('status', 'processing')
        .lt('last_heartbeat', fiveMinutesAgo)
        .select('id');

    if (stalledError) console.error("🤖 Maintenance Error (Stalled):", stalledError);

    // C. QUEUE PROCESSOR: Pick up existing pending tasks
    const { data: pendingTasks, error: pendingError } = await supabase
        .from('agent_tasks')
        .select('id')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(5);

    if (pendingError) {
        console.error("🤖 Queue Processor Error:", pendingError);
    } else {
        console.log(`🤖 Queue Processor: Found ${pendingTasks?.length || 0} pending tasks.`);
    }

    if (pendingTasks && pendingTasks.length > 0) {
        console.log(`🤖 Queue Processor: Dispatching ${pendingTasks.length} pending tasks...`);
        for (const task of pendingTasks) {
            console.log(`🤖 Dispatching task: ${task.id}`);
            // Dispatch via Local Qwen / GH CLI pipeline
            generateViaCliAction(task.id).catch(e => console.error(`❌ Dispatch failed for task ${task.id}:`, e));
        }
    }

    try {
        // 1. Get Active Monitored Posts with engagement metrics
        const { data: monitoredPostsData, error: monitoredError } = await supabase
            .from('monitored_posts')
            .select(`
                id,
                post_id,
                posts!inner (
                    title,
                    likes_count:likes(count),
                    comments_count:comments(count)
                )
            `)
            .eq('is_active', true);

        if (monitoredError || !monitoredPostsData) {
            return NextResponse.json({ message: 'Error fetching monitored posts', error: monitoredError, raw: monitoredPostsData });
        }

        // TEMPORARY: Return raw data for debugging
        if (request.headers.get("x-debug") === "true") {
            return NextResponse.json({ raw: monitoredPostsData });
        }

        // 2. Filter by threshold (1 like and 1 comment for now)
        const THRESHOLD_LIKES = 1;
        const THRESHOLD_COMMENTS = 1;

        const monitoredPosts = monitoredPostsData.filter((p: any) => {
            const post = Array.isArray(p.posts) ? p.posts[0] : p.posts;
            const likes = post?.likes_count?.[0]?.count ?? 0;
            const comments = post?.comments_count?.[0]?.count ?? 0;

            const meetsThreshold = likes >= THRESHOLD_LIKES && comments >= THRESHOLD_COMMENTS;
            console.log(`🤖 Agent Trace | Post: "${post?.title?.substring(0, 20)}..." | Eng: ${likes}L, ${comments}C | Threshold: ${THRESHOLD_LIKES}L, ${THRESHOLD_COMMENTS}C | Result: ${meetsThreshold ? 'PASS' : 'SKIP'}`);
            return meetsThreshold;
        });

        console.log(`🤖 Agent Analysis: Found ${monitoredPostsData.length} records in monitored_posts.`);
        console.log(`🤖 Filtered Result: ${monitoredPosts.length} posts ready for analysis.`);

        if (monitoredPosts.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No posts met the engagement threshold',
                stats: { total: monitoredPostsData.length, metThreshold: 0 }
            });
        }

        const postIds = monitoredPosts.map(p => p.post_id);
        console.log(`🤖 Post IDs to fetch comments for: ${postIds}`);

        // Fetch recent comments for these posts
        const { data: comments, error: fetchError } = await supabase
            .from('comments')
            .select('*')
            .in('post_id', postIds)
            .order('created_at', { ascending: false })
            .limit(20);

        if (fetchError) {
            console.error("❌ Error fetching comments:", fetchError);
            return NextResponse.json({ error: 'Error fetching comments' }, { status: 500 });
        }

        console.log(`🤖 Found ${comments?.length || 0} comments to analyze.`);

        if (!comments || comments.length === 0) return NextResponse.json({ message: 'No comments found', processed: 0 });

        return NextResponse.json({
            success: true,
            message: "Queue processed and engagement checked.",
            monitored: monitoredPosts.length
        });

    } catch (error) {
        console.error("Agent run error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
