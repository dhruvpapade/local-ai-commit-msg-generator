const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const aiService = require("./aiService");
const gitUtils = require("./utils/gitUtils");
const aiUtils = require("./utils/aiUtils");
const AI_MODEL = "llama3.2:3b";

function activate(context) {
  const disposable = vscode.commands.registerCommand(
    "extension.generateCommitMessage",
    function () {
      const panel = vscode.window.createWebviewPanel(
        "aiCommitMessage",
        "AI Commit Message Generator",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          localResourceRoots: [
            vscode.Uri.file(path.join(context.extensionPath, "media")),
          ],
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
      panel.webview.onDidReceiveMessage((message) => {
        if (message.command === "generate") {
          if (!aiUtils.isOllamaInstalled()) {
            return panel.webview.postMessage({
              command: "info",
              text: "❌ Ollama is not installed or not available in PATH.\nPlease install it from https://ollama.com/download and try again.",
            });
          }

          if (!aiUtils.isOllamaRunning(AI_MODEL)) {
            return panel.webview.postMessage({
              command: "info",
              text: "❌ Ollama is installed but the model is not available.\nPlease run `ollama pull llama3.2:3b` first.",
            });
          }

          if (!gitUtils.isGitRepoSafe()) {
            return panel.webview.postMessage({
              command: "info",
              text: "❌ This project is not a Git repository.\nPlease run `git init` first.",
            });
          }

          if (!gitUtils.hasCodeChanges()) {
            return panel.webview.postMessage({
              command: "info",
              text: "❌ No code changes detected.",
            });
          }

          const unstagedFiles = gitUtils.getGitUnstagedFiles();
          if (unstagedFiles.length > 0) {
            return panel.webview.postMessage({
              command: "info",
              text: `❌ You have unstaged changes:\n${unstagedFiles.join(
                ", "
              )}.\nPlease stage them with \"git add\" before proceeding.`,
            });
          }

          const diff = gitUtils.getGitDiff();
          if (!diff || diff.trim().length === 0) {
            return panel.webview.postMessage({
              command: "info",
              text: "❌ No file changes found. Please modify some files before generating a commit.",
            });
          }

          const aiMessage = aiService.generateAICommit(diff);
          if (!aiMessage || aiMessage.length < 5) {
            return panel.webview.postMessage({
              command: "info",
              text: "❌ AI returned an empty or invalid message.",
            });
          }

          const fullMessage = gitUtils.formatCommit(
            message.type,
            message.ticket,
            aiMessage
          );

          panel.webview.postMessage({
            command: "commitResult",
            result: fullMessage,
          });
        }

        if (message.command === "commit") {
          try {
            gitUtils.gitCommit(message.message);
            panel.webview.postMessage({
              command: "info",
              text: "✅ Commit completed successfully!",
            });
          } catch (e) {
            panel.webview.postMessage({
              command: "info",
              text: "❌ Commit failed: " + e.message,
            });
          }
        }
      });
    }
  );

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
