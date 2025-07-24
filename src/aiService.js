// aiCommitGenerator.js

/**
 * ============================================================================
 * AI Commit Message Generator using Ollama
 * ============================================================================
 * This module uses an AI model (via Ollama) to generate concise and well-structured
 * Git commit messages based on Git diffs.
 *
 * Dependencies:
 * - Ollama Client (local API)
 * - Node.js (v14+ recommended)
 * ============================================================================
 */

const ollamaClient = require('./ollamaClient');

/**
 * Warm up the Ollama model with a simple dummy prompt.
 * This helps reduce first-response latency.
 *
 * @returns {Promise<void>}
 */
async function warmUpModel() {
  const dummyPrompt = `Summarize: Add logging to API handler.`;
  console.log("⚙️ Warming up AI model...");

  const start = Date.now();

  try {
    const result = await ollamaClient.generate(dummyPrompt);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`✅ AI model warmed up. Response time: ${duration} seconds`);

    // Optional: log first few words to confirm output quality
    console.log("🔹 Output preview:", result?.slice(0, 50));
  } catch (err) {
    console.warn("⚠️ Failed to warm up model:", err.message);
  }
}

/**
 * Generate a commit message using the AI model based on a given diff.
 *
 * @param {string} diff - Git diff output (staged changes)
 * @param {string} type - Commit type (e.g., "feature", "fix", "refactor")
 * @returns {Promise<{aiMessage: string, duration: string}>}
 */
async function generateAICommit(diff, type) {
  const typePrompts = {
    feat: "Generate a clear, imperative Git commit title (max 50 characters) and a bullet-points description for a new feature from the diff below.",
    fix: "Generate a concise Git commit title (max 50 characters) and a bullet-points description for a bug fix from the diff below.",
    chore: "Generate a Git commit title (max 50 characters) and bullet-points description for non-functional changes (e.g., configs, dependencies) from the diff below.",
    refactor: "Generate a Git commit title (max 50 characters) and bullet-points description for a code refactor (no functional change) from the diff below.",
    docs: "Generate a Git commit title (max 50 characters) and bullet-points description for documentation updates from the diff below.",
    test: "Generate a Git commit title (max 50 characters) and bullet-points description for added/updated test cases from the diff below.",
    style: "Generate a Git commit title (max 50 characters) and bullet-points description for formatting/styling changes from the diff below.",
  };

  const prompt = `
  ${typePrompts[type]}

  Instructions:
  - Summarize only **major** changes from the full diff.
  - Use concise, technical language.
  - Skip minor or low-context edits.
  - Use imperative mood (e.g., "Add", "Fix", "Refactor").

  - Output only in the following format:
  Title:
  Description:

  Use below git diff:
  ${diff}
  `.trim();

  console.log('🚀 Generating commit message...');
  const startTime = Date.now();

  let commitMessage;
  try {
    commitMessage = await ollamaClient.generate(prompt);
  } catch (err) {
    console.error('❌ Ollama error:', err.message);
    return {
      aiMessage: '',
      duration: 'Failed to generate message',
    };
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  const cleanMessage = commitMessage?.trim();

  console.log(`⏱️ Commit message generated in ${duration} seconds`);

  return {
    aiMessage: cleanMessage || '',
    duration: `Commit message generated in ${duration} seconds`,
  };
}

// Exported functions
module.exports = {
  warmUpModel,
  generateAICommit,
};

/**
 * ============================================================================
 * HOW TO USE (example usage inside a Node.js CLI or VS Code extension):
 * ============================================================================
 * 
 * const { warmUpModel, generateAICommit } = require('./aiCommitGenerator');
 * const gitUtils = require('./git-utils'); // contains getGitDiff()
 * 
 * (async () => {
 *   await warmUpModel();
 * 
 *   const diff = gitUtils.getGitDiff(); // Get staged diff
 *   if (!diff) {
 *     console.log("⚠️ No staged changes found.");
 *     return;
 *   }
 * 
 *   const { aiMessage, duration } = await generateAICommit(diff, "feature");
 *   if (aiMessage) {
 *     console.log("✅ Suggested Commit Message:", aiMessage);
 *   } else {
 *     console.log("❌ Failed to generate commit message.");
 *   }
 * })();
 * 
 * ============================================================================
 */

