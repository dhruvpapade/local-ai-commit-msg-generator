# 🧠 Local AI-Powered Commit Message Generator

A Visual Studio Code extension that uses **local AI models** (via [Ollama](https://ollama.com)) to generate **meaningful, conventional commit messages** from Git diffs.  
Works completely **offline**, ensures **security**, and improves **developer productivity** by up to 90%.

---

## 🚀 Features

- ✅ Generate short, clear commit messages from staged diffs
- ✅ Fully local (no internet required) using Ollama + models like CodeLLaMA, Phi-2, or StarCoder
- ✅ Interactive UI using VS Code WebView
- ✅ Commit message customization: type, ticket ID, formatting
- ✅ Validates:
  - Ollama is installed
  - Ollama is running
  - Git has staged changes
  - Ticket ID format (e.g., `JIRA-1234`)
- ✅ Enforces [Conventional Commit](https://www.conventionalcommits.org/) style

---

## 📥 Installation

### 1. Clone and Install Extension

```bash
git clone https://github.com/dhruvpapade/local-ai-commit-msg-generator
cd local-ai-commit-msg-generator
npm install
