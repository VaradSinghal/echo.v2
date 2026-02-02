
import { createServiceRoleClient } from "../utils/supabase/service";
import { createPullRequestAction } from "../app/actions/agent";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function runTest() {
    const supabase = createServiceRoleClient();

    console.log("🧪 Starting End-to-End Workflow Test...");

    // 1. Create a fresh test task
    const { data: task, error: taskError } = await supabase
        .from('agent_tasks')
        .insert({
            monitored_post_id: 'bbc05353-7717-4b0e-928f-f3967c55f8d0', // VaradSinghal/test-repo
            task_type: 'generate_code',
            status: 'pending',
            current_step: 'Manual Test Trigger',
            result: {
                comment_id: '75a74cb6-47bf-4656-a85c-42a52fbaf629', // "ADD A BETTER GREETING LINE"
                reason: 'E2E Testing'
            }
        })
        .select()
        .single();

    if (taskError || !task) {
        console.error("❌ Failed to create test task:", taskError);
        return;
    }

    console.log(`✅ Test Task Created: ${task.id}`);
    console.log(`🔗 Monitor Logs: http://localhost:3000/dashboard/agent (Look for task ${task.id.substring(0, 8)})`);

    // 2. Trigger the action
    console.log("🚀 Triggering createPullRequestAction...");
    try {
        const result = await createPullRequestAction(task.id);
        if (result.error) {
            console.error("❌ Action failed:", result.error);
        } else {
            console.log("🎉 Action successful!", result.url);
        }
    } catch (e: any) {
        console.error("💥 Execution Error:", e.message);
    }
}

runTest();
