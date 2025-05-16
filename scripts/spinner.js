let spinnerPrizes = [];
let spinnerWheel, spinnerResultText;

export function renderSpinner(prizes) {
  spinnerPrizes = prizes;

  const wheel = document.getElementById("spinner-wheel");
  if (!wheel) return;

  wheel.innerHTML = ''; // Clear previous

  // Fill spinner bar fully: duplicate enough prizes to overflow container
  const extended = [];
  while (extended.length < 40) {
    extended.push(...spinnerPrizes);
  }

  extended.forEach(prize => {
    const div = document.createElement("div");
    div.className = "min-w-[160px] h-40 flex flex-col items-center justify-center bg-black/20 text-white border border-white/10 rounded-lg mx-2 p-2 text-sm";
    div.innerHTML = `
      <img src="${prize.image}" class="h-20 object-contain mb-2" />
      <div class="font-semibold text-center">${prize.name}</div>
      <div class="text-xs text-gray-400">${prize.value || ''}</div>
    `;
    wheel.appendChild(div);
  });
}

export function spinToPrize(index) {
  const prizeWidth = 160 + 16; // card width + margin
  const visibleCount = Math.floor(window.innerWidth / prizeWidth);
  const buffer = 10; // how deep into the duplicated spinner to target
  const finalIndex = buffer + index;

  const scrollDistance = -(finalIndex * prizeWidth) + (window.innerWidth / 2) - (prizeWidth / 2);

  spinnerWheel = document.getElementById("spinner-wheel");
  spinnerResultText = document.getElementById("spinner-result");

  if (!spinnerWheel) return;

  spinnerWheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
  spinnerWheel.style.transform = `translateX(${scrollDistance}px)`;

  setTimeout(() => {
    const prize = spinnerPrizes[index];
    if (spinnerResultText) {
      spinnerResultText.textContent = `You won: ${prize.name}!`;
      spinnerResultText.classList.remove("hidden");
    }
  }, 4000);
}
