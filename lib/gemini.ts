import { GoogleGenerativeAI } from "@google/generative-ai";

interface KeyUsage {
    key: string;
    usageCount: number;
    lastUsed: number;
    isRateLimited: boolean;
}

class GeminiMultiAccountManager {
    private keys: KeyUsage[] = [];
    private currentIndex: number = 0;

    constructor() {
        this.loadKeys();
    }

    private loadKeys() {
        const rawKeys = (process.env.GEMINI_API_KEYS || "").split(",").filter(Boolean);
        if (rawKeys.length === 0 && process.env.GEMINI_API_KEY) {
            rawKeys.push(process.env.GEMINI_API_KEY);
        }

        if (rawKeys.length > 0) {
            this.keys = rawKeys.map(key => ({
                key,
                usageCount: 0,
                lastUsed: 0,
                isRateLimited: false
            }));
            console.log(`Gemini Manager: Loaded ${this.keys.length} keys.`);
        }
    }

    getNextKey(): string {
        // Retry loading keys if none found (useful if entries are populated late)
        if (this.keys.length === 0) {
            this.loadKeys();
        }

        if (this.keys.length === 0) {
            console.error("Gemini Manager: No keys available!");
            return "";
        }

        let attempts = 0;
        while (attempts < this.keys.length) {
            const current = this.keys[this.currentIndex];
            this.currentIndex = (this.currentIndex + 1) % this.keys.length;

            if (!current.isRateLimited) {
                current.usageCount++;
                current.lastUsed = Date.now();
                return current.key;
            }
            attempts++;
        }

        // If all rate limited, cycle one
        const fallback = this.keys[this.currentIndex];
        fallback.isRateLimited = false;
        return fallback.key;
    }

    markRateLimited(key: string) {
        const keyInfo = this.keys.find(k => k.key === key);
        if (keyInfo) {
            keyInfo.isRateLimited = true;
            console.warn(`Gemini key rate limited: ${key.substring(0, 8)}...`);
        }
    }
}

const manager = new GeminiMultiAccountManager();

export class GeminiService {
    async analyzeFeedback(comment: string) {
        if (!comment) return null;
        const apiKey = manager.getNextKey();
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const prompt = `Analyze this user feedback and return JSON with sentiment_score (-1 to 1), category ("feature_request", "bug", "question", "feedback"), and keywords (string[]). Comment: "${comment}"`;

            const result = await model.generateContent(prompt);
            const text = result.response.text();
            console.log("🤖 Gemini Raw Response:", text);

            const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
            return JSON.parse(cleanJson);
        } catch (error: any) {
            if (error?.status === 429) manager.markRateLimited(apiKey);
            console.error("Gemini analysis failed:", error);
            return null;
        }
    }

    async generateEmbedding(text: string): Promise<number[] | null> {
        const apiKey = manager.getNextKey();
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
            const result = await model.embedContent(text);
            return result.embedding.values;
        } catch (error: any) {
            if (error?.status === 429) manager.markRateLimited(apiKey);
            console.error("Gemini embedding failed:", error);
            return null;
        }
    }

    async extractTopics(comments: string[]): Promise<string[]> {
        if (comments.length === 0) return [];
        const apiKey = manager.getNextKey();
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const prompt = `Extract top 5 themes from: ${comments.join(", ")}. Return JSON array of strings.`;
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
            return JSON.parse(cleanJson);
        } catch (error) {
            console.error("Gemini topics failed:", error);
            return [];
        }
    }

    async generateCode(feedback: string, filePath: string, currentCode: string) {
        const apiKey = manager.getNextKey();
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const prompt = `Update ${filePath} for feedback: ${feedback}. Current code:\n${currentCode}\nReturn JSON with {new_code, explanation, confidence_score}.`;
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
            return JSON.parse(cleanJson);
        } catch (error) {
            console.error("Gemini code gen failed:", error);
            return null;
        }
    }
}
