import os
import asyncio
import httpx
from supabase._async.client import AsyncClient as SupabaseAsyncClient
from dotenv import load_dotenv

load_dotenv()

async def manual_trigger():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    supabase = SupabaseAsyncClient(url, key)
    
    # 1. Latest monitored post
    res = await supabase.table("monitored_posts").select("id, repo_id").order("created_at", desc=True).limit(1).execute()
    monitored_post_id = res.data[0]['id']
    repo_id = res.data[0]['repo_id']
    
    # 2. Latest comment
    comment_res = await supabase.table("comments").select("id, content").order("created_at", desc=True).limit(1).execute()
    comment_id = comment_res.data[0]['id']
    comment_content = comment_res.data[0]['content']
    
    # 3. Create Agent Task
    task_desc = f"Implement the requested feature: '{comment_content}' for the {repo_id} repository."
    task_data = {
        "monitored_post_id": monitored_post_id,
        "task_type": "generate_code",
        "status": "pending",
        "current_step": "Manually triggered from latest feedback.",
        "result": {
            "comment_id": comment_id,
            "priority": 1.0,
            "task_description": task_desc
        }
    }
    
    insert_res = await supabase.table("agent_tasks").insert(task_data).execute()
    task_id = insert_res.data[0]['id']
    print(f"✅ Created Agent Task: {task_id}")
    
    # 4. Trigger Run via Frontend
    print("🚀 Triggering Agent Run at /api/agent/run ...")
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    async with httpx.AsyncClient() as client:
        await client.post(f"{frontend_url}/api/agent/run")
    
    print("Pipeline successfully triggered.")

if __name__ == "__main__":
    asyncio.run(manual_trigger())
