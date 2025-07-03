const vscode = require("vscode");
const simpleGit = require("simple-git");

const rootPath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
const git = simpleGit(rootPath);

async function isGitRepoSafe() {
  try {
    return await git.checkIsRepo();
  } catch (err) {
    return false;
  }
}

async function hasCodeChanges() {
  const status = await git.status();
  return status.files.length > 0;
}

async function getGitDiff() {
  try {
    diff = await git.diff(['--staged']);
    return diff;
  } catch (err) {
    console.error("Git diff error:", err);
    return "";
  }
}

async function getGitUnstagedFiles() {
  try {
    const status = await git.status();
    const unstagedFiles = status.modified.filter(f => !status.staged.includes(f));
    return unstagedFiles;
  } catch (err) {
    console.error("Git get unstaged files error:", err);
    return "";
  }
}

async function gitCommit(message) {
    await git.commit(message);
}

async function formatCommit(type, ticket, message) {
  const parts = [];
  if (ticket) parts.push(ticket);
  if (type) parts.push(type);
  return `${parts.join(":")}: ${message}`;
}

module.exports = {
  getGitUnstagedFiles,
  getGitDiff,
  isGitRepoSafe,
  gitCommit,
  formatCommit,
  hasCodeChanges
};