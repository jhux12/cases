let spinnerPrizes = [];
const targetIndex = 15;

function getRarityColor(rarity) {
  const base = rarity?.toLowerCase().replace(/\s+/g, '');
  switch (base) {
    case 'legendary': return '#facc15';
    case 'ultrarare': return '#c084fc';
    case 'rare': return '#60a5fa';
    case 'uncommon': return '#4ade80';
    default: return '#a1a1aa';
  }
}

export function renderSpinner(prizes, winningPrize) {
  const container = document.getElementById("spinner-container");
  if (!container) return console.warn("🚫 Spinner container not found");

  // TEMP: Replace with visual debug box
  container.innerHTML = `
    <div id="spinner-wrapper" style="border: 2px solid red; padding: 10px; color: white;">
      LOADING SPINNER...
    </div>
  `;

  console.log("✅ renderSpinner() ran. Prizes:", prizes);
  console.log("✅ Winning prize:", winningPrize);
}

export function spinToPrize() {
  const spinnerWheel = document.getElementById("spinner-wheel");
  console.log("📦 spinnerWheel found?", spinnerWheel);

  if (!spinnerWheel) {
    console.warn("⚠️ spinnerWheel is missing from DOM!");
    return;
  }

  const cards = spinnerWheel.querySelectorAll(".item");
  const targetCard = cards[targetIndex];
  if (!targetCard) {
    console.warn("❌ targetCard at index", targetIndex, "not found.");
    return;
  }

  const targetRect = targetCard.getBoundingClientRect();
  console.log("📐 Target card position:", targetRect);

  if (!targetRect.width || targetRect.width < 50) {
    console.warn("🛑 Layout not ready, skipping spin.");
    return;
  }

  // TEMP: Disable movement to confirm if spinner stays
  spinnerWheel.style.transition = 'transform 4s ease-in-out';
  spinnerWheel.style.transform = 'translateX(0px)';

  // Glow + win text
  setTimeout(() => {
    const prize = spinnerPrizes[targetIndex];
    const spinnerResultText = document.getElementById("spinner-result");
    if (spinnerResultText) {
      spinnerResultText.textContent = `You won: ${prize.name}!`;
      spinnerResultText.classList.remove("hidden");
    }

    if (targetCard) {
      const glowClass = `glow-${(prize.rarity || 'common').toLowerCase().replace(/\s+/g, '-')}`;
      targetCard.classList.add(glowClass, "ring-4", "ring-white");
    }
  }, 4000);
}
