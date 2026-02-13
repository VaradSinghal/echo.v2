import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv("../.env.local")
url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

def verify_embedding():
    comment_id = "dbc2de52-012a-4d81-bc35-a11f5bd49864"
    res = supabase.table("comment_embeddings").select("*").eq("comment_id", comment_id).execute()
    if res.data:
        print(f"✅ Embedding found for comment {comment_id}!")
        print(f"Embedding length: {len(res.data[0]['embedding'])}")
    else:
        print(f"❌ No embedding found for comment {comment_id}.")

if __name__ == "__main__":
    verify_embedding()
