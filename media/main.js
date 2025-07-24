const vscode = acquireVsCodeApi();

// DOM Elements
const loader = document.getElementById("loader");
const timer = document.getElementById("timer");
const timerText = document.getElementById("timer-text");
const commitTitle = document.getElementById("commitTitle");
const prDescription = document.getElementById("prDescription");
const ticketError = document.getElementById("ticketError");
const msgEl = document.getElementById("errorMessage");
const commitSection = document.getElementById("commitSection");
const prSection = document.getElementById("prSection");
const baseBranch = document.getElementById("baseBranch");

// Show temporary error/info message
function showMessage(text) {
  msgEl.textContent = text;
  msgEl.style.display = "block";
}

// Handle "generateCommitBtn" button click
document.getElementById("generateCommitBtn").addEventListener("click", () => {
  msgEl.style.display = "none";
  timer.style.display = "none";

  const type = document.getElementById("type").value;
  const ticket = document.getElementById("ticket").value;

  // Validate ticket input
  if (!ticket) {
    ticketError.style.display = "block";
    return;
  } else {
    ticketError.style.display = "none";
  }

  commitTitle.value = ""; // Clear previous commit title
  loader.style.display = "flex";

  vscode.postMessage({
    command: "generateCommit",
    type,
    ticket
  });
});

// Handle "Commit" button click
document.getElementById("commitBtn").addEventListener("click", () => {
  const msg = commitTitle.value;

  vscode.postMessage({
    command: "commit",
    message: msg
  });
});

// Handle "generatePRBtn" button click
document.getElementById("generatePRBtn").addEventListener("click", () => {
  msgEl.style.display = "none";
  timer.style.display = "none";

  prDescription.value = ""; // Clear previous commit title
  loader.style.display = "flex";

  vscode.postMessage({
    command: "generatePR",
  });
});

// Handle "createPRBtn" button click
document.getElementById("createPRBtn").addEventListener("click", () => {
    vscode.postMessage({
        command: "createPR",
        prTitle : commitTitle.value,
        prBody : prDescription.value,
        baseBranch : baseBranch.value
    });
});

// Handle messages from extension backend
window.addEventListener("message", (event) => {
  const message = event.data;

  switch (message.command) {
    case "commitResult":
      loader.style.display = "none";
      commitTitle.value = message.result.aiMessage;
      timerText.innerHTML = message.result.duration;
      timer.style.display = "flex";
      break;
      
    case "prResult":
      loader.style.display = "none";
      prDescription.value = message.result.aiMessage;
      timerText.innerHTML = message.result.duration;
      timer.style.display = "flex";
      break;

    case "commitSuccess":
      loader.style.display = "none";
      commitSection.style.display = "none";
      prSection.style.display = "grid";
      showMessage(message.text);
      break;

    case "branches":
      baseBranch.innerHTML = ""; // Clear existing options
      message.data.forEach(branch => {
        const opt = document.createElement("option");
        opt.value = branch;
        opt.textContent = branch;
        baseBranch.appendChild(opt);
      });
      break;

    case "info":
      loader.style.display = "none";
      showMessage(message.text);
      break;

    default:
      console.warn("Unhandled message:", message);
  }
});

// Trigger fetch on load
window.onload = () => {
  vscode.postMessage({ command: "getBranches" });
};