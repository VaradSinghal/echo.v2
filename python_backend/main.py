import os
import asyncio
import threading
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import torch
import uvicorn
from supabase.client import AsyncClient, create_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI()

# Global event loop for scheduling async tasks from sync callbacks
main_loop = None

# Use all-MiniLM-L6-v2 (384 dimensions) for faster, lightweight embedding generation
model_name = "sentence-transformers/all-MiniLM-L6-v2"
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Loading model '{model_name}' on {device}...")
model = SentenceTransformer(model_name, device=device)

# Supabase setup
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

# Global Supabase client
supabase: AsyncClient = None

class EmbeddingRequest(BaseModel):
    text: str

class EmbeddingResponse(BaseModel):
    embedding: list[float]

def generate_embedding_internal(text: str) -> list[float]:
    return model.encode(text).tolist()

@app.post("/embed", response_model=EmbeddingResponse)
async def get_embedding(request: EmbeddingRequest):
    try:
        if not request.text:
            raise HTTPException(status_code=400, detail="Text is required")
        
        embedding = generate_embedding_internal(request.text)
        return EmbeddingResponse(embedding=embedding)
    except Exception as e:
        print(f"Error generating embedding: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model": model_name, "device": device}

# --- Realtime Worker Logic ---

async def process_comment_async(payload):
    """Asynchronous processing of a new comment."""
    try:
        data = payload.get("new", {})
        if not data:
            data = payload.get("record", {})
            
        comment_id = data.get("id")
        content = data.get("content")
        
        if not comment_id or not content:
            return

        print(f"🔄 Processing new comment {comment_id}...")
        
        # Generate embedding
        # Run synchronous model.encode in a thread pool
        embedding = await main_loop.run_in_executor(None, generate_embedding_internal, content)
        
        # Save to comment_embeddings table
        await supabase.table("comment_embeddings").upsert({
            "comment_id": comment_id,
            "embedding": embedding
        }).execute()
        
        print(f"✅ Successfully saved embedding for comment {comment_id}")
        
    except Exception as e:
        print(f"❌ Error in process_comment_async: {str(e)}")

def on_postgres_changes_sync(payload):
    """Synchronous wrapper for the realtime callback."""
    if main_loop:
        asyncio.run_coroutine_threadsafe(process_comment_async(payload), main_loop)

async def run_realtime_listener():
    """Starts the Supabase Realtime listener."""
    print("🚀 Starting Realtime Worker...")
    try:
        channel = supabase.channel("comment-changes")
        await channel.on_postgres_changes(
            event="INSERT",
            schema="public",
            table="comments",
            callback=on_postgres_changes_sync
        ).subscribe()
        
        print("📡 Realtime Worker is now listening for new comments.")
        
        while True:
            await asyncio.sleep(3600)
            
    except Exception as e:
        print(f"❌ Failed to start Realtime Worker: {str(e)}")

@app.on_event("startup")
async def startup_event():
    global supabase, main_loop
    main_loop = asyncio.get_event_loop()
    
    from supabase._async.client import AsyncClient as SupabaseAsyncClient
    supabase = SupabaseAsyncClient(supabase_url, supabase_key)
    
    asyncio.create_task(run_realtime_listener())

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
