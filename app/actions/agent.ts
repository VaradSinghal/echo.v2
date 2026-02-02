"use server"

import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/service";
import { GeminiService } from "@/lib/gemini";
import { GitHubService } from "@/lib/github";
import { headers } from "next/headers";

const gemini = new GeminiService();

export async function createPullRequestAction(taskId: string) {
    const supabase = createServiceRoleClient();
    const userClient = createClient();

    // 1. Fetch task and related data with owner info
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

    // 2. Fetch User ID (for token) - try session first, then fallback to post owner
    let targetUserId: string | undefined;
    const { data: { user } } = await userClient.auth.getUser();

    if (user) {
        targetUserId = user.id;
    } else {
        // Fallback to the user who owns the post/repo
        const post = Array.isArray(task.monitored_posts.posts)
            ? task.monitored_posts.posts[0]
            : task.monitored_posts.posts;
        targetUserId = post?.user_id;
    }

    if (!targetUserId) return { error: "Authorized user not found for this task" };

    try {
        const github = new GitHubService();
        const repo = task.monitored_posts.repo_id;
        const branch = `echo-agent-fix-${taskId.substring(0, 8)}`;

        // Helper for logging and heartbeat
        const addLog = async (msg: string, status: string = 'processing', step?: string) => {
            console.log(`🤖 [Task ${taskId}] ${step ? `[${step}] ` : ''}${msg}`);

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

        // 1. Fetch Repository Structure (Virtual Clone)
        await addLog(`Discovering repo structure for ${repo}...`, "processing", "Analyzing Repo");
        const fileTree = await github.getRepoTree(targetUserId, repo);
        await addLog(`Successfully mapped ${fileTree.length} files in repository.`, "processing", "Context Loaded");


        // 2. Fetch the feedback context
        const { data: comment } = await supabase
            .from('comments')
            .select('content')
            .eq('id', task.result?.comment_id)
            .single();

        const feedback = comment?.content || "Community request for improvements.";

        // 3. Plan Implementation (Context Aware)
        await addLog("Planning implementation strategy with Gemini...", "processing", "Planning");
        const targetFiles = await gemini.planImplementation(feedback, fileTree);

        if (!targetFiles || targetFiles.length === 0) {
            throw new Error("Gemini could not identify any files to modify for this feedback.");
        }

        await addLog(`Identified ${targetFiles.length} files for modification: ${targetFiles.join(", ")}`);

        // 4. Fetch File Contents and Generate Patches
        const fileChanges: { path: string, content: string, explanation: string }[] = [];

        for (const filePath of targetFiles) {
            await addLog(`Fetching content for ${filePath}...`, "processing", `Patching ${filePath}`);

            try {
                const currentCode = await github.getFileContent(targetUserId, repo, filePath);
                await addLog(`Current content for ${filePath} loaded (${currentCode.length} chars).`, "processing", `Patching ${filePath}`);

                // Add context about other files being modified if multi-file
                const context = targetFiles.length > 1
                    ? `This is part of a multi-file change involving: ${targetFiles.join(", ")}`
                    : "";

                await addLog(`Requesting patch from Gemini for ${filePath}...`, "processing", `Patching ${filePath}`);
                const aiResult = await gemini.generateCode(feedback, filePath, currentCode, context);

                if (aiResult) {
                    await addLog(`Patch generated for ${filePath} (Confidence: ${aiResult.confidence_score}).`, "processing", `Patching ${filePath}`);
                    fileChanges.push({
                        path: filePath,
                        content: aiResult.new_code,
                        explanation: aiResult.explanation
                    });
                } else {
                    await addLog(`Warning: Gemini failed to generate a patch for ${filePath}.`, "processing", `Patching ${filePath}`);
                }
            } catch (fileErr: any) {
                await addLog(`Warning: Skipping ${filePath} due to error: ${fileErr.message}`, "processing", `Patching ${filePath}`);
            }
        }

        if (fileChanges.length === 0) {
            throw new Error("No valid patches were generated for any of the target files.");
        }

        await addLog(`Synthesized ${fileChanges.length} patches. Preparing GitHub dispatch...`, "processing", "Dispatching");

        // 5. Save Generated Code for first file (backward compat for schema) + Log all
        for (const change of fileChanges) {
            await supabase.from('generated_code').insert({
                task_id: taskId,
                file_path: change.path,
                new_code: change.content,
                explanation: change.explanation,
                status: 'ready'
            });
        }

        // 6. Create PR via GitHub
        const prTitle = `Agent: ${fileChanges[0].explanation.substring(0, 50)}...`;
        const prBody = `This PR was automatically generated by the Echo Agent based on community feedback.\n\n### Feedback Context\n> ${feedback}\n\n### Changes Summary\n${fileChanges.map(c => `- **${c.path}**: ${c.explanation}`).join("\n")}`;

        await addLog(`Creating PR in ${repo} on branch ${branch}...`, "processing", "Creating PR");
        const pr = await github.createPR(
            targetUserId,
            repo,
            branch,
            prTitle,
            prBody,
            fileChanges.map(c => ({ path: c.path, content: c.content }))
        );

        await addLog(`PR #${pr.number} successfully dispatched!`, "completed", "Completed");

        // 7. Update Task & Log PR
        await supabase.from('agent_tasks').update({
            status: 'completed',
            current_step: 'PR Link: ' + pr.html_url
        }).eq('id', taskId);

        // Map the PR to the first generated code record for simple lookup
        const { data: firstCode } = await supabase.from('generated_code').select('id').eq('task_id', taskId).limit(1).single();
        if (firstCode) {
            await supabase.from('github_prs').insert({
                generated_code_id: firstCode.id,
                pr_number: pr.number,
                pr_url: pr.html_url,
                status: 'open'
            });
        }

        return { success: true, url: pr.html_url };
    } catch (e: any) {
        console.error("❌ Agent Action Error:", e.message);
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

export async function semanticSearch(query: string, repoId: string = "all", threshold: number = 0.7) {
    const supabase = createClient();

    // 1. Generate embedding for the query
    const embedding = await gemini.generateEmbedding(query);
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

export async function getTopicsForPost(postId: string) {
    const supabase = createClient();

    const { data: comments, error } = await supabase
        .from('comments')
        .select('content')
        .eq('post_id', postId)
        .limit(50);

    if (error || !comments) return { error: "Failed to fetch comments" };

    const topics = await gemini.extractTopics(comments.map(c => c.content));
    return { topics };
}

export async function toggleMonitoringAction(postId: string, repoId: string | null) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    try {
        const { data: existing } = await supabase
            .from('monitored_posts')
            .select('id, is_active')
            .eq('post_id', postId)
            .maybeSingle();

        const cleanRepoId = repoId?.replace('https://github.com/', '') || 'unknown';

        if (existing) {
            const { error } = await supabase
                .from('monitored_posts')
                .update({
                    is_active: !existing.is_active,
                    repo_id: cleanRepoId // Ensure it's clean on update too
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
