import { GoogleGenerativeAI } from "@google/generative-ai";

// Support rotating multiple keys
const keys = (process.env.GEMINI_API_KEYS || "").split(",").filter(Boolean);
let keyIndex = 0;

function getApiKey() {
    if (keys.length === 0) {
        if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
        console.warn("No Gemini API keys found in env.");
        return "";
    }
    const key = keys[keyIndex];
    keyIndex = (keyIndex + 1) % keys.length;
    return key;
}

export class GeminiService {
    private genAI: GoogleGenerativeAI;

    constructor() {
        this.genAI = new GoogleGenerativeAI(getApiKey());
    }

    async analyzeFeedback(comment: string) {
        if (!comment) return null;
        try {
            const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
            const prompt = `
        Analyze the following user feedback comment:
        "${comment}"
        
        Return a JSON object with:
        - sentiment_score: float between -1.0 (negative) and 1.0 (positive)
        - category: "feature_request", "bug", "question", or "feedback"
        - keywords: array of strings (max 5)
      `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Basic cleanup to ensure JSON
            const jsonStr = text.replace(/```json / g, "").replace(/```/g, "").trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error("Gemini analysis failed:", error);
            return null;
        }
    }

    async generateEmbedding(text: string): Promise<number[] | null> {
        try {
            const model = this.genAI.getGenerativeModel({ model: "embedding-001" });
            const result = await model.embedContent(text);
            return result.embedding.values;
        } catch (error) {
            console.error("Gemini embedding failed:", error);
            return null;
        }
    }
}
