const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const { getGitUnstagedFiles, getGitDiff, generateAICommit } = require("./aiService");
const simpleGit = require("simple-git");
const git = simpleGit();
const { spawnSync } = require("child_process");
const axios = require("axios");

function activate(context) {
  const disposable = vscode.commands.registerCommand("extension.generateCommitMessage", async function () {
    const panel = vscode.window.createWebviewPanel(
      "aiCommitMessage",
      "AI Commit Message Generator",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(context.extensionPath, "media"))
        ]
      }
    );

    // Load base HTML
    const htmlPath = path.join(context.extensionPath, "webview.html");
    let html = fs.readFileSync(htmlPath, "utf8");

    const styleUri = panel.webview.asWebviewUri(
      vscode.Uri.file(path.join(context.extensionPath, "media", "style.css"))
    );
    const scriptUri = panel.webview.asWebviewUri(
      vscode.Uri.file(path.join(context.extensionPath, "media", "main.js"))
    );

    html = html
      .replace("{{STYLE_URI}}", styleUri)
      .replace("{{SCRIPT_URI}}", scriptUri);

    panel.webview.html = html;

    // Handle messages from WebView
    panel.webview.onDidReceiveMessage(async (message) => {
      console.log('Command received from WebView:', message.command);

      if (message.command === "generate") {

        if (!isOllamaInstalled()) {
          return panel.webview.postMessage({
            command: "info",
            text: "❌ Ollama is not installed or not available in PATH.\nPlease install it from https://ollama.com/download and try again."
          });
        }

        if (!(await isOllamaRunning())) {
          return panel.webview.postMessage({
            command: "info",
            text: "❌ Ollama is installed but not running.\nPlease start it using `ollama serve` or open the Ollama desktop app."
          });
        }

        const unstagedFiles = await getGitUnstagedFiles();
        if (unstagedFiles.length > 0) {
          return panel.webview.postMessage({
            command: "info",
            text: `❌ You have unstaged changes:\n${unstagedFiles.join(', ')}.\nPlease stage them with "git add" before proceeding.`
          });
        }

        const diff = await getGitDiff();
        if (!diff || diff.trim().length === 0) {
          return panel.webview.postMessage({
            command: "info",
            text: "❌ No staged changes found. Please stage your changes first."
          });
        }

        const aiMessage = await generateAICommit(diff);
        if (!aiMessage || aiMessage.length < 5) {
          return panel.webview.postMessage({
            command: "info",
            text: "❌ AI returned an empty or invalid message."
          });
        }

        const fullMessage = formatCommit(message.type, message.ticket, aiMessage);
        panel.webview.postMessage({
          command: "commitResult",
          result: fullMessage
        });
      }

      if (message.command === "commit") {
        try {
          await git.commit(message.message);
          panel.webview.postMessage({
            command: "info",
            text: "✅ Commit completed successfully!"
          });
        } catch (e) {
          panel.webview.postMessage({
            command: "info",
            text: "❌ Commit failed: " + e.message
          });
        }
      }
    });
  });

  context.subscriptions.push(disposable);
}

function formatCommit(type, ticket, message) {
  const parts = [];
  if (ticket) parts.push(ticket);
  if (type) parts.push(type);
  return `${parts.join(":")}: ${message}`;
}

function isOllamaInstalled() {
  const result = spawnSync("ollama", ["--version"], { encoding: "utf8" });
  return result.status === 0;
}

async function isOllamaRunning() {
  try {
    const res = await axios.get("http://localhost:11434");
    return res.status === 200;
  } catch (err) {
    return false;
  }
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
