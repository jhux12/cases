// Store prizes for each spinner instance
const spinnerPrizesMap = {};
const targetIndex = 15;

// Exported so other modules (like box battles) can reuse the same color map
export function getRarityColor(rarity) {
  const base = rarity?.toLowerCase().replace(/\s+/g, '');
  switch (base) {
    case 'legendary': return '#facc15';
    case 'ultrarare': return '#e879f9';
    case 'rare': return '#3b82f6';
    case 'uncommon': return '#22c55e';
    default: return '#9ca3af';
  }
}

export function getTopPrizes(prizeList, count = 30) {
  return [...prizeList]
    .sort((a, b) => (b.value || 0) - (a.value || 0))
    .slice(0, count);
}

export function renderSpinner(prizes, winningPrize = null, isPreview = false, id = 0) {
  const container = document.getElementById(`spinner-container-${id}`);
  if (!container) return console.warn("🚫 Spinner container not found");

  container.innerHTML = "";
  // remove any placeholder classes used before the battle starts
  container.className = "w-full h-full";

  const borderEl = document.getElementById(`spinner-border-${id}`);
  if (borderEl) borderEl.style.borderColor = "#1f2937";

  const spinnerWheel = document.createElement("div");
  spinnerWheel.id = `spinner-wheel-${id}`;
  spinnerWheel.className = "reel flex h-full items-center";

  if (isPreview) {
    spinnerWheel.classList.add("animate-scroll-preview");
  }

  container.appendChild(spinnerWheel);
  spinnerPrizesMap[id] = [];

  const shuffled = [...prizes];

  for (let i = 0; i < 30; i++) {
    let prize = isPreview || !winningPrize
      ? shuffled[i % shuffled.length]
      : (i === targetIndex ? winningPrize : shuffled[Math.floor(Math.random() * shuffled.length)]);

    if (!prize || typeof prize !== 'object' || !prize.image || !prize.name) {
      prize = {
        name: "Mystery",
        image: "https://via.placeholder.com/80?text=?",
        value: 0,
        rarity: "common"
      };
    }

    spinnerPrizesMap[id].push(prize);

    const div = document.createElement("div");
    const rarity = (prize.rarity || 'common').toLowerCase().replace(/\s+/g, '');
    const borderColor = getRarityColor(rarity);

    const glowClass = `glow-${rarity}`;
    div.className = `min-w-[140px] h-[160px] mx-1 flex items-center justify-center rounded-xl bg-transparent shadow-md item border-2 ${glowClass}`;
    div.style.borderColor = borderColor;
    div.setAttribute("data-index", i);
    div.innerHTML = `
      <div class="flex flex-col items-center">
        <img src="${prize.image}" class="h-[100px] object-contain drop-shadow-md rounded-xl" />
        <div class="mt-1 text-xs text-white bg-black/50 px-2 py-0.5 rounded-sm flex items-center gap-1">
          <span>${prize.value.toLocaleString()}</span>
          <img src="https://cdn-icons-png.flaticon.com/128/6369/6369589.png" class="w-3 h-3" alt="coin" />
        </div>
      </div>
    `;
    spinnerWheel.appendChild(div);
  }
}

// Spin the reel to land the pre-rendered winning prize.
// durationSec ensures multiple spinners can start/stop together.
export function spinToPrize(callback, showPopup = true, id = 0, durationSec = 5) {
  const spinnerWheel = document.getElementById(`spinner-wheel-${id}`);
  if (!spinnerWheel) return Promise.resolve();

  spinnerWheel.classList.remove("animate-scroll-preview");

  // Reset any previous transform before measuring
  spinnerWheel.style.transition = 'none';
  spinnerWheel.style.transform = 'translate3d(0,0,0)';
  void spinnerWheel.offsetWidth; // Force reflow

  const cards = spinnerWheel.querySelectorAll(".item");
  const targetCard = cards[targetIndex];
  if (!targetCard) return Promise.resolve();

  const containerEl = spinnerWheel.parentElement;
  const cardCenter = targetCard.offsetLeft + targetCard.offsetWidth / 2;
  const containerCenter = containerEl.clientWidth / 2;
  const finalOffset = cardCenter - containerCenter;

  const spinDuration = durationSec; // uniform spin length for synchronized reels
  requestAnimationFrame(() => {
    spinnerWheel.style.willChange = 'transform';
    spinnerWheel.style.transition = `transform ${spinDuration}s cubic-bezier(0.33, 1, 0.68, 1)`;
    spinnerWheel.style.transform = `translate3d(-${finalOffset}px,0,0)`;
  });

  let tracker;

  function trackCenterPrize() {
    const cards = spinnerWheel.querySelectorAll(".item");
    const containerRect = spinnerWheel.parentElement.getBoundingClientRect();
    const centerX = containerRect.left + containerRect.width / 2;
    let closestCard = null;
    let minDistance = Infinity;

    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.left + rect.width / 2;
      const distance = Math.abs(centerX - cardCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestCard = card;
      }
    });

    if (closestCard) {
      const indexAttr = parseInt(closestCard.getAttribute("data-index"), 10);
      const prize = spinnerPrizesMap[id][indexAttr];
      const rarity = (prize?.rarity || "common").toLowerCase().replace(/\s+/g, '');
      const color = getRarityColor(rarity);

      const borderEl = document.getElementById(`spinner-border-${id}`);
      if (borderEl) borderEl.style.borderColor = color;
    }
  }

  trackCenterPrize();
  tracker = setInterval(trackCenterPrize, 100);

  return new Promise(resolve => {
  function onTransitionEnd() {
      clearInterval(tracker);
      spinnerWheel.style.willChange = '';
      spinnerWheel.style.transition = 'none';

    // Final landing: award the prize
    const prize = spinnerPrizesMap[id][targetIndex];
    const rarity = (prize.rarity || 'common').toLowerCase().replace(/\s+/g, '');

    const spinnerResultText = document.getElementById("spinner-result");
    if (spinnerResultText) {
      spinnerResultText.textContent = `You won: ${prize.name}!`;
      spinnerResultText.classList.remove("hidden");
    }

    if (showPopup) {
      document.getElementById("popup-image").src = prize.image;
      document.getElementById("popup-name").textContent = prize.name;
      document.getElementById("popup-value").textContent = prize.value;
      document.getElementById("sell-value").textContent = Math.floor(prize.value * 0.8);
      document.getElementById("win-popup").classList.remove("hidden");
    } else {
      const popup = document.getElementById("win-popup");
      if (popup) popup.classList.add("hidden");
    }

    if (targetCard) {
      const glowClass = `glow-${rarity}`;
      const flashClass = `glow-flash-${rarity}`;
      targetCard.classList.add(glowClass, flashClass, "ring-4", "ring-white");
    }

    if (callback) callback(prize);
    resolve(prize);
    spinnerWheel.removeEventListener('transitionend', onTransitionEnd);
  }

    spinnerWheel.addEventListener('transitionend', onTransitionEnd);
  });
}

export function showWinPopup(prize) {
  document.getElementById("popup-image").src = prize.image;
  document.getElementById("popup-name").textContent = prize.name;
  document.getElementById("popup-value").textContent = prize.value;
  document.getElementById("sell-value").textContent = Math.floor(prize.value * 0.8);
  document.getElementById("win-popup").classList.remove("hidden");
}
