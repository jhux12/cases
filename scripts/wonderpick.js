let currentPack = null;
let currentPrize = null;
let cardPrizes = [];
let selectedIndex = null;

function renderPack(data) {
  document.getElementById('pack-name').textContent = data.name;
  document.getElementById('pack-image').src = data.image;
  document.getElementById('main-pack-image').src = data.image;
  document.querySelectorAll('.case-pack-image').forEach(img => img.src = data.image);
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

  // prepare filler prizes for the face-down cards
  const allPrizes = Object.values(currentPack.prizes || {});
  const fillers = allPrizes.filter(p => p !== winningPrize);
  while (fillers.length < 5) {
    fillers.push(fillers[Math.floor(Math.random() * fillers.length)] || winningPrize);
  }
  // randomize filler order for card placement
  cardPrizes = fillers.slice(0,5).sort(() => Math.random() - 0.5);
  selectedIndex = null;
  document.getElementById('pack-display').classList.add('hidden');
  document.getElementById('back-btn').classList.add('hidden');
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
        <img class="flip-card-front w-40 h-40 object-contain rounded-xl" src="${prize.image}" alt="Front" />
        <img class="flip-card-back w-40 h-40 object-contain rounded-xl" src="${backImg}" alt="Back" />
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

  // replace the selected card's prize with the actual winning prize
  cardPrizes[index] = currentPrize;
  const front = card.querySelector('.flip-card-front');
  front.src = currentPrize.image;

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
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    setTimeout(showWinPopup, 600);
  }, others.length * delay + 400);
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
  const container = document.getElementById('card-container');
  container.classList.add('hidden');
  container.innerHTML = '';
  document.getElementById('pack-display').classList.remove('hidden');
  document.getElementById('back-btn').classList.remove('hidden');
  document.getElementById('open-pack').disabled = false;
}

document.addEventListener('DOMContentLoaded', () => {
  loadPack();
  document.getElementById('open-pack').addEventListener('click', openPack);
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
