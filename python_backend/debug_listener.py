import asyncio
import os
import json
from supabase._async.client import create_client, AsyncClient
from dotenv import load_dotenv

load_dotenv("../.env.local")
url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

async def main():
    print(f"🔗 Connecting to {url}...")
    supabase: AsyncClient = await create_client(url, key)
    
    print("📡 Subscribing to public:comments...")
    channel = supabase.channel("debug_channel")
    
    def on_event(payload):
        print(f"🔔 EVENT RECEIVED: {json.dumps(payload, default=str)}")

    await channel.on_postgres_changes(
        event="INSERT",
        schema="public",
        table="comments",
        callback=on_event
    ).subscribe()
    
    print("✅ Subscribed. Waiting for events... (Insert a comment now)")
    
    # Run for 60 seconds
    for i in range(60):
        await asyncio.sleep(1)
        if i % 10 == 0:
            print(f"  Still listening... ({60-i}s left)")

if __name__ == "__main__":
    asyncio.run(main())
