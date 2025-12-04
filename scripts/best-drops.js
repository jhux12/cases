const rotationMs = 6400;

const drops = [
  {
    title: 'Pikachu VMAX (Secret)',
    pack: 'Pika Pika',
    odds: '1 in 480 odds',
    value: '+420 gems',
    streak: 'Trending right now',
    rarity: 'Secret rare',
    cheers: 184,
    cardImg: 'https://tcgplayer-cdn.tcgplayer.com/product/284302_in_1000x1000.jpg',
    packImg:
      'https://firebasestorage.googleapis.com/v0/b/cases-e5b4e.firebasestorage.app/o/Pack%20Images%2FUntitled%20design%20(27).png?alt=media&token=27661ed2-182e-49d5-a635-f07d19410001',
    note: 'Chat keeps bumping this one to the top of the list.'
  },
  {
    title: "Pikachu (Secret) SM",
    pack: 'Pika Pika',
    odds: '1 in 720 odds',
    value: '+260 gems',
    streak: 'Voted in by the crowd',
    rarity: 'Sun & Moon',
    cheers: 132,
    cardImg: 'https://tcgplayer-cdn.tcgplayer.com/product/201352_in_1000x1000.jpg',
    packImg:
      'https://firebasestorage.googleapis.com/v0/b/cases-e5b4e.firebasestorage.app/o/Pack%20Images%2FUntitled%20design%20(27).png?alt=media&token=27661ed2-182e-49d5-a635-f07d19410001',
    note: 'Rare odds, but it keeps sneaking back into rotation.'
  },
  {
    title: "N's Reshiram",
    pack: 'Twin Dragons',
    odds: '1 in 320 odds',
    value: '+300 gems',
    streak: 'Fresh pull this hour',
    rarity: 'Legendary rare',
    cheers: 146,
    cardImg: 'https://boxed.gg/_next/image?url=https%3A%2F%2Fproduct-images.tcgplayer.com%2F623594.jpg&w=640&q=75',
    packImg:
      'https://firebasestorage.googleapis.com/v0/b/cases-e5b4e.firebasestorage.app/o/Pack%20Images%2FChatGPT_Image_Aug_10__2025__11_20_09_PM-removebg-preview.png?alt=media&token=34a17fd5-2a05-4c2c-899c-c4ac0484a152',
    note: 'Quickly climbing the queue after a streak of cheers.'
  }
];

let currentIndex = 0;
let rotationTimer;

const clampCheers = value => Math.min(400, value);
const isAutoOn = () => spotlightElements.toggle?.classList.contains('active');

const qs = id => document.getElementById(id);

const spotlightElements = {
  card: qs('spotlight-card'),
  pack: qs('spotlight-pack'),
  rarity: qs('spotlight-rarity'),
  odds: qs('spotlight-odds'),
  streak: qs('spotlight-streak'),
  title: qs('spotlight-title'),
  packName: qs('spotlight-pack-name'),
  value: qs('spotlight-value'),
  applauseCount: qs('applause-count'),
  applauseFill: qs('applause-meter-fill'),
  note: qs('note-chip'),
  pill: qs('spotlight-pill'),
  progress: qs('auto-progress-fill'),
  queue: qs('drop-queue'),
  toggle: qs('toggle-auto'),
  dealNext: qs('deal-next'),
  applaud: qs('applaud-button')
};

const renderSpotlight = index => {
  const drop = drops[index];
  const {
    card,
    pack,
    rarity,
    odds,
    streak,
    title,
    packName,
    value,
    applauseCount,
    applauseFill,
    note,
    pill
  } = spotlightElements;

  if (!card || !pack) return;

  card.src = drop.cardImg;
  card.alt = `${drop.title} card art`;
  pack.src = drop.packImg;
  pack.alt = `${drop.pack} pack art`;
  rarity.textContent = drop.rarity;
  odds.textContent = drop.odds;
  streak.textContent = drop.streak;
  title.textContent = drop.title;
  packName.textContent = `From: ${drop.pack}`;
  value.textContent = drop.value;
  applauseCount.textContent = `${drop.cheers} applause`;
  applauseFill.style.width = `${(clampCheers(drop.cheers) / 400) * 100}%`;
  note.textContent = drop.note;
  pill.textContent = `Live queue • ${drops.length} drops`;
};

const highlightQueue = index => {
  if (!spotlightElements.queue) return;
  const buttons = spotlightElements.queue.querySelectorAll('[data-queue-index]');
  buttons.forEach(button => {
    const isActive = Number(button.dataset.queueIndex) === index;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-current', isActive ? 'true' : 'false');
  });
};

const buildQueue = () => {
  if (!spotlightElements.queue) return;
  spotlightElements.queue.innerHTML = drops
    .map(
      (drop, index) => `
        <button class="queue-card" data-queue-index="${index}" aria-current="${index === currentIndex}">
          <span class="queue-thumb" aria-hidden="true">
            <img src="${drop.packImg}" alt="${drop.pack} pack" loading="lazy">
          </span>
          <span class="queue-copy">
            <strong>${drop.title}</strong>
            <small>${drop.odds} • ${drop.rarity}</small>
          </span>
          <span class="queue-cheers">${drop.cheers} applause</span>
        </button>
      `
    )
    .join('');
};

const animateProgress = () => {
  if (!spotlightElements.progress) return;
  const bar = spotlightElements.progress;
  bar.style.transition = 'none';
  bar.style.width = '0%';
  requestAnimationFrame(() => {
    bar.style.transition = `width ${rotationMs}ms linear`;
    bar.style.width = '100%';
  });
};

const nextDrop = shouldAnimate => {
  currentIndex = (currentIndex + 1) % drops.length;
  renderSpotlight(currentIndex);
  highlightQueue(currentIndex);
  if (shouldAnimate) animateProgress();
};

const startRotation = () => {
  clearInterval(rotationTimer);
  rotationTimer = setInterval(() => nextDrop(true), rotationMs);
  animateProgress();
};

const stopRotation = () => {
  clearInterval(rotationTimer);
  if (spotlightElements.progress) {
    spotlightElements.progress.style.transition = 'none';
    spotlightElements.progress.style.width = '0%';
  }
};

const toggleRotation = () => {
  if (!spotlightElements.toggle) return;
  const isActive = spotlightElements.toggle.classList.toggle('active');
  spotlightElements.toggle.innerHTML = `${
    isActive ? '<i class="fa-regular fa-circle-play"></i> Auto-rotate on' : '<i class="fa-regular fa-circle-pause"></i> Auto-rotate off'
  }`;
  if (isActive) {
    startRotation();
  } else {
    stopRotation();
  }
};

const applaud = () => {
  const drop = drops[currentIndex];
  drop.cheers += 1;
  renderSpotlight(currentIndex);
  highlightQueue(currentIndex);
  if (spotlightElements.applaud) {
    spotlightElements.applaud.classList.add('popped');
    setTimeout(() => spotlightElements.applaud.classList.remove('popped'), 300);
  }
};

const wireControls = () => {
  spotlightElements.dealNext?.addEventListener('click', () => {
    const autoEnabled = isAutoOn();
    nextDrop(autoEnabled);
    autoEnabled ? startRotation() : stopRotation();
  });

  spotlightElements.applaud?.addEventListener('click', applaud);
  spotlightElements.toggle?.addEventListener('click', toggleRotation);

  spotlightElements.queue?.addEventListener('click', event => {
    const button = event.target.closest('[data-queue-index]');
    if (!button) return;
    const index = Number(button.dataset.queueIndex);
    currentIndex = index;
    renderSpotlight(currentIndex);
    highlightQueue(currentIndex);
    if (isAutoOn()) {
      startRotation();
    } else {
      stopRotation();
    }
  });
};

const initBestDrops = () => {
  if (!spotlightElements.card || !spotlightElements.queue) return;
  renderSpotlight(currentIndex);
  buildQueue();
  highlightQueue(currentIndex);
  wireControls();
  startRotation();
};

document.addEventListener('DOMContentLoaded', initBestDrops);
