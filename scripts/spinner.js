let spinnerPrizes = [];
const cardWidth = 160;
const cardMargin = 16;
const fullCardWidth = cardWidth + cardMargin;
const targetIndex = 15;

export function renderSpinner(prizes, winningPrize) {
  const container = document.getElementById("spinner-container");
  if (!container) return;

  // Clear spinner
  container.innerHTML = `
    <div class="relative overflow-hidden w-full h-full">
      <div id="spinner-wheel" class="flex h-full items-center transition-transform duration-[4000ms] ease-[cubic-bezier(0.17,0.67,0.12,0.99)]"></div>
      <div class="absolute top-0 bottom-0 w-[4px] bg-pink-500 left-1/2 transform -translate-x-1/2 z-10 rounded-full shadow-lg"></div>
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
    const rarity = (prize.rarity || 'common').toLowerCase().replace(/\s+/g, '-');
    div.className = `min-w-[${cardWidth}px] mx-[${cardMargin / 2}px] h-[180px] flex flex-col items-center justify-center text-white rounded-xl bg-black/30 shadow-md item ${rarity}`;
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

  // Ensure layout is stable before animating
  spinnerWheel.style.transition = 'none';
  spinnerWheel.style.transform = 'translateX(0)';
  void spinnerWheel.offsetWidth;

  // Calculate center alignment
  const viewportCenter = window.innerWidth / 2;
  const offset = targetIndex * fullCardWidth + fullCardWidth / 2 - viewportCenter;

  setTimeout(() => {
    spinnerWheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
    spinnerWheel.style.transform = `translateX(-${offset}px)`;
  }, 50);

  // Highlight winning card after spin
  setTimeout(() => {
    const prize = spinnerPrizes[targetIndex];
    const spinnerResultText = document.getElementById("spinner-result");
    if (spinnerResultText) {
      spinnerResultText.textContent = `You won: ${prize.name}!`;
      spinnerResultText.classList.remove("hidden");
    }

    const allCards = spinnerWheel.querySelectorAll(".item");
    const winningCard = allCards[targetIndex];
    if (winningCard) {
      const glowClass = `glow-${(prize.rarity || 'common').toLowerCase().replace(/\s+/g, '-')}`;
      winningCard.classList.add(glowClass, "ring-4", "ring-white");
    }
  }, 4000);
}
