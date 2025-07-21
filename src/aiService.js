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
  const dummyPrompt = `You are an AI expert to generate concise and informative commit message.`;
  console.log("⚙️ Warming up AI model...");

  try {
    await ollamaClient.generate(dummyPrompt);
    console.log("✅ AI model warmed up.");
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
    feat: "Write a clear, imperative Git commit title (40-50 characters max) describing a new feature in imperative mood based on the following diff.",
    fix: "Write a concise Git commit title (40-50 characters max) describing what bug was fixed in imperative mood based on the following diff.",
    chore: "Write a commit title (40-50 characters max) for a non-functional update like dependency or config changes in imperative mood based on the following diff.",
    refactor: "Write a commit title (40-50 characters max) for a code refactor (without changing functionality) in imperative mood based on the following diff.",
    docs: "Write a commit title (40-50 characters max) for documentation updates in imperative mood based on the following diff.",
    test: "Write a commit title (40-50 characters max) for test case additions or modifications in imperative mood based on the following diff.",
    style: "Write a commit title (40-50 characters max) for formatting or style-only code changes in imperative mood based on the following diff.",
  };
  
  const prompt = `
${typePrompts[type]}

Key Guidelines:
- Focus only on major technical changes
- Be concise and specific
- Avoid quotes, filler, or vague terms
- Return only the title

Git diff:
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

