let spinnerPrizes = [];
let spinnerWheel, spinnerResultText;

export function renderSpinner(prizes) {
  spinnerPrizes = prizes;

  spinnerWheel = document.getElementById("spinner-wheel");
  spinnerResultText = document.getElementById("spinner-result");

  if (!spinnerWheel || !spinnerResultText) return;

  const extended = [...prizes, ...prizes, ...prizes]; // repeat 3x for smooth loop

  spinnerWheel.innerHTML = ''; // clear previous prizes

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

export function spinToPrize(index) {
  const prizeWidth = 160 + 16; // card width + margin
  const baseIndex = spinnerPrizes.length; // middle repetition
  const finalIndex = baseIndex + index;

  const offsetCenter = (window.innerWidth / 2) - (prizeWidth / 2);
  const totalScroll = finalIndex * prizeWidth;
  const scrollDistance = -(totalScroll - offsetCenter);

  spinnerWheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
  spinnerWheel.style.transform = `translateX(${scrollDistance}px)`;

  setTimeout(() => {
    const prize = spinnerPrizes[index];
    spinnerResultText.textContent = `You won: ${prize.name}!`;
    spinnerResultText.classList.remove("hidden");
  }, 4000);
}
