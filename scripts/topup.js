document.addEventListener("DOMContentLoaded", () => {
  const loadTopupPopup = async () => {
    if (document.getElementById("topup-popup")) return;

    try {
      const res = await fetch("/components/topup.html");
      const html = await res.text();
      document.body.insertAdjacentHTML("beforeend", html);

      document.getElementById("close-topup")?.addEventListener("click", () => {
        document.getElementById("topup-popup").classList.add("hidden");
      });
    } catch (err) {
      console.error("Failed to load topup popup:", err);
    }
  };

  const showTopupPopup = async () => {
    await loadTopupPopup();
    document.getElementById("topup-popup")?.classList.remove("hidden");
  };

  document.addEventListener("click", (e) => {
    if (e.target.closest("#topup-button") || e.target.closest("#topup-button-mobile")) {
      e.preventDefault();
      showTopupPopup();
    }
  });
});
