const { spawnSync } = require("child_process");

function isOllamaInstalled() {
  const result = spawnSync("ollama", ["--version"], { encoding: "utf8" });
  return result.status === 0;
}

function isOllamaRunning(model) {
  const result = spawnSync("ollama", ["list"], { encoding: "utf8" });
  if (result.status !== 0 || !result.stdout) return false;
  return result.stdout.toLowerCase().includes(model.toLowerCase());
}

module.exports = {
  isOllamaInstalled,
  isOllamaRunning
};
