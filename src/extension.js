// extension.js

/**
 * =============================================================================
 * AI Commit Message Generator - VS Code Extension Entry Point
 * =============================================================================
 * Description:
 * This extension uses AI (via Ollama) to generate meaningful Git commit messages
 * based on staged code changes. It integrates with Git and shows a custom webview
 * for interaction.
 *
 * Dependencies:
 * - Ollama CLI & model installed locally
 * - Git repository initialized with staged changes
 * =============================================================================
 */

const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const aiService = require("./aiService");
const gitUtils = require("./utils/gitUtils");
const aiUtils = require("./utils/aiUtils");

// Change this to the model name you want Ollama to use
const AI_MODEL = "llama3.2:3b";

/**
 * Called when the extension is activated
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
  try {
    // Pre-warm the AI model
    aiService.warmUpModel();

    // Register the command
    const disposable = vscode.commands.registerCommand(
      "extension.generateCommitMessage",
      async () => {
        try {
          // Create and configure webview panel
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

          // Load HTML for webview
          const htmlPath = path.join(context.extensionPath, "webview.html");
          let html = fs.readFileSync(htmlPath, "utf8");

          // Inject style and script URIs
          const styleUri = panel.webview.asWebviewUri(
            vscode.Uri.file(path.join(context.extensionPath, "media", "style.css"))
          );
          const scriptUri = panel.webview.asWebviewUri(
            vscode.Uri.file(path.join(context.extensionPath, "media", "main.js"))
          );

          html = html
            .replace("{{STYLE_URI}}", styleUri.toString())
            .replace("{{SCRIPT_URI}}", scriptUri.toString());

          panel.webview.html = html;

          /**
           * Handle messages sent from the WebView
           */
          panel.webview.onDidReceiveMessage(async (message) => {
            try {
              if (message.command === "generate") {
                // Prerequisite checks
                if (!aiUtils.isOllamaInstalled()) {
                  return panel.webview.postMessage({
                    command: "info",
                    text:
                      "❌ Ollama is not installed or not available in PATH.\n" +
                      "Download it from https://ollama.com/download",
                  });
                }

                if (!aiUtils.isOllamaRunning(AI_MODEL)) {
                  return panel.webview.postMessage({
                    command: "info",
                    text:
                      `❌ The model "${AI_MODEL}" is not running.\n` +
                      `Run: \`ollama pull ${AI_MODEL}\` and \`ollama run ${AI_MODEL}\``,
                  });
                }

                if (!gitUtils.isGitRepoSafe()) {
                  return panel.webview.postMessage({
                    command: "info",
                    text: "❌ This is not a valid Git repository.\nRun `git init` to initialize.",
                  });
                }

                if (!gitUtils.hasCodeChanges()) {
                  return panel.webview.postMessage({
                    command: "info",
                    text: "❌ No code changes detected in the repository.",
                  });
                }

                if (!gitUtils.isGitStagedFiles()) {
                  return panel.webview.postMessage({
                    command: "info",
                    text: "❌ Please stage your changes before generating a commit message.",
                  });
                }

                // Get staged diff
                const diff = gitUtils.getGitDiff();
                if (!diff || diff.trim().length === 0) {
                  return panel.webview.postMessage({
                    command: "info",
                    text: "❌ No staged file changes found.",
                  });
                }

                // Ask AI to generate commit message
                try {
                  const aiResponse = await aiService.generateAICommit(diff, message.type);

                  if (!aiResponse?.aiMessage || aiResponse.aiMessage.length < 5) {
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
                    text: "❌ Error generating message: " + e.message,
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
              console.error("🔴 WebView message error:", msgErr);
            }
          });
        } catch (cmdErr) {
          vscode.window.showErrorMessage(
            "❌ Failed to open AI Commit Panel: " + cmdErr.message
          );
          console.error("🔴 Command registration error:", cmdErr);
        }
      }
    );

    context.subscriptions.push(disposable);
  } catch (e) {
    console.error("❌ Extension activation failed:", e.message);
    vscode.window.showErrorMessage("Extension activation failed: " + e.message);
  }
}

/**
 * Called when the extension is deactivated
 */
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
