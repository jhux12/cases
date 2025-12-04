const qs = id => document.getElementById(id);

const elements = {
  card: qs('free-pack-card'),
  confetti: qs('free-pack-confetti'),
  status: qs('free-pack-status'),
  reveal: qs('free-pack-reveal')
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
    elements.status.textContent = 'Sneaker + console highlighted — sign up to claim the free pack.';
  }

  elements.confetti?.classList.add('pop');
  setTimeout(() => elements.confetti?.classList.remove('pop'), 800);
};

const initFreePackTile = () => {
  if (!elements.card) return;
  setItemDelays();
  elements.reveal?.addEventListener('click', popItems);
};

document.addEventListener('DOMContentLoaded', initFreePackTile);
