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
            const prompt = `Analyze this user feedback. Return ONLY valid JSON and nothing else.
            JSON structure: { "sentiment_score": number (-1 to 1), "category": "feature_request" | "bug" | "question" | "feedback", "keywords": string[] }
            Comment: "${comment}"`;

            // Add 30s timeout
            const result = await Promise.race([
                model.generateContent(prompt),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Gemini analysis timeout")), 30000))
            ]) as any;

            const text = result.response.text();
            console.log("🤖 Gemini Raw Response:", text);

            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("No JSON found in response");
            return JSON.parse(jsonMatch[0]);
        } catch (error: any) {
            if (error?.status === 429) manager.markRateLimited(apiKey);
            console.error("Gemini analysis failed:", error.message);
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
            const prompt = `Extract top 5 themes from: ${comments.join(", ")}. Return ONLY a JSON array of strings.`;

            // Add 30s timeout
            const result = await Promise.race([
                model.generateContent(prompt),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Gemini topics timeout")), 30000))
            ]) as any;

            const text = result.response.text();
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (!jsonMatch) throw new Error("No JSON array found");
            return JSON.parse(jsonMatch[0]);
        } catch (error: any) {
            console.error("Gemini topics failed:", error.message);
            return [];
        }
    }

    async planImplementation(feedback: string, fileTree: string[]) {
        const apiKey = manager.getNextKey();
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const prompt = `Based on this feedback: "${feedback}", and this repository structure:\n${fileTree.join("\n")}\n\nDetermine which files need to be modified. Return ONLY a JSON array of file paths. Example: ["README.md", "src/index.js"]`;

            // Add 45s timeout for planning
            const result = await Promise.race([
                model.generateContent(prompt),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Gemini planning timeout")), 45000))
            ]) as any;

            const text = result.response.text();
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (!jsonMatch) return ["README.md"]; // Fallback
            return JSON.parse(jsonMatch[0]);
        } catch (error: any) {
            console.error("Gemini planning failed:", error.message);
            return ["README.md"];
        }
    }

    async generateCode(feedback: string, filePath: string, currentCode: string, context?: string) {
        const apiKey = manager.getNextKey();
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const prompt = `Update ${filePath} for feedback: "${feedback}". 
            ${context ? `Background Context about repo: ${context}` : ''}
            Current code in ${filePath}:\n${currentCode}\n
            Return ONLY JSON with {new_code: string, explanation: string, confidence_score: number}.`;

            // Add 90s timeout for code generation (longer due to size)
            const result = await Promise.race([
                model.generateContent(prompt),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Gemini code gen timeout")), 90000))
            ]) as any;

            const text = result.response.text();
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("No JSON found in response");
            return JSON.parse(jsonMatch[0]);
        } catch (error: any) {
            console.error("Gemini code gen failed:", error.message);
            return null;
        }
    }
}
