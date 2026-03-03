/**
 * @fileoverview lib/llm/OpenAIProvider.js
 */
import { OpenAI } from "openai";
import LLMProvider from "./LLMProvider.js";

class OpenAIProvider extends LLMProvider {
    constructor(config) {
        super(config);
        this.client = new OpenAI({ apiKey: config.apiKey });
        this.model = config.model || "gpt-4o";
    }

    async generateJSON(prompt, jsonSchema, systemInstruction = "You are a helpful travel assistant.") {
        return this.withTimeout(async () => {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: prompt }
                ],
                response_format: jsonSchema ? {
                    type: "json_schema",
                    json_schema: {
                        name: "response_schema",
                        schema: jsonSchema,
                        strict: true // Ensures model strictly adheres to the schema
                    }
                } : { type: "json_object" },
                temperature: 0.2, // Low temperature for deterministic output
            });

            return JSON.parse(response.choices[0].message.content);
        });
    }

    async *generateStream(prompt, systemInstruction = "You are a helpful travel assistant.") {
        const stream = await this.client.chat.completions.create({
            model: this.model,
            messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: prompt }
            ],
            stream: true,
        });

        for await (const chunk of stream) {
            if (chunk.choices[0]?.delta?.content) {
                yield chunk.choices[0].delta.content;
            }
        }
    }
}

export default OpenAIProvider;
