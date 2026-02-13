import os
import asyncio
import json
import traceback
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import torch
import logging
import uvicorn

# --- Types ---

class CommentRequest(BaseModel):
    comment_ids: list[str]

# Configure logging to file
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("backend.log", encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)
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

# Global clients
supabase: AsyncClient = None
main_loop = None
llm_service = None

from llm_service import LLMService

@asynccontextmanager
async def lifespan(app: FastAPI):
    global supabase, main_loop, llm_service
    main_loop = asyncio.get_event_loop()
    
    logger.info("🔗 Initializing Supabase AsyncClient...")
    from supabase._async.client import AsyncClient as SupabaseAsyncClient
    supabase = SupabaseAsyncClient(supabase_url, supabase_key)
    
    logger.info("🧠 Initializing Local LLM Service...")
    model_path = os.path.join("models", "Phi-3-mini-4k-instruct-q4.gguf")
    llm_service = LLMService(model_path)
    
    stop_event = asyncio.Event()
    listener_task = asyncio.create_task(run_realtime_listener(stop_event))
    yield
    logger.info("🛑 Shutting down Realtime Worker...")
    stop_event.set()
    await listener_task

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
    llm_status = "active" if llm_service and llm_service.llm else "inactive (model missing)"
    return {"status": "healthy", "model": model_name, "device": device, "llm": llm_status}

@app.post("/generate_report")
async def generate_report(req: CommentRequest):
    if not llm_service or not llm_service.llm:
        raise HTTPException(status_code=503, detail="LLM not loaded")
        
    try:
        if not req.comment_ids:
            return {"report": "No comments provided."}
            
        response = await supabase.table("comments")\
            .select("content")\
            .in_("id", req.comment_ids)\
            .execute()
        comments = [r['content'] for r in response.data]
        
        if not comments:
            return {"report": "No comments found for the given IDs."}
            
        report = await main_loop.run_in_executor(None, llm_service.generate_report, comments)
        return {"report": report}
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@app.post("/top_comment")
async def get_top_comment(req: CommentRequest):
    # Simple logic: Find comment with highest sentiment magnitude (furthest from 0) 
    # or just return the one with 'bug' category if valuable.
    # Ideally, we used the LLM to rank them, but for speed, let's use the stored analysis.
    try:
        if not req.comment_ids:
             return {"top_comment": None}
             
        response = await supabase.table("feedback_analysis")\
            .select("comment_id, sentiment_score, category, comments(content)")\
            .in_("comment_id", req.comment_ids)\
            .execute()
            
        data = response.data
        if not data:
            return {"top_comment": None}
            
        # Rank by priority_score descending
        sorted_comments = sorted(data, key=lambda x: x.get('priority_score', 0), reverse=True)
        top = sorted_comments[0]
        
        return {
            "top_comment": {
                "id": top['comment_id'],
                "content": top['comments']['content'],
                "score": top['sentiment_score'],
                "category": top['category'],
                "priority": top.get('priority_score', 0),
                "summary": top.get('actionable_summary', "")
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/logs")
async def get_logs():
    """Returns the last 100 lines of the backend log file."""
    try:
        if not os.path.exists("backend.log"):
            return {"logs": "Log file not found."}
        
        with open("backend.log", "r", encoding='utf-8') as f:
            lines = f.readlines()
            # Return last 100 lines
            return {"logs": "".join(lines[-100:])}
    except Exception as e:
        return {"logs": f"Error reading logs: {str(e)}"}

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

        logger.info(f"🔄 Processing new comment {comment_id}...")
        
        # 1. Generate Embedding
        embedding = await main_loop.run_in_executor(None, generate_embedding_internal, content)
        
        await supabase.table("comment_embeddings").upsert({
            "comment_id": comment_id,
            "embedding": embedding
        }).execute()
        logger.info(f"✅ Saved embedding for {comment_id}")
        
        # 2. Analyze Sentiment/Classify (if LLM is available)
        if llm_service and llm_service.llm:
            analysis = await main_loop.run_in_executor(None, llm_service.analyze_comment, content)
            if analysis:
                logger.info(f"🧠 Analysis: {analysis}")
                await supabase.table("feedback_analysis").insert({
                    "comment_id": comment_id,
                    "sentiment_score": analysis.get("sentiment_score", 0),
                    "category": analysis.get("category", "general"),
                    "priority_score": analysis.get("priority_score", 0),
                    "actionable_summary": analysis.get("actionable_summary", ""),
                    "keywords": analysis.get("keywords", [])
                }).execute()
                logger.info(f"✅ Saved analysis for {comment_id}")

                # 3. Trigger Echo Agent if priority is high
                priority = analysis.get("priority_score", 0)
                category = analysis.get("category", "general")
                
                if priority >= 0.7 or category in ["bug", "feature_request"]:
                    logger.info(f"🤖 High priority feedback detected (Priority: {priority}, Cat: {category}). Checking for active monitors...")
                    
                    # Fetch post_id for this comment to check if it's monitored
                    comment_res = await supabase.table("comments").select("post_id").eq("id", comment_id).single().execute()
                    post_id = comment_res.data.get("post_id") if comment_res.data else None
                    
                    if post_id:
                        monitored_res = await supabase.table("monitored_posts").select("id").eq("post_id", post_id).eq("is_active", True).execute()
                        if monitored_res.data:
                            monitored_post_id = monitored_res.data[0]['id']
                            logger.info(f"🚀 Triggering Echo Agent task for monitored post {monitored_post_id}")
                            
                            await supabase.table("agent_tasks").insert({
                                "monitored_post_id": monitored_post_id,
                                "task_type": "analyze",
                                "status": "pending",
                                "current_step": "Initializing autonomous analysis of high-priority feedback.",
                                "result": {"comment_id": comment_id, "priority": priority}
                            }).execute()
                            logger.info(f"✅ Created agent task for {monitored_post_id}")
            else:
                logger.warning(f"⚠️ LLM analysis returned no data for {comment_id}")
        else:
            logger.warning("⚠️ LLM Service not active, skipping analysis.")
    except Exception as e:
        logger.error(f"❌ Error in process_comment_async: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())

# --- Supabase Initialization ---
async def run_realtime_listener(stop_event: asyncio.Event):
    """Subscribe to Supabase Realtime for new comments."""
    logger.info("🚀 Starting Realtime Worker Listener Task...")
    try:
        channel = supabase.channel("realtime_comments")
        
        def sync_on_insert(payload):
            logger.info(f"🔔 EVENT RECEIVED: {payload}")
            if main_loop:
                asyncio.run_coroutine_threadsafe(process_comment_async(payload), main_loop)
            else:
                logger.error("❌ main_loop not initialized, cannot process comment.")

        channel.on_postgres_changes(
            event="INSERT",
            schema="public",
            table="comments",
            callback=sync_on_insert
        )
        
        await channel.subscribe()
        logger.info("📡 Realtime Worker is SUBSCRIBED.")
        
        # Keep alive until stop_event is set
        while not stop_event.is_set():
            await asyncio.sleep(1)
            
    except Exception as e:
        logger.error(f"❌ ERROR in Realtime Listener: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
