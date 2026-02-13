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
        if not os.path.exists(self.model_path):
            logger.warning(f"⚠️ Model not found at {self.model_path}. LLM features will be disabled.")
            return

        logger.info(f"Loading LLM from {self.model_path}...")
        try:
            from llama_cpp import Llama
            # n_ctx=2048 or 4096 depending on memory
            self.llm = Llama(
                model_path=self.model_path,
                n_ctx=4096,
                n_gpu_layers=-1, # Offload all to GPU if available
                verbose=False
            )
            logger.info("✅ LLM loaded successfully.")
        except Exception as e:
            logger.error(f"❌ Failed to load LLM: {e}")

    def analyze_comment(self, text: str):
        if not self.llm:
            return None

        prompt = f"""<|system|>
You are an AI assistant that analyzes user feedback for product managers.
Analyze the following comment and return a JSON object with:
- "sentiment_score": a number between -1.0 (negative) and 1.0 (positive).
- "category": one of "bug", "feature_request", "question", or "general".
- "priority_score": a number between 0.0 (low) and 1.0 (high) based on urgency and impact.
- "actionable_summary": a 1-sentence summary of what should be done.
- "keywords": a list of up to 3 key topics.

Return ONLY valid JSON.
<|end|>
<|user|>
Comment: "{text}"
<|end|>
<|assistant|>
"""
        try:
            response = self.llm(
                prompt,
                max_tokens=300,
                stop=["<|end|>"],
                temperature=0.1
            )
            
            # Extract text
            output_text = response['choices'][0]['text'].strip()
            
            # Parse JSON
            # Start from first '{' and end at last '}'
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

        comments_text = "\n".join([f"- {c}" for c in comments[:50]]) # Limit to 50 for context window
        
        prompt = f"""<|system|>
You are an Elite Product Strategist and Data Analyst. Your goal is to transform raw community feedback into a high-impact, professional Community Intelligence Report.

STRICT FORMATTING RULES:
1. Use professional, data-centric language.
2. Use Markdown headers (##, ###) for clear separation.
3. Keep it punchy but comprehensive.
4. Avoid generic filler; cite specific patterns found in the feedback.

REQUIRED SECTIONS:
- ## 📊 EXECUTIVE SUMMARY: A 2-3 sentence high-level overview of the current community pulse.
- ## 📈 SENTIMENT PULSE: Analyze the emotional tone (Positive/Neutral/Negative) and identify what's driving it.
- ## 🔥 HIGH-RESONANCE ISSUES: Identify the top 3 recurring problems or complaints. Rank them by perceived impact.
- ## 🚀 GROWTH OPPORTUNITIES: Highlight the most requested features or improvements.
- ## 🛠️ STRATEGIC ROADMAP: Provide 3 concrete, numbered steps the dev team should take immediately.
<|end|>
<|user|>
Process the following feedback signals into a structured report:
{comments_text}
<|end|>
<|assistant|>
"""
        response = self.llm(
            prompt,
            max_tokens=1000,
            stop=["<|end|>"],
            temperature=0.7
        )
        return response['choices'][0]['text'].strip()
