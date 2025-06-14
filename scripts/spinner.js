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
} else if (i === targetIndex) {
  prize = winningPrize;
} else if (i === targetIndex - 1 && Math.random() < 0.3) { // 30% chance of near-miss
  const highValuePrize = prizeList.find(p => 
    p.rarity?.toLowerCase().includes("ultra") || 
    p.rarity?.toLowerCase().includes("legendary")
  );
  prize = highValuePrize || shuffled[Math.floor(Math.random() * shuffled.length)];
} else {
  prize = shuffled[Math.floor(Math.random() * shuffled.length)];
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

    div.className = "min-w-[140px] h-[160px] mx-1 flex items-center justify-center rounded-xl bg-transparent shadow-md item border-2";
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

export function spinToPrize(callback) {
  const spinnerWheel = document.getElementById("spinner-wheel");
  if (!spinnerWheel) return;

  spinnerWheel.classList.remove("animate-scroll-preview");

  const cards = spinnerWheel.querySelectorAll(".item");
  const targetCard = cards[targetIndex];
  if (!targetCard) return;

  const targetRect = targetCard.getBoundingClientRect();
  const cardCenter = targetRect.left + targetRect.width / 2;
  const containerCenter = window.innerWidth / 2;
  const suspenseRange = 70;
  const randomOffset = Math.floor(Math.random() * (suspenseRange * 2 + 1)) - suspenseRange;
  const scrollOffset = cardCenter - containerCenter + randomOffset;

  spinnerWheel.style.transition = 'transform 8s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
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

  spinnerWheel.addEventListener("transitionend", () => {
    cancelAnimationFrame(animationFrame);

    // Flash the near-miss card before final stop
const nearMissCard = spinnerWheel.querySelector(`.item[data-index="${targetIndex - 1}"]`)
  || spinnerWheel.querySelector(`.item[data-index="${targetIndex + 1}"]`);
if (nearMissCard) {
  nearMissCard.classList.add("near-miss-flash");
}

    const prize = spinnerPrizes[targetIndex];
    const rarity = (prize.rarity || 'common').toLowerCase().replace(/\s+/g, '');

    const soundMap = {
      common: document.getElementById("sound-common"),
      uncommon: document.getElementById("sound-rare"),
      rare: document.getElementById("sound-rare"),
      ultrarare: document.getElementById("sound-ultrarare"),
      legendary: document.getElementById("sound-legendary"),
    };
    const sound = soundMap[rarity];
    if (sound) sound.play();

    const spinnerResultText = document.getElementById("spinner-result");
    if (spinnerResultText) {
      spinnerResultText.textContent = `You won: ${prize.name}!`;
      spinnerResultText.classList.remove("hidden");
    }

    document.getElementById("popup-image").src = prize.image;
    document.getElementById("popup-name").textContent = prize.name;
    document.getElementById("popup-value").textContent = prize.value;
    document.getElementById("sell-value").textContent = Math.floor(prize.value * 0.8);
    document.getElementById("win-popup").classList.remove("hidden");

    if (targetCard) {
      const glowClass = `glow-${rarity}`;
      targetCard.classList.add(glowClass, "ring-4", "ring-white");
    }

    if (callback) callback(prize);
  }, { once: true });
}

export function showWinPopup(prize) {
  document.getElementById("popup-image").src = prize.image;
  document.getElementById("popup-name").textContent = prize.name;
  document.getElementById("popup-value").textContent = prize.value;
  document.getElementById("sell-value").textContent = Math.floor(prize.value * 0.8);
  document.getElementById("win-popup").classList.remove("hidden");
}
