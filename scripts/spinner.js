let spinnerPrizes = [];
let spinnerWheel, spinnerResultText;

export function renderSpinner(prizes) {
  spinnerPrizes = prizes;

  const container = document.getElementById("spinner-container");
  container.innerHTML = `
    <div class="relative my-6">
      <div class="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-full bg-pink-500 z-10"></div>
      <div id="spinner-wheel" class="flex transition-transform duration-[4000ms] ease-[cubic-bezier(0.17,0.67,0.12,0.99)] will-change-transform"></div>
    </div>
    <div id="spinner-result" class="hidden text-center text-xl font-bold text-yellow-400 mt-4"></div>
  `;

  spinnerWheel = container.querySelector("#spinner-wheel");
  spinnerResultText = container.querySelector("#spinner-result");

  const extended = [...prizes, ...prizes, ...prizes]; // 3x loop for smooth scroll

  extended.forEach(prize => {
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

export function spinToPrize(winningPrize) {
  const index = spinnerPrizes.findIndex(p => p.name === winningPrize.name);
  if (index === -1) return;

  const prizeWidth = 160 + 16; // width + margin
  const totalPrizes = spinnerPrizes.length;
  const baseOffset = totalPrizes * prizeWidth; // ensures full forward scroll

  const centerOffset = (window.innerWidth / 2) - (prizeWidth / 2);
  const finalOffset = (index * prizeWidth) + baseOffset;
  const scrollDistance = -(finalOffset - centerOffset);

  spinnerWheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
  spinnerWheel.style.transform = `translateX(${scrollDistance}px)`;

  setTimeout(() => {
    spinnerResultText.textContent = `🎉 You won: ${winningPrize.name}!`;
    spinnerResultText.classList.remove("hidden");
  }, 4000);
}

