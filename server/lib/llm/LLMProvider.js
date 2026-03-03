/**
 * @fileoverview lib/llm/LLMProvider.js
 */

class LLMProvider {
    /**
     * @param {Object} config
     * @param {number} [config.timeoutMs=15000] - 15 second strict timeout
     */
    constructor(config = {}) {
        this.timeoutMs = config.timeoutMs || 15000;
    }

    /**
     * Abstract method: generate structured JSON output
     * @param {string} prompt 
     * @param {Object} jsonSchema 
     * @param {string} systemInstruction 
     * @returns {Promise<Object>}
     */
    async generateJSON(prompt, jsonSchema, systemInstruction) {
        throw new Error("generateJSON() must be implemented by subclass");
    }

    /**
     * Abstract method: generator function for streaming text
     * @param {string} prompt 
     * @param {string} systemInstruction 
     * @returns {AsyncGenerator<string, void, unknown>}
     */
    async *generateStream(prompt, systemInstruction) {
        throw new Error("generateStream() must be implemented by subclass");
    }

    /**
     * Helper to execute a promise with a strict timeout
     */
    withTimeout(promiseFn) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`LLM Timeout exceeded ${this.timeoutMs}ms`));
            }, this.timeoutMs);

            promiseFn()
                .then((res) => {
                    clearTimeout(timer);
                    resolve(res);
                })
                .catch((err) => {
                    clearTimeout(timer);
                    reject(err);
                });
        });
    }
}

export default LLMProvider;
