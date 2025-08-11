let vaults = [];
let activeVault = null;
let timerInterval = null;
let sliderInterval = null;

function renderActive(pack) {
  if (!pack) return;
  const price = parseFloat(pack.price) || 0;
  document.getElementById('pack-name').textContent = pack.name;
  document.getElementById('pack-image').src = pack.image;
  document.getElementById('pack-price').textContent = price.toLocaleString();
  document.getElementById('open-link').href = `vault.html?id=${pack.id}`;

  const cards = Object.values(pack.prizes || {}).sort((a,b) => (b.value || 0) - (a.value || 0));
  const preview = cards.slice(0,5);
  const slider = document.getElementById('card-slider');
  clearInterval(sliderInterval);
  let idx = 0;
  function showSlide(i){
    const c = preview[i];
    if(!c){ slider.innerHTML=''; return; }
    const rarity = (c.rarity || '').toLowerCase().replace(/\s+/g,'');
    slider.innerHTML = `
      <div class="relative flex flex-col items-center">
        <img src="${c.image}" class="w-full h-full object-contain rounded-lg bg-black/40 border-2 border-yellow-500/40 shadow-lg" />
        <div class="absolute bottom-1 left-1 flex items-center gap-1 text-xs bg-black/60 px-1 rounded">
          <img src="https://cdn-icons-png.flaticon.com/128/6369/6369589.png" class="w-3 h-3" />
          ${Number(c.value || 0).toLocaleString()}
        </div>
      </div>`;
    const wrapper = slider.firstElementChild;
    if(rarity === 'legendary') wrapper.classList.add('legendary-spark');
    else wrapper.classList.remove('legendary-spark');
  }
  if(preview.length){
    showSlide(0);
    sliderInterval = setInterval(() => {
      idx = (idx + 1) % preview.length;
      showSlide(idx);
    }, 2000);
  } else {
    slider.innerHTML = '';
  }
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

