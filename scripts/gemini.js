import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getVertexAI, getGenerativeModel } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-vertexai-preview.js";

const firebaseConfig = {
  apiKey: "AIzaSyCyRm6dWH8b_BZ0oImEBPW_T3sF14Tz8dE",
  authDomain: "cases-e5b4e.firebaseapp.com",
  databaseURL: "https://cases-e5b4e-default-rtdb.firebaseio.com",
  projectId: "cases-e5b4e",
  storageBucket: "cases-e5b4e.appspot.com",
  messagingSenderId: "1094023497986",
  appId: "1:1094023497986:web:59e018f1aa5e8c4093d7a5"
};

function extractText(result) {
  if (!result) return "";
  if (typeof result.text === "function") {
    const text = result.text();
    if (text) return text;
  }

  const response = result.response || result;
  if (typeof response?.text === "function") {
    const text = response.text();
    if (text) return text;
  }

  const candidates = response?.candidates || result.candidates || [];
  const parts = candidates
    .flatMap((candidate) => candidate.content?.parts || candidate.parts || [])
    .map((part) => part.text)
    .filter(Boolean);
  return parts.join("\n\n");
}

function setupGeminiUI(model) {
  const promptInput = document.getElementById("gemini-prompt");
  const runButton = document.getElementById("gemini-run");
  const statusLabel = document.getElementById("gemini-status");
  const output = document.getElementById("gemini-output");

  if (!promptInput || !runButton || !statusLabel || !output) {
    return;
  }

  const setBusy = (busy) => {
    runButton.disabled = busy;
    runButton.setAttribute("aria-busy", busy ? "true" : "false");
    runButton.classList.toggle("opacity-60", busy);
    runButton.classList.toggle("cursor-not-allowed", busy);
  };

  runButton.addEventListener("click", async () => {
    const prompt = promptInput.value.trim();
    if (!prompt) {
      statusLabel.textContent = "Enter a prompt to ask Gemini.";
      promptInput.focus();
      return;
    }

    setBusy(true);
    statusLabel.textContent = "Contacting Gemini...";
    output.textContent = "";

    try {
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ]
      });

      const text = extractText(result);
      output.textContent = text || "Gemini did not return any content. Try another question.";
      statusLabel.textContent = "Gemini responded just now.";
    } catch (error) {
      console.error("Failed to fetch Gemini response", error);
      statusLabel.textContent = "Unable to reach Gemini. Please try again.";
      output.textContent = error.message || "Unknown error occurred.";
    } finally {
      setBusy(false);
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const promptInput = document.getElementById("gemini-prompt");
  if (!promptInput) {
    return;
  }

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const vertexAI = getVertexAI(app);
  const model = getGenerativeModel(vertexAI, {
    model: "gemini-1.5-flash"
  });

  setupGeminiUI(model);
});
