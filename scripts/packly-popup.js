(() => {
  if (window.showPacklyPopup) return;

  const VARIANTS = {
    info: {
      label: "Heads up",
      accent: "#6366f1",
      icon: "\u2139\ufe0f"
    },
    success: {
      label: "Success",
      accent: "#22c55e",
      icon: "\u2705"
    },
    warning: {
      label: "Check this",
      accent: "#f59e0b",
      icon: "\u26a0\ufe0f"
    },
    error: {
      label: "Something went wrong",
      accent: "#ef4444",
      icon: "\u274c"
    }
  };

  const style = document.createElement("style");
  style.id = "packly-popup-style";
  style.textContent = `
    :root {
      --packly-card-bg: var(--card-surface, #ffffff);
      --packly-card-text: var(--text-primary, #0f172a);
      --packly-muted: var(--text-muted, #475569);
      --packly-border: var(--card-border, #e2e8f0);
      --packly-overlay: rgba(15, 23, 42, 0.45);
    }
    body.dark-mode {
      --packly-card-bg: #0f172a;
      --packly-card-text: #e2e8f0;
      --packly-muted: #cbd5e1;
      --packly-border: #1f2937;
      --packly-overlay: rgba(0, 0, 0, 0.65);
    }
    #packly-popup-overlay {
      position: fixed;
      inset: 0;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 1.25rem;
      background: var(--packly-overlay);
      backdrop-filter: blur(8px);
      z-index: 9998;
    }
    #packly-popup-overlay.active { display: flex; }
    #packly-popup-card {
      width: min(520px, 90vw);
      background: var(--packly-card-bg);
      color: var(--packly-card-text);
      border-radius: 20px;
      border: 1px solid var(--packly-border);
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.22), 0 0 0 1px rgba(99, 102, 241, 0.06);
      padding: 1.25rem 1.5rem 1.35rem;
      position: relative;
      overflow: hidden;
      transform: translateY(8px) scale(0.98);
      opacity: 0;
      transition: opacity 160ms ease, transform 180ms ease;
    }
    #packly-popup-overlay.active #packly-popup-card {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    #packly-popup-accent {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.18), rgba(14, 165, 233, 0.18));
      opacity: 0.75;
      filter: blur(42px);
      z-index: 0;
      pointer-events: none;
    }
    #packly-popup-card .content {
      position: relative;
      z-index: 1;
      display: flex;
      gap: 0.85rem;
      align-items: flex-start;
    }
    #packly-popup-icon {
      flex-shrink: 0;
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: grid;
      place-items: center;
      font-size: 1.2rem;
      font-weight: 700;
      background: rgba(99, 102, 241, 0.14);
      color: #1e1b4b;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.6);
    }
    body.dark-mode #packly-popup-icon {
      color: #e0e7ff;
      background: rgba(99, 102, 241, 0.2);
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
    }
    #packly-popup-title {
      font-size: 1rem;
      font-weight: 700;
      margin: 0;
      color: var(--packly-card-text);
    }
    #packly-popup-message {
      margin: 0.15rem 0 0.65rem;
      color: var(--packly-muted);
      line-height: 1.6;
      font-size: 0.95rem;
      white-space: pre-line;
    }
    #packly-popup-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.6rem;
    }
    #packly-popup-close {
      border: 1px solid var(--packly-border);
      background: rgba(255, 255, 255, 0.8);
      color: var(--packly-card-text);
      padding: 0.55rem 1.1rem;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 120ms ease, box-shadow 120ms ease;
    }
    #packly-popup-confirm {
      border: none;
      background: linear-gradient(120deg, #3b82f6, #8b5cf6);
      color: #fff;
      padding: 0.55rem 1.2rem;
      border-radius: 12px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 14px 30px rgba(99, 102, 241, 0.3);
      transition: transform 120ms ease, box-shadow 120ms ease;
    }
    #packly-popup-close:hover, #packly-popup-confirm:hover { transform: translateY(-1px) scale(1.01); }
    #packly-popup-close:active, #packly-popup-confirm:active { transform: translateY(0) scale(0.99); }
    #packly-popup-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.25rem 0.55rem;
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 700;
      background: rgba(99, 102, 241, 0.12);
      color: #312e81;
      border: 1px solid rgba(99, 102, 241, 0.28);
    }
    body.dark-mode #packly-popup-badge {
      color: #e0e7ff;
      background: rgba(99, 102, 241, 0.2);
      border-color: rgba(255, 255, 255, 0.08);
    }
  `;
  document.head.appendChild(style);

  let overlay;
  let messageEl;
  let titleEl;
  let badgeEl;
  let iconEl;
  let confirmBtn;
  let hidePopup;
  let pendingResolve = null;
  let currentMode = "alert";

  const ensureElements = () => {
    if (overlay) return;
    overlay = document.createElement("div");
    overlay.id = "packly-popup-overlay";
    overlay.innerHTML = `
      <div id="packly-popup-card" role="alertdialog" aria-modal="true">
        <div id="packly-popup-accent"></div>
        <div class="content">
          <div id="packly-popup-icon"></div>
          <div class="copy">
            <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
              <span id="packly-popup-badge"></span>
              <p id="packly-popup-title"></p>
            </div>
            <p id="packly-popup-message"></p>
            <div id="packly-popup-actions">
              <button id="packly-popup-close" type="button">Dismiss</button>
              <button id="packly-popup-confirm" type="button">Got it</button>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    messageEl = overlay.querySelector("#packly-popup-message");
    titleEl = overlay.querySelector("#packly-popup-title");
    badgeEl = overlay.querySelector("#packly-popup-badge");
    iconEl = overlay.querySelector("#packly-popup-icon");
    confirmBtn = overlay.querySelector("#packly-popup-confirm");
    const closeBtn = overlay.querySelector("#packly-popup-close");

    hidePopup = (result = false) => {
      overlay.classList.remove("active");
      if (pendingResolve) {
        pendingResolve(result);
        pendingResolve = null;
      }
    };

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) hidePopup(currentMode === "confirm" ? false : true);
    });
    closeBtn.addEventListener("click", () => hidePopup(false));
    confirmBtn.addEventListener("click", () => hidePopup(true));
    document.addEventListener("keydown", (e) => {
      if (overlay.classList.contains("active") && e.key === "Escape") hidePopup(false);
    });
  };

  const resolveVariant = (message = "", explicit) => {
    if (explicit && VARIANTS[explicit]) return explicit;
    const normalized = message.toLowerCase();
    if (normalized.includes("error") || normalized.includes("fail") || message.includes("❌")) return "error";
    if (normalized.includes("success") || normalized.includes("complete") || message.includes("✅")) return "success";
    if (normalized.includes("warning") || normalized.includes("caution")) return "warning";
    return "info";
  };

  const showPacklyPopup = (message, options = {}) => {
    ensureElements();
    if (overlay.classList.contains("active")) {
      hidePopup(false);
    }
    const { title = "", variant, dismissText, confirmText, mode = "alert" } = options;
    const resolved = resolveVariant(String(message || ""), variant);
    const { label, accent, icon } = VARIANTS[resolved];

    currentMode = mode === "confirm" ? "confirm" : "alert";
    const finalDismissText = dismissText || (currentMode === "confirm" ? "Cancel" : "Dismiss");
    const finalConfirmText = confirmText || (currentMode === "confirm" ? "Confirm" : "Got it");

    badgeEl.textContent = label;
    badgeEl.style.background = `${accent}1f`;
    badgeEl.style.borderColor = `${accent}33`;
    badgeEl.style.color = resolved === "success" ? "#0f2e1a" : "#0f172a";
    if (document.body.classList.contains("dark-mode")) {
      badgeEl.style.color = "#e0e7ff";
    }

    titleEl.textContent = title || "Packly.gg notification";
    messageEl.textContent = message || "";
    iconEl.textContent = icon;
    iconEl.style.boxShadow = `inset 0 0 0 1px ${accent}33`;
    iconEl.style.background = `${accent}22`;
    confirmBtn.style.background = `linear-gradient(120deg, ${accent}, #3b82f6)`;
    confirmBtn.textContent = finalConfirmText;
    overlay.querySelector("#packly-popup-close").textContent = finalDismissText;

    return new Promise((resolve) => {
      pendingResolve = resolve;
      overlay.classList.add("active");
      confirmBtn.focus({ preventScroll: true });
    });
  };

  window.showPacklyPopup = showPacklyPopup;
  window.showPacklyConfirm = (message, options = {}) => showPacklyPopup(message, { ...options, mode: "confirm" });

  window.alert = (message) => {
    showPacklyPopup(message);
  };
})();
