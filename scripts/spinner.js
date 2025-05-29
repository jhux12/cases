// spinner.js

let spinnerPrizes = [];
const targetIndex = 15;

function getRarityColor(rarity) {
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

export function renderSpinner(prizes, winningPrize = null, isPreview = false) {
  const container = document.getElementById("spinner-container");
  if (!container) return console.warn("🚫 Spinner container not found");

  container.innerHTML = "";

  const spinnerWheel = document.createElement("div");
  spinnerWheel.id = "spinner-wheel";
  spinnerWheel.className = "flex h-full items-center";
  if (isPreview) {
    spinnerWheel.classList.add("animate-scroll-preview");
  } else {
    spinnerWheel.classList.add("transition-transform", "duration-[4000ms]", "ease-[cubic-bezier(0.17,0.67,0.12,0.99)]");
  }

  container.appendChild(spinnerWheel);

  spinnerPrizes = [];

  const shuffled = [...prizes];

  for (let i = 0; i < 30; i++) {
    let prize;
    if (isPreview || !winningPrize) {
      prize = shuffled[i % shuffled.length];
    } else {
      prize = i === targetIndex ? winningPrize : shuffled[Math.floor(Math.random() * shuffled.length)];
    }

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

    div.className = "min-w-[160px] mx-2 h-[180px] flex flex-col items-center justify-center text-white rounded-xl bg-black/30 shadow-md item border-2";
    div.style.borderColor = borderColor;
    div.setAttribute("data-index", i);

    div.innerHTML = `
      <img src="${prize.image}" class="h-20 object-contain mb-2 drop-shadow-md" />
      <div class="font-bold text-sm text-center leading-tight">${prize.name}</div>
      <div class="text-xs text-gray-400">${prize.value || ''}</div>
    `;

    spinnerWheel.appendChild(div);
  }
}

export function spinToPrize() {
  const spinnerWheel = document.getElementById("spinner-wheel");
  if (!spinnerWheel) return;
  spinnerWheel.classList.remove("animate-scroll-preview");
  const cards = spinnerWheel.querySelectorAll(".item");
  const targetCard = cards[targetIndex];
  if (!targetCard) return;

  const targetRect = targetCard.getBoundingClientRect();
  const cardCenter = targetRect.left + targetRect.width / 2;
  const containerCenter = window.innerWidth / 2;
  const scrollOffset = cardCenter - containerCenter;

  spinnerWheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
  spinnerWheel.style.transform = `translateX(-${scrollOffset}px)`;

  const rarityInfo = document.getElementById("rarity-info");
  if (rarityInfo) rarityInfo.classList.remove("hidden");

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
      if (bar) bar.style.backgroundColor = color;
    }

    animationFrame = requestAnimationFrame(trackCenterPrize);
  }

  trackCenterPrize();

  setTimeout(() => {
    cancelAnimationFrame(animationFrame);

    const prize = spinnerPrizes[targetIndex] || {
      name: "Mystery Card",
      image: "https://via.placeholder.com/100?text=?",
      value: 0,
      rarity: "common"
    };

    if (targetCard) {
      const glowClass = `glow-${(prize.rarity || 'common').toLowerCase().replace(/\s+/g, '-')}`;
      targetCard.classList.add(glowClass, "ring-4", "ring-white");
    }

    // 🎉 Show animated popup
    const popup = document.createElement("div");
    popup.id = "prize-popup";
    popup.className = "fixed inset-0 bg-black/80 flex items-center justify-center z-50";

    popup.innerHTML = `
      <div class="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-purple-600 rounded-2xl p-6 text-white text-center w-80 shadow-2xl scale-90 animate-[zoomIn_0.3s_ease-out_forwards]">
        <img src="${prize.image}" alt="${prize.name}" class="w-32 h-32 mx-auto mb-4 drop-shadow-lg rounded-lg" />
        <h2 class="text-xl font-bold mb-2">${prize.name}</h2>
        <div class="flex items-center justify-center text-yellow-300 font-semibold text-lg gap-2 mb-4">
          <img src="https://cdn-icons-png.flaticon.com/128/6369/6369589.png" class="w-5 h-5" />
          ${prize.value || 0}
        </div>
        <button id="close-popup" class="mt-2 bg-pink-600 px-4 py-2 rounded-full text-white font-semibold hover:bg-pink-700 transition">
          Add to Inventory
        </button>
      </div>
    `;

    document.body.appendChild(popup);

    document.getElementById("close-popup").addEventListener("click", () => {
      popup.remove();
    });
  }, 4000);
}

