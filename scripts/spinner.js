let spinnerPrizes = [];
const targetIndex = 15;

function getRarityColor(rarity) {
  const base = rarity?.toLowerCase().replace(/\s+/g, '');
  switch (base) {
    case 'legendary': return '#facc15'; // yellow
    case 'ultrarare': return '#c084fc'; // purple
    case 'rare': return '#60a5fa';      // blue
    case 'uncommon': return '#4ade80';  // green
    default: return '#a1a1aa';          // gray
  }
}

export function renderSpinner(prizes, winningPrize) {
  const container = document.getElementById("spinner-container");
  if (!container) return console.warn("🚫 Spinner container not found");

  const old = document.getElementById("spinner-wrapper");
  if (old) old.remove();

  // Inject full spinner + rarity bar structure
  container.innerHTML = `
    <div id="spinner-wrapper">
      <div class="relative overflow-hidden w-full h-[200px]">
        <div id="spinner-wheel" class="flex h-full items-center transition-transform duration-[4000ms] ease-[cubic-bezier(0.17,0.67,0.12,0.99)]"></div>
        <div class="absolute top-0 bottom-0 w-[4px] bg-pink-500 left-1/2 transform -translate-x-1/2 z-10 rounded-full shadow-lg"></div>
      </div>
    </div>
    <div class="mt-2 text-center text-sm font-semibold text-white" id="rarity-label">Current: COMMON</div>
  <div id="rarity-indicator" style="height: 12px; margin-top: 12px; background: #1f2937; border: 1px solid #ffffff22; border-radius: 9999px; overflow: hidden;">
  <div id="rarity-bar" style="height: 100%; width: 100%; background: #ef4444; transition: background-color 0.3s ease-in-out;"></div>
</div>
  `;

  const spinnerWheel = document.getElementById("spinner-wheel");
  spinnerPrizes = [];

  const shuffled = [...prizes];
  for (let i = 0; i < 30; i++) {
    let prize = i === targetIndex ? winningPrize : shuffled[Math.floor(Math.random() * shuffled.length)];

    if (!prize || typeof prize !== 'object' || !prize.image || !prize.name) {
      prize = {
        name: "Mystery",
        image: "https://via.placeholder.com/80?text=?",
        value: 0,
        rarity: "common"
      };
    }

    spinnerPrizes.push(prize);

    const div = document.createElement("div");
    const rarity = (prize.rarity || 'common').toLowerCase().replace(/\s+/g, '');
    const borderColor = getRarityColor(rarity);

    div.className = `min-w-[160px] mx-2 h-[180px] flex flex-col items-center justify-center text-white rounded-xl bg-black/30 shadow-md item border-2`;
    div.style.borderColor = borderColor;
    div.setAttribute("data-index", i); // Track prize index

    div.innerHTML = `
      <img src="${prize.image}" class="h-20 object-contain mb-2 drop-shadow-md" />
      <div class="font-bold text-sm text-center leading-tight">${prize.name}</div>
      <div class="text-xs text-gray-400">${prize.value || ''}</div>
    `;
    spinnerWheel.appendChild(div);
  }

  console.log("✅ Spinner rendered with", spinnerPrizes.length, "prizes");
}

export function spinToPrize() {
  const spinnerWheel = document.getElementById("spinner-wheel");
  if (!spinnerWheel) return;

  const cards = spinnerWheel.querySelectorAll(".item");
  const targetCard = cards[targetIndex];
  if (!targetCard) return;

  const targetRect = targetCard.getBoundingClientRect();
  const cardCenter = targetRect.left + targetRect.width / 2;
  const containerCenter = window.innerWidth / 2;
  const scrollOffset = cardCenter - containerCenter;

  spinnerWheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
  spinnerWheel.style.transform = `translateX(-${scrollOffset}px)`;

  // 🔄 Track prize at center
  let animationFrame;
  function trackCenterPrize() {
    const cards = spinnerWheel.querySelectorAll(".item");
    const centerX = window.innerWidth / 2;
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
      const indexAttr = closestCard.getAttribute("data-index");
      const prize = spinnerPrizes[indexAttr];
      const rarity = (prize?.rarity || "common").toLowerCase().replace(/\s+/g, '');
      const color = getRarityColor(rarity);

      const bar = document.getElementById("rarity-bar");
      const label = document.getElementById("rarity-label");
      if (bar) bar.style.backgroundColor = color;
      if (label) label.textContent = `Current: ${rarity.toUpperCase()}`;
    }

    animationFrame = requestAnimationFrame(trackCenterPrize);
  }

  trackCenterPrize();

  // After spin finishes
  setTimeout(() => {
    cancelAnimationFrame(animationFrame);

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

