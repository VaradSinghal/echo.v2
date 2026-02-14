import os
from huggingface_hub import snapshot_download

MODEL_REPO = "Qwen/Qwen2.5-Coder-7B-Instruct-GGUF"
# Pattern to match the specific quantization requested
ALLOW_PATTERNS = ["*qwen2.5-coder-7b-instruct-q5_k_m*.gguf"]
DEST_DIR = os.path.join(os.path.dirname(__file__), "models")

def download_model():
    print(f"🚀 Downloading model from {MODEL_REPO} with pattern {ALLOW_PATTERNS}...")
    
    if not os.path.exists(DEST_DIR):
        os.makedirs(DEST_DIR)
        
    try:
        # snapshot_download returns the directory path
        path = snapshot_download(
            repo_id=MODEL_REPO,
            allow_patterns=ALLOW_PATTERNS,
            local_dir=DEST_DIR,
            local_dir_use_symlinks=False
        )
        print(f"✅ Model downloaded successfully to: {path}")
        
        # List files to verify
        files = os.listdir(DEST_DIR)
        print(f"📂 Files in models dir: {files}")
        
    except Exception as e:
        print(f"❌ Failed to download model: {e}")

if __name__ == "__main__":
    download_model()
