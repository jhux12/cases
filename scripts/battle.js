(function() {
  const themeToggle = document.getElementById('theme-toggle');
  const main = document.querySelector('main');
  const packListEl = document.getElementById('pack-list');
  const loserPrizeList = document.getElementById('loser-prize-list');
  const selectedPacksEl = document.getElementById('selected-packs');
  const entryCostEl = document.getElementById('entry-cost');
  const totalPotEl = document.getElementById('total-pot');
  const packsSelectedCount = document.getElementById('packs-selected-count');
  const liveBattlesEl = document.getElementById('live-battles');
  const myBattlesEl = document.getElementById('my-battles');
  const myBattlesCount = document.getElementById('my-battles-count');

  let selectedPackIds = new Set();
  let cachedPacks = [];
  let selectedLoserPrize = null;
  let currentUser = null;
  let liveBattles = [];

  function getTheme() {
    return localStorage.getItem('battle-theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  }
  function applyTheme(theme) {
    main.setAttribute('data-theme', theme);
    themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';
    localStorage.setItem('battle-theme', theme);
  }
  function toggleTheme() {
    applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
  }

  themeToggle?.addEventListener('click', toggleTheme);
  applyTheme(getTheme());

  function renderPacks() {
    packListEl.innerHTML = '';
    cachedPacks.forEach((pack) => {
      const card = document.createElement('div');
      card.className = `pack-card ${selectedPackIds.has(pack.id) ? 'selected' : ''}`;
      card.innerHTML = `
        <div class="flex">
          <img src="${pack.image || '/pack-opener.png'}" alt="${pack.name}" style="width:48px;height:48px;border-radius:12px;object-fit:cover;" />
          <div>
            <strong>${pack.name}</strong>
            <div class="muted">💎 ${pack.price}</div>
          </div>
        </div>
      `;
      card.addEventListener('click', () => {
        if (selectedPackIds.has(pack.id)) {
          selectedPackIds.delete(pack.id);
        } else {
          selectedPackIds.add(pack.id);
        }
        renderPacks();
        renderSummary();
      });
      packListEl.appendChild(card);
    });
  }

  function renderSummary() {
    const selected = cachedPacks.filter((p) => selectedPackIds.has(p.id));
    packsSelectedCount.textContent = `${selected.length} selected`;
    selectedPacksEl.innerHTML = selected.map((p) => `<div class="tag-pill">${p.name} • 💎 ${p.price}</div>`).join('');
    const total = selected.reduce((sum, p) => sum + Number(p.price), 0) + (selectedLoserPrize?.costGems || 0);
    entryCostEl.textContent = `💎 ${total}`;
    totalPotEl.textContent = `💎 ${total * 2}`;
  }

  function renderLoserPrizes(prizes) {
    loserPrizeList.innerHTML = '';
    prizes.forEach((prize) => {
      const card = document.createElement('div');
      const isSelected = selectedLoserPrize?.prizeId === prize.prizeId;
      card.className = `pack-card ${isSelected ? 'selected' : ''}`;
      card.innerHTML = `
        <div class="flex">
          <img src="${prize.image || '/pack-opener.png'}" alt="${prize.name}" style="width:48px;height:48px;border-radius:12px;object-fit:cover;" />
          <div>
            <strong>${prize.name}</strong>
            <div class="muted">Adds +💎 ${prize.costGems}</div>
          </div>
        </div>
      `;
      card.addEventListener('click', () => {
        selectedLoserPrize = isSelected ? null : prize;
        renderLoserPrizes(prizes);
        renderSummary();
      });
      loserPrizeList.appendChild(card);
    });
  }

  async function fetchPacks() {
    const snapshot = await firebase.database().ref('cases').once('value');
    const raw = snapshot.val() || {};
    cachedPacks = Object.entries(raw).map(([id, value]) => ({
      id,
      name: value.name || `Pack ${id}`,
      price: Number(value.price) || 0,
      image: value.image || value.cover || '/pack-opener.png',
    })).slice(0, 18);
    renderPacks();
    renderSummary();
  }

  async function fetchLoserPrizes() {
    const snapshot = await firebase.database().ref('loserPrizes').once('value');
    const raw = snapshot.val() || {};
    const prizes = Object.entries(raw).map(([prizeId, value]) => ({
      prizeId,
      name: value.name || 'Loser prize',
      costGems: Number(value.costGems || value.price || 0),
      image: value.image || '',
    }));
    renderLoserPrizes(prizes.slice(0, 6));
  }

  async function createBattle() {
    if (!currentUser) {
      alert('Sign in to create a battle.');
      return;
    }
    if (!selectedPackIds.size) {
      alert('Select at least one pack');
      return;
    }
    const packs = Array.from(selectedPackIds);
    const idToken = await currentUser.getIdToken();
    const body = { idToken, packs, loserPrizeId: selectedLoserPrize?.prizeId, mode: 'WTA' };
    const res = await fetch('/api/battles/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Failed to create battle');
      return;
    }
    window.location.href = `/battle-room.html?battleId=${data.battleId}`;
  }

  function renderBattleCard(battle, isMine = false) {
    const card = document.createElement('div');
    card.className = 'battle-card';
    const countdown = Math.max(0, Math.floor((battle.expiresAt - Date.now()) / 1000));
    card.innerHTML = `
      <div class="flex-between">
        <div>
          <strong>#${battle.shortId || battle.id || ''}</strong>
          <p class="muted">${battle.player1?.displayName || 'Player'} vs ${battle.player2?.displayName || 'Waiting'}</p>
        </div>
        <span class="status-pill">${battle.status}</span>
      </div>
      <div class="flex" style="margin-top:0.5rem;">
        <span class="tag-pill">Packs: ${battle.packs?.length || 0}</span>
        <span class="tag-pill">Entry 💎 ${battle.entryCostGems}</span>
        <span class="tag-pill">Pot 💎 ${battle.potGems}</span>
      </div>
      ${battle.loserPrize ? `<p class="muted">Loser prize: ${battle.loserPrize.name} (+💎 ${battle.loserPrize.costGems})</p>` : ''}
      <div class="flex-between" style="margin-top:0.75rem;">
        <small class="muted">AI joins in ${countdown}s</small>
        <div>${isMine ? '<button class="button secondary" data-open>Open</button>' : '<button class="button" data-join>Join</button>'}</div>
      </div>
    `;
    card.querySelector('[data-join]')?.addEventListener('click', () => joinBattle(battle.id));
    card.querySelector('[data-open]')?.addEventListener('click', () => {
      window.location.href = `/battle-room.html?battleId=${battle.id}`;
    });
    return card;
  }

  async function joinBattle(battleId) {
    if (!currentUser) {
      alert('Sign in to join battles');
      return;
    }
    const idToken = await currentUser.getIdToken();
    const res = await fetch('/api/battles/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, battleId }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Unable to join battle');
      return;
    }
    window.location.href = `/battle-room.html?battleId=${battleId}`;
  }

  function subscribeLiveBattles() {
    firebase.database().ref('battles').orderByChild('status').equalTo('waiting').on('value', (snap) => {
      const raw = snap.val() || {};
      liveBattles = Object.entries(raw).map(([id, val]) => ({ id, ...val, shortId: id.slice(-6) }));
      renderLiveBattles('newest');
    });
  }

  function renderLiveBattles(sort) {
    const sorted = [...liveBattles];
    if (sort === 'pot') sorted.sort((a, b) => b.potGems - a.potGems);
    if (sort === 'ending') sorted.sort((a, b) => a.expiresAt - b.expiresAt);
    if (sort === 'newest') sorted.sort((a, b) => b.createdAt - a.createdAt);
    liveBattlesEl.innerHTML = '';
    sorted.forEach((battle) => liveBattlesEl.appendChild(renderBattleCard(battle, false)));
  }

  function subscribeMyBattles() {
    if (!currentUser) return;
    firebase.database().ref('battles').on('value', (snap) => {
      const raw = snap.val() || {};
      const mine = Object.entries(raw)
        .map(([id, val]) => ({ id, ...val }))
        .filter((b) => b.player1?.uid === currentUser.uid || b.player2?.uid === currentUser.uid);
      myBattlesCount.textContent = `${mine.length} battles`;
      myBattlesEl.innerHTML = '';
      mine.forEach((battle) => myBattlesEl.appendChild(renderBattleCard(battle, true)));
    });
  }

  document.getElementById('create-battle')?.addEventListener('click', createBattle);
  document.getElementById('sort-buttons')?.addEventListener('click', (e) => {
    const sort = e.target.dataset.sort;
    if (sort) renderLiveBattles(sort);
  });

  firebase.auth().onAuthStateChanged((user) => {
    currentUser = user;
    if (!user) {
      alert('Please login to use battles');
      window.location.href = '/auth.html';
      return;
    }
    fetchPacks();
    fetchLoserPrizes();
    subscribeLiveBattles();
    subscribeMyBattles();
  });
})();
