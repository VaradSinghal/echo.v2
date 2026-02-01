
import { createServiceRoleClient } from "../utils/supabase/service";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createServiceRoleClient();

async function debugAgent() {
    console.log("🔍 Debugging Agent Monitoring State...");

    // 1. Check monitored posts
    const { data: monitored, error: mError } = await supabase
        .from('monitored_posts')
        .select(`
            id,
            post_id,
            is_active,
            repo_id,
            posts (
                title,
                likes:likes(count),
                comments:comments(count)
            )
        `);

    if (mError) {
        console.error("❌ Error fetching monitored posts:", mError);
    } else {
        console.log(`📊 Found ${monitored?.length || 0} monitored posts:`);
        monitored?.forEach((m: any) => {
            const likes = m.posts?.likes?.[0]?.count ?? 0;
            const comments = m.posts?.comments?.[0]?.count ?? 0;
            console.log(`- ID: ${m.id} | Repo: ${m.repo_id} | Active: ${m.is_active} | Likes: ${likes} | Comments: ${comments} | Title: ${m.posts?.title}`);
        });
    }

    // 2. Check recent feedback analysis
    const { data: analysis } = await supabase.from('feedback_analysis').select('*').limit(5);
    console.log(`\n🧠 Recent Feedback Analysis: ${analysis?.length || 0}`);

    // 3. Check recent tasks
    const { data: tasks } = await supabase.from('agent_tasks').select('*').order('created_at', { ascending: false }).limit(5);
    console.log(`\n📋 Recent Agent Tasks: ${tasks?.length || 0}`);
    tasks?.forEach(t => {
        console.log(`- Type: ${t.task_type} | Status: ${t.status} | Created: ${t.created_at}`);
    });
}

debugAgent();
