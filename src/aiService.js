const { spawnSync } = require("child_process");
const AI_MODEL = "llama3.2:3b";

function generateAICommit(diff) {
  const prompt = `
You are an expert AI commit message generator specialized in creating concise, informative commit messages that follow best practices in version control.

Your ONLY task is to generate a well-structured commit message based on the provided diff. The commit message must:
1. Use a clear, descriptive title in the imperative mood (20-25 characters max)
2. Focus solely on the technical changes in the code
3. Use present tense and be specific about modifications

Key Guidelines:
- Analyze the entire diff comprehensively
- Capture the essence of only MAJOR changes
- Use technical, precise languages
- Avoid generic or vague descriptions
- Avoid quoting any words or sentences
- Avoid adding description for minor changes with not much context
- Return just the commit message, no additional text
- Don't return more bullet points
- Generate a single commit message

Output Format:
Concise Title Summarizing Changes

- Specific change description
- Rationale for key modifications
- Impact of changes
- Return only the title

Git diff:
${diff}
`.trim();

  const result = spawnSync("ollama", ["run", AI_MODEL], {
    input: prompt,
    encoding: "utf-8",
    maxBuffer: 1024 * 1024
  });

  if (result.error) {
    console.error("❌ Ollama error:", result.error.message);
    return null;
  }

  if (result.status !== 0) {
    console.error("⚠️ Ollama failed:", result.stderr);
    return null;
  }

  return result.stdout.trim();
}

module.exports = {
  generateAICommit
};
