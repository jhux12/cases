let heroRotationInterval = null;
let flipIntervals = [];

function parseValue(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  const numeric = parseFloat(value.toString().replace(/[^0-9.]/g, ''));
  return Number.isNaN(numeric) ? 0 : numeric;
}

function selectTopCases(cases, limit = 4) {
  return [...cases]
    .filter(c => c)
    .sort((a, b) => (b.openCount || 0) - (a.openCount || 0) || parseValue(b.price) - parseValue(a.price))
    .slice(0, limit);
}

function getTopPrize(prizes = []) {
  return [...prizes]
    .map(prize => ({ ...prize, numericValue: parseValue(prize.value) }))
    .sort((a, b) => (b.numericValue || 0) - (a.numericValue || 0))[0];
}

function populateStardust() {
  const container = document.getElementById('hero-stardust');
  if (!container || container.dataset.rendered) return;

  const fragment = document.createDocumentFragment();
  const sparkles = 28;
  for (let i = 0; i < sparkles; i += 1) {
    const star = document.createElement('span');
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.setProperty('--drift-x', `${Math.random() * 120 - 40}px`);
    star.style.setProperty('--float-duration', `${8 + Math.random() * 10}s`);
    star.style.animationDelay = `${Math.random() * 6}s`;
    fragment.appendChild(star);
  }

  container.appendChild(fragment);
  container.dataset.rendered = 'true';
}

function setupHeroCrossfade(cases) {
  const stage = document.getElementById('hero-pack-stage');
  if (!stage) return;

  const packs = selectTopCases(cases, 5).filter(p => p.image);
  stage.innerHTML = '<div class="hero-pack-stage-glow" aria-hidden="true"></div>';

  if (!packs.length) {
    stage.insertAdjacentHTML('beforeend', '<div class="hero-pack-placeholder">Fresh packs arriving soon</div>');
    return;
  }

  packs.forEach((pack, idx) => {
    const img = document.createElement('img');
    img.src = pack.image;
    img.alt = `${pack.name || 'Pack'} hero preview`;
    img.className = 'hero-pack-img';
    if (idx === 0) img.classList.add('active');
    stage.appendChild(img);
  });

  const images = stage.querySelectorAll('.hero-pack-img');
  let current = 0;
  if (heroRotationInterval) {
    clearInterval(heroRotationInterval);
  }

  heroRotationInterval = window.setInterval(() => {
    if (!images.length) return;
    images[current].classList.remove('active');
    current = (current + 1) % images.length;
    images[current].classList.add('active');
  }, 4200);
}

function createShowcaseCard(pack, index) {
  const grid = document.getElementById('pack-showcase-grid');
  if (!grid) return;

  const prizes = Object.values(pack.prizes || {});
  const topPrize = getTopPrize(prizes) || {};
  const priceLabel = pack.isFree ? 'Free pack' : `${parseValue(pack.price).toLocaleString()} gems`;

  const card = document.createElement('div');
  card.className = 'pack-showcase-card';
  card.innerHTML = `
    <div class="flip-card relative" data-index="${index}">
      <div class="flip-card-inner">
        <img class="flip-card-front w-full h-full object-contain rounded-xl" src="${topPrize.image || pack.image || ''}" alt="${
    topPrize.name || pack.name || 'Pack prize'}" />
        <img class="flip-card-back w-full h-full object-contain rounded-xl" src="${pack.image || ''}" alt="${pack.name || 'Pack'}" />
      </div>
    </div>
    <div class="pack-showcase-meta">
      <h3 class="text-lg font-semibold">${pack.name || 'Featured pack'}</h3>
      <p class="text-sm">${topPrize.name ? `${topPrize.name} • ` : ''}${priceLabel}</p>
    </div>
  `;

  grid.appendChild(card);
  const flipCard = card.querySelector('.flip-card');
  const delay = 800 + index * 350;
  setTimeout(() => {
    flipCard.classList.toggle('flipped');
    const interval = window.setInterval(() => {
      flipCard.classList.toggle('flipped');
    }, 4200 + index * 250);
    flipIntervals.push(interval);
  }, delay);
}

function buildPackShowcase(cases) {
  const grid = document.getElementById('pack-showcase-grid');
  if (!grid) return;

  flipIntervals.forEach(clearInterval);
  flipIntervals = [];
  grid.innerHTML = '';

  const picks = selectTopCases(cases, 3);
  if (!picks.length) {
    grid.innerHTML = '<div class="text-indigo-100/80">Add packs to see the flip showcase in action.</div>';
    return;
  }

  picks.forEach((pack, idx) => createShowcaseCard(pack, idx));
}

document.addEventListener('DOMContentLoaded', populateStardust);
document.addEventListener('cases:loaded', event => {
  const cases = event.detail?.cases || [];
  setupHeroCrossfade(cases);
  buildPackShowcase(cases);
});
