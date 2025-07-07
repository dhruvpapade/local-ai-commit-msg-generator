const { spawnSync } = require("child_process");
const AI_MODEL = "llama3.2:3b";

function preloadModel() {
  try {
    spawnSync("ollama", ["run", AI_MODEL], {
      input: "Ping",
      encoding: "utf-8",
      stdio: "pipe",
      timeout: 10_000, // optional: fail early if it's too slow
    });
    console.log(`✅ Preloaded model: ${AI_MODEL}`);
  } catch (err) {
    console.warn(`⚠️ Ollama preload failed:`, err.message);
  }
}

function generateAICommit(diff) {
  const prompt = `
  Write a clear Git commit title (15-20 characters) in imperative mood based on the following diff.

  - Focus only on major technical changes
  - Be concise and specific
  - Avoid quotes, filler, or vague terms
  - Return only the title

  Git diff:
  ${diff}
  `;

  const start = Date.now(); // Start timer

  const result = spawnSync("ollama", ["run", AI_MODEL], {
    input: prompt,
    encoding: "utf-8",
    maxBuffer: 1024 * 1024
  });

  const end = Date.now(); // End timer
  const duration = (end - start) / 1000;

  console.log(`⏱️ Commit message generated in ${duration.toFixed(2)} seconds`);

  if (result.error) {
    console.error("❌ Ollama error:", result.error.message);
    return null;
  }

  if (result.status !== 0) {
    console.error("⚠️ Ollama failed:", result.stderr);
    return null;
  }

  const raw = result.stdout.trim();
  const clean = raw.replace(/[^\w\s-]/g, ""); // optional: clean special chars

  return clean;
}


module.exports = {
  preloadModel,
  generateAICommit
};
