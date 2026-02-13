import os
import asyncio
import json
import traceback
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import torch
import uvicorn
from supabase.client import AsyncClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Use all-MiniLM-L6-v2 (384 dimensions)
model_name = "sentence-transformers/all-MiniLM-L6-v2"
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Loading model '{model_name}' on {device}...")
model = SentenceTransformer(model_name, device=device)

# Supabase setup
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

# Global Supabase client
supabase: AsyncClient = None
main_loop = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global supabase, main_loop
    main_loop = asyncio.get_event_loop()
    print("🔗 Initializing Supabase AsyncClient...")
    from supabase._async.client import AsyncClient as SupabaseAsyncClient
    supabase = SupabaseAsyncClient(supabase_url, supabase_key)
    listener_task = asyncio.create_task(run_realtime_listener())
    yield
    print("🛑 Shutting down Realtime Worker...")
    listener_task.cancel()

app = FastAPI(lifespan=lifespan)

class EmbeddingRequest(BaseModel):
    text: str

class EmbeddingResponse(BaseModel):
    embedding: list[float]

def generate_embedding_internal(text: str) -> list[float]:
    return model.encode(text).tolist()

@app.post("/embed", response_model=EmbeddingResponse)
async def get_embedding(request: EmbeddingRequest):
    try:
        embedding = generate_embedding_internal(request.text)
        return EmbeddingResponse(embedding=embedding)
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model": model_name, "device": device}

# --- Realtime Worker Logic ---

async def process_comment_async(payload):
    """Asynchronous processing of a new comment."""
    try:
        data = None
        
        # Try dictionary access
        if isinstance(payload, dict):
            data = payload.get("new") or payload.get("record")
        else:
            # Try as object with attributes (PostgresChangesPayload)
            if hasattr(payload, "new"):
                data = payload.new
            elif hasattr(payload, "record"):
                data = payload.record
            
        # Fallback for nested 'data' key
        if not data and isinstance(payload, dict) and "data" in payload:
            data = payload["data"].get("new") or payload["data"].get("record")
            
        if not data:
            return
            
        # Extract ID and Content
        comment_id = None
        content = None
        
        if isinstance(data, dict):
            comment_id = data.get("id")
            content = data.get("content")
        else:
            comment_id = getattr(data, "id", None)
            content = getattr(data, "content", None)
            
        if not comment_id or not content:
            return

        print(f"🔄 Processing new comment {comment_id}...")
        embedding = await main_loop.run_in_executor(None, generate_embedding_internal, content)
        
        await supabase.table("comment_embeddings").upsert({
            "comment_id": comment_id,
            "embedding": embedding
        }).execute()
        
        print(f"✅ Successfully saved embedding for comment {comment_id}")
        
    except Exception as e:
        print(f"❌ Error in process_comment_async: {str(e)}")

def on_postgres_changes_sync(payload):
    if main_loop:
        asyncio.run_coroutine_threadsafe(process_comment_async(payload), main_loop)

async def run_realtime_listener():
    print("🚀 Starting Realtime Worker Listener Task...")
    try:
        channel = supabase.channel("comment-changes")
        await channel.on_postgres_changes(
            event="INSERT",
            schema="public",
            table="comments",
            callback=on_postgres_changes_sync
        ).subscribe()
        
        print("📡 Realtime Worker is SUBSCRIBED.")
        while True:
            await asyncio.sleep(3600)
    except asyncio.CancelledError:
        pass
    except Exception as e:
        print(f"❌ Failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
