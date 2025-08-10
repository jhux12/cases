let currentPack = null;
let currentPrize = null;

function renderPack(data) {
  document.getElementById('pack-name').textContent = data.name;
  document.getElementById('pack-image').src = data.image;
  document.getElementById('pack-price').textContent = (data.price || 0).toLocaleString();

  const prizes = Object.values(data.prizes || {});
  const rarityColors = {
    common: '#a1a1aa',
    uncommon: '#4ade80',
    rare: '#60a5fa',
    ultrarare: '#c084fc',
    legendary: '#facc15'
  };
  document.getElementById('prizes-grid').innerHTML = prizes.map(prize => {
    const rarity = (prize.rarity || 'common').toLowerCase().replace(/\s+/g,'');
    const color = rarityColors[rarity] || '#a1a1aa';
    return `
      <div class="prize-card relative rounded-xl p-4 bg-gray-800 border-2 text-white text-center shadow-sm transition-transform duration-200 hover:scale-105" style="border-color:${color}">
        <img src="${prize.image}" class="w-full h-[120px] object-contain mx-auto mb-3 bg-black/20 rounded-lg" />
        <div class="font-semibold text-sm clamp-2 mb-8">${prize.name}</div>
        <div class="absolute bottom-2 left-2 flex items-center gap-1 text-yellow-300 font-medium text-xs">
          <img src="https://cdn-icons-png.flaticon.com/128/6369/6369589.png" class="w-4 h-4" />
          ${(prize.value || 0).toLocaleString()}
        </div>
        <div class="absolute bottom-2 right-2 text-white/70 bg-black/40 px-2 py-[2px] text-xs rounded-full">
          ${(prize.odds || 0).toFixed(1)}%
        </div>
      </div>
    `;
  }).join('');
}

async function loadPack() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) return;
  const snap = await firebase.database().ref('wonderPicks/' + id).once('value');
  currentPack = snap.val();
  if (currentPack) renderPack(currentPack);
}

async function openPack() {
  if (!currentPack) return;
  const user = firebase.auth().currentUser;
  if (!user) return alert('You must be logged in.');

  const userSnap = await firebase.database().ref('users/' + user.uid).once('value');
  const userData = userSnap.val() || {};
  const balance = parseFloat(userData.balance || 0);
  const price = parseFloat(currentPack.price || 0);
  if (balance < price) return alert('Not enough coins.');

  const fairSnap = await firebase.database().ref('users/' + user.uid + '/provablyFair').once('value');
  const fairData = fairSnap.val();
  if (!fairData) return alert('Provably fair data missing.');
  const { serverSeed, clientSeed, nonce } = fairData;

  await firebase.database().ref('users/' + user.uid + '/balance').set(balance - price);

  const prizes = Object.values(currentPack.prizes || {}).sort((a,b) => a.odds - b.odds);
  const totalOdds = prizes.reduce((sum,p) => sum + (p.odds || 0), 0);

  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${serverSeed}:${clientSeed}:${nonce || 0}`));
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2,'0')).join('');
  const rand = parseInt(hashHex.substring(0,8),16) / 0xffffffff;

  let cumulative = 0;
  let winningPrize = prizes[prizes.length - 1];
  for (const p of prizes) {
    cumulative += p.odds || 0;
    if (rand * totalOdds < cumulative) { winningPrize = p; break; }
  }

  const unboxData = {
    name: winningPrize.name,
    image: winningPrize.image,
    rarity: winningPrize.rarity,
    value: winningPrize.value,
    timestamp: Date.now(),
    sold: false
  };
  const invRef = firebase.database().ref('users/' + user.uid + '/inventory').push();
  await invRef.set(unboxData);
  await firebase.database().ref('users/' + user.uid + '/unboxHistory/' + invRef.key).set(unboxData);
  currentPrize = { ...winningPrize, key: invRef.key };

  document.getElementById('pack-section').classList.add('hidden');
  document.getElementById('selection-section').classList.remove('hidden');
  document.getElementById('rewards-grid').innerHTML = document.getElementById('prizes-grid').innerHTML;
  setupCards();
}

function setupCards() {
  const container = document.getElementById('card-container');
  container.innerHTML = '';
  const backImg = currentPack.cardBack || 'https://via.placeholder.com/160x160?text=Back';
  for (let i = 0; i < 5; i++) {
    const card = document.createElement('div');
    card.className = 'flip-card animate-in';
    card.style.transform = `rotate(${(i-2)*10}deg)`;
    card.style.animationDelay = `${i * 0.1}s`;
    card.innerHTML = `
      <div class="flip-card-inner">
        <img class="flip-card-front w-40 h-40 object-contain rounded-xl" src="" alt="Front" />
        <img class="flip-card-back w-40 h-40 object-contain rounded-xl" src="${backImg}" alt="Back" />
      </div>`;
    card.addEventListener('click', () => revealCard(card));
    container.appendChild(card);
  }
}

function revealCard(card) {
  const front = card.querySelector('.flip-card-front');
  front.src = currentPrize.image;
  card.classList.add('flipped');
  showWinPopup();
}

function showWinPopup() {
  document.getElementById('popup-image').src = currentPrize.image;
  document.getElementById('popup-name').textContent = currentPrize.name;
  document.getElementById('popup-value').textContent = currentPrize.value.toLocaleString();
  document.getElementById('sell-value').textContent = Math.floor(currentPrize.value * 0.8).toLocaleString();
  document.getElementById('win-popup').classList.remove('hidden');
}

async function sellPrize() {
  const user = firebase.auth().currentUser;
  if (!user || !currentPrize) return;
  const sellAmount = Math.floor(currentPrize.value * 0.8);
  const balanceRef = firebase.database().ref('users/' + user.uid + '/balance');
  const balanceSnap = await balanceRef.once('value');
  const currentBalance = balanceSnap.val() || 0;
  await balanceRef.set(currentBalance + sellAmount);
  await firebase.database().ref('users/' + user.uid + '/inventory/' + currentPrize.key).remove();
}

function resetGame() {
  document.getElementById('selection-section').classList.add('hidden');
  document.getElementById('pack-section').classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  loadPack();
  document.getElementById('open-pack').addEventListener('click', openPack);
  document.getElementById('toggle-rewards').addEventListener('click', () => {
    document.getElementById('rewards-grid').classList.toggle('hidden');
  });
  document.getElementById('close-popup').addEventListener('click', () => {
    document.getElementById('win-popup').classList.add('hidden');
    resetGame();
  });
  document.getElementById('keep-btn').addEventListener('click', () => {
    document.getElementById('win-popup').classList.add('hidden');
    resetGame();
  });
  document.getElementById('sell-btn').addEventListener('click', async () => {
    await sellPrize();
    document.getElementById('win-popup').classList.add('hidden');
    resetGame();
  });
});
