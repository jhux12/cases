let spinnerWheel;
const cardWidth = 160;
const cardMargin = 16;
const fullCardWidth = cardWidth + cardMargin;
let spinnerPrizes = [];

// Utility: Shuffle an array
function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function renderSpinner(prizes, winningPrize) {
  const container = document.getElementById("spinner-container");
  if (!container) return;

  // Clear previous spinner
  const existing = document.getElementById("spinner-wrapper");
  if (existing) existing.remove();

  // Spinner structure
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

  // Construct the spinner content
  const shuffled = shuffle(prizes);
  spinnerPrizes = [];

  for (let i = 0; i < 30; i++) {
    let prize = i === 15 ? winningPrize : shuffled[Math.floor(Math.random() * shuffled.length)];

    // Fallback if prize is undefined
    if (!prize || !prize.name || !prize.image) {
      prize = {
        name: "Mystery",
        image: "https://via.placeholder.com/80?text=?",
        value: 0,
        rarity: "common"
      };
    }

    spinnerPrizes.push(prize);

    const rarity = (prize.rarity || "common").toLowerCase().replace(/\s+/g, '-');
    const div = document.createElement("div");
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

  spinnerWheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
  spinnerWheel.style.transform = `translateX(-${scrollTo}px)`;

  setTimeout(() => {
    const prize = spinnerPrizes[targetIndex];
    const spinnerResultText = document.getElementById("spinner-result");
    if (spinnerResultText) {
      spinnerResultText.textContent = `You won: ${prize.name}!`;
      spinnerResultText.classList.remove("hidden");
    }
  }, 4000);
}

