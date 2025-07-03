const simpleGit = require("simple-git");
const fetch = require("node-fetch");
const git = simpleGit();
const { OLLAMA_API_URL_ENDPOINT, AI_MODEL } = require("./config");

async function getGitDiff() {
  try {
    diff = await git.diff();
    console.log('diff: ' + diff);
    return diff;
  } catch (err) {
    console.error("Git diff error:", err);
    return "";
  }
}

async function getGitUnstagedFiles() {
  try {
    const status = await git.status();
    const unstagedFiles = status.modified.filter(f => !status.staged.includes(f));
    return unstagedFiles;
  } catch (err) {
    console.error("Git get unstaged files error:", err);
    return "";
  }
}

async function generateAICommit(diff) {
  try {
    const prompt = `
        Complete this Git commit message with a short, clear description (5-10 words max):

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
    return data.response.trim().replace(/^["']|["']$/g, "");
  } catch (err) {
    console.error("AI error:", err);
    return "Error generating commit message.";
  }
}

module.exports = {
  getGitUnstagedFiles,
  getGitDiff,
  generateAICommit
};
