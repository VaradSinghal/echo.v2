import os
import asyncio
import httpx
from supabase._async.client import AsyncClient as SupabaseAsyncClient
from dotenv import load_dotenv

load_dotenv()

async def trigger_test_pr():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    supabase = SupabaseAsyncClient(url, key)
    
    # 1. Get all GitHub tokens
    res = await supabase.table("github_tokens").select("access_token").execute()
    tokens = [t['access_token'] for t in res.data]
    
    selected_token = None
    target_repo = "VaradSinghal/test-repo"
    
    print(f"Checking {len(tokens)} tokens for write access to {target_repo}...")
    
    async with httpx.AsyncClient() as client:
        for t in tokens:
            try:
                # Check repo permissions with this token
                gh_res = await client.get(
                    f"https://api.github.com/repos/{target_repo}",
                    headers={"Authorization": f"token {t}"}
                )
                if gh_res.status_code == 200:
                    repo_data = gh_res.json()
                    permissions = repo_data.get("permissions", {})
                    if permissions.get("push"):
                        gh_user_res = await client.get("https://api.github.com/user", headers={"Authorization": f"token {t}"})
                        gh_user = gh_user_res.json().get("login", "unknown")
                        print(f"✅ Found working token! Owner: {gh_user}")
                        selected_token = t
                        break
            except Exception as e:
                print(f"Error checking token: {e}")
                
    if not selected_token:
        print("❌ No token found with push access to the target repo.")
        # Fallback to first one anyway if we want to test the auth fix
        selected_token = tokens[0]
        print(f"Falling back to first token (ID: ...{tokens[0][-4:]}) for auth-fix testing.")

    # 2. Create a dummy task for tracking
    task_data = {
        "status": "pending",
        "task_type": "generate_code",
        "current_step": "Manual test trigger (Auth Fix Verification)",
        "result": {"manual_test": True}
    }
    task_res = await supabase.table("agent_tasks").insert(task_data).execute()
    task_id = task_res.data[0]['id']
    print(f"✅ Created Agent Task: {task_id}")
    
    # 3. Call the backend /generate endpoint
    payload = {
        "repo_url": f"https://github.com/{target_repo}",
        "task": "Add a professional README.md with Echo Agent details.",
        "task_id": task_id,
        "github_token": selected_token,
        "create_pr": True
    }
    
    print(f"🚀 Triggering PR Pipeline...")
    async with httpx.AsyncClient(timeout=600.0) as client:
        try:
            response = await client.post("http://localhost:8000/generate", json=payload)
            print(f"Backend Response: {response.json()}")
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(trigger_test_pr())
