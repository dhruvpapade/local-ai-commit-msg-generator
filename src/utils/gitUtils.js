// git-utils.js

/**
 * ============================================================================
 * Git Utilities for VS Code Extensions or Node.js CLI Tools
 * - Requires: Git CLI
 * - Context: Runs in the root of the currently opened workspace in VS Code
 * ============================================================================
 */

const { spawnSync } = require("child_process");
const vscode = require("vscode");

/**
 * Gets the root path of the VS Code workspace.
 * Falls back to process.cwd() if workspace is not opened.
 *
 * @returns {string} Absolute path to workspace root or process cwd
 */
function getRootPath() {
  return vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath ?? process.cwd();
}

/**
 * Checks if the current directory is inside a Git repository.
 *
 * @returns {boolean} True if inside a Git repo, false otherwise
 */
function isGitRepoSafe() {
  const result = spawnSync("git", ["rev-parse", "--is-inside-work-tree"], {
    cwd: getRootPath(),
    encoding: "utf-8",
    stdio: "pipe",
  });

  return result.status === 0 && result.stdout.trim() === "true";
}

/**
 * Checks whether there are any uncommitted changes in the working directory.
 *
 * @returns {boolean} True if there are changes (staged or unstaged)
 */
function hasCodeChanges() {
  const result = spawnSync("git", ["status", "--porcelain"], {
    cwd: getRootPath(),
    encoding: "utf-8",
  });

  return result.status === 0 && result.stdout.trim().length > 0;
}

/**
 * Checks if any files are currently staged for commit.
 *
 * @returns {boolean} True if there are staged files
 */
function isGitStagedFiles() {
  const result = spawnSync("git", ["diff", "--cached", "--name-only"], {
    cwd: getRootPath(),
    encoding: "utf-8",
  });

  return result.status === 0 && !!result.stdout.trim();
}

/**
 * Retrieves a list of unstaged file paths.
 *
 * @returns {string[]} Array of file names that are modified but unstaged
 */
function getGitUnstagedFiles() {
  const result = spawnSync("git", ["diff", "--name-only"], {
    cwd: getRootPath(),
    encoding: "utf-8",
  });

  if (result.status !== 0) return [];
  return result.stdout.trim().split("\n").filter(Boolean);
}

/**
 * Gets the diff of staged changes only.
 *
 * @returns {string} Git diff output for staged files
 */
function getGitDiff() {
  const result = spawnSync("git", ["diff", "--cached"], {
    cwd: getRootPath(),
    encoding: "utf-8",
    maxBuffer: 1024 * 1024, // 1 MB buffer
  });

  return result.status === 0 ? result.stdout.trim() : "";
}

/**
 * Formats a conventional commit message using type, ticket, and message.
 *
 * Example output:
 *   "JIRA-123:FEAT: Add new login form"
 *
 * @param {string} type - Commit type (e.g., FEAT, FIX, REFACTOR)
 * @param {string} ticket - Ticket ID or issue number (e.g., JIRA-123)
 * @param {string} message - Commit message
 * @returns {string} Formatted commit message
 */
function formatCommit(type, ticket, message) {
  const prefix = [ticket?.toUpperCase(), type?.toUpperCase()].filter(Boolean).join(":");
  return prefix ? `${prefix}: ${message}` : message;
}

/**
 * Performs a `git commit -m "<message>"`
 *
 * @param {string} message - Commit message
 * @throws Error if git commit fails
 */
function gitCommit(message) {
  const result = spawnSync("git", ["commit", "-m", message], {
    cwd: getRootPath(),
    encoding: "utf-8",
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || "Git commit failed");
  }
}

// Exporting all utility functions
module.exports = {
  isGitRepoSafe,
  hasCodeChanges,
  isGitStagedFiles,
  getGitUnstagedFiles,
  getGitDiff,
  formatCommit,
  gitCommit,
};

/**
 * ============================================================================
 * USAGE EXAMPLE (in VS Code extension or CLI)
 * ============================================================================
 * 
 * const git = require('./git-utils');
 * 
 * if (!git.isGitRepoSafe()) {
 *   console.error("Not a Git repository.");
 *   return;
 * }
 * 
 * if (!git.isGitStagedFiles()) {
 *   console.warn("No files staged. Please use `git add` before committing.");
 *   return;
 * }
 * 
 * const diff = git.getGitDiff();
 * console.log("Staged Diff:\n", diff);
 * 
 * const commitMsg = git.formatCommit("feat", "TASK-001", "add user service");
 * git.gitCommit(commitMsg);
 * 
 * console.log("✅ Commit successful!");
 */
