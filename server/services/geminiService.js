import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logsDir = path.join(__dirname, '../logs');

// Ensure the logs directory exists
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const tokenUsageFile = path.join(logsDir, 'tokenUsage.json');

// Initialize Gemini Client
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

// Simple in-memory cache
const cache = new Map();

/**
 * Helper to log token usage for benchmarking and reporting
 */
function logTokenUsage(usage, model, operation) {
    if (!usage) return;

    const logEntry = {
        timestamp: new Date().toISOString(),
        model,
        operation,
        prompt_tokens: usage.promptTokenCount || 0,
        completion_tokens: usage.candidatesTokenCount || 0,
        total_tokens: usage.totalTokenCount || 0
    };

    try {
        let logs = [];
        if (fs.existsSync(tokenUsageFile)) {
            const fileContent = fs.readFileSync(tokenUsageFile, 'utf-8');
            logs = JSON.parse(fileContent || '[]');
        }
        logs.push(logEntry);
        fs.writeFileSync(tokenUsageFile, JSON.stringify(logs, null, 2));
        console.log(`[Token Usage Tracker] ${usage.totalTokenCount} tokens used for operation "${operation}"`);
    } catch (err) {
        console.error('Failed to write token usage log:', err);
    }
}

/**
 * Main function to generate completions using Gemini
 * @param {string} prompt - The user prompt
 * @param {string} systemMessage - Optional system message to set context
 * @param {object} options - Options like temperature, JSON mode, caching, and stream
 * @returns {string} The AI generated text/JSON string
 */
export async function callGemini(prompt, systemMessage = '', options = {}) {
    const {
        temperature = 0.6,
        maxOutputTokens = 900, // Google uses maxOutputTokens
        jsonMode = false,
        useCache = true,
        operationName = 'general-generation'
    } = options;

    // Caching Layer
    const cacheKey = JSON.stringify({ prompt, systemMessage, jsonMode });
    if (useCache && cache.has(cacheKey)) {
        console.log(`[Cache Hit] Returning cached response for "${operationName}"`);
        return cache.get(cacheKey);
    }

    try {
        const config = {
            temperature,
            maxOutputTokens,
        };

        if (systemMessage) {
            // Enforce JSON instructions inside system instructions if required
            let sysMsg = systemMessage;
            if (jsonMode && !systemMessage.includes('JSON')) {
                sysMsg += '\nYou must return the response in strict JSON format.';
            }
            config.systemInstruction = sysMsg;
        } else if (jsonMode) {
            config.systemInstruction = 'You must return the response in strict JSON format.';
        }

        if (jsonMode) {
            config.responseMimeType = 'application/json';
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config,
        });

        logTokenUsage(response.usageMetadata, 'gemini-2.5-flash', operationName);

        const resultText = response.text;

        // Save to Cache
        if (useCache) {
            cache.set(cacheKey, resultText);
        }

        return resultText;
    } catch (error) {
        console.error('[Gemini Service Error]:', error);
        throw error;
    }
}

/**
 * Utility to extract JSON safely from text
 */
export function extractJSON(text) {
    if (!text) return null;

    try {
        return JSON.parse(text);
    } catch (e) {
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            try {
                const jsonStr = text.substring(firstBrace, lastBrace + 1);
                return JSON.parse(jsonStr);
            } catch (err) {
                return null;
            }
        }
        return null;
    }
}
