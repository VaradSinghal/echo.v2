import os
import requests
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}

# 1. Activate monitor
post_id = "223e4995-3092-45e8-9733-d8f6c5c80a12"
patch_url = f"{url}/rest/v1/monitored_posts?post_id=eq.{post_id}"
patch_data = {"is_active": True, "repo_id": "VaradSinghal/test-repo"}

print(f"Activating monitor for {post_id}...")
res1 = requests.patch(patch_url, headers=headers, json=patch_data)
print(f"Status: {res1.status_code}, Response: {res1.text}")

# 2. Insert comment
comment_url = f"{url}/rest/v1/comments"
comment_data = {
    "post_id": post_id,
    "content": "BUG: The contact form validation fails on long emails. Please increase the buffer size in the form validation logic.",
    "user_id": "168f6daf-564e-43dc-ace0-533c8b499620"
}

print("Inserting test comment...")
res2 = requests.post(comment_url, headers=headers, json=comment_data)
print(f"Status: {res2.status_code}, Response: {res2.text}")
