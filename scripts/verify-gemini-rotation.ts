
import { GeminiService } from "../lib/gemini";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function testRotation() {
    const gemini = new GeminiService();
    console.log("🚀 Testing Gemini Multi-Key Rotation...");

    // 1. Initial test
    console.log("\n--- Pass 1: Simple Analysis ---");
    const res1 = await gemini.analyzeFeedback("Hello world");
    console.log("Result 1 received:", !!res1);

    // 2. Continuous calls to trigger rotation
    console.log("\n--- Pass 2: Rotating through keys ---");
    for (let i = 0; i < 5; i++) {
        const res = await gemini.analyzeFeedback(`Test message ${i}`);
        console.log(`Call ${i + 1}: Success=${!!res}`);
    }

    console.log("\n✅ Multi-key rotation check complete. Check console logs for 'Gemini Manager' output.");
}

testRotation().catch(console.error);
