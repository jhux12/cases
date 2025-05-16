let spinnerPrizes = [];
let spinnerWheel, spinnerResultText;

export function renderSpinner(prizes) {
  spinnerPrizes = prizes;
  const container = document.getElementById("spinner-container");

  // Clear any existing content
  const existingWheel = document.getElementById("spinner-wheel");
  if (existingWheel) existingWheel.innerHTML = "";

  spinnerWheel = existingWheel;
  spinnerResultText = document.getElementById("spinner-result");

  const repeated = [...prizes, ...prizes, ...prizes]; // More content for scroll space

  repeated.forEach(prize => {
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

export function spinToPrize(prizeIndex) {
  const prizeWidth = 160 + 16; // item width + margin
  const visibleItems = Math.floor(window.innerWidth / prizeWidth);
  const centerOffset = (window.innerWidth / 2) - (prizeWidth / 2);

  const baseIndex = spinnerPrizes.length; // middle block of repeated content
  const finalIndex = baseIndex + prizeIndex;

  const scrollDistance = -(finalIndex * prizeWidth - centerOffset);

  spinnerWheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
  spinnerWheel.style.transform = `translateX(${scrollDistance}px)`;

  setTimeout(() => {
    const prize = spinnerPrizes[prizeIndex];
    if (spinnerResultText) {
      spinnerResultText.textContent = `You won: ${prize.name}!`;
      spinnerResultText.classList.remove("hidden");
    }
  }, 4000);
}
