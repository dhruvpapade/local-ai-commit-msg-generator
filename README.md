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

### 1. Download and Install ollama Server
https://ollama.com/ 

Check that the 'llama3.2:3b' AI model is running

```bash
ollama pull llama3.2:3b
```
<img width="894" height="337" alt="image" src="https://github.com/user-attachments/assets/23c76aad-f768-42bd-a94b-f7d6f2949c89" />

```bash
ollama run llama3.2:3b
```
<img width="585" height="241" alt="image" src="https://github.com/user-attachments/assets/6a711f63-061a-4238-9291-d3480a4c78f7" />

### 2. Clone and Install Extension

```bash
git clone https://github.com/dhruvpapade/local-ai-commit-msg-generator
cd local-ai-commit-msg-generator
npm install
