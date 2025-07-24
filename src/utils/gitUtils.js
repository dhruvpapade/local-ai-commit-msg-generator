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

  if (result.status !== 0) return "";

  let diff = result.stdout.trim();
  // Remove added lines with variable declarations (const, let, var), require, import, include
  diff = diff.split("\n").filter(line => {
    const isDiffMeta = line.startsWith("+++") || line.startsWith("---");
    const isCodeLine = line.startsWith("+") || line.startsWith("-");
    if (!isCodeLine || isDiffMeta) return true;

    const trimmed = line.slice(1).trim();

    // Remove blank lines and unwanted patterns
    return trimmed !== "" &&
           !/^(const|let|var)\s/.test(trimmed) &&
           !/^import\s/.test(trimmed) &&
           !/require\(/.test(trimmed) &&
           !/include\s/.test(trimmed);
  })
  .join("\n");
  return diff;
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
 * Commits staged changes and pushes them to the remote repository.
 *
 * Performs a `git commit -m "<message>"` followed by `git push`.
 *
 * @param {string} message - The commit message to use.
 * @throws {Error} If the commit or push operation fails.
 */
function gitCommitAndPush(message) {
  // Step 1: Commit
  const commitResult = spawnSync("git", ["commit", "-m", message], {
    cwd: getRootPath(),
    encoding: "utf-8",
  });

  if (commitResult.status !== 0) {
    throw new Error(commitResult.stderr || "Git commit failed");
  }

  // Step 2: Push
  const pushResult = spawnSync("git", ["push"], {
    cwd: getRootPath(),
    encoding: "utf-8",
  });

  if (pushResult.status !== 0) {
    throw new Error(pushResult.stderr || "Git push failed");
  }

  console.log("✅ Commit and push successful.");
}

/**
 * Checks if the GitHub CLI is installed on the system.
 *
 * @returns {boolean} - Returns true if the GitHub CLI is available; false if it's missing or inaccessible.
 */
function isGitHubAuthAvailable() {
  const result = spawnSync("gh", ["auth", "status"], {
    encoding: "utf-8",
  });

  if (result.error) {
    console.error("GitHub CLI not found:", result.error.message);
    return false;
  }

  return true;
}

/**
 * Removes references to remote branches that have been deleted from the origin.
 *
 * @param {string} cwd - The working directory where the Git command should be executed.
 * @returns {boolean} - Returns true if pruning was successful; false otherwise.
 */
function pruneDeletedRemoteBranches(cwd) {
  const result = spawnSync("git", ["remote", "prune", "origin"], {
    cwd: getRootPath(),
    encoding: "utf-8",
  });

  if (result.status !== 0) {
    console.error("Failed to prune branches:", result.stderr);
    return false;
  }

  return true;
}

/**
 * Retrieves all active remote Git branches after pruning deleted ones.
 *
 * @returns {string[]} - An array of branch names without the 'origin/' prefix.
 */
function getAllBranches() {
  pruneDeletedRemoteBranches();
  const result = spawnSync("git", ["branch", "-r", "--format=%(refname:short)"], {
    cwd: getRootPath(),
    encoding: "utf-8",
  });

  if (result.status !== 0) {
    console.error("Failed to fetch branches:", result.stderr);
    return [];
  }

  // Parse and clean branch names
  return result.stdout
    .split("\n")
    .map(line => line.trim().replace(/^\* /, ""))
    .filter(branch => branch.length > 0)
    .map(branch => branch.replace(/^origin\//, "")); // Remove 'origin/' prefix

}

/**
 * Retrieves the name of the current Git branch.
 *
 * @returns {string|null} - The current branch name, or null if the operation fails.
 */
function getCurrentBranch() {
  const result = spawnSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
    cwd: getRootPath(),
    encoding: "utf-8",
  });

  if (result.status !== 0) {
    console.error("Failed to get current branch:", result.stderr);
    return null;
  }

  return result.stdout.trim();
}

/**
 * Creates a pull request on GitHub using the GitHub CLI.
 *
 * @param {string} prTitle - Title of the pull request.
 * @param {string} prBody - Body content of the pull request.
 * @param {string} base - The base branch to merge into.
 * @returns {{success: boolean, prUrl?: string, error?: string}} - Result of the PR creation with either a URL or an error message.
 */
function createPR(prTitle, prBody, base) {
  const head = getCurrentBranch() || '';
  const result = spawnSync("gh", [
    'pr', 'create',
    '--base', base, 
    '--head', head, 
    '--title', prTitle,
    '--body', prBody
  ],
  {
    cwd: getRootPath(),
    encoding: "utf-8",
  });

  if (result.error) {
    console.error("Spawn error:", result.error.message);
    return {
      success: false,
      error: result.error.message
    };
  }

  if (result.status !== 0) {
    console.error("PR creation failed:", result.stderr);
    return {
      success: false,
      error: result.stderr
    };
  }

  const url = result.stdout.trim(); // URL of created PR
  console.log("PR created:", url);
  return {
      success: true,
      prUrl: url
    };
}

// Exporting all utility functions
module.exports = {
  isGitRepoSafe,
  hasCodeChanges,
  isGitStagedFiles,
  getGitUnstagedFiles,
  getGitDiff,
  formatCommit,
  gitCommitAndPush,
  isGitHubAuthAvailable,
  createPR,
  getAllBranches
};
