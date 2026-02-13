
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Need service role to bypass RLS/etc
const supabase = createClient(supabaseUrl, supabaseKey);

async function runPipelineTest() {
    console.log("🛠️ Starting E2E Pipeline Test...");

    // 1. Get a monitored post
    const { data: monitors } = await supabase
        .from('monitored_posts')
        .select('id, post_id, repo_id')
        .eq('is_active', true)
        .limit(1);

    if (!monitors || monitors.length === 0) {
        console.error("❌ No active monitored posts found. Please monitor a post first.");
        return;
    }

    const monitor = monitors[0];
    console.log(`📌 Using Monitor: ${monitor.id} (Repo: ${monitor.repo_id})`);

    // 2. Insert a high-priority bug comment
    const testContent = `URGENT BUG: The dashboard crashes when I click the 'Analyze' button repeatedly slowly. It seems to be a race condition in the state management. Please fix this in components/dashboard/LocalInsights.tsx.`;

    // Get a real user_id from the post owner
    const { data: postData } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', monitor.post_id)
        .single();

    const userId = postData?.user_id;
    if (!userId) {
        console.error("❌ Could not find post owner user_id.");
        return;
    }

    console.log("📝 Inserting simulated bug report...");
    const { data: comment, error: commentErr } = await supabase
        .from('comments')
        .insert({
            post_id: monitor.post_id,
            content: testContent,
            user_id: userId
        })
        .select()
        .single();

    if (commentErr) {
        console.error("❌ Error inserting comment:", commentErr);
        return;
    }
    console.log(`✅ Comment inserted: ${comment.id}`);

    // 3. Wait for Local Analysis (Python Backend)
    console.log("⏳ Waiting for Local LLM analysis (Python Backend)...");
    let analysis = null;
    for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const { data } = await supabase
            .from('feedback_analysis')
            .select('*')
            .eq('comment_id', comment.id)
            .maybeSingle();

        if (data) {
            analysis = data;
            break;
        }
        process.stdout.write(".");
    }

    if (!analysis) {
        console.error("\n❌ Timeout: Python backend did not analyze the comment in time.");
        return;
    }
    console.log(`\n🧠 Analysis Received: Category=${analysis.category}, Priority=${analysis.priority_score}`);

    // 4. Trigger Agent Run API
    console.log("🚀 Triggering Agent API Run...");
    const resp = await fetch("http://localhost:3000/api/agent/run", { method: 'POST' });
    const runResult = await resp.json();
    console.log("📡 API Response:", runResult);

    // 5. Monitor Task Progress
    console.log("⏳ Monitoring Agent Task...");
    let task = null;
    for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const { data } = await supabase
            .from('agent_tasks')
            .select('*')
            .eq('monitored_post_id', monitor.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (data && data.status !== 'pending' && data.status !== 'processing') {
            task = data;
            break;
        }
        if (data) {
            console.log(`🔄 Step: ${data.current_step} | Status: ${data.status}`);
        }
    }

    if (!task || task.status !== 'completed') {
        console.error(`❌ Task failed or timed out. Last status: ${task?.status}`);
        return;
    }

    console.log(`\n🎉 PIPELINE SUCCESS!`);
    console.log(`🔗 PR Created: ${task.current_step}`);
}

runPipelineTest().catch(console.error);
