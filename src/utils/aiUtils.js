const { spawnSync } = require("child_process");
const axios = require("axios");
const { OLLAMA_API_URL } = require("../config");

async function isOllamaInstalled() {
  const result = spawnSync("ollama", ["--version"], { encoding: "utf8" });
  return result.status === 0;
}

async function isOllamaRunning() {
  try {
    const res = await axios.get(OLLAMA_API_URL);
    return res.status === 200;
  } catch (err) {
    return false;
  }
}


module.exports = {
  isOllamaInstalled,
  isOllamaRunning
};
