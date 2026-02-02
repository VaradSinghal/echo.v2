import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

const keys = (process.env.GEMINI_API_KEYS || "").split(",").filter(Boolean);

async function testGemini() {
    if (keys.length === 0) {
        console.error("No Gemini keys found.");
        return;
    }

    for (const key of keys) {
        console.log(`Testing Key: ${key.substring(0, 8)}...`);
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" }); // Trying flash as it might be more available

        try {
            const result = await model.generateContent("Hello, are you working?");
            console.log("✅ Success:", result.response.text());
        } catch (e: any) {
            console.error(`❌ Failed: [${e.status}] ${e.message}`);
        }
    }
}

testGemini();
