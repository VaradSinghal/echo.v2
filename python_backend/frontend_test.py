import os
import uuid
from supabase import create_client, Client
from dotenv import load_dotenv

# Load credentials
load_dotenv("../.env.local")
url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

def trigger_test():
    # Get a post
    posts = supabase.table("posts").select("id").limit(1).execute()
    if not posts.data:
        print("No posts found.")
        return
    post_id = posts.data[0]["id"]
    
    # Get a user
    profiles = supabase.table("profiles").select("id").limit(1).execute()
    if not profiles.data:
        print("No profiles found.")
        return
    user_id = profiles.data[0]["id"]
    
    content = f"Frontend-style test comment - {uuid.uuid4()}"
    print(f"Adding comment: {content}")
    
    res = supabase.table("comments").insert({
        "post_id": post_id,
        "user_id": user_id,
        "content": content
    }).execute()
    
    if res.data:
        print(f"Success! Comment ID: {res.data[0]['id']}")
    else:
        print("Failed to add comment.")

if __name__ == "__main__":
    trigger_test()
