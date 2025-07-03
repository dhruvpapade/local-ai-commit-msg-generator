const fetch = require("node-fetch");
const { OLLAMA_API_URL_ENDPOINT, AI_MODEL } = require("./config");

async function generateAICommit(diff) {
  try {
      const prompt = `
      Based on the following Git diff, generate a simple, fast, short and clean Git commit message.

      Rules:
      - Output ONLY the commit message, no explanation or formatting.
      - Maximum 15 words.
      - Use imperative tone (e.g., "Fix bug" not "Fixed bug").
      - Do NOT include quotes, prefixes, labels, or explanations.

      Git diff:
      ${diff}
      `;

    const response = await fetch(OLLAMA_API_URL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: AI_MODEL, // Change to your preferred LLM
        prompt,
        stream: false
      })
    });

    const data = await response.json();
    return data?.response?.trim().replace(/^["']|["']$/g, "");
  } catch (err) {
    console.error("AI error:", err);
    return "Error generating commit message.";
  }
}

module.exports = {
  generateAICommit
};
