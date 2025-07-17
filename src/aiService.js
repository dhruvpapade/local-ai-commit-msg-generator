const ollamaClient = require('./ollamaClient');

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

async function generateAICommit(diff, type) {
  const prompt = `
Write a clear ${type} Git commit title (40-50 characters max) in imperative mood based on the following diff.

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

  const duration = ((Date.now() - startTime) / 1000).toFixed(2); // in seconds
  const cleanMessage = commitMessage?.trim();

  console.log(`⏱️ Commit message generated in ${duration} seconds`);

  return {
    aiMessage: cleanMessage || '',
    duration: `Commit message generated in ${duration} seconds`,
  };
}

module.exports = {
  warmUpModel,
  generateAICommit,
};
