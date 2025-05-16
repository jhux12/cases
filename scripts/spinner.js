let spinnerPrizes = [];
let spinnerContainer, spinnerWheel, spinnerResultText;

export function renderSpinner(prizes) {
    spinnerPrizes = prizes;

    const container = document.getElementById("case-container");

    // Clear existing spinner if any
    const existing = document.getElementById("spinner-wrapper");
    if (existing) existing.remove();

    const wrapper = document.createElement("div");
    wrapper.id = "spinner-wrapper";
    wrapper.innerHTML = `
        <div class="relative my-6">
            <div class="center-line absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-full bg-pink-500 z-10"></div>
            <div id="spinner-wheel" class="flex transition-transform duration-[4000ms] ease-in-out items-center"></div>
        </div>
        <div id="spinner-result" class="hidden text-center text-xl font-bold text-yellow-400 mt-4"></div>
    `;

    container.appendChild(wrapper);
    spinnerWheel = document.getElementById("spinner-wheel");
    spinnerResultText = document.getElementById("spinner-result");

    const extended = [...prizes, ...prizes, ...prizes];
    spinnerWheel.innerHTML = '';

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

// ✅ Spins to a specific prize object from the original spinnerPrizes array
export function spinToPrize(winningPrize) {
  if (!winningPrize || !winningPrize.name || !spinnerPrizes || spinnerPrizes.length === 0) {
    console.error("Invalid winningPrize or spinnerPrizes not set");
    return;
  }

  const index = spinnerPrizes.findIndex(p => p.name === winningPrize.name);
  if (index === -1) {
    console.error("Winning prize not found in spinnerPrizes");
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

