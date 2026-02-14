"use server"

import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/service";
import { GitHubService } from "@/lib/github";
import { headers } from "next/headers";



export async function semanticSearch(query: string, repoId: string = "all", threshold: number = 0.7) {
    const supabase = createClient();
    const localUrl = process.env.LOCAL_EMBEDDING_URL || "http://localhost:8000/embed";

    // 1. Generate embedding for the query using local service
    let embedding: number[] | null = null;
    try {
        const response = await fetch(localUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: query })
        });
        if (response.ok) {
            const data = await response.json();
            embedding = data.embedding;
        }
    } catch (e) {
        console.error("Local embedding search failed:", e);
    }

    if (!embedding) return { error: "Failed to generate embedding" };

    // 2. Call RPC to find matches
    const { data, error } = await supabase.rpc('match_comments', {
        query_embedding: embedding,
        match_threshold: threshold,
        match_count: 20
    });

    if (error) return { error: error.message };

    // Filter results if repoId is not "all"
    let results = data || [];
    if (repoId !== "all") {
        results = results.filter((r: any) => r.repo_link === repoId);
    }

    return { data: results };
}


export async function toggleMonitoringAction(postId: string, repoId: string | null) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    try {
        const cleanRepoId = repoId?.replace('https://github.com/', '') || 'unknown';

        const { data: existing } = await supabase
            .from('monitored_posts')
            .select('id, is_active')
            .eq('post_id', postId)
            .eq('repo_id', cleanRepoId)
            .maybeSingle();

        if (existing) {
            const { error } = await supabase
                .from('monitored_posts')
                .update({
                    is_active: !existing.is_active
                })
                .eq('id', existing.id);
            if (error) throw error;
            return { success: true, active: !existing.is_active };
        } else {
            const { error } = await supabase
                .from('monitored_posts')
                .insert({
                    post_id: postId,
                    repo_id: cleanRepoId,
                    is_active: true
                });
            if (error) throw error;
            return { success: true, active: true };
        }
    } catch (e: any) {
        console.error("Error toggling monitoring:", e);
        return { error: e.message };
    }
}

export async function triggerAgentRunAction() {
    try {
        const headersList = headers();
        const host = headersList.get("host");
        const protocol = headersList.get("x-forwarded-proto") || "https";
        const isLocal = host?.includes("localhost") || host?.includes("127.0.0.1");
        const origin = isLocal ? `http://${host}` : `${protocol}://${host}`;

        const resp = await fetch(`${origin}/api/agent/run`, {
            method: 'POST',
            cache: 'no-store'
        });
        return await resp.json();
    } catch (e: any) {
        console.error("Agent trigger error", e);
        return { error: e.message };
    }
}

export async function generateReportAction(postId?: string) {
    const supabase = createClient();
    const localUrl = process.env.LOCAL_EMBEDDING_URL || "http://localhost:8000/embed";
    const baseUrl = localUrl.replace("/embed", "");

    try {
        let query = supabase
            .from('comments')
            .select('id')
            .order('created_at', { ascending: false });

        if (postId) {
            query = query.eq('post_id', postId);
        }

        const { data: comments } = await query.limit(100);
        const targetIds = comments?.map(c => c.id) || [];

        if (targetIds.length === 0) return { report: "No comments found for the selected signal." };

        const response = await fetch(`${baseUrl}/generate_report`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ comment_ids: targetIds })
        });

        if (!response.ok) throw new Error("Local LLM service failed");
        const data = await response.json();
        return { report: data.report };

    } catch (e: any) {
        console.error("Report generation error:", e);
        return { error: "Failed to generate report. Ensure Local LLM is active." };
    }
}

export async function getTopCommentAction(postId?: string) {
    const supabase = createClient();
    const localUrl = process.env.LOCAL_EMBEDDING_URL || "http://localhost:8000/embed";
    const baseUrl = localUrl.replace("/embed", "");

    try {
        let query = supabase
            .from('comments')
            .select('id')
            .order('created_at', { ascending: false });

        if (postId) {
            query = query.eq('post_id', postId);
        }

        const { data: comments } = await query.limit(100);
        const targetIds = comments?.map(c => c.id) || [];

        if (targetIds.length === 0) return { top_comment: null };

        const response = await fetch(`${baseUrl}/top_comment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ comment_ids: targetIds })
        });

        if (!response.ok) throw new Error("Local LLM service failed");
        const data = await response.json();
        return { top_comment: data.top_comment };

    } catch (e: any) {
        console.error("Top comment error:", e);
        return { error: "Failed to fetch top comment." };
    }
}

export async function getMonitoredPostsAction() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    try {
        const { data, error } = await supabase
            .from('monitored_posts')
            .select(`
                id,
                post_id,
                repo_id,
                posts!inner (
                    id,
                    content,
                    user_id
                )
            `)
            .eq('is_active', true)
            .eq('posts.user_id', user.id);

        if (error) throw error;

        const posts = (data || []).map((m: any) => ({
            id: m.post_id,
            title: m.posts?.content?.substring(0, 50) + "..." || m.repo_id
        }));

        return { posts };
    } catch (e: any) {
        console.error("Error fetching monitored posts:", e);
        return { error: e.message };
    }
}

export async function generateViaCliAction(taskId: string) {
    const supabase = createServiceRoleClient();
    const userClient = createClient();

    // 1. Fetch task and related data
    const { data: task, error: taskError } = await supabase
        .from('agent_tasks')
        .select(`
            *,
            monitored_posts (
                repo_id,
                posts (user_id)
            )
        `)
        .eq('id', taskId)
        .single();

    if (taskError || !task) return { error: "Task not found" };

    // 2. Get user ID
    let targetUserId: string | undefined;
    const { data: { user } } = await userClient.auth.getUser();

    if (user) {
        targetUserId = user.id;
    } else {
        const post = Array.isArray(task.monitored_posts.posts)
            ? task.monitored_posts.posts[0]
            : task.monitored_posts.posts;
        targetUserId = post?.user_id;
    }

    if (!targetUserId) return { error: "Authorized user not found for this task" };

    try {
        const github = new GitHubService();
        const repo = task.monitored_posts.repo_id;
        const branch = `echo-cli-fix-${taskId.substring(0, 8)}`;

        // Mark as processing
        await supabase.from('agent_tasks').update({
            status: 'processing',
            current_step: 'Initializing Local Agent generation...',
            last_heartbeat: new Date().toISOString()
        }).eq('id', taskId);

        // Helper for logging
        const addLog = async (msg: string, status: string = 'processing', step?: string) => {
            console.log(`🤖 [CLI Task ${taskId}] ${step ? `[${step}] ` : ''}${msg}`);
            const { data: currentTask } = await supabase.from('agent_tasks').select('logs').eq('id', taskId).single();
            const newLogEntry = { timestamp: new Date().toISOString(), message: msg, status };
            const newLogs = [...(currentTask?.logs || []), newLogEntry];
            await supabase.from('agent_tasks').update({
                logs: newLogs,
                status: status === 'failed' ? 'failed' : status === 'completed' ? 'completed' : 'processing',
                current_step: step || msg,
                last_heartbeat: new Date().toISOString()
            }).eq('id', taskId);
        };

        // 3. Get feedback context (Unified: Find the "best" comment for this post)
        const postId = task.monitored_posts.post_id;
        const { top_comment, error: topError } = await getTopCommentAction(postId);

        let feedback = "";
        let taskDescription = "";

        if (top_comment) {
            feedback = top_comment.content;
            taskDescription = top_comment.summary || feedback;
            await addLog(`Found top actionable feedback: "${feedback.substring(0, 50)}..."`, "processing", "Context Loaded");
        } else {
            // Fallback to the comment that triggered the task
            const { data: comment } = await supabase
                .from('comments')
                .select('content')
                .eq('id', task.result?.comment_id)
                .single();

            feedback = comment?.content || "Community request for improvements.";

            const { data: analysis } = await supabase
                .from('feedback_analysis')
                .select('actionable_summary, category')
                .eq('comment_id', task.result?.comment_id)
                .single();

            taskDescription = analysis?.actionable_summary || feedback;
            await addLog(`Using triggering comment as feedback: "${feedback.substring(0, 50)}..."`, "processing", "Context Loaded");
        }

        // 4. Get GitHub token for the user
        const { data: tokenData } = await supabase
            .from('github_tokens')
            .select('access_token')
            .eq('user_id', targetUserId)
            .single();

        const githubToken = tokenData?.access_token || "";

        // 5. Build repo URL
        let repoUrl = repo;
        if (!repoUrl.startsWith("https://")) {
            repoUrl = `https://github.com/${repoUrl}`;
        }

        await addLog(`Calling Local Agent to generate code for ${repo}...`, "processing", "Local Agent Generation");

        // 6. Call the Python backend /generate endpoint
        const localUrl = process.env.LOCAL_EMBEDDING_URL || "http://localhost:8000/embed";
        const baseUrl = localUrl.replace("/embed", "");

        const generateResponse = await fetch(`${baseUrl}/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                task_id: taskId, // Enabling real-time progression in backend
                repo_url: repoUrl,
                task: taskDescription,
                github_token: githubToken,
                create_pr: true // Request backend to handle git/gh flow
            })
        });

        if (!generateResponse.ok) {
            const errData = await generateResponse.json().catch(() => ({ detail: "Unknown error" }));
            throw new Error(`Local Agent generation failed: ${errData.detail || generateResponse.statusText}`);
        }

        const generateResult = await generateResponse.json();

        if (!generateResult.success || !generateResult.patches || generateResult.patches.length === 0) {
            throw new Error("Local Agent returned no patches.");
        }

        await addLog(`Generated ${generateResult.patches.length} patches. Repository updated locally.`, "processing", "Patches Ready");

        // 7. Save patches to generated_code table
        const fileChanges: { path: string, content: string, explanation: string }[] = [];

        for (const patch of generateResult.patches) {
            await supabase.from('generated_code').insert({
                task_id: taskId,
                file_path: patch.path,
                new_code: patch.new_code,
                explanation: patch.explanation,
                status: 'ready'
            });

            fileChanges.push({
                path: patch.path,
                content: patch.new_code,
                explanation: patch.explanation
            });
        }

        // 8. PR Status
        const prUrl = generateResult.pr_url;
        if (prUrl) {
            await addLog(`PR successfully created via CLI: ${prUrl}`, "completed", "Completed");

            // 9. Update task & log PR
            await supabase.from('agent_tasks').update({
                status: 'completed',
                current_step: 'PR Link: ' + prUrl
            }).eq('id', taskId);

            await supabase.from('generated_code').update({ status: 'applied' }).eq('task_id', taskId);

            const { data: firstCode } = await supabase.from('generated_code').select('id').eq('task_id', taskId).limit(1).single();
            if (firstCode) {
                await supabase.from('github_prs').insert({
                    generated_code_id: firstCode.id,
                    pr_number: parseInt(prUrl.split('/').pop() || "0"),
                    pr_url: prUrl,
                    status: 'open'
                });
            }
        } else {
            await addLog(`⚠️ Patches generated but PR creation via CLI failed. Check backend logs.`, "failed", "PR Failed");
            throw new Error("PR creation via GH CLI failed.");
        }

        // 10. Disable monitoring
        await supabase.from('monitored_posts').update({ is_active: false }).eq('id', task.monitored_post_id);

        return { success: true, url: prUrl };
    } catch (e: any) {
        console.error("❌ CLI Agent Action Error:", e.message);
        const { data: currentTask } = await supabase.from('agent_tasks').select('logs').eq('id', taskId).single();
        const failLogs = [...(currentTask?.logs || []), { timestamp: new Date().toISOString(), message: `ERROR: ${e.message}`, status: 'failed' }];

        await supabase.from('agent_tasks').update({
            status: 'failed',
            logs: failLogs,
            current_step: 'Failed: ' + e.message,
            result: { ...task.result, error: e.message }
        }).eq('id', taskId);
        return { error: e.message };
    }
}

export async function reinitializeLlmAction() {
    try {
        const localUrl = process.env.LOCAL_EMBEDDING_URL || "http://localhost:8000/embed";
        const baseUrl = localUrl.replace("/embed", "");

        const response = await fetch(`${baseUrl}/reinitialize`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });

        const data = await response.json();
        return data;
    } catch (e: any) {
        console.error("Failed to reinitialize LLM:", e);
        return { success: false, message: e.message };
    }
}

export async function retryAnalysisAction(commentId: string) {
    try {
        const localUrl = process.env.LOCAL_EMBEDDING_URL || "http://localhost:8000/embed";
        const baseUrl = localUrl.replace("/embed", "");

        const response = await fetch(`${baseUrl}/analyze_comment/${commentId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });

        const data = await response.json();
        return data;
    } catch (e: any) {
        console.error("Failed to retry analysis:", e);
        return { success: false, message: e.message };
    }
}
