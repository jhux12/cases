let currentPack = null;
let currentPrize = null;
let cardPrizes = [];
let selectedIndex = null;
let winningIndex = null;

const rarityColors = {
  common: '#a1a1aa',
  uncommon: '#4ade80',
  rare: '#60a5fa',
  ultrarare: '#c084fc',
  legendary: '#facc15'
};

function renderPack(data) {
  document.getElementById('pack-name').textContent = data.name;
  document.title = `Packly.gg | ${data.name}`;
  document.getElementById('main-pack-image').src = data.image;
  document.querySelectorAll('.case-pack-image').forEach(img => img.src = data.image);
  document.getElementById('pack-price').textContent = (data.price || 0).toLocaleString();

    const prizes = Object.values(data.prizes || {}).sort((a, b) => (b.value || 0) - (a.value || 0));
    const topCards = prizes.slice(0,2);
    const left = document.getElementById('top-card-1');
    const right = document.getElementById('top-card-2');
    [left, right].forEach(el => { el.classList.add('hidden'); el.classList.remove('legendary-spark'); });
    if (topCards[0]) {
      left.src = topCards[0].image;
      left.classList.remove('hidden');
      const rarity = (topCards[0].rarity || '').toLowerCase().replace(/\s+/g,'');
      left.style.borderColor = rarityColors[rarity] || '#a1a1aa';
      if (rarity === 'legendary') left.classList.add('legendary-spark');
    }
    if (topCards[1]) {
      right.src = topCards[1].image;
      right.classList.remove('hidden');
      const rarity = (topCards[1].rarity || '').toLowerCase().replace(/\s+/g,'');
      right.style.borderColor = rarityColors[rarity] || '#a1a1aa';
      if (rarity === 'legendary') right.classList.add('legendary-spark');
    }
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
  const snap = await firebase.database().ref('vaults/' + id).once('value');
  currentPack = snap.val();
  if (currentPack) renderPack(currentPack);
}

async function openPack() {
  if (!currentPack) return;
  const user = firebase.auth().currentUser;
  if (!user) return alert('You must be logged in.');

  const openBtn = document.getElementById('open-pack');
  openBtn.disabled = true;

  const userSnap = await firebase.database().ref('users/' + user.uid).once('value');
  const userData = userSnap.val() || {};
  const balance = parseFloat(userData.balance || 0);
  const price = parseFloat(currentPack.price || 0);
  if (balance < price) {
    openBtn.disabled = false;
    return alert('Not enough coins.');
  }

  const fairSnap = await firebase.database().ref('users/' + user.uid + '/provablyFair').once('value');
  const fairData = fairSnap.val();
  if (!fairData) {
    openBtn.disabled = false;
    return alert('Provably fair data missing.');
  }
  const { serverSeed, clientSeed, nonce } = fairData;

  await firebase.database().ref('users/' + user.uid + '/balance').set(balance - price);

  const prizes = Object.values(currentPack.prizes || {})
    .map(p => ({ ...p, odds: Number(p.odds) || 0 }))
    .sort((a,b) => a.odds - b.odds);
  const totalOdds = prizes.reduce((sum,p) => sum + p.odds, 0);

  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${serverSeed}:${clientSeed}:${nonce || 0}`));
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2,'0')).join('');
  const rand = parseInt(hashHex.substring(0,8),16) / 0xffffffff;

  let cumulative = 0;
  let winningPrize = prizes[prizes.length - 1];
  for (const p of prizes) {
    cumulative += p.odds;
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
  await firebase.database().ref('users/' + user.uid + '/provablyFair').update({ nonce: (nonce || 0) + 1 });

  // prepare prizes for the face-down cards and guarantee five entries
  const allPrizes = Object.values(currentPack.prizes || {});
  const keyFor = p => p.image || p.name;

  // collect up to four unique filler prizes different from the winning prize
  const fillers = [];
  const used = new Set([keyFor(winningPrize)]);
  for (const prize of allPrizes.sort(() => Math.random() - 0.5)) {
    const key = keyFor(prize);
    if (!used.has(key)) {
      fillers.push(prize);
      used.add(key);
    }
    if (fillers.length === 4) break;
  }

  // if we couldn't find four unique fillers, pad with random prizes
  while (fillers.length < 4 && allPrizes.length) {
    fillers.push(allPrizes[Math.floor(Math.random() * allPrizes.length)]);
  }

  cardPrizes = [...fillers, winningPrize].sort(() => Math.random() - 0.5);
  winningIndex = cardPrizes.findIndex(p => keyFor(p) === keyFor(winningPrize));

  selectedIndex = null;
  document.getElementById('pack-display').classList.add('hidden');
  document.getElementById('back-btn').classList.add('hidden');
  document.getElementById('pack-name').textContent = 'Pick Your Card';
  document.title = 'Packly.gg | Pick Your Card';
  setupCards();
}

function setupCards() {
  const container = document.getElementById('card-container');
  container.innerHTML = '';
  container.classList.remove('hidden');
  const backImg = currentPack.cardBack || 'https://via.placeholder.com/160x160?text=Back';
  cardPrizes.forEach((prize, i) => {
    const card = document.createElement('div');
    card.className = 'flip-card relative';
    card.dataset.index = i;
    card.style.opacity = '0';
    card.style.transform = 'translateY(200px) rotate(0deg)';
    card.style.transition = 'transform 0.6s ease, opacity 0.6s ease';
    card.innerHTML = `
      <div class="flip-card-inner">
        <img class="flip-card-front w-full h-full object-contain rounded-xl" src="${prize.image}" alt="Front" />
        <img class="flip-card-back w-full h-full object-contain rounded-xl" src="${backImg}" alt="Back" />
      </div>`;
    card.addEventListener('click', () => selectCard(card, i));
    container.appendChild(card);
    setTimeout(() => {
      card.style.opacity = '1';
      card.style.transform = `translateY(0) rotate(${(i-2)*10}deg)`;
    }, i * 150);
  });
}

function flipCard(index) {
  const card = document.querySelector(`.flip-card[data-index="${index}"]`);
  if (card) card.classList.add('flipped');
}

function selectCard(card, index) {
  if (selectedIndex !== null) return;
  selectedIndex = index;

  const originalPrize = cardPrizes[index];
  const originalWinningIndex = winningIndex;

  // move the winning prize to the chosen card and shift the previous prize
  cardPrizes[index] = currentPrize;
  if (originalWinningIndex !== index) {
    cardPrizes[originalWinningIndex] = originalPrize;
    const winCard = document.querySelector(`.flip-card[data-index="${originalWinningIndex}"]`);
    if (winCard) {
      winCard.querySelector('.flip-card-front').src = originalPrize.image;
    }
  }
  const front = card.querySelector('.flip-card-front');
  front.src = currentPrize.image;
  winningIndex = index;

  // visually mark the chosen card
  const label = document.createElement('div');
  label.textContent = 'Your Pick';
  label.className = 'absolute -top-6 left-1/2 -translate-x-1/2 text-xs bg-purple-600 px-2 py-1 rounded shadow';
  card.appendChild(label);
  card.classList.add('ring-4', 'ring-yellow-400', 'selected');

  const others = cardPrizes
    .map((p,i) => ({p,i}))
    .filter(obj => obj.i !== index)
    .sort((a,b) => a.p.value - b.p.value); // highest value last

  const delay = 400;
  others.forEach((obj, idx) => {
    setTimeout(() => flipCard(obj.i), idx * delay);
  });

  setTimeout(() => {
    flipCard(index);
    setTimeout(showWinPopup, 600);
  }, others.length * delay + 400);
}

function showWinPopup() {
  const imgEl = document.getElementById('popup-image');
  const nameEl = document.getElementById('popup-name');
  const valueEl = document.getElementById('popup-value');
  const rarityEl = document.getElementById('popup-rarity');
  const oddsEl = document.getElementById('popup-odds');
  const cardEl = document.getElementById('popup-card');

  imgEl.src = currentPrize.image;
  nameEl.textContent = currentPrize.name;
  valueEl.textContent = currentPrize.value.toLocaleString();
  document.getElementById('sell-value').textContent = Math.floor(currentPrize.value * 0.8).toLocaleString();

  const rarityKey = (currentPrize.rarity || 'common').toLowerCase().replace(/\s+/g,'');
  const color = rarityColors[rarityKey] || '#a1a1aa';
  rarityEl.textContent = currentPrize.rarity || '';
  rarityEl.style.color = color;
  oddsEl.textContent = `${(currentPrize.odds || 0).toFixed(1)}%`;
  cardEl.style.borderColor = color;

  imgEl.classList.remove('glow-flash-common','glow-flash-uncommon','glow-flash-rare','glow-flash-ultrarare','glow-flash-legendary');
  imgEl.classList.add(`glow-flash-${rarityKey}`);

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
  const container = document.getElementById('card-container');
  container.classList.add('hidden');
  container.innerHTML = '';
  document.getElementById('pack-display').classList.remove('hidden');
  document.getElementById('back-btn').classList.remove('hidden');
  document.getElementById('open-pack').disabled = false;
  if (currentPack) {
    document.getElementById('pack-name').textContent = currentPack.name;
    document.title = `Packly.gg | ${currentPack.name}`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadPack();
  document.getElementById('open-pack').addEventListener('click', openPack);
  const keepBtn = document.getElementById('keep-btn');
  const sellBtn = document.getElementById('sell-btn');

  document.getElementById('close-popup').addEventListener('click', () => {
    document.getElementById('win-popup').classList.add('hidden');
    resetGame();
  });
  keepBtn.addEventListener('click', () => {
    keepBtn.disabled = true;
    sellBtn.disabled = true;
    document.getElementById('win-popup').classList.add('hidden');
    resetGame();
  });
  sellBtn.addEventListener('click', async () => {
    if (sellBtn.disabled) return;
    sellBtn.disabled = true;
    keepBtn.disabled = true;
    await sellPrize();
    document.getElementById('win-popup').classList.add('hidden');
    resetGame();
  });

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
