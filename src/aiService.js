// aiCommitGenerator.js

const ollamaClient = require('./ollamaClient');

class AIService {
  constructor() {
    this.diff = '';
    this.modelWarmedUp = false;
  }

  /**
   * Set the Git diff to be used for generating messages.
   * @param {string} diff - The Git diff string.
   */
  setDiff(diff) {
    this.diff = diff?.trim() || '';
  }

  /**
   * Warm up the Ollama model to reduce cold-start latency.
   * This is done only once per session.
   */
  async warmUpModel() {
    if (this.modelWarmedUp) return;

    const dummyPrompt = `You are an AI expert to generate concise and informative commit messages.`;
    console.log("⚙️ Warming up AI model...");

    const startTime = Date.now();
    try {
      await ollamaClient.generate(dummyPrompt);
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.modelWarmedUp = true;
      console.log(`✅ AI model warmed up in ${duration} seconds`);
    } catch (err) {
      console.warn("⚠️ Failed to warm up model:", err.message);
    }
  }

  /**
   * Generate a commit message based on the diff and commit type.
   * @param {string} type - Commit type (e.g., feat, fix, chore, etc.)
   * @returns {Promise<{ aiMessage: string, duration: string }>}
   */
  async generateCommitMessage(type) {
    if (!this.diff) {
      console.warn("⚠️ No diff provided. Call setDiff(diff) first.");
      return { aiMessage: '', duration: 'No diff provided' };
    }

    const typePrompts = {
      feat: "Write a Git commit title (≤50 chars) for a new feature.",
      fix: "Write a Git commit title (≤50 chars) for a bug fix.",
      chore: "Write a Git commit title (≤50 chars) for non-functional updates.",
      refactor: "Write a Git commit title (≤50 chars) for a code refactor.",
      docs: "Write a Git commit title (≤50 chars) for documentation updates.",
      test: "Write a Git commit title (≤50 chars) for test changes.",
      style: "Write a Git commit title (≤50 chars) for style-only changes.",
    };

    const prompt = `
${typePrompts[type] || typePrompts['chore']}
Git diff:
${this.diff}
    `.trim();

    console.log('🚀 Generating commit message...');
    const startTime = Date.now();

    try {
      const rawMessage = await ollamaClient.generate(prompt);
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      const aiMessage = rawMessage
        ?.replace(/[^\w\s-]/g, '') // Remove special characters
        .trim()
        .replace(/\s+/g, ' ')      // Normalize whitespace
        .replace(/^\w/, c => c.toUpperCase()) || '';

      console.log(`⏱️ Commit message generated in ${duration} seconds`);

      return {
        aiMessage,
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
   * Generate a concise pull request description from the diff.
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
      const rawDescription = await ollamaClient.generate(prompt);
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      const aiMessage = rawDescription?.trim() || '';

      console.log(`⏱️ PR description generated in ${duration} seconds`);

      return {
        aiMessage,
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
