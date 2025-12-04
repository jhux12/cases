const chargeStep = 20;
const statusMessages = [
  'Charge the bar to wake the free pack.',
  'Almost there — the seal is glowing.',
  'Ready! Tap reveal to peek inside.',
  'Bonus hype unlocked. Grab it while it sparkles.'
];

const celebratePhrases = [
  'Boom! Free pack unlocked.',
  'You juiced it! Tap reveal to claim.',
  'Glitter mode: on. Sign up to snag it.',
  'Charge maxed — your freebie is waiting.'
];

const qs = id => document.getElementById(id);

const elements = {
  card: qs('free-pack-card'),
  pulse: qs('free-pack-pulse'),
  confetti: qs('free-pack-confetti'),
  meter: qs('free-pack-meter-fill'),
  status: qs('free-pack-status'),
  charge: qs('free-pack-charge'),
  reveal: qs('free-pack-reveal')
};

let charge = 0;

const updateStatus = () => {
  const index = Math.min(Math.floor(charge / 40), statusMessages.length - 1);
  elements.status.textContent = statusMessages[index];
};

const updateMeter = () => {
  if (!elements.meter) return;
  elements.meter.style.width = `${Math.min(charge, 100)}%`;
  elements.card?.classList.toggle('is-amped', charge >= 60);
};

const handleCharge = () => {
  charge = charge >= 100 ? 0 : Math.min(100, charge + chargeStep);
  updateMeter();
  updateStatus();
};

const handleReveal = () => {
  if (!elements.status) return;
  const message = celebratePhrases[Math.floor(Math.random() * celebratePhrases.length)];
  elements.status.textContent = message;
  elements.card?.classList.add('is-amped');
  setTimeout(() => elements.card?.classList.remove('is-amped'), 1200);
};

const initFreePackTile = () => {
  if (!elements.card) return;
  updateMeter();
  updateStatus();
  elements.charge?.addEventListener('click', handleCharge);
  elements.reveal?.addEventListener('click', handleReveal);
};

document.addEventListener('DOMContentLoaded', initFreePackTile);
