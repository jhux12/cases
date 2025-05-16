let spinnerPrizes = [];
let spinnerWheel, spinnerResultText;

/**
 * Render the spinner strip with repeated prizes
 */
export function renderSpinner(prizes) {
  spinnerPrizes = prizes;

  spinnerWheel = document.getElementById("spinner-wheel");
  spinnerResultText = document.getElementById("spinner-result");

  if (!spinnerWheel || !spinnerResultText) return;

  spinnerWheel.innerHTML = ""; // clear previous

  const repeated = [...prizes, ...prizes, ...prizes]; // 3x repetition
  repeated.forEach(prize => {
    const div = document.createElement("div");
    div.className = "min-w-[160px] h-40 flex flex-col items-center justify-center bg-black/20 text-white border border-white/10 rounded-lg mx-2 p-2 text-sm";
    div.innerHTML = `
      <img src="${prize.image}" class="h-20 object-contain mb-2" />
      <div class="font-semibold text-center">${prize.name}</div>
      <div class="text-xs text-gray-400">${(prize.value || 0).toLocaleString()} coins</div>
    `;
    spinnerWheel.appendChild(div);
  });
}

/**
 * Spin to land on the prize at the given index (relative to original prizes)
 */
export function spinToPrize(index) {
  const prizeWidth = 160 + 16; // width + margin
  const centerOffset = (window.innerWidth / 2) - (prizeWidth / 2);

  const baseIndex = spinnerPrizes.length; // center group
  const finalIndex = baseIndex + index;

  const translateX = -(finalIndex * prizeWidth - centerOffset);

  // Apply the transform
  spinnerWheel.style.transition = "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)";
  spinnerWheel.style.transform = `translateX(${translateX}px)`;

  // Show result after spin
  setTimeout(() => {
    const prize = spinnerPrizes[index];
    if (spinnerResultText) {
      spinnerResultText.textContent = `🎉 You won: ${prize.name}!`;
      spinnerResultText.classList.remove("hidden");
    }
  }, 4000);
}


