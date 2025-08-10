// Store prizes for each spinner instance
const spinnerPrizesMap = {};
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

export function renderSpinner(prizes, winningPrize = null, isPreview = false, id = 0) {
  const container = document.getElementById(`spinner-container-${id}`);
  if (!container) return console.warn("🚫 Spinner container not found");

  container.innerHTML = "";

  const borderEl = document.getElementById(`spinner-border-${id}`);
  if (borderEl) borderEl.style.borderColor = "#1f2937";

  const spinnerWheel = document.createElement("div");
  spinnerWheel.id = `spinner-wheel-${id}`;
  spinnerWheel.className = "flex h-full items-center";

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

export function spinToPrize(callback, showPopup = true, id = 0) {
  const spinnerWheel = document.getElementById(`spinner-wheel-${id}`);
  if (!spinnerWheel) return;

  spinnerWheel.classList.remove("animate-scroll-preview");

  // Reset any previous transform before measuring
  spinnerWheel.style.transition = 'none';
  spinnerWheel.style.transform = 'translate3d(0,0,0)';
  void spinnerWheel.offsetWidth; // Force reflow

  const cards = spinnerWheel.querySelectorAll(".item");
  const targetCard = cards[targetIndex];
  if (!targetCard) return;

  const containerEl = spinnerWheel.parentElement;
  const targetRect = targetCard.getBoundingClientRect();
  const containerRect = containerEl.getBoundingClientRect();
  const cardCenter = targetRect.left + targetRect.width / 2;
  const containerCenter = containerRect.left + containerRect.width / 2;

  // Adjust for any scale transform applied to the container
  let scale = 1;
  const transform = window.getComputedStyle(containerEl).transform;
  if (transform && transform !== 'none') {
    const match = transform.match(/matrix\(([^,]+)/);
    if (match) {
      scale = parseFloat(match[1]) || 1;
    }
  }

  let scrollOffset = (cardCenter - containerCenter) / scale;

  // Now apply the spin
  requestAnimationFrame(() => {
    // Longer, ultra-smooth spin
    spinnerWheel.style.willChange = 'transform';
    spinnerWheel.style.transition = 'transform 10s cubic-bezier(0.22, 1, 0.36, 1)';
    spinnerWheel.style.transform = `translate3d(-${scrollOffset}px,0,0)`;
  });

  let animationFrame;

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
      const indexAttr = closestCard.getAttribute("data-index");
      const prize = spinnerPrizesMap[id][indexAttr];
      const rarity = (prize?.rarity || "common").toLowerCase().replace(/\s+/g, '');
      const color = getRarityColor(rarity);

      const borderEl = document.getElementById(`spinner-border-${id}`);
      if (borderEl) borderEl.style.borderColor = color;
    }

    animationFrame = requestAnimationFrame(trackCenterPrize);
  }

  trackCenterPrize();

  spinnerWheel.addEventListener("transitionend", () => {
    cancelAnimationFrame(animationFrame);

    // Flash the near-miss card
    const nearMissCard = spinnerWheel.querySelector(`.item[data-index="${targetIndex - 1}"]`)
      || spinnerWheel.querySelector(`.item[data-index="${targetIndex + 1}"]`);
    if (nearMissCard) {
      nearMissCard.classList.add("near-miss-flash");
    }

    const prize = spinnerPrizesMap[id][targetIndex];
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
