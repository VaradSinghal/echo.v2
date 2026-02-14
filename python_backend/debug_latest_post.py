import os
import asyncio
from supabase._async.client import AsyncClient as SupabaseAsyncClient
from dotenv import load_dotenv

load_dotenv()

async def get_latest_post():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    supabase = SupabaseAsyncClient(url, key)
    
    # 1. Get latest monitored post
    res = await supabase.table("monitored_posts").select("*, posts(*)").order("created_at", desc=True).limit(1).execute()
    if not res.data:
        print("No monitored posts found.")
        return
    
    post = res.data[0]
    print(f"Latest Monitored Post ID: {post['id']}")
    print(f"Original Post ID: {post['post_id']}")
    print(f"Repo ID: {post['repo_id']}")
    
    # 2. Get comments for this post
    comments_res = await supabase.table("comments").select("*").eq("post_id", post['post_id']).order("created_at", desc=True).execute()
    print(f"Found {len(comments_res.data)} comments.")
    for c in comments_res.data[:5]:
        print(f"- [{c['id']}] {c['content'][:50]}...")
    
    # 3. Check for analysis
    if comments_res.data:
        comment_ids = [c['id'] for c in comments_res.data]
        analysis_res = await supabase.table("feedback_analysis").select("*").in_("comment_id", comment_ids).execute()
        print(f"Found analysis for {len(analysis_res.data)} comments.")
        for a in analysis_res.data[:3]:
            print(f"  Comment {a['comment_id']}: Priority {a['priority_score']}, Cat: {a['category']}")

if __name__ == "__main__":
    asyncio.run(get_latest_post())
