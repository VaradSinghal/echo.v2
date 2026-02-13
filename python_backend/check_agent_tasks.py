import os
import asyncio
from supabase._async.client import AsyncClient, create_client
from dotenv import load_dotenv

load_dotenv("../.env.local")
url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

async def check_tasks():
    supabase = AsyncClient(url, key)
    print("🔍 Checking agent_tasks table...")
    res = await supabase.table("agent_tasks").select("*").order("created_at", desc=True).limit(1).execute()
    if res.data:
        task = res.data[0]
        print(f"✅ Found Recent Task: {task['id']}")
        print(f"   Type: {task['task_type']}")
        print(f"   Status: {task['status']}")
        print(f"   Step: {task['current_step']}")
        print(f"   Result: {task['result']}")
    else:
        print("❌ No tasks found in agent_tasks.")

if __name__ == "__main__":
    asyncio.run(check_tasks())
