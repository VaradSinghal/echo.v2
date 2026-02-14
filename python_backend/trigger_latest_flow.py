import os
import asyncio
import httpx
from supabase._async.client import AsyncClient as SupabaseAsyncClient
from dotenv import load_dotenv

load_dotenv()

async def trigger_flow():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    supabase = SupabaseAsyncClient(url, key)
    
    # 1. Get latest comment for latest monitored post
    res = await supabase.table("monitored_posts").select("post_id, repo_id").order("created_at", desc=True).limit(1).execute()
    if not res.data:
        print("No monitored posts.")
        return
    
    post_id = res.data[0]['post_id']
    repo_id = res.data[0]['repo_id']
    
    comments_res = await supabase.table("comments").select("id, content").eq("post_id", post_id).order("created_at", desc=True).limit(1).execute()
    if not comments_res.data:
        print("No comments.")
        return
    
    comment = comments_res.data[0]
    print(f"Triggering analysis for comment: {comment['id']} ('{comment['content'][:30]}...')")
    
    # 2. Call analyze_comment endpoint
    python_url = "http://localhost:8000"
    async with httpx.AsyncClient(timeout=300.0) as client:
        # Step A: Reinitialize just in case (as user mentioned fails)
        print("♻️ Reinitializing LLM...")
        await client.post(f"{python_url}/reinitialize")
        
        # Step B: Analyze
        print("🧪 Analyzing...")
        analysis_res = await client.post(f"{python_url}/analyze_comment/{comment['id']}")
        print(f"Analysis result: {analysis_res.json()}")
        
        # Give it a moment to save to DB
        await asyncio.sleep(2)
        
        # Step C: Trigger Agent Run via Frontend
        # (The process_comment_async actually creates the task if priority is high)
        # Check if task was created
        tasks_res = await supabase.table("agent_tasks").select("id").eq("status", "pending").order("created_at", desc=True).limit(1).execute()
        if tasks_res.data:
            task_id = tasks_res.data[0]['id']
            print(f"✅ Created Agent Task: {task_id}")
            
            # Step D: Trigger the Python generate endpoint (or via frontend /api/agent/run)
            print("🚀 Triggering Agent Run...")
            frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
            await client.post(f"{frontend_url}/api/agent/run")
            print("Successfully triggered agent run.")
        else:
            print("⚠️ No task created automatically. Priority might be low. Manually creating task...")
            # Manual creation if needed
            task_data = {
                "monitored_post_id": (await supabase.table("monitored_posts").select("id").eq("post_id", post_id).single().execute()).data['id'],
                "task_type": "generate_code",
                "status": "pending",
                "current_step": "Manual trigger for latest feedback.",
                "result": {"comment_id": comment['id'], "priority": 1.0}
            }
            await supabase.table("agent_tasks").insert(task_data).execute()
            print("✅ Manually created Agent Task. Triggering run again...")
            await client.post(f"{frontend_url}/api/agent/run")

if __name__ == "__main__":
    asyncio.run(trigger_flow())
