let vaults = [];
let activeVault = null;
let timerInterval = null;

function renderActive(pack) {
  if (!pack) return;
  const price = parseFloat(pack.price) || 0;
  document.getElementById('pack-name').textContent = pack.name;
  document.getElementById('pack-image').src = pack.image;
  document.getElementById('pack-price').textContent = price.toLocaleString();
  document.getElementById('open-link').href = `vault.html?id=${pack.id}`;

  const cards = Object.values(pack.prizes || {}).sort((a,b) => (b.value || 0) - (a.value || 0));

  const topCards = cards.slice(0,2);
  const left = document.getElementById('top-card-1');
  const right = document.getElementById('top-card-2');
  [left, right].forEach(el => { el.classList.add('hidden'); el.classList.remove('legendary-spark'); });
  if (topCards[0]) {
    left.src = topCards[0].image;
    left.classList.remove('hidden');
    if ((topCards[0].rarity || '').toLowerCase().replace(/\s+/g,'') === 'legendary') left.classList.add('legendary-spark');
  }
  if (topCards[1]) {
    right.src = topCards[1].image;
    right.classList.remove('hidden');
    if ((topCards[1].rarity || '').toLowerCase().replace(/\s+/g,'') === 'legendary') right.classList.add('legendary-spark');
  }

  const preview = cards.slice(0,5);
  document.getElementById('card-preview').innerHTML = preview.map(c => `
    <div class="flex flex-col items-center">
      <img src="${c.image}" class="w-16 h-20 sm:w-20 sm:h-24 object-contain rounded-lg bg-black/40 border-2 border-yellow-500/40 shadow-lg transform transition-transform duration-300 hover:scale-105" />
      <div class="mt-1 flex items-center gap-1 text-sm">
        <img src="https://cdn-icons-png.flaticon.com/128/6369/6369589.png" class="w-4 h-4" />
        ${Number(c.value || 0).toLocaleString()}
      </div>
    </div>
  `).join('');
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

