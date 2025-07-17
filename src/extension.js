const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const aiService = require("./aiService");
const gitUtils = require("./utils/gitUtils");
const aiUtils = require("./utils/aiUtils");
const AI_MODEL = "llama3.2:3b";

async function activate(context) {
  try {
    aiService.warmUpModel();

    const disposable = vscode.commands.registerCommand(
      "extension.generateCommitMessage",
      async function () {
        try {
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

          const htmlPath = path.join(context.extensionPath, "webview.html");
          html = fs.readFileSync(htmlPath, "utf8");

          const styleUri = panel.webview.asWebviewUri(
            vscode.Uri.file(
              path.join(context.extensionPath, "media", "style.css")
            )
          );
          const scriptUri = panel.webview.asWebviewUri(
            vscode.Uri.file(
              path.join(context.extensionPath, "media", "main.js")
            )
          );

          html = html
            .replace("{{STYLE_URI}}", styleUri.toString())
            .replace("{{SCRIPT_URI}}", scriptUri.toString());

          panel.webview.html = html;

          // Handle messages from WebView
          panel.webview.onDidReceiveMessage(async (message) => {
            try {
              if (message.command === "generate") {
                if (!aiUtils.isOllamaInstalled()) {
                  return panel.webview.postMessage({
                    command: "info",
                    text:
                      "❌ Ollama is not installed or not available in PATH.\n" +
                      "Please install it from https://ollama.com/download and try again.",
                  });
                }

                if (!aiUtils.isOllamaRunning(AI_MODEL)) {
                  return panel.webview.postMessage({
                    command: "info",
                    text: `❌ Ollama is installed but the model "${AI_MODEL}" is not available.\nPlease run \`ollama pull ${AI_MODEL}\` first.`,
                  });
                }

                if (!gitUtils.isGitRepoSafe()) {
                  return panel.webview.postMessage({
                    command: "info",
                    text:
                      "❌ This project is not a Git repository.\nPlease run `git init` first.",
                  });
                }

                if (!gitUtils.hasCodeChanges()) {
                  return panel.webview.postMessage({
                    command: "info",
                    text: "❌ No code changes detected.",
                  });
                }

                if (!gitUtils.isGitStagedFiles()) {
                  return panel.webview.postMessage({
                    command: "info",
                    text:
                      "❌ You have unstaged changes, Please stage them before proceeding.",
                  });
                }

                const diff = gitUtils.getGitDiff();
                if (!diff || diff.trim().length === 0) {
                  return panel.webview.postMessage({
                    command: "info",
                    text:
                      "❌ No file changes found. Please modify some files before generating a commit.",
                  });
                }

                try {
                  const aiResponse = await aiService.generateAICommit(diff, message.type);

                  if (
                    !aiResponse ||
                    !aiResponse.aiMessage ||
                    aiResponse.aiMessage.length < 5
                  ) {
                    return panel.webview.postMessage({
                      command: "info",
                      text: "❌ AI returned an empty or invalid message.",
                    });
                  }

                  const fullMessage = gitUtils.formatCommit(
                    message.type,
                    message.ticket,
                    aiResponse.aiMessage
                  );

                  panel.webview.postMessage({
                    command: "commitResult",
                    result: {
                      aiMessage: fullMessage,
                      duration: aiResponse.duration,
                    },
                  });
                } catch (e) {
                  panel.webview.postMessage({
                    command: "info",
                    text: "❌ Error generating commit message: " + e.message,
                  });
                }
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
            } catch (msgErr) {
              panel.webview.postMessage({
                command: "info",
                text: "❌ Unexpected error: " + msgErr.message,
              });
              console.error("Unhandled WebView message error:", msgErr);
            }
          });
        } catch (cmdErr) {
          vscode.window.showErrorMessage(
            "❌ Failed to launch AI Commit Message Generator: " + cmdErr.message
          );
          console.error("Command error:", cmdErr);
        }
      }
    );

    context.subscriptions.push(disposable);
  } catch (e) {
    console.error("❌ Extension activation failed:", e.message);
    vscode.window.showErrorMessage("Extension activation failed: " + e.message);
  }
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
