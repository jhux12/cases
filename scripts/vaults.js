let vaults = [];
let activeVault = null;
let timerInterval = null;
let sliderInterval = null;

const rarityColors = {
  common: '#a1a1aa',
  uncommon: '#4ade80',
  rare: '#60a5fa',
  ultrarare: '#c084fc',
  legendary: '#facc15'
};

function renderActive(pack) {
  if (!pack) return;
  const price = parseFloat(pack.price) || 0;
  document.getElementById('pack-name').textContent = pack.name;
  document.getElementById('pack-image').src = pack.image;
  document.getElementById('pack-price').textContent = price.toLocaleString();
  document.getElementById('open-link').href = `vault.html?id=${pack.id}`;

  const cards = Object.values(pack.prizes || {}).sort((a,b) => (b.value || 0) - (a.value || 0));
  const slider = document.getElementById('card-slider');
  slider.innerHTML = '';
  slider.scrollLeft = 0;
  const sets = 5;
  const loopCards = Array.from({length: sets}, () => cards).flat();
  loopCards.forEach(c => {
    const wrapper = document.createElement('div');
    wrapper.className = 'relative flex-shrink-0 w-24 h-32 sm:w-32 sm:h-40';
    const img = document.createElement('img');
    img.src = c.image;
    img.className = 'w-full h-full object-contain rounded-lg bg-black/40 border-2 shadow-lg';
    const rarity = (c.rarity || '').toLowerCase().replace(/\s+/g,'');
    img.style.borderColor = rarityColors[rarity] || '#a1a1aa';
    wrapper.appendChild(img);
    const val = document.createElement('div');
    val.className = 'absolute bottom-1 left-1 flex items-center gap-1 text-xs bg-black/60 px-1 rounded';
    val.innerHTML = `<img src="https://cdn-icons-png.flaticon.com/128/6369/6369589.png" class="w-3 h-3" />${Number(c.value || 0).toLocaleString()}`;
    wrapper.appendChild(val);
    if(rarity === 'legendary') wrapper.classList.add('legendary-spark');
    slider.appendChild(wrapper);
  });
  if(cards.length){
    startAutoScroll(slider, sets);
  }
}

function startAutoScroll(slider, sets){
  clearInterval(sliderInterval);
  slider.dataset.pause = 'false';
  slider.onmouseenter = () => slider.dataset.pause = 'true';
  slider.onmouseleave = () => slider.dataset.pause = 'false';
  slider.ontouchstart = () => slider.dataset.pause = 'true';
  slider.ontouchend = () => slider.dataset.pause = 'false';
  sliderInterval = setInterval(() => {
    if (slider.dataset.pause === 'true') return;
    slider.scrollLeft += 1;
    if (slider.scrollLeft >= slider.scrollWidth / sets){
      slider.scrollLeft = 0;
    }
  },16);
}

function startTimer(expires) {
  clearInterval(timerInterval);
  const timerEl = document.getElementById('vault-timer');
  function update() {
    const diff = expires - Date.now();
    if (diff <= 0) {
      clearInterval(timerInterval);
      localStorage.removeItem('vaultActive');
      chooseActive();
      return;
    }
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    timerEl.textContent = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  }
  update();
  timerInterval = setInterval(update, 1000);
}

function chooseActive() {
  if (!vaults.length) return;
  const stored = JSON.parse(localStorage.getItem('vaultActive') || '{}');
  const now = Date.now();
  if (stored.expires && now < stored.expires && vaults.find(v => v.id === stored.id)) {
    activeVault = vaults.find(v => v.id === stored.id);
    startTimer(stored.expires);
  } else {
    activeVault = vaults[Math.floor(Math.random() * vaults.length)];
    const expires = now + 30 * 60 * 1000;
    localStorage.setItem('vaultActive', JSON.stringify({ id: activeVault.id, expires }));
    startTimer(expires);
  }
  renderActive(activeVault);
}

function loadVaults() {
  firebase.database().ref('vaults').once('value').then(snap => {
    const data = snap.val() || {};
    vaults = Object.entries(data).map(([id, val]) => ({ id, ...val }));
    chooseActive();
  });
}

document.addEventListener('DOMContentLoaded', loadVaults);

