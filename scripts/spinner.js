let spinnerPrizes = [];
let spinnerWheel;
let spinnerResultText;

/**
 * Renders the spinner wheel with repeated prizes
 * @param {Array} prizes
 */
export function renderSpinner(prizes) {
  spinnerPrizes = prizes;

  const container = document.getElementById("spinner-container");
  spinnerWheel = document.getElementById("spinner-wheel");
  spinnerResultText = document.getElementById("spinner-result");

  if (!container || !spinnerWheel) return;

  // Clear any existing wheel content
  spinnerWheel.innerHTML = '';

  // Extend prize list to simulate a long spinning strip
  const extended = [...spinnerPrizes, ...spinnerPrizes, ...spinnerPrizes];

  extended.forEach((prize) => {
    const card = document.createElement("div");
    card.className =
      "min-w-[160px] h-40 flex flex-col items-center justify-center bg-black/20 text-white border border-white/10 rounded-lg mx-2 p-2 text-sm";
    card.innerHTML = `
      <img src="${prize.image}" class="h-20 object-contain mb-2" />
      <div class="font-semibold text-center">${prize.name}</div>
      <div class="text-xs text-gray-400">${prize.value || ''} coins</div>
    `;
    spinnerWheel.appendChild(card);
  });
}

/**
 * Animates the spinner to land on the given index
 * @param {number} index
 */
export function spinToPrize(index) {
  const prizeWidth = 160 + 16; // 160px width + 16px margin
  const baseIndex = spinnerPrizes.length; // middle group start
  const finalIndex = baseIndex + index;

  const totalScroll = finalIndex * prizeWidth;
  const centerOffset = window.innerWidth / 2 - prizeWidth / 2;
  const translateX = -(totalScroll - centerOffset);

  spinnerWheel.style.transition = "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)";
  spinnerWheel.style.transform = `translateX(${translateX}px)`;

  setTimeout(() => {
    const prize = spinnerPrizes[index];
    if (spinnerResultText) {
      spinnerResultText.textContent = `🎉 You won: ${prize.name}!`;
      spinnerResultText.classList.remove("hidden");
    }
  }, 4000);
}

