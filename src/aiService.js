// aiCommitGenerator.js

const ollamaClient = require('./ollamaClient');

class AIService {
  constructor() {
    this.diff = '';
  }

  /**
   * Set the git diff to be used by the generator.
   * @param {string} diff
   */
  setDiff(diff) {
    this.diff = diff?.trim();
  }

  /**
   * Warm up the Ollama model with a dummy prompt.
   */
  async warmUpModel() {
    const dummyPrompt = `You are an AI expert to generate concise and informative commit message.`;
    console.log("⚙️ Warming up AI model...");
    const startTime = Date.now();

    try {
      await ollamaClient.generate(dummyPrompt);
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log(`✅ AI model warmed up in ${duration} seconds`);
    } catch (err) {
      console.warn("⚠️ Failed to warm up model:", err.message);
    }
  }

  /**
   * Generate a commit message from the current diff and commit type.
   * @param {string} type - Commit type (e.g., feat, fix, chore)
   * @returns {Promise<{ aiMessage: string, duration: string }>}
   */
  async generateCommitMessage(type) {
    if (!this.diff) {
      console.warn("⚠️ No diff provided. Call setDiff(diff) first.");
      return { aiMessage: '', duration: 'No diff provided' };
    }

    const typePrompts = {
      feat: "Generate a clear, imperative Git commit title (max 50 characters) describing a new feature.",
      fix: "Generate a concise Git commit title (max 50 characters) describing what bug was fixed.",
      chore: "Generate a commit title (max 50 characters) for a non-functional update like dependency or config changes.",
      refactor: "Generate a commit title (max 50 characters) for a code refactor (without changing functionality).",
      docs: "Generate a commit title (max 50 characters) for documentation updates.",
      test: "Generate a commit title (max 50 characters) for test case additions or modifications.",
      style: "Generate a commit title (max 50 characters) for formatting or style-only code changes.",
    };

    const prompt = `
    ${typePrompts[type]}
    Key Guidelines:
    - Focus only on major technical changes
    - Be concise and specific
    - Avoid quotes, filler, or vague terms
    - Return only the title

    Git diff:
    ${this.diff}
        `.trim();

    console.log('🚀 Generating commit message...');
    const startTime = Date.now();

    try {
      const commitMessage = await ollamaClient.generate(prompt);
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log(`⏱️ Commit message generated in ${duration} seconds`);

      return {
        aiMessage: commitMessage?.replace(/[^\w\s-]/g, "").trim() || '',
        duration: `Commit message generated in ${duration} seconds`
      };
    } catch (err) {
      console.error('❌ Ollama error:', err.message);
      return {
        aiMessage: '',
        duration: 'Failed to generate message'
      };
    }
  }

  /**
   * Generate a PR description from the current diff.
   * @returns {Promise<{ aiMessage: string, duration: string }>}
   */
  async generatePRDescription() {
    if (!this.diff) {
      console.warn("⚠️ No diff provided. Call setDiff(diff) first.");
      return { aiMessage: '', duration: 'No diff provided' };
    }

    const prompt = `
    Generate a concise pull request description using only bullet points.

    Instructions:
    - Output ONLY meaningful technical bullet points.
    - Do NOT include any headings, explanations, or notes.
    - Skip minor changes and focus on major improvements or fixes.
    - Avoid phrases like "Description", "Note", or any extra context outside the bullets.

    Git diff:
    ${this.diff}
        `.trim();

    console.log('🚀 Generating PR description...');
    const startTime = Date.now();

    try {
      const description = await ollamaClient.generate(prompt);
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log(`⏱️ Commit message generated in ${duration} seconds`);

      return {
        aiMessage: description?.trim() || '',
        duration: `Description generated in ${duration} seconds`
      };
    } catch (err) {
      console.error('❌ Ollama error:', err.message);
      return {
        aiMessage: '',
        duration: 'Failed to generate description'
      };
    }
  }
}

module.exports = AIService;
