const { spawnSync } = require("child_process");
const vscode = require("vscode");

function getRootPath() {
  return vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath ?? process.cwd();
}

function isGitRepoSafe() {
  const rootPath = getRootPath();

  const result = spawnSync("git", ["rev-parse", "--is-inside-work-tree"], {
    cwd: rootPath,
    encoding: "utf-8",
    stdio: "pipe",
  });

  return result.status === 0 && result.stdout.trim() === "true";
}

function hasCodeChanges() {
  const result = spawnSync("git", ["status", "--porcelain"], {
    cwd: getRootPath(),
    encoding: "utf-8",
  });

  return result.status === 0 && result.stdout.trim().length > 0;
}

function getGitUnstagedFiles() {
  const result = spawnSync("git", ["diff", "--name-only"], {
    cwd: getRootPath(),
    encoding: "utf-8",
  });

  if (result.status !== 0) return [];
  return result.stdout.trim().split("\n").filter(Boolean);
}

function getGitDiff() {
  const result = spawnSync("git", ["diff", "--cached"], {
    cwd: getRootPath(),
    encoding: "utf-8",
    maxBuffer: 1024 * 1024,
  });

  return result.status === 0 ? result.stdout.trim() : "";
}

function formatCommit(type, ticket, message) {
  const prefix = [ticket?.toUpperCase(), type?.toUpperCase()].filter(Boolean).join(":");
  return prefix ? `${prefix}: ${message}` : message;
}

function gitCommit(message) {
  const result = spawnSync("git", ["commit", "-m", message], {
    cwd: getRootPath(),
    encoding: "utf-8",
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || "Git commit failed");
  }
}

module.exports = {
  isGitRepoSafe,
  hasCodeChanges,
  getGitUnstagedFiles,
  getGitDiff,
  formatCommit,
  gitCommit,
};
