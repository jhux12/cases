let wonderPicks = [];
let activePick = null;
let timerInterval = null;

function renderActive(pack) {
  if (!pack) return;
  const price = parseFloat(pack.price) || 0;
  document.getElementById('pack-name').textContent = pack.name;
  document.getElementById('pack-image').src = pack.image;
  document.getElementById('pack-price').textContent = price.toLocaleString();
  document.getElementById('open-link').href = `wonder-pick.html?id=${pack.id}`;
  const cards = Object.values(pack.prizes || {}).slice(0,5);
  document.getElementById('card-preview').innerHTML = cards.map(c => `
    <img src="${c.image}" class="w-20 h-24 object-contain rounded-lg bg-black/40 border-2 border-yellow-500/40 shadow-lg transform transition-transform duration-300 hover:scale-105" />
  `).join('');
}

function startTimer(expires) {
  clearInterval(timerInterval);
  const timerEl = document.getElementById('wp-timer');
  function update() {
    const diff = expires - Date.now();
    if (diff <= 0) {
      clearInterval(timerInterval);
      localStorage.removeItem('wpActive');
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
  if (!wonderPicks.length) return;
  const stored = JSON.parse(localStorage.getItem('wpActive') || '{}');
  const now = Date.now();
  if (stored.expires && now < stored.expires && wonderPicks.find(wp => wp.id === stored.id)) {
    activePick = wonderPicks.find(wp => wp.id === stored.id);
    startTimer(stored.expires);
  } else {
    activePick = wonderPicks[Math.floor(Math.random() * wonderPicks.length)];
    const expires = now + 30 * 60 * 1000;
    localStorage.setItem('wpActive', JSON.stringify({ id: activePick.id, expires }));
    startTimer(expires);
  }
  renderActive(activePick);
}

function loadWonderPicks() {
  firebase.database().ref('wonderPicks').once('value').then(snap => {
    const data = snap.val() || {};
    wonderPicks = Object.entries(data).map(([id, val]) => ({ id, ...val }));
    chooseActive();
  });
}

document.addEventListener('DOMContentLoaded', loadWonderPicks);

