let spinnerPrizes = [];
let spinnerContainer, spinnerWheel, spinnerResultText;

export function renderSpinner(prizes, winningPrize = null) {
  spinnerPrizes = prizes;

  const container = document.getElementById("spinner-container");

  // Clear old content
  container.innerHTML = `
    <div class="relative w-full overflow-hidden border border-white/10 rounded-lg bg-black/20 backdrop-blur-md h-[200px]">
      <div id="center-line" class="absolute top-0 bottom-0 w-1 bg-pink-500 left-1/2 transform -translate-x-1/2 z-10"></div>
      <div id="spinner-wheel" class="flex h-full items-center transition-transform duration-[4000ms] ease-[cubic-bezier(0.17,0.67,0.12,0.99)] will-change-transform"></div>
    </div>
    <div id="spinner-result" class="text-center text-xl font-bold text-yellow-400 mt-4 hidden"></div>
  `;

  spinnerWheel = document.getElementById("spinner-wheel");
  spinnerResultText = document.getElementById("spinner-result");

  const extended = [...spinnerPrizes, ...spinnerPrizes, ...spinnerPrizes];

  extended.forEach((prize) => {
    const card = document.createElement("div");
    card.className = "min-w-[160px] h-40 flex flex-col items-center justify-center bg-black/20 text-white border border-white/10 rounded-lg mx-2 p-2 text-sm";
    card.innerHTML = `
      <img src="${prize.image}" class="h-20 object-contain mb-2" />
      <div class="font-semibold text-center">${prize.name}</div>
      <div class="text-xs text-gray-400">${prize.value || ''}</div>
    `;
    spinnerWheel.appendChild(card);
  });

  // If winningPrize was passed now, spin immediately
  if (winningPrize) spinToPrize(winningPrize);
}

export function spinToPrize(winningPrize) {
  if (!winningPrize || !spinnerPrizes || spinnerPrizes.length === 0) {
    console.error("Missing winningPrize or spinnerPrizes");
    return;
  }

  const index = spinnerPrizes.findIndex((p) => p.name === winningPrize.name);
  if (index === -1) {
    console.error("winningPrize not found in spinnerPrizes");
    return;
  }

  const prizeWidth = 160 + 16; // width + margin
  const offsetCenter = (window.innerWidth / 2) - (prizeWidth / 2);
  const baseIndex = spinnerPrizes.length; // middle group
  const finalIndex = baseIndex + index;
  const scrollDistance = -(finalIndex * prizeWidth - offsetCenter);

  spinnerWheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
  spinnerWheel.style.transform = `translateX(${scrollDistance}px)`;

  setTimeout(() => {
    spinnerResultText.textContent = `You won: ${winningPrize.name}!`;
    spinnerResultText.classList.remove("hidden");
  }, 4000);
}

