const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const aiService = require("./aiService");
const gitUtils = require('./utils/gitUtils');
const aiUtils = require('./utils/aiUtils');

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
      if (message.command === "generate") {
        if (!await aiUtils.isOllamaInstalled()) {
          return panel.webview.postMessage({
            command: "info",
            text: "❌ Ollama is not installed or not available in PATH.\nPlease install it from https://ollama.com/download and try again."
          });
        }

        if (!(await aiUtils.isOllamaRunning())) {
          return panel.webview.postMessage({
            command: "info",
            text: "❌ Ollama is installed but not running.\nPlease start it using `ollama serve` or open the Ollama desktop app."
          });
        }

        if (!(await gitUtils.isGitRepoSafe())) {
          return panel.webview.postMessage({
            command: "info",
            text: "❌ This project is not a Git repository.\nPlease run `git init` first."
          });
        }

        const codeChanges = await gitUtils.hasCodeChanges();
        if (!codeChanges) {
          return panel.webview.postMessage({
            command: "info",
            text: `❌ No code changes detected.`
          });
        }

        const unstagedFiles = await gitUtils.getGitUnstagedFiles();
        if (unstagedFiles.length > 0) {
          return panel.webview.postMessage({
            command: "info",
            text: `❌ You have unstaged changes:\n${unstagedFiles.join(', ')}.\nPlease stage them with "git add" before proceeding.`
          });
        }

        const diff = await gitUtils.getGitDiff();
        if (!diff || diff?.trim().length === 0) {
          return panel.webview.postMessage({
            command: "info",
            ext: "❌ No file changes found. Please modify some files before generating a commit."
          });
        }

        const aiMessage = await aiService.generateAICommit(diff);
        if (!aiMessage || aiMessage.length < 5) {
          return panel.webview.postMessage({
            command: "info",
            text: "❌ AI returned an empty or invalid message."
          });
        }

        const fullMessage = await gitUtils.formatCommit(message.type, message.ticket, aiMessage);
        panel.webview.postMessage({
          command: "commitResult",
          result: fullMessage
        });
      }

      if (message.command === "commit") {
        try {
          await gitUtils.gitCommit(message.message);
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

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
