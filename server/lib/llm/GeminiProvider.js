/**
 * @fileoverview lib/llm/GeminiProvider.js
 */
import { GoogleGenAI } from "@google/genai";
import LLMProvider from "./LLMProvider.js";

class GeminiProvider extends LLMProvider {
    constructor(config) {
        super(config);
        this.client = new GoogleGenAI({ apiKey: config.apiKey });
        this.model = config.model || "gemini-2.5-flash";
    }

    async generateJSON(prompt, jsonSchema, systemInstruction = "You are a helpful travel assistant.") {
        return this.withTimeout(async () => {
            const response = await this.client.models.generateContent({
                model: this.model,
                contents: prompt,
                config: {
                    systemInstruction: systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: jsonSchema,
                    temperature: 0.2,
                }
            });
            return JSON.parse(response.text);
        });
    }

    async *generateStream(prompt, systemInstruction = "You are a helpful travel assistant.") {
        const streamResponse = await this.client.models.generateContentStream({
            model: this.model,
            contents: prompt,
            config: { systemInstruction }
        });
        for await (const chunk of streamResponse) {
            yield chunk.text;
        }
    }
}

export default GeminiProvider;
