let spinnerWheel;
const cardWidth = 160; // card width in px
const cardMargin = 16; // left + right margin
const fullCardWidth = cardWidth + cardMargin;
let spinnerPrizes = [];

export function renderSpinner(prizes, winningPrize) {
  const container = document.getElementById("spinner-container");
  if (!container) return;

  // Remove previous spinner if exists
  const existing = document.getElementById("spinner-wrapper");
  if (existing) existing.remove();

  // Create spinner wrapper
  const wrapper = document.createElement("div");
  wrapper.id = "spinner-wrapper";
  wrapper.innerHTML = `
    <div class="relative overflow-hidden w-full">
      <div class="center-line absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-full bg-pink-500 z-10"></div>
      <div id="spinner-wheel" class="flex transition-transform duration-[4000ms] ease-in-out"></div>
    </div>
    <div id="spinner-result" class="hidden text-center text-xl font-bold text-yellow-400 mt-4"></div>
  `;
  container.appendChild(wrapper);

  spinnerWheel = document.getElementById("spinner-wheel");
  const spinnerResultText = document.getElementById("spinner-result");

  // Build the prizes array and ensure the winning prize is in the center
  const shuffled = [...prizes];
  spinnerPrizes = [];
  for (let i = 0; i < 30; i++) {
    let prize = i === 15 ? winningPrize : shuffled[Math.floor(Math.random() * shuffled.length)];

    // Fallback in case prize is missing or incomplete
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
    const glowMap = {
      'common': 'ring-gray-400 shadow-[0_0_20px_#a1a1aa]',
      'uncommon': 'ring-green-400 shadow-[0_0_20px_#4ade80]',
      'rare': 'ring-blue-400 shadow-[0_0_20px_#60a5fa]',
      'ultra-rare': 'ring-purple-500 shadow-[0_0_25px_#c084fc]',
      'legendary': 'ring-yellow-400 shadow-[0_0_30px_#facc15]'
    };
    const glowClass = glowMap[rarity] || 'ring-gray-400 shadow-[0_0_20px_#a1a1aa]';
    div.className = `min-w-[160px] h-40 flex flex-col items-center justify-center rounded-lg mx-2 p-2 text-sm item ${rarity} ring-2 ${glowClass}`;
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

  spinnerWheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
  spinnerWheel.style.transform = `translateX(-${scrollTo}px)`;

  setTimeout(() => {
    const prize = spinnerPrizes[targetIndex];
    const spinnerResultText = document.getElementById("spinner-result");
    if (spinnerResultText) {
      spinnerResultText.textContent = `You won: ${prize.name}!`;
      spinnerResultText.classList.remove("hidden");
    }

    // 🎯 Apply extra glow to winning card
    const allCards = spinnerWheel.querySelectorAll(".item");
    const winningCard = allCards[targetIndex];
    if (winningCard) {
      const rarity = (prize.rarity || 'common').toLowerCase().replace(/\s+/g, '-');
      const glowMap = {
        'common': 'ring-gray-400 shadow-[0_0_20px_#a1a1aa]',
        'uncommon': 'ring-green-400 shadow-[0_0_20px_#4ade80]',
        'rare': 'ring-blue-400 shadow-[0_0_20px_#60a5fa]',
        'ultra-rare': 'ring-purple-500 shadow-[0_0_25px_#c084fc]',
        'legendary': 'ring-yellow-400 shadow-[0_0_30px_#facc15]'
      };
      const glowClass = glowMap[rarity] || 'ring-gray-400 shadow-[0_0_20px_#a1a1aa]';
      winningCard.classList.add("ring-4", ...glowClass.split(" "));
    }
  }, 4000);
}
