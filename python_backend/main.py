import os
import asyncio
import json
import traceback
import tempfile
import shutil
import subprocess
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import torch
import logging
import uvicorn
import uuid
import time
from fastapi.middleware.cors import CORSMiddleware

# --- Types ---

class CommentRequest(BaseModel):
    comment_ids: list[str]

class GenerateRequest(BaseModel):
    repo_url: str
    task: str
    task_id: str = "" # Optional Supabase task ID for progression updates
    github_token: str = ""
    create_pr: bool = False

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
    # This will automatically find the best .gguf in models/ dir
    model_path = os.path.join("models")
    llm_service = LLMService(model_path)
    
    stop_event = asyncio.Event()
    listener_task = asyncio.create_task(run_realtime_listener(stop_event))
    yield
    logger.info("🛑 Shutting down Realtime Worker...")
    stop_event.set()
    await listener_task

app = FastAPI(lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.post("/reinitialize")
async def reinitialize_llm():
    """Force reload the LLM service."""
    global llm_service
    try:
        logger.info("♻️ Re-initializing LLM Service...")
        model_path = os.path.join("models")
        new_service = LLMService(model_path)
        if new_service.llm:
            llm_service = new_service
            return {"success": True, "message": "LLM Service re-initialized successfully."}
        else:
            return {"success": False, "message": "LLM Service failed to load model during re-initialization."}
    except Exception as e:
        logger.error(f"❌ Re-initialization failed: {e}")
        return {"success": False, "message": str(e)}

@app.post("/analyze_comment/{comment_id}")
async def analyze_comment_endpoint(comment_id: str):
    """Manually trigger analysis for a specific comment."""
    try:
        res = await supabase.table("comments").select("content").eq("id", comment_id).single().execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Comment not found.")
        
        content = res.data["content"]
        logger.info(f"🧪 Manually analyzing comment {comment_id}...")
        
        # We reuse the existing logic but wrap it for the endpoint
        await process_comment_async({"new": {"id": comment_id, "content": content}})
        return {"success": True, "message": f"Analysis triggered for {comment_id}"}
    except Exception as e:
        logger.error(f"❌ Manual analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
            .select("comment_id, sentiment_score, category, priority_score, actionable_summary, comments(content)")\
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

# --- Local Code Generation ---

def handle_remove_readonly(func, path, exc):
    """Helper to remove readonly files on Windows (git objects)."""
    import stat
    excvalue = exc[1]
    if func in (os.rmdir, os.remove, os.unlink) and excvalue.errno == 13: # EACCES
        os.chmod(path, stat.S_IWRITE)
        func(path)
    else:
        raise

# --- Helpers ---

async def add_task_log(task_id: str, message: str, status: str = "processing", step: str = None):
    """Add a log entry to a Supabase agent_task and update current_step."""
    if not task_id or not supabase:
        return
    
    try:
        # Get current logs
        res = await supabase.table("agent_tasks").select("logs").eq("id", task_id).single().execute()
        current_logs = res.data.get("logs", []) if res.data else []
        
        # Add new log
        new_log = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "message": message,
            "status": status
        }
        updated_logs = current_logs + [new_log]
        
        # Update record
        update_data = {
            "logs": updated_logs,
            "last_heartbeat": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
        if status:
            update_data["status"] = status
        if step:
            update_data["current_step"] = step
            
        await supabase.table("agent_tasks").update(update_data).eq("id", task_id).execute()
        logger.info(f"📝 Task {task_id}: {message}")
    except Exception as e:
        logger.error(f"⚠️ Failed to update task log for {task_id}: {e}")

@app.post("/generate")
async def generate_code(req: GenerateRequest):
    """Clone a repo, use Local LLM to plan and generate code patches."""
    if not llm_service or not llm_service.llm:
         raise HTTPException(status_code=503, detail="Local LLM not loaded.")
    
    tmp_dir = None
    try:
        # 1. Update status
        await add_task_log(req.task_id, "Cloning repository...", step="Cloning Repo")

        # 1.5 Handle missing analysis if this task was triggered by a comment
        try:
            task_res = await supabase.table("agent_tasks").select("result").eq("id", req.task_id).single().execute()
            if task_res.data and "result" in task_res.data:
                comment_id = task_res.data["result"].get("comment_id")
                if comment_id:
                    # Check if analysis exists
                    analysis_res = await supabase.table("feedback_analysis").select("id").eq("comment_id", comment_id).execute()
                    if not analysis_res.data:
                        await add_task_log(req.task_id, f"Analysis missing for comment {comment_id}. Attempting on-demand analysis...", step="Analyzing Feedback")
                        logger.info(f"🧪 On-demand analysis for comment {comment_id}...")
                        await analyze_comment_endpoint(comment_id)
        except Exception as e:
            logger.warning(f"⚠️ Could not perform on-demand analysis check: {e}")

        # 2. Clone the repo
        tmp_dir = tempfile.mkdtemp(prefix="echo_codegen_")
        logger.info(f"📦 Cloning {req.repo_url} to {tmp_dir}...")
        
        clone_url = req.repo_url
        if req.github_token and "github.com" in clone_url:
            # Inject token for private repo access
            clone_url = clone_url.replace("https://", f"https://x-access-token:{req.github_token}@")
        
        clone_result = await main_loop.run_in_executor(
            None,
            lambda: subprocess.run(
                ["git", "clone", "--depth", "1", clone_url, tmp_dir],
                capture_output=True, text=True, timeout=120
            )
        )
        
        if clone_result.returncode != 0:
            msg = f"Git clone failed: {clone_result.stderr[:300]}"
            await add_task_log(req.task_id, msg, status="failed", step="Clone Failed")
            raise HTTPException(status_code=400, detail=msg)
        
        await add_task_log(req.task_id, "Repository mapped successfully.", step="Analyzing Codebase")
        logger.info(f"✅ Repo cloned successfully.")
        
        # 3. Build file tree from cloned repo
        file_tree = []
        for root, dirs, files in os.walk(tmp_dir):
            # Skip hidden dirs and common non-code dirs
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ('node_modules', 'venv', '__pycache__', '.git', 'dist', 'build')]
            for f in files:
                full_path = os.path.join(root, f)
                rel_path = os.path.relpath(full_path, tmp_dir)
                file_tree.append(rel_path.replace(os.sep, "/"))
        
        logger.info(f"📂 File tree built: {len(file_tree)} files found.")
        
        # 4. Generate feature implementation using Local LLM (Qwen)
        await add_task_log(req.task_id, f"Planning technical solution for: {req.task[:50]}...", step="Synthesizing Solution")
        logger.info(f"🧠 Generating feature for task: {req.task[:80]}...")
        
        # Run in thread pool to avoid blocking asyncio loop
        feature_data = await main_loop.run_in_executor(
            None,
            llm_service.generate_code,
            req.task,
            file_tree
        )
        
        patches = []
        if feature_data and "files" in feature_data:
            for file_entry in feature_data["files"]:
                patches.append({
                    "path": file_entry.get("path"),
                    "new_code": file_entry.get("content"),
                    "explanation": f"Generated by Local Qwen2.5 for task: {req.task[:30]}...",
                    "confidence": 0.9
                })
                logger.info(f"✅ Generated content for {file_entry.get('path')}")
        else:
            logger.warning("⚠️ No files returned from local generation.")
        
        if not patches:
            await add_task_log(req.task_id, "Local LLM could not generate a solution.", status="failed", step="Generation Failed")
            return {"success": False, "message": "Local LLM could not generate any patches.", "patches": []}
        
        await add_task_log(req.task_id, f"Successfully synthesized patches for {len(patches)} files.", step="Patches Ready")

        # 5. Optional: Create PR using GH CLI
        pr_url = None
        if req.create_pr:
            await add_task_log(req.task_id, "Applying patches and preparing GitHub dispatch...", step="Creating PR")
            logger.info("🚀 PR creation requested. Applying patches and pushing...")
            try:
                # 5.1 Apply patches
                for patch in patches:
                    abs_path = os.path.join(tmp_dir, patch["path"])
                    os.makedirs(os.path.dirname(abs_path), exist_ok=True)
                    with open(abs_path, "w", encoding='utf-8') as f:
                        f.write(patch["new_code"])
                
                # 5.2 Git Config & Branch
                branch_name = f"echo-agent-{uuid.uuid4().hex[:8]}"
                repo_name = req.repo_url.split("/")[-1].replace(".git", "")
                
                # Configure git user for this temp repo
                subprocess.run(["git", "config", "user.email", "agent@echo-v2.local"], cwd=tmp_dir)
                subprocess.run(["git", "config", "user.name", "Echo Agent"], cwd=tmp_dir)
                
                cmds = [
                    ["git", "checkout", "-b", branch_name],
                    ["git", "add", "."],
                    ["git", "commit", "-m", f"Agent: {req.task[:50]}"],
                    ["git", "push", "origin", branch_name]
                ]
                
                for cmd in cmds:
                    logger.info(f"Running git command: {' '.join(cmd)}")
                    res = subprocess.run(cmd, cwd=tmp_dir, capture_output=True, text=True)
                    if res.returncode != 0:
                        logger.warning(f"⚠️ Git command failed: {' '.join(cmd)} | {res.stderr}")

                # 5.3 Create PR using GH CLI
                await add_task_log(req.task_id, f"Opening Pull Request for {repo_name}...", step="Creating PR")
                logger.info(f"🆕 Creating PR via GitHub CLI for {repo_name}...")
                pr_create_res = subprocess.run(
                    ["gh", "pr", "create", "--title", f"Agent: {req.task[:50]}", "--body", f"Automated PR from Echo Agent for task: {req.task}"],
                    cwd=tmp_dir, capture_output=True, text=True
                )
                
                if pr_create_res.returncode == 0:
                    pr_url = pr_create_res.stdout.strip()
                    logger.info(f"✅ PR Created: {pr_url}")
                    await add_task_log(req.task_id, f"PR successully created: {pr_url}", status="completed", step=f"PR Link: {pr_url}")
                    
                    # 5.4 Run PR Agent Enhance
                    logger.info("🧠 Running PR Agent /describe...")
                    # Note: We use the local OpenAI endpoint we just added
                    env = {
                        **os.environ, 
                        "OPENAI_BASE_URL": "http://localhost:8000/v1",
                        "OPENAI_API_KEY": "dummy-key", # Required by lib but unused by local Qwen
                        "CONFIG.MODEL": "qwen2.5-coder-7b"
                    }
                    subprocess.run(["pr-agent", "describe"], cwd=tmp_dir, env=env)
                else:
                    logger.error(f"❌ GH CLI PR Create Failed: {pr_create_res.stderr}")
                    await add_task_log(req.task_id, "GitHub CLI failed to create PR.", status="failed", step="PR Failed")
            
            except Exception as pr_err:
                logger.error(f"❌ PR Pipeline Error: {pr_err}")
                await add_task_log(req.task_id, f"PR Error: {str(pr_err)}", status="failed")

        logger.info(f"🎉 Code generation complete: {len(patches)} files generated.")
        return {
            "success": True, 
            "patches": patches, 
            "files_analyzed": len(file_tree), 
            "files_modified": len(patches),
            "pr_url": pr_url
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Generate error: {str(e)}")
        logger.error(traceback.format_exc())
        await add_task_log(req.task_id, f"Error: {str(e)}", status="failed")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup temp directory
        if tmp_dir and os.path.exists(tmp_dir):
            try:
                shutil.rmtree(tmp_dir, onerror=handle_remove_readonly)
                logger.info(f"🧹 Cleaned up temp dir: {tmp_dir}")
            except Exception as e:
                logger.warning(f"⚠️ Could not clean up {tmp_dir}: {e}")


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
            analysis = None
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    analysis = await main_loop.run_in_executor(None, llm_service.analyze_comment, content)
                    if analysis:
                        break
                    logger.warning(f"⚠️ LLM analysis attempt {attempt+1} returned no data for {comment_id}")
                except Exception as analysis_err:
                    logger.error(f"❌ LLM analysis attempt {attempt+1} failed: {analysis_err}")
                
                if attempt < max_retries - 1:
                    await asyncio.sleep(2 ** attempt) # Exponential backoff
            
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
                                "task_type": "generate_code",
                                "status": "pending",
                                "current_step": "High-priority feedback detected. Queued for local code generation.",
                                "result": {"comment_id": comment_id, "priority": priority}
                            }).execute()
                            logger.info(f"✅ Created agent task for {monitored_post_id}")
                            
                            # 4. Trigger Next.js Agent Route to process the task immediately
                            try:
                                # We try to reach the frontend API to trigger the queue processor
                                # Determine base URL (default to localhost:3000 if not set)
                                frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
                                logger.info(f"📡 Triggering Agent Run at {frontend_url}/api/agent/run ...")
                                
                                import httpx
                                async with httpx.AsyncClient() as client:
                                    await client.post(f"{frontend_url}/api/agent/run")
                                logger.info("✅ Agent Run triggered successfully.")
                            except Exception as trigger_err:
                                logger.warning(f"⚠️ Could not trigger Agent Run API: {trigger_err}")
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
        
        # Keep alive with health check logging
        while not stop_event.is_set():
            try:
                await asyncio.sleep(60)
                logger.debug("💓 Realtime Listener Heartbeat")
            except Exception as e:
                logger.error(f"💓 Heartbeat error: {e}")
            
    except Exception as e:
        logger.error(f"❌ FATAL ERROR in Realtime Listener: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        # Attempt to restart the listener after a delay if it's not a stop event
        if not stop_event.is_set():
            logger.info("🔄 Attempting to restart listener in 10s...")
            await asyncio.sleep(10)
            asyncio.create_task(run_realtime_listener(stop_event))

@app.post("/v1/chat/completions")
async def openai_completions(req: dict):
    """OpenAI-compatible chat completions for local LLM (used by PR-Agent)."""
    messages = req.get("messages", [])
    temp = req.get("temperature", 0.7)
    max_tokens = req.get("max_tokens", 1024)
    
    if not llm_service:
        raise HTTPException(status_code=503, detail="LLM service not initialized")

    content = await main_loop.run_in_executor(
        None,
        lambda: llm_service.chat_completion(messages, temp, max_tokens)
    )
    
    return {
        "id": f"chatcmpl-{uuid.uuid4().hex}",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": "qwen2.5-coder-7b",
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": content
                },
                "finish_reason": "stop"
            }
        ],
        "usage": {
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0
        }
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
