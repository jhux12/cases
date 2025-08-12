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
  const timerEl = document.getElementById('pickem-timer');
  function update() {
    const diff = expires - Date.now();
    if (diff <= 0) {
      clearInterval(timerInterval);
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
  const HALF_HOUR = 30 * 60 * 1000;
  const now = Date.now();
  const period = Math.floor(now / HALF_HOUR);
  const stored = JSON.parse(localStorage.getItem('pickemActive') || '{}');
  if (stored.period === period && vaults.find(v => v.id === stored.id)) {
    activeVault = vaults.find(v => v.id === stored.id);
  } else {
    activeVault = vaults[Math.floor(Math.random() * vaults.length)];
    localStorage.setItem('pickemActive', JSON.stringify({ id: activeVault.id, period }));
  }
  const expires = (period + 1) * HALF_HOUR;
  startTimer(expires);
  renderActive(activeVault);
}

function loadVaults() {
  firebase.database().ref('vaults').once('value').then(snap => {
    const data = snap.val() || {};
    vaults = Object.entries(data).map(([id, val]) => ({ id, ...val }));
    chooseActive();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadVaults();

  const pfBtn = document.getElementById('pf-info');
  if (pfBtn) {
    pfBtn.addEventListener('click', async () => {
      const user = firebase.auth().currentUser;
      if (!user) return;

      const fairSnap = await firebase.database().ref(`users/${user.uid}/provablyFair`).once('value');
      const fairData = fairSnap.val();

      document.getElementById('pf-server-seed').textContent = fairData?.serverSeed || 'Not found';
      document.getElementById('pf-client-seed').textContent = fairData?.clientSeed || 'Not found';
      document.getElementById('pf-nonce').textContent = fairData?.nonce ?? 'Not found';

      document.getElementById('provably-fair-modal').classList.remove('hidden');
    });

    document.getElementById('update-client-seed').addEventListener('click', async () => {
      const user = firebase.auth().currentUser;
      if (!user) return;
      const newSeed = document.getElementById('client-seed-input').value.trim();
      if (!newSeed) return;
      await firebase.database().ref(`users/${user.uid}/provablyFair`).update({ clientSeed: newSeed, nonce: 0 });
      document.getElementById('pf-client-seed').textContent = newSeed;
      document.getElementById('pf-nonce').textContent = 0;
    });

    document.getElementById('new-server-seed').addEventListener('click', async () => {
      const user = firebase.auth().currentUser;
      if (!user) return;
      const serverSeed = generateRandomString(64);
      const serverSeedHash = await sha256(serverSeed);
      const clientSeed = document.getElementById('pf-client-seed').textContent || 'default';
      await firebase.database().ref(`users/${user.uid}/provablyFair`).set({
        serverSeed,
        serverSeedHash,
        clientSeed,
        nonce: 0
      });
      document.getElementById('pf-server-seed').textContent = serverSeed;
      document.getElementById('pf-nonce').textContent = 0;
    });
  }
});

function generateRandomString(length) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

async function sha256(message) {
  const data = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hashBuffer)].map(b => b.toString(16).padStart(2, '0')).join('');
}

