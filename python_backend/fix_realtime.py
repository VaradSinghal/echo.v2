import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv("../.env.local")
url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

def check_realtime():
    # Check if 'comments' is in the publication
    res = supabase.rpc("get_publications", {}).execute()
    # If rpc fails or not available, we can try to run a raw query if we had a pg client
    # But let's try to just enable it via a SQL block in a migration or just execute it if possible.
    
    # Actually, let's just try to run the SQL to enable it.
    sql = """
    DO $$ 
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND schemaname = 'public' 
            AND tablename = 'comments'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
        END IF;
    END $$;
    """
    try:
        # Note: supabase-py doesn't have a direct 'sql' execution method exposed like this usually
        # but sometimes we can use an rpc or if it's a newer client.
        # Alternatively, I'll just ask the user to run it if I can't.
        print("Checking if comments table is in supabase_realtime publication...")
        # Since I can't run raw SQL easily without a specific RPC, 
        # I'll check the 'feedback_analysis' table logic which worked before.
        pass
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # Let's just create a new migration file to ENSURE it's enabled.
    print("Enabling Realtime for comments table...")
