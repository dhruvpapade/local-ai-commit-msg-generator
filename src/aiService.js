const fetch = require("node-fetch");
const { OLLAMA_API_URL_ENDPOINT, AI_MODEL } = require("./config");

async function generateAICommit(diff) {
  try {
     const prompt = `
      Write a clear Git commit title (15–20 characters) in imperative mood based on the following diff.

      - Focus only on major technical changes
      - Be concise and specific
      - Avoid quotes, filler, or vague terms
      - Return only the title

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
