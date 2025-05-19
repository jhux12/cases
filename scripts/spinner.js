let spinnerPrizes = [];
let spinnerWheel, spinnerResultText;

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function renderSpinner(prizes, winningPrize) {
  const container = document.getElementById("spinner-container");
  if (!container) return;

  // Remove previous spinner if exists
  const existing = document.getElementById("spinner-wrapper");
  if (existing) existing.remove();

  // Build wrapper HTML
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
  spinnerResultText = document.getElementById("spinner-result");

  // Insert 30 prizes with winningPrize at index 15
  const shuffled = shuffle([...prizes]);
  spinnerPrizes = [];

  for (let i = 0; i < 30; i++) {
    const prize = i === 15 ? winningPrize : shuffled[Math.floor(Math.random() * shuffled.length)];
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
  const targetIndex = 15; // Always land on the prize in the middle
  const prizeWidth = 160 + 16;
  const offsetCenter = (window.innerWidth / 2) - (prizeWidth / 2);
  const totalScroll = targetIndex * prizeWidth;
  const scrollDistance = -(totalScroll - offsetCenter);

  spinnerWheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
  spinnerWheel.style.transform = `translateX(${scrollDistance}px)`;

  setTimeout(() => {
    const prize = spinnerPrizes[targetIndex];
    spinnerResultText.textContent = `You won: ${prize.name}!`;
    spinnerResultText.classList.remove("hidden");
  }, 4000);
}
