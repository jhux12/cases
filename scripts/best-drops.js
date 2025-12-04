const qs = id => document.getElementById(id);

const elements = {
  card: qs('free-pack-card'),
  confetti: qs('free-pack-confetti'),
  status: qs('free-pack-status'),
  reveal: qs('free-pack-reveal'),
  image: qs('free-pack-image'),
  title: document.querySelector('.free-pack-title'),
  sub: document.querySelector('.free-pack-sub'),
  itemLeft: qs('free-pack-item-left'),
  itemRight: qs('free-pack-item-right')
};

const defaults = {
  name: 'Free mystery pack',
  description: 'See the two biggest hits waiting inside your welcome pack. Claim them by signing up.',
  image:
    'https://firebasestorage.googleapis.com/v0/b/cases-e5b4e.firebasestorage.app/o/Pack%20Images%2FUntitled%20design%20(27).png?alt=media&token=27661ed2-182e-49d5-a635-f07d19410001',
  items: [
    {
      label: 'Top sneaker pull',
      image:
        'https://firebasestorage.googleapis.com/v0/b/cases-e5b4e.firebasestorage.app/o/Shoebox.png?alt=media&token=6b9c97f2-3ba1-4bbd-8d14-3c17bf96393c'
    },
    {
      label: 'Bonus console hit',
      image:
        'https://firebasestorage.googleapis.com/v0/b/cases-e5b4e.firebasestorage.app/o/PS5.png?alt=media&token=05b9bf7a-5d85-4452-b192-1cf4b616b36f'
    }
  ]
};

let activePack = { ...defaults };

const parsePrizeValue = value => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  const numeric = parseFloat(value.toString().replace(/[^0-9.]/g, ''));
  return Number.isNaN(numeric) ? 0 : numeric;
};

const getTopPrizes = (prizes = {}, limit = 2) => {
  const list = Array.isArray(prizes) ? prizes : Object.values(prizes || {});
  return [...list]
    .map(prize => ({ ...prize, numericValue: parsePrizeValue(prize.value) }))
    .sort((a, b) => (b.numericValue || 0) - (a.numericValue || 0))
    .slice(0, limit);
};

const setItemContent = (el, data, fallback) => {
  if (!el) return;
  const img = el.querySelector('img');
  const label = el.querySelector('.free-pack-item-label');
  const chosen = data || fallback;
  if (img) {
    img.src = chosen?.image || fallback?.image || '';
    img.alt = chosen?.name || chosen?.label || 'Pack reward';
  }
  if (label) {
    const parts = [chosen?.name || chosen?.label || 'Top pull'];
    if (chosen?.value) parts.push(chosen.value);
    label.textContent = parts.join(' · ');
  }
};

const resolvePackImage = pack => {
  if (!pack) return defaults.image;
  const { image, cardBack, coverImage, packImage, caseImage, images } = pack;
  const nestedImage = images?.cover || images?.main || images?.card;
  return image || cardBack || coverImage || packImage || caseImage || nestedImage || defaults.image;
};

const renderPack = pack => {
  if (!elements.card) return;
  const selected = pack || defaults;
  activePack = selected;

  const [left, right] = getTopPrizes(selected.prizes || {}, 2);
  const [fallbackLeft, fallbackRight] = defaults.items;

  setItemContent(elements.itemLeft, left, fallbackLeft);
  setItemContent(elements.itemRight, right, fallbackRight);

  if (elements.image) {
    elements.image.src = resolvePackImage(selected);
    elements.image.alt = selected.name ? `${selected.name} pack` : 'Free signup pack';
  }
  if (elements.title) {
    const packName = selected.name || selected.caseName || defaults.name;
    elements.title.textContent = `Claim the ${packName} free when you join`;
  }
  if (elements.sub) {
    elements.sub.textContent = selected.description || defaults.description;
  }
};

const fetchFreePack = async () => {
  if (!(window.firebase?.database)) {
    renderPack(defaults);
    return;
  }
  try {
    const snapshot = await firebase.database().ref('cases').once('value');
    const cases = snapshot.val() || {};
    const freeEntry = Object.entries(cases).find(([, value]) => value.isFree);
    if (freeEntry) {
      const [caseId, data] = freeEntry;
      renderPack({ ...data, id: caseId });
    } else {
      renderPack(defaults);
    }
  } catch (error) {
    console.error('Error loading free pack', error);
    renderPack(defaults);
  }
};

const setItemDelays = () => {
  const items = document.querySelectorAll('.free-pack-item');
  items.forEach((item, index) => {
    item.style.transitionDelay = `${index * 80}ms`;
  });
};

const popItems = () => {
  if (!elements.card) return;
  elements.card.classList.remove('is-open');
  // Force reflow so repeated clicks re-trigger the animation
  void elements.card.offsetWidth;
  elements.card.classList.add('is-open');

  if (elements.status) {
    const packName = activePack?.name || 'free pack';
    elements.status.textContent = `Top hits from ${packName} revealed — tap again to replay.`;
  }

  elements.confetti?.classList.add('pop');
  setTimeout(() => elements.confetti?.classList.remove('pop'), 800);
};

const initFreePackTile = () => {
  if (!elements.card) return;
  setItemDelays();
  elements.reveal?.addEventListener('click', popItems);
  fetchFreePack();
};

document.addEventListener('DOMContentLoaded', initFreePackTile);
