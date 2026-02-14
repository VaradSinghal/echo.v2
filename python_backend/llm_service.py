import json
import os
import logging

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self, model_path: str):
        self.model_path = model_path
        self.llm = None
        self._load_model()

    def _load_model(self):
        # If model_path is a directory, find the .gguf file inside
        if os.path.isdir(self.model_path):
            files = [f for f in os.listdir(self.model_path) if f.endswith(".gguf")]
            if files:
                # 1. Prefer qwen if multiple
                qwen_files = [f for f in files if "qwen" in f.lower()]
                candidates = qwen_files if qwen_files else files

                # 2. Prefer single file over split parts (exclude 'of-00002' etc)
                single_files = [f for f in candidates if "-of-" not in f]
                
                # 3. If no single file, look for the first part of a split
                split_start_files = [f for f in candidates if "-00001-of-" in f]

                if single_files:
                    selected = single_files[0]
                elif split_start_files:
                    selected = split_start_files[0]
                else:
                    selected = candidates[0] # Fallback
                
                self.model_path = os.path.join(self.model_path, selected)
        
        if not os.path.exists(self.model_path):
            logger.warning(f"⚠️ Model not found at {self.model_path}. LLM features will be disabled.")
            return

        logger.info(f"Loading LLM from {self.model_path}...")
        try:
            from llama_cpp import Llama
            # n_ctx=4096 for stability on demo hardware
            self.llm = Llama(
                model_path=self.model_path,
                n_ctx=4096,
                n_gpu_layers=32, # Offload some to GPU, keep context safe
                verbose=False
            )
            logger.info("✅ LLM loaded successfully.")
        except Exception as e:
            logger.error(f"❌ Failed to load LLM: {e}")

    def analyze_comment(self, text: str):
        if not self.llm:
            return None

        # ChatML format for Qwen
        prompt = f"""<|im_start|>system
You are an AI assistant that analyzes user feedback for product managers.
Analyze the following comment and return a JSON object with:
- "sentiment_score": a number between -1.0 (negative) and 1.0 (positive).
- "category": one of "bug", "feature_request", "question", or "general".
- "priority_score": a number between 0.0 (low) and 1.0 (high) based on urgency and impact.
- "actionable_summary": a 1-sentence summary of what should be done.
- "keywords": a list of up to 3 key topics.

Return ONLY valid JSON.
<|im_end|>
<|im_start|>user
Comment: "{text}"
<|im_end|>
<|im_start|>assistant
"""
        try:
            response = self.llm(
                prompt,
                max_tokens=300,
                stop=["<|im_end|>"],
                temperature=0.1
            )
            
            # Extract text
            output_text = response['choices'][0]['text'].strip()
            
            # Parse JSON
            start = output_text.find('{')
            end = output_text.rfind('}') + 1
            if start != -1 and end != -1:
                json_str = output_text[start:end]
                try:
                    return json.loads(json_str)
                except json.JSONDecodeError:
                    logger.error(f"❌ Failed to decode JSON from: {json_str}")
                    return None
            else:
                logger.warning(f"⚠️ Could not find JSON markers in LLM output: {output_text}")
                return None
        except Exception as e:
            logger.error(f"❌ Error during LLM analysis: {e}")
            return None

    def generate_report(self, comments: list[str]):
        if not self.llm:
            return "LLM not loaded."

        comments_text = "\n".join([f"- {c}" for c in comments[:50]]) # Limit to 50
        
        prompt = f"""<|im_start|>system
You are an Elite Product Strategist and Data Analyst. Your goal is to transform raw community feedback into a high-impact, professional Community Intelligence Report.

STRICT FORMATTING RULES:
1. Use professional, data-centric language.
2. Use Markdown headers (##, ###) for clear separation.
3. Keep it punchy but comprehensive.
4. Avoid generic filler; cite specific patterns found in the feedback.

REQUIRED SECTIONS:
- ## 📊 EXECUTIVE SUMMARY
- ## 📈 SENTIMENT PULSE
- ## 🔥 HIGH-RESONANCE ISSUES
- ## 🚀 GROWTH OPPORTUNITIES
- ## 🛠️ STRATEGIC ROADMAP
<|im_end|>
<|im_start|>user
Process the following feedback signals into a structured report:
{comments_text}
<|im_end|>
<|im_start|>assistant
"""
        response = self.llm(
            prompt,
            max_tokens=1000,
            stop=["<|im_end|>"],
            temperature=0.7
        )
        return response['choices'][0]['text'].strip()

    def generate_code(self, task: str, file_tree: list[str]) -> dict | None:
        """Generate code using local Qwen2.5-Coder-7B."""
        if not self.llm:
            return None

        # Prepare context (truncate if too large)
        tree_context = "\n".join(file_tree[:300])
        
        # Qwen ChatML Prompt
        prompt = f"""<|im_start|>system
You are an autonomous coding agent.
Your goal is to generate file contents to complete the task.
You must output ONLY valid JSON.
Format: {{ "files": [ {{ "path": "...", "content": "..." }} ] }}
<|im_end|>
<|im_start|>user
Task: {task}

Repository Structure:
{tree_context}

Generate the JSON/code now.
<|im_end|>
<|im_start|>assistant
"""
        try:
            response = self.llm(
                prompt,
                max_tokens=4096,
                stop=["<|im_end|>"],
                temperature=0.1,
                echo=False
            )
            
            output_text = response['choices'][0]['text'].strip()
            
            # JSON Parse Logic
            start = output_text.find('{')
            end = output_text.rfind('}') + 1
            if start != -1 and end > start:
                json_str = output_text[start:end]
                try:
                    return json.loads(json_str)
                except json.JSONDecodeError:
                    logger.error(f"❌ Failed to decode JSON from Qwen output: {json_str[:200]}...")
                    return None
            else:
                logger.warning(f"⚠️ No JSON object found in Qwen output: {output_text[:200]}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Error during Qwen code generation: {e}")
            return None
    def chat_completion(self, messages: list, temperature: float = 0.7, max_tokens: int = 1024) -> str:
        """OpenAI-compatible chat completion using local Qwen."""
        if not self.llm:
            return "Error: Local LLM not loaded."

        # Map OpenAI messages to ChatML
        prompt = ""
        for m in messages:
            role = m.get("role", "user")
            content = m.get("content", "")
            prompt += f"<|im_start|>{role}\n{content}<|im_end|>\n"
        
        prompt += "<|im_start|>assistant\n"

        try:
            response = self.llm(
                prompt,
                max_tokens=max_tokens,
                stop=["<|im_end|>"],
                temperature=temperature,
                echo=False
            )
            return response['choices'][0]['text'].strip()
        except Exception as e:
            logger.error(f"❌ Error during Chat Completion: {e}")
            return f"Error: {e}"
