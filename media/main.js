const vscode = acquireVsCodeApi();
const loader = document.getElementById("loader");
const timer = document.getElementById("timer");
const timerText = document.getElementById("timer-text");
const commitTitle = document.getElementById("commitTitle");
const prDescription = document.getElementById("prDescription");
const ticketError = document.getElementById("ticketError");
const msgEl = document.getElementById("errorMessage");
const baseBranch = document.getElementById("baseBranch");
const generateBtn = document.getElementById("generateBtn");
const commitBtn = document.getElementById("commitBtn");
const createPRBtn = document.getElementById("createPRBtn");

function showMessage(text) {
    msgEl.textContent = text;
    msgEl.style.display = "block";
}

generateBtn.addEventListener("click", () => {
    msgEl.style.display = "none";
    timer.style.display = "none";
    const type = document.getElementById("type").value;
    const ticket = document.getElementById("ticket").value;

    // Validate ticket
    if (!ticket) {
        ticketError.style.display = "block";
        return;
    } else {
        ticketError.style.display = "none";
    }

    commitTitle.value = ""; // Clear old commitTitle
    prDescription.value = ""; // Clear old prDescription
    loader.style.display = "flex";

    vscode.postMessage({
        command: "generate",
        type,
        ticket
    });
});

commitBtn.addEventListener("click", () => {
    const msg = commitTitle.value;
    vscode.postMessage({
        command: "commit",
        message: msg
    });
});

createPRBtn.addEventListener("click", () => {
    vscode.postMessage({
        command: "createPR",
        prTitle : commitTitle.value,
        prBody : prDescription.value,
        baseBranch : baseBranch.value
    });
});

window.addEventListener("message", (event) => {
    const message = event.data;

    if (message.command === "commitResult") {
        loader.style.display = "none";
        commitTitle.value = message.result.aiMessage.title;
        prDescription.value = message.result.aiMessage.description;
        timerText.innerHTML = message.result.duration;
        timer.style.display = "flex";
    } else if (message.command === "info") {
        loader.style.display = "none";
        if(message.success) {
            document.getElementById("ouput-section").style.display = "none";
        }
        showMessage(message.text);
    }

    if (message.command === "branches") {
        const select = document.getElementById("baseBranch");
        select.innerHTML = ""; // Clear existing options

        message.data.forEach(branch => {
            const opt = document.createElement("option");
            opt.value = branch;
            opt.textContent = branch;
            select.appendChild(opt);
        });
    }
});

// Trigger fetch on load
window.onload = () => {
  vscode.postMessage({ command: "getBranches" });
};
