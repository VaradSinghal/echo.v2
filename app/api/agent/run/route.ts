import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/service";
import { GeminiService } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/redis";
import { createPullRequestAction } from "@/app/actions/agent";

export async function POST(request: Request) {
    // Rate Limit check
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const { success } = await checkRateLimit(ip);
    if (!success) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const supabase = createServiceRoleClient();
    const gemini = new GeminiService();

    // 0. Cleanup Stale Tasks (Older than 10 minutes without heartbeat)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { error: cleanupError } = await supabase
        .from('agent_tasks')
        .update({
            status: 'failed',
            current_step: 'Failed: Agent process timed out (no heartbeat)',
            logs: [{ timestamp: new Date().toISOString(), message: "Marked as failed due to inactivity (timeout).", status: "failed" }]
        })
        .eq('status', 'processing')
        .lt('last_heartbeat', tenMinutesAgo);

    if (cleanupError) console.error("🤖 Cleanup Error:", cleanupError);

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

        let processedCount = 0;

        for (const comment of comments) {
            // Check if already analyzed
            const { data: existing } = await supabase
                .from('feedback_analysis')
                .select('id')
                .eq('comment_id', comment.id)
                .single();

            if (existing) continue;

            // Perform Analysis
            console.log(`🤖 Analyzing comment ID: ${comment.id} -> "${comment.content.substring(0, 30)}..."`);
            try {
                const analysis = await gemini.analyzeFeedback(comment.content);
                if (analysis) {
                    console.log(`✅ Gemini Analysis Received: Category=${analysis.category}, Sentiment=${analysis.sentiment_score}`);
                    const { data: analysisData, error: analysisError } = await supabase
                        .from('feedback_analysis')
                        .insert({
                            comment_id: comment.id,
                            sentiment_score: analysis.sentiment_score,
                            category: analysis.category,
                            keywords: analysis.keywords,
                        })
                        .select()
                        .single();

                    if (!analysisError && analysisData) {
                        console.log(`✅ Saved Analysis to DB for comment: ${comment.id}`);
                        // Generate Embedding
                        const embedding = await gemini.generateEmbedding(comment.content);
                        if (embedding) {
                            await supabase.from('comment_embeddings').insert({
                                comment_id: comment.id,
                                embedding: embedding
                            });
                            console.log(`✅ Saved Embedding for comment: ${comment.id}`);
                        }

                        // 3. Conditional: Trigger Code Generation for High Impact Feedback
                        if (analysis.category === 'feature_request' || analysis.category === 'bug') {
                            console.log(`🚀 High Impact Feedback Detected: Creating task for ${analysis.category}`);

                            // Create a pending 'generate_code' task with initial log
                            const { data: task, error: taskError } = await supabase.from('agent_tasks').insert({
                                monitored_post_id: monitoredPosts.find(p => p.post_id === comment.post_id)?.id,
                                task_type: 'generate_code',
                                status: 'pending',
                                current_step: 'Queued',
                                logs: [
                                    { timestamp: new Date(Date.now() - 3000).toISOString(), message: `High-impact signal detected in community feed.` },
                                    { timestamp: new Date(Date.now() - 1000).toISOString(), message: `Gemini Analysis: Category identified as [${analysis.category.toUpperCase()}].` },
                                    { timestamp: new Date().toISOString(), message: `Autonomous engineering task initialized.` }
                                ],
                                result: {
                                    comment_id: comment.id,
                                    reason: `Automated trigger for ${analysis.category}`
                                }
                            }).select().single();

                            if (taskError) {
                                console.error("❌ Task Creation Error:", taskError);
                            } else {
                                console.log(`✅ Task Created successfully: ${task.id}`);

                                // Proactively trigger the automated engineering pipeline
                                createPullRequestAction(task.id).catch(e => {
                                    console.error("❌ Autonomous PR dispatch failed:", e);
                                });
                            }
                        }

                        processedCount++;
                    } else {
                        console.error("❌ Analysis insertion error:", analysisError);
                    }
                } else {
                    console.warn("⚠️ Analysis returned null for comment:", comment.id);
                }
            } catch (e: any) {
                console.error(`❌ Analysis Error for comment ${comment.id}:`, e.message);
            }
        }

        return NextResponse.json({ success: true, processed: processedCount });

    } catch (error) {
        console.error("Agent run error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
