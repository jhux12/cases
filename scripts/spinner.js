let spinnerPrizes = [];
let spinnerWheel, spinnerResultText;

export function renderSpinner(prizes) {
  spinnerPrizes = prizes;

  spinnerWheel = document.getElementById("spinner-wheel");
  spinnerResultText = document.getElementById("spinner-result");

  if (!spinnerWheel || !spinnerResultText) return;

  // Clear previous items
  spinnerWheel.innerHTML = '';

  // Repeat the prize list 3x for smooth spin effect
  const extended = [...prizes, ...prizes, ...prizes];

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

  // ✅ Unhide the spinner wrapper
  const spinnerWrapper = document.getElementById("spinner-wrapper");
  if (spinnerWrapper) {
    spinnerWrapper.classList.remove("hidden");
  }

  // Hide result text until spin finishes
  spinnerResultText.classList.add("hidden");

  // Reset transform to prevent jump if spinning multiple times
  spinnerWheel.style.transition = 'none';
  spinnerWheel.style.transform = 'translateX(0)';
}

export function spinToPrize(index) {
  const prizeWidth = 160 + 16; // card + margin
  const baseIndex = spinnerPrizes.length; // middle set (3x repeated)
  const finalIndex = baseIndex + index;

  const offsetCenter = (window.innerWidth / 2) - (prizeWidth / 2);
  const totalScroll = finalIndex * prizeWidth;
  const scrollDistance = -(totalScroll - offsetCenter);

  // Trigger spin animation
  spinnerWheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
  spinnerWheel.style.transform = `translateX(${scrollDistance}px)`;

  // Show result text after spin completes
  setTimeout(() => {
    const prize = spinnerPrizes[index];
    spinnerResultText.textContent = `You won: ${prize.name}!`;
    spinnerResultText.classList.remove("hidden");
  }, 4000);
}
