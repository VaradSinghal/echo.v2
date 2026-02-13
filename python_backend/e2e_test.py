import os
import uuid
import time
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv("../.env.local")
url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

def test_pipeline():
    # 1. Dynamically fetch a valid post and user
    print("🔍 Fetching valid post and user for test...")
    posts = supabase.table("posts").select("id, user_id").limit(1).execute()
    if not posts.data:
        print("❌ No posts found in database to test against.")
        return False
        
    post_id = posts.data[0]['id']
    user_id = posts.data[0]['user_id']
    print(f"✅ Using Post: {post_id}, User: {user_id}")
    
    # 2. Insert test comment (CRITICAL BUG)
    test_id = str(uuid.uuid4())
    content = f"URGENT BUG: The checkout page crashes with a 500 error whenever I use a coupon code. This is blocking sales! [Ref: {test_id}]"
    
    print(f"🚀 Inserting comment... (Ref: {test_id})")
    try:
        res = supabase.table("comments").insert({
            "post_id": post_id,
            "user_id": user_id,
            "content": content
        }).execute()
        
        comment_id = res.data[0]['id']
        print(f"✅ Comment inserted: {comment_id}")
        
        print("⏳ Waiting for Realtime Worker to process (LLM analysis)...")
        # Poll for analysis (max 120s - local LLM can be slow)
        start_time = time.time()
        while time.time() - start_time < 120:
            time.sleep(10)
            elapsed = int(time.time() - start_time)
            print(f"  Checking... ({elapsed}s elapsed)")
            
            # Check analysis
            analysis = supabase.table("feedback_analysis").select("*").eq("comment_id", comment_id).execute()
            if analysis.data:
                print("\n✨ PIPELINE SUCCESS! LLM Analysis found:")
                print(f"   Category: {analysis.data[0]['category']}")
                print(f"   Sentiment: {analysis.data[0]['sentiment_score']}")
                print(f"   Keywords: {analysis.data[0]['keywords']}")
                return True
                
        print("\n❌ PIPELINE TIMEOUT: Analysis not found after 120s.")
        return False
        
    except Exception as e:
        print(f"❌ Error during test: {str(e)}")
        return False

if __name__ == "__main__":
    test_pipeline()
