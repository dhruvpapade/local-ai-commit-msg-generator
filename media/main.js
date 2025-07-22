const vscode = acquireVsCodeApi();
const loader = document.getElementById("loader");
const timer = document.getElementById("timer");
const timerText = document.getElementById("timer-text");
const commitTitle = document.getElementById("commitTitle");
const prDescription = document.getElementById("prDescription");
const ticketError = document.getElementById("ticketError");
const msgEl = document.getElementById("errorMessage");
const generateBtn = document.getElementById("generateBtn");
const commitBtn = document.getElementById("commitBtn");

function showMessage(text) {

    msgEl.textContent = text;
    msgEl.style.display = "block";

    setTimeout(() => {
        msgEl.style.display = "none";
    }, 10000);
}

document.getElementById("generateBtn").addEventListener("click", () => {
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

document.getElementById("commitBtn").addEventListener("click", () => {
    const msg = commitTitle.value;
    vscode.postMessage({
        command: "commit",
        message: msg
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
        generateBtn.disabled = false;
        commitBtn.disabled = false;
    } else if (message.command === "info") {
        loader.style.display = "none";
        showMessage(message.text);
    }
});

