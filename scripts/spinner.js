// Store prizes for each spinner instance
const spinnerPrizesMap = {};
const targetIndex = 15;

function getRarityColor(rarity) {
  const base = rarity?.toLowerCase().replace(/\s+/g, '');
  switch (base) {
    case 'legendary': return '#facc15';
    case 'ultrarare': return '#e879f9';
    case 'rare': return '#3b82f6';
    case 'uncommon': return '#22c55e';
    default: return '#9ca3af';
  }
}

export function getTopPrizes(prizeList, count = 30) {
  return [...prizeList]
    .sort((a, b) => (b.value || 0) - (a.value || 0))
    .slice(0, count);
}

export function renderSpinner(prizes, winningPrize = null, isPreview = false, id = 0) {
  const container = document.getElementById(`spinner-container-${id}`);
  if (!container) return console.warn("🚫 Spinner container not found");

  container.innerHTML = "";

  const borderEl = document.getElementById(`spinner-border-${id}`);
  if (borderEl) borderEl.style.borderColor = "#1f2937";

  const spinnerWheel = document.createElement("div");
  spinnerWheel.id = `spinner-wheel-${id}`;
  spinnerWheel.className = "flex h-full items-center";

  if (isPreview) {
    spinnerWheel.classList.add("animate-scroll-preview");
  }

  container.appendChild(spinnerWheel);
  spinnerPrizesMap[id] = [];

  const shuffled = [...prizes];

  for (let i = 0; i < 30; i++) {
    let prize = isPreview || !winningPrize
      ? shuffled[i % shuffled.length]
      : (i === targetIndex ? winningPrize : shuffled[Math.floor(Math.random() * shuffled.length)]);

    if (!prize || typeof prize !== 'object' || !prize.image || !prize.name) {
      prize = {
        name: "Mystery",
        image: "https://via.placeholder.com/80?text=?",
        value: 0,
        rarity: "common"
      };
    }

    spinnerPrizesMap[id].push(prize);

    const div = document.createElement("div");
    const rarity = (prize.rarity || 'common').toLowerCase().replace(/\s+/g, '');
    const borderColor = getRarityColor(rarity);

    const glowClass = `glow-${rarity}`;
    div.className = `min-w-[140px] h-[160px] mx-1 flex items-center justify-center rounded-xl bg-transparent shadow-md item border-2 ${glowClass}`;
    div.style.borderColor = borderColor;
    div.setAttribute("data-index", i);
    div.innerHTML = `
      <div class="flex flex-col items-center">
        <img src="${prize.image}" class="h-[100px] object-contain drop-shadow-md rounded-xl" />
        <div class="mt-1 text-xs text-white bg-black/50 px-2 py-0.5 rounded-sm flex items-center gap-1">
          <span>${prize.value.toLocaleString()}</span>
          <img src="https://cdn-icons-png.flaticon.com/128/6369/6369589.png" class="w-3 h-3" alt="coin" />
        </div>
      </div>
    `;
    spinnerWheel.appendChild(div);
  }
}

export function spinToPrize(callback, showPopup = true, id = 0) {
  const spinnerWheel = document.getElementById(`spinner-wheel-${id}`);
  if (!spinnerWheel) return Promise.resolve();

  spinnerWheel.classList.remove("animate-scroll-preview");

  // Reset any previous transform before measuring
  spinnerWheel.style.transition = 'none';
  spinnerWheel.style.transform = 'translate3d(0,0,0)';
  void spinnerWheel.offsetWidth; // Force reflow

  const cards = spinnerWheel.querySelectorAll(".item");
  const targetCard = cards[targetIndex];
  if (!targetCard) return Promise.resolve();

  const containerEl = spinnerWheel.parentElement;

  // Determine scaling applied to the container so calculations can occur in
  // the unscaled coordinate space used by transforms.
  let scale = 1;
  const transform = window.getComputedStyle(containerEl).transform;
  if (transform && transform !== 'none') {
    const match = transform.match(/matrix\(([^,]+)/);
    if (match) {
      scale = parseFloat(match[1]) || 1;
    }
  }

  const targetRect = targetCard.getBoundingClientRect();
  const containerRect = containerEl.getBoundingClientRect();
  const containerCenter = containerRect.left + containerRect.width / 2;
  const cardCenter = targetRect.left + targetRect.width / 2;

  // Precompute each card's center relative to the container center in the
  // same coordinate space as the transform so we avoid layout work every frame.
  const cardCenters = Array.from(cards).map(card => {
    const rect = card.getBoundingClientRect();
    return (rect.left + rect.width / 2 - containerCenter) / scale;
  });
  const step = cardCenters[1] - cardCenters[0];
  const firstCenter = cardCenters[0];

  const finalOffset = (cardCenter - containerCenter) / scale;
  let targetOffset = finalOffset;
  let closeCallDir = 0;

  // Randomly apply a "close call" overshoot so the wheel appears to almost
  // stop on an adjacent prize before settling on the winner. Bias the
  // overshoot toward a rare neighbour if one exists to make the near miss
  // feel more dramatic.
  const closeCallChance = 0.5; // roughly half the spins
  const adjacent = [
    { dir: -1, prize: spinnerPrizesMap[id][targetIndex - 1] },
    { dir: 1, prize: spinnerPrizesMap[id][targetIndex + 1] }
  ];
  if (Math.random() < closeCallChance) {
    const rareAdjacent = adjacent.filter(a => {
      const r = (a.prize?.rarity || 'common').toLowerCase().replace(/\s+/g, '');
      return ['rare', 'ultrarare', 'legendary'].includes(r);
    });
    const chosen = (rareAdjacent.length ? rareAdjacent : adjacent)[Math.floor(Math.random() * (rareAdjacent.length ? rareAdjacent.length : adjacent.length))];
    closeCallDir = chosen.dir;
    const overshoot = 25 + Math.random() * 35; // 25-60px
    targetOffset = finalOffset + closeCallDir * overshoot;
  }

  const spinDuration = 4 + Math.random() * 2; // 4-6 seconds for a snappier feel
  const borderEl = document.getElementById(`spinner-border-${id}`);
  let currentOffset = 0;

  let lastIndex = -1;
  function highlight(offset) {
    const index = Math.max(0, Math.min(cardCenters.length - 1, Math.round((offset - firstCenter) / step)));
    if (index === lastIndex) return;
    lastIndex = index;
    const prize = spinnerPrizesMap[id][index];
    const rarity = (prize?.rarity || 'common').toLowerCase().replace(/\s+/g, '');
    const color = getRarityColor(rarity);
    if (borderEl) borderEl.style.borderColor = color;
  }

  function animate(offset, duration, done) {
    const startOffset = currentOffset;
    const animation = spinnerWheel.animate(
      [
        { transform: `translate3d(-${startOffset}px,0,0)` },
        { transform: `translate3d(-${offset}px,0,0)` }
      ],
      {
        duration: duration * 1000,
        easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
        fill: 'forwards'
      }
    );

    function step() {
      currentOffset = startOffset + (offset - startOffset) * (animation.currentTime / (duration * 1000));
      highlight(currentOffset);
      if (animation.playState === 'running') requestAnimationFrame(step);
    }
    requestAnimationFrame(step);

    animation.addEventListener('finish', () => {
      currentOffset = offset;
      highlight(currentOffset);
      spinnerWheel.style.transform = `translate3d(-${offset}px,0,0)`;
      if (done) done();
    });
  }

  spinnerWheel.style.willChange = 'transform';

  return new Promise(resolve => {
    function finish() {
      spinnerWheel.style.willChange = '';

      const prize = spinnerPrizesMap[id][targetIndex];
      const rarity = (prize.rarity || 'common').toLowerCase().replace(/\s+/g, '');

      const spinnerResultText = document.getElementById("spinner-result");
      if (spinnerResultText) {
        spinnerResultText.textContent = `You won: ${prize.name}!`;
        spinnerResultText.classList.remove("hidden");
      }

      if (showPopup) {
        document.getElementById("popup-image").src = prize.image;
        document.getElementById("popup-name").textContent = prize.name;
        document.getElementById("popup-value").textContent = prize.value;
        document.getElementById("sell-value").textContent = Math.floor(prize.value * 0.8);
        document.getElementById("win-popup").classList.remove("hidden");
      } else {
        const popup = document.getElementById("win-popup");
        if (popup) popup.classList.add("hidden");
      }

      if (targetCard) {
        const glowClass = `glow-${rarity}`;
        targetCard.classList.add(glowClass, "ring-4", "ring-white");
      }

      if (callback) callback(prize);
      resolve(prize);
    }

    function startFinal() {
      if (closeCallDir !== 0) {
        const nearMissIndex = closeCallDir === -1 ? targetIndex - 1 : targetIndex + 1;
        const nearMissCard = spinnerWheel.querySelector(`.item[data-index="${nearMissIndex}"]`);
        if (nearMissCard) nearMissCard.classList.add("near-miss-flash");
        closeCallDir = 0;
        animate(finalOffset, 0.4, finish);
      } else {
        finish();
      }
    }

    animate(targetOffset, spinDuration, startFinal);
  });
}

export function showWinPopup(prize) {
  document.getElementById("popup-image").src = prize.image;
  document.getElementById("popup-name").textContent = prize.name;
  document.getElementById("popup-value").textContent = prize.value;
  document.getElementById("sell-value").textContent = Math.floor(prize.value * 0.8);
  document.getElementById("win-popup").classList.remove("hidden");
}
