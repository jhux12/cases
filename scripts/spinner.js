let spinnerPrizes = [];
const cardWidth = 160;
const cardMargin = 16;
const fullCardWidth = cardWidth + cardMargin;

export function renderSpinner(prizes, winningPrize) {
  const container = document.getElementById("spinner-container");
  if (!container) return;

  // Clear previous spinner content
  container.innerHTML = `
    <div class="relative overflow-hidden w-full">
      <div class="center-line absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-full bg-pink-500 z-10"></div>
      <div id="spinner-wheel" class="flex transition-transform duration-[4000ms] ease-in-out"></div>
    </div>
    <div id="spinner-result" class="hidden text-center text-xl font-bold text-yellow-400 mt-4"></div>
  `;

  const spinnerWheel = document.getElementById("spinner-wheel");
  spinnerPrizes = [];

  const shuffled = [...prizes];
  for (let i = 0; i < 30; i++) {
    let prize = i === 15 ? winningPrize : shuffled[Math.floor(Math.random() * shuffled.length)];

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
    div.className = `min-w-[160px] h-40 flex flex-col items-center justify-center rounded-lg mx-2 p-2 text-sm item ${rarity}`;
    div.innerHTML = `
      <img src="${prize.image}" class="h-20 object-contain mb-2" />
      <div class="font-semibold text-center">${prize.name}</div>
      <div class="text-xs text-gray-400">${prize.value || ''}</div>
    `;
    spinnerWheel.appendChild(div);
  }
}

export function spinToPrize() {
  const targetIndex = 15;
  const scrollTo = targetIndex * fullCardWidth - (window.innerWidth / 2 - fullCardWidth / 2);

  const spinnerWheel = document.getElementById("spinner-wheel"); // fresh grab each time
  if (!spinnerWheel) return;

  spinnerWheel.style.transition = 'none';
  spinnerWheel.style.transform = 'translateX(0px)';
  void spinnerWheel.offsetWidth;

  setTimeout(() => {
    spinnerWheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
    spinnerWheel.style.transform = `translateX(-${scrollTo}px)`;
  }, 50);

setTimeout(() => {
  const prize = spinnerPrizes[targetIndex];
  const spinnerResultText = document.getElementById("spinner-result");
  if (spinnerResultText) {
    spinnerResultText.textContent = `You won: ${prize.name}!`;
    spinnerResultText.classList.remove("hidden");
  }

  // 🎯 Apply glow effect to the winning card
  const allCards = spinnerWheel.querySelectorAll(".item");
  const winningCard = allCards[targetIndex];
  if (winningCard) {
    const glowClass = `glow-${(prize.rarity || 'common').toLowerCase().replace(/\s+/g, '-')}`;
    winningCard.classList.add(glowClass, "ring-4", "ring-white");
  }
}, 4000);

