/**
 * @fileoverview lib/llm/index.js
 */
import OpenAIProvider from "./OpenAIProvider.js";
import GeminiProvider from "./GeminiProvider.js";
import dotenv from "dotenv";

dotenv.config();

class LLMService {
    constructor() {
        this.primary = new GeminiProvider({
            apiKey: process.env.GEMINI_API_KEY,
            model: process.env.GEMINI_MODEL_FALLBACK || "gemini-2.5-flash",
            timeoutMs: Number(process.env.LLM_TIMEOUT_MS) || 15000
        });
        this.fallback = new OpenAIProvider({
            apiKey: process.env.OPENAI_API_KEY,
            model: process.env.OPENAI_MODEL_PRIMARY || "gpt-4o",
            timeoutMs: Number(process.env.LLM_TIMEOUT_MS) || 15000
        });
    }

    /**
     * Generates JSON output using the primary provider, falling back on error.
     */
    async generateJSON(prompt, jsonSchema = null, systemInstruction = "You are a helpful travel assistant.") {
        try {
            console.log(`[LLMService] Attempting generation with Primary LLM (${this.primary.model})...`);
            return await this.primary.generateJSON(prompt, jsonSchema, systemInstruction);
        } catch (error) {
            console.warn(`[LLMService] Primary LLM failed: ${error.message}. Triggering fallback to ${this.fallback.model}...`);
            // Warning: We swallow the error and try the fallback. If fallback fails, we throw.
            return await this.fallback.generateJSON(prompt, jsonSchema, systemInstruction);
        }
    }

    /**
     * Generates streamed text using the primary provider, falling back on error.
     */
    async *generateStream(prompt, systemInstruction = "You are a helpful travel assistant.") {
        try {
            console.log(`[LLMService] Attempting stream generation with Primary LLM (${this.primary.model})...`);
            const stream = this.primary.generateStream(prompt, systemInstruction);
            for await (const chunk of stream) {
                yield chunk;
            }
        } catch (error) {
            console.warn(`[LLMService] Primary LLM stream failed: ${error.message}. Triggering fallback to ${this.fallback.model}...`);
            const fallbackStream = this.fallback.generateStream(prompt, systemInstruction);
            for await (const chunk of fallbackStream) {
                yield chunk;
            }
        }
    }
}

export default new LLMService();
