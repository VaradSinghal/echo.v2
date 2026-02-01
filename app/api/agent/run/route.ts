import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { GeminiService } from '@/lib/gemini';
import { checkRateLimit } from '@/lib/redis';

export async function POST(request: Request) {
    // Rate Limit check
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const { success } = await checkRateLimit(ip);
    if (!success) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const supabase = createClient();
    const gemini = new GeminiService();

    try {
        // 1. Fetch unanalyzed comments from monitored posts
        // For simplicity, we fetch comments that do NOT have a corresponding feedback_analysis entry
        // This requires a customized join or query. We'll implement a simpler approach:
        // Fetch last 10 comments, iterate, check if analyzed.
        // Ideally: Use a SQL function or explicit left join filter.

        // Get Active Monitored Posts
        const { data: monitoredPosts } = await supabase
            .from('monitored_posts')
            .select('post_id, id')
            .eq('is_active', true);

        if (!monitoredPosts || monitoredPosts.length === 0) {
            return NextResponse.json({ message: 'No active monitored posts' });
        }

        const postIds = monitoredPosts.map(p => p.post_id);

        // Fetch recent comments for these posts
        const { data: comments } = await supabase
            .from('comments')
            .select('*')
            .in('post_id', postIds)
            .order('created_at', { ascending: false })
            .limit(20);

        if (!comments) return NextResponse.json({ message: 'No comments found' });

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
            const analysis = await gemini.analyzeFeedback(comment.content);
            if (analysis) {
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
                    // Generate Embedding
                    const embedding = await gemini.generateEmbedding(comment.content);
                    if (embedding) {
                        await supabase.from('comment_embeddings').insert({
                            comment_id: comment.id,
                            embedding: embedding
                        });
                    }

                    // 3. Conditional: Trigger Code Generation for High Impact Feedback
                    if (analysis.category === 'feature_request' || analysis.category === 'bug') {
                        // Create a pending 'generate_code' task
                        await supabase.from('agent_tasks').insert({
                            monitored_post_id: monitoredPosts.find(p => p.post_id === comment.post_id)?.id,
                            task_type: 'generate_code',
                            status: 'pending',
                            result: {
                                comment_id: comment.id,
                                reason: `Automated trigger for ${analysis.category}`
                            }
                        });
                    }

                    processedCount++;
                }
            }
        }

        return NextResponse.json({ success: true, processed: processedCount });

    } catch (error) {
        console.error("Agent run error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
