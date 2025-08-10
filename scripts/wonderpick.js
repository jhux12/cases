let currentPack = null;
let currentPrize = null;

function renderPack(data) {
  document.getElementById('pack-name').textContent = data.name;
  document.getElementById('pack-image').src = data.image;
  const prizeList = document.getElementById('prize-list');
  prizeList.innerHTML = '';
  Object.values(data.prizes || {}).slice(0,5).forEach(p => {
    const img = document.createElement('img');
    img.src = p.image;
    img.alt = p.name;
    img.className = 'w-20 h-20 object-contain rounded';
    prizeList.appendChild(img);
  });
}

async function loadPack() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) return;
  const snap = await firebase.database().ref('cases/' + id).once('value');
  currentPack = snap.val();
  if (currentPack) renderPack(currentPack);
}

async function openPack() {
  if (!currentPack) return;
  const user = firebase.auth().currentUser;
  if (!user) return alert('You must be logged in.');

  const fairSnap = await firebase.database().ref('users/' + user.uid + '/provablyFair').once('value');
  const fairData = fairSnap.val();
  if (!fairData) return alert('Provably fair data missing.');
  const { serverSeed, clientSeed, nonce } = fairData;

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
  setupCards();
}

function setupCards() {
  const container = document.getElementById('card-container');
  container.innerHTML = '';
  const backImg = currentPack.cardBack || 'https://via.placeholder.com/160x160?text=Back';
  for (let i=0; i<5; i++) {
    const card = document.createElement('div');
    card.className = 'flip-card';
    card.style.transform = `rotate(${(i-2)*10}deg)`;
    card.innerHTML = `
      <div class="flip-card-inner">
        <img class="flip-card-front w-40 h-40 object-contain rounded" src="" alt="Front" />
        <img class="flip-card-back w-40 h-40 object-contain rounded" src="${backImg}" alt="Back" />
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

document.addEventListener('DOMContentLoaded', () => {
  loadPack();
  document.getElementById('open-pack').addEventListener('click', openPack);
  document.getElementById('close-popup').addEventListener('click', () => {
    document.getElementById('win-popup').classList.add('hidden');
  });
  document.getElementById('keep-btn').addEventListener('click', () => {
    document.getElementById('win-popup').classList.add('hidden');
  });
  document.getElementById('sell-btn').addEventListener('click', async () => {
    await sellPrize();
    document.getElementById('win-popup').classList.add('hidden');
  });
});
