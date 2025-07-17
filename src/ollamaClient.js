// ollamaClient.js

/**
 * =============================================================================
 * OllamaClient: A Singleton class to communicate with Ollama's local API
 * =============================================================================
 * Description:
 * This class interacts with Ollama's local model serving API (typically hosted
 * at http://localhost:11434) to generate AI responses.
 *
 * Model used: llama3.2:3b
 * =============================================================================
 */

const axios = require("axios");

class OllamaClient {
  constructor() {
    // Singleton enforcement: return existing instance if already created
    if (OllamaClient.instance) return OllamaClient.instance;

    // Model name to use (customize as needed)
    this.model = "llama3.2:3b";

    // Ollama API URL (default local endpoint)
    this.apiUrl = "http://localhost:11434/api/generate";

    // Save instance
    OllamaClient.instance = this;
  }

  /**
   * Generates a response from the Ollama model using the provided prompt
   * @param {string} prompt - Text input for the model
   * @returns {Promise<string>} - AI-generated cleaned response
   */
  async generate(prompt) {
    try {
      const res = await axios.post(this.apiUrl, {
        model: this.model,
        prompt,
        stream: false,
      });

      const raw = res.data?.response?.trim();

      // Return cleaned response by removing special characters
      return raw.replace(/[^\w\s-]/g, "");
    } catch (err) {
      console.error("❌ Ollama API Error:", err.message);
      throw new Error("Failed to get response from Ollama model");
    }
  }
}

// Export singleton instance
module.exports = new OllamaClient();
