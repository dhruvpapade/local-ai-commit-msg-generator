// ollama-status.js

// ============================================================================
// This script provides utility functions to:
// 1. Check if the 'ollama' CLI is installed
// 2. Check if a specific model is currently running via `ollama list`
// ============================================================================

const { spawnSync } = require("child_process");

/**
 * Checks whether the `ollama` command-line tool is installed and available.
 * It runs `ollama --version` and checks for a successful status code.
 *
 * @returns {boolean} True if installed, false otherwise.
 */
function isOllamaInstalled() {
  const result = spawnSync("ollama", ["--version"], { encoding: "utf8" });
  return result.status === 0;
}

/**
 * Checks if a specific Ollama model is currently listed (i.e., downloaded or running).
 * It executes `ollama list` and searches for the model name in the output.
 *
 * @param {string} model - The name of the model to search for (e.g., "llama3", "mistral").
 * @returns {boolean} True if the model is found, false otherwise.
 */
function isOllamaRunning(model) {
  const result = spawnSync("ollama", ["list"], { encoding: "utf8" });
  if (result.status !== 0 || !result.stdout) return false;
  return result.stdout.toLowerCase().includes(model.toLowerCase());
}

// Exporting the utility functions for external use
module.exports = {
  isOllamaInstalled,
  isOllamaRunning,
};

/**
 * ============================================================================
 * USAGE EXAMPLE (Uncomment to run directly):
 * ============================================================================
 * 
 * const { isOllamaInstalled, isOllamaRunning } = require("./ollama-status");
 * 
 * if (!isOllamaInstalled()) {
 *   console.log("❌ Ollama is not installed.");
 * } else if (isOllamaRunning("llama3")) {
 *   console.log("✅ Ollama is installed and 'llama3' model is available.");
 * } else {
 *   console.log("⚠️  Ollama is installed, but 'llama3' model is not available.");
 * }
 */
