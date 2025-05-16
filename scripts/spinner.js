let spinnerPrizes = [];
let spinnerWheel, spinnerResultText;

// Render the spinner bar with enough prizes to fill the screen
export function renderSpinner(prizes) {
  spinnerPrizes = prizes;

  const container = document.getElementById("spinner-container");
  if (!container) return;

  spinnerWheel = document.getElementById("spinner-wheel");
  spinnerResultText = document.getElementById("spinner-result");

  if (!spinnerWheel) return;

  spinnerWheel.innerHTML = ""; // Clear previous

  const prizeWidth = 160 + 16; // prize width + margin
  const screenWidth = window.innerWidth;
  const visibleItems = Math.ceil(screenWidth / prizeWidth);
  const totalNeeded = visibleItems + 5; // extra buffer for scroll
  const repeatCount = Math.ceil(totalNeeded / prizes.length);

  const extendedPrizes = [];
  for (let i = 0; i < repeatCount; i++) {
    extendedPrizes.push(...prizes);
  }

  // Rebuild spinner
  extendedPrizes.forEach(prize => {
    const div = document.createElement("div");
    div.className = "min-w-[160px] h-40 flex flex-col items-center justify-center bg-black/20 text-white border border-white/10 rounded-lg mx-2 p-2 text-sm";
    div.innerHTML = `
      <img src="${prize.image}" class="h-20 object-contain mb-2" />
      <div class="font-semibold text-center">${prize.name}</div>
      <div class="text-xs text-gray-400">${prize.value || ''}</div>
    `;
    spinnerWheel.appendChild(div);
  });
}

// Spin the wheel so it lands exactly on the winning prize index
export function spinToPrize(prizeIndex) {
  if (!spinnerWheel || !spinnerPrizes.length) return;

  const prizeWidth = 160 + 16;
  const repeatCount = Math.ceil((window.innerWidth / prizeWidth + 5) / spinnerPrizes.length);
  const extendedLength = spinnerPrizes.length * repeatCount;

  const fullList = Array(repeatCount).fill(spinnerPrizes).flat();
  const middleOffset = Math.floor(extendedLength / 2);
  const targetIndex = middleOffset + prizeIndex;
  const scrollDistance = -(targetIndex * prizeWidth - window.innerWidth / 2 + prizeWidth / 2);

  spinnerWheel.style.transition = "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)";
  spinnerWheel.style.transform = `translateX(${scrollDistance}px)`;

  setTimeout(() => {
    const prize = spinnerPrizes[prizeIndex];
    if (spinnerResultText) {
      spinnerResultText.textContent = `You won: ${prize.name}!`;
      spinnerResultText.classList.remove("hidden");
    }
  }, 4000);
}
