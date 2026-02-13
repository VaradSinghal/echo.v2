from huggingface_hub import hf_hub_download
import os
import time

model_name = "microsoft/Phi-3-mini-4k-instruct-gguf"
filename = "Phi-3-mini-4k-instruct-q4.gguf"
local_dir = "models"

if not os.path.exists(local_dir):
    os.makedirs(local_dir)

print(f"Downloading {filename} from {model_name}...")

max_retries = 5
for attempt in range(max_retries):
    try:
        hf_hub_download(
            repo_id=model_name, 
            filename=filename, 
            local_dir=local_dir,
            resume_download=True,
            local_files_only=False
        )
        print("✅ Download complete!")
        break
    except Exception as e:
        print(f"❌ Attempt {attempt + 1} failed: {e}")
        if attempt < max_retries - 1:
            print("Retrying in 5 seconds...")
            time.sleep(5)
        else:
            print("❌ All retries failed.")
            raise e
