const state = {
  balance: 0,
  packs: [
    { id: 'crystal', name: 'Crystal Storm', price: 120, difficulty: 2, image: 'CR' },
    { id: 'neon', name: 'Neon Pulse', price: 80, difficulty: 1, image: 'NP' },
    { id: 'mythic', name: 'Mythic Vault', price: 220, difficulty: 3, image: 'MV' },
    { id: 'ember', name: 'Ember Rush', price: 60, difficulty: 1, image: 'ER' },
    { id: 'shadow', name: 'Shadow Core', price: 150, difficulty: 2, image: 'SC' },
    { id: 'prism', name: 'Prism Flux', price: 95, difficulty: 2, image: 'PF' },
  ],
  selectedPacks: {},
  createBattleForm: {
    name: '',
    players: 2,
    mode: 'total',
    privacy: 'public',
  },
  publicBattles: [
    { id: 'b-100', name: 'Twilight Trials', players: 4, joined: 2, packs: 3, mode: 'Total Value Wins', costPerPlayer: 180, userJoined: false },
    { id: 'b-101', name: 'Pulse Party', players: 3, joined: 3, packs: 2, mode: 'Best Single Pull', costPerPlayer: 95, userJoined: true },
  ],
  myBattles: [
    { id: 'm-200', name: 'Vault Kings', players: 2, joined: 1, packs: 4, mode: 'Most Rare Pull', costPerPlayer: 210, userJoined: true },
  ],
  searchTerm: '',
};

function requireAuth() {
  console.log('Auth placeholder: allow access to battle page');
  return true;
}

function getUserBalance() {
  return 1250;
}

function initBattlePage() {
  requireAuth();
  state.balance = getUserBalance();
  document.getElementById('balance-display').textContent = `Balance: 🪙 ${state.balance.toLocaleString()}`;

  bindForm();
  renderPackCatalog();
  renderSelectedSummary();
  renderLobbyList('public');
  attachModalHandlers();
}

function bindForm() {
  const nameInput = document.getElementById('battle-name');
  const playersSelect = document.getElementById('battle-players');
  const modeSelect = document.getElementById('battle-mode');
  const searchInput = document.getElementById('pack-search');
  const publicBtn = document.getElementById('create-public');
  const privateBtn = document.getElementById('create-private');
  const tabButtons = Array.from(document.querySelectorAll('.tab'));

  nameInput.addEventListener('input', (e) => {
    state.createBattleForm.name = e.target.value;
  });

  playersSelect.addEventListener('change', (e) => {
    state.createBattleForm.players = parseInt(e.target.value, 10);
    renderSelectedSummary();
  });

  modeSelect.addEventListener('change', (e) => {
    state.createBattleForm.mode = e.target.options[e.target.selectedIndex].text;
  });

  searchInput.addEventListener('input', (e) => {
    state.searchTerm = e.target.value.toLowerCase();
    renderPackCatalog();
  });

  publicBtn.addEventListener('click', () => createBattle('public'));
  privateBtn.addEventListener('click', () => createBattle('private'));

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      btn.setAttribute('aria-selected', 'true');
      tabButtons
        .filter((other) => other !== btn)
        .forEach((other) => other.setAttribute('aria-selected', 'false'));
      renderLobbyList(tab === 'public' ? 'public' : 'my');
    });
  });
}

function renderPackCatalog() {
  const grid = document.getElementById('pack-grid');
  grid.innerHTML = '';
  const packs = state.packs.filter((pack) =>
    pack.name.toLowerCase().includes(state.searchTerm)
  );

  packs.forEach((pack) => {
    const card = document.createElement('article');
    card.className = 'pack-card';

    const thumb = document.createElement('div');
    thumb.className = 'pack-thumb';
    thumb.textContent = pack.image;

    const info = document.createElement('div');
    info.className = 'pack-info';
    const title = document.createElement('h4');
    title.textContent = pack.name;
    const price = document.createElement('p');
    price.textContent = `Price: 🪙 ${pack.price}`;
    const difficulty = document.createElement('p');
    difficulty.className = 'difficulty';
    difficulty.textContent = '🌶'.repeat(pack.difficulty);

    info.append(title, price, difficulty);

    const stepper = document.createElement('div');
    stepper.className = 'stepper';
    const qty = state.selectedPacks[pack.id] || 0;
    const minus = document.createElement('button');
    minus.type = 'button';
    minus.textContent = '–';
    minus.addEventListener('click', () => updatePackQty(pack.id, -1));

    const qtyLabel = document.createElement('span');
    qtyLabel.textContent = qty;

    const plus = document.createElement('button');
    plus.type = 'button';
    plus.textContent = '+';
    plus.addEventListener('click', () => updatePackQty(pack.id, 1));

    stepper.append(minus, qtyLabel, plus);
    card.append(thumb, info, stepper);
    grid.appendChild(card);
  });
}

function updatePackQty(id, delta) {
  const current = state.selectedPacks[id] || 0;
  const next = Math.max(0, current + delta);
  if (next === 0) {
    delete state.selectedPacks[id];
  } else {
    state.selectedPacks[id] = next;
  }
  renderPackCatalog();
  renderSelectedSummary();
}

function renderSelectedSummary() {
  const totalPacks = Object.values(state.selectedPacks).reduce((sum, qty) => sum + qty, 0);
  const costPerPlayer = Object.entries(state.selectedPacks).reduce((sum, [packId, qty]) => {
    const pack = state.packs.find((p) => p.id === packId);
    return sum + (pack ? pack.price * qty : 0);
  }, 0);
  const totalPot = costPerPlayer * state.createBattleForm.players;

  document.getElementById('total-packs').textContent = totalPacks;
  document.getElementById('cost-per-player').textContent = `🪙 ${costPerPlayer.toLocaleString()}`;
  document.getElementById('total-pot').textContent = `🪙 ${totalPot.toLocaleString()}`;

  const canAfford = costPerPlayer > 0 && state.balance >= costPerPlayer;
  document.getElementById('create-public').disabled = !canAfford;
  document.getElementById('create-private').disabled = !canAfford;
}

function renderLobbyList(tab) {
  const list = document.getElementById('lobby-list');
  list.innerHTML = '';
  const data = tab === 'public' ? state.publicBattles : state.myBattles;

  if (!data.length) {
    const empty = document.createElement('p');
    empty.textContent = 'No battles yet. Create one to get started!';
    empty.className = 'subtitle';
    list.appendChild(empty);
    return;
  }

  data.forEach((battle) => {
    const card = document.createElement('article');
    card.className = 'battle-card';

    const meta = document.createElement('div');
    meta.className = 'battle-meta';
    const title = document.createElement('h4');
    title.textContent = battle.name;
    const info = document.createElement('p');
    info.textContent = `${battle.joined}/${battle.players} joined · ${battle.packs} packs · ${battle.mode}`;
    const cost = document.createElement('p');
    cost.textContent = `Cost per player: 🪙 ${battle.costPerPlayer.toLocaleString()}`;
    meta.append(title, info, cost);

    const actions = document.createElement('div');
    actions.className = 'card-actions';
    const status = document.createElement('span');
    status.className = 'status-pill';
    status.textContent = battle.joined >= battle.players ? 'Full' : 'Open';

    const actionBtn = document.createElement('button');
    actionBtn.className = battle.userJoined ? 'secondary' : 'primary';
    actionBtn.textContent = battle.userJoined ? 'Enter' : 'Join';
    actionBtn.addEventListener('click', () => {
      if (battle.userJoined) {
        enterBattle(battle.id);
      } else {
        joinBattle(battle.id, tab);
      }
    });

    actions.append(status, actionBtn);
    card.append(meta, actions);
    list.appendChild(card);
  });
}

function openModal(title, message) {
  const modal = document.getElementById('modal');
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-message').textContent = message;
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  const modal = document.getElementById('modal');
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
}

function attachModalHandlers() {
  const close = document.getElementById('modal-close');
  const ok = document.getElementById('modal-ok');
  const modal = document.getElementById('modal');
  [close, ok].forEach((btn) => btn.addEventListener('click', closeModal));
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });
}

function createBattle(privacy) {
  const nameInput = document.getElementById('battle-name');
  state.createBattleForm.name = nameInput.value.trim() || 'Untitled Battle';
  state.createBattleForm.privacy = privacy;

  const costPerPlayer = Object.entries(state.selectedPacks).reduce((sum, [packId, qty]) => {
    const pack = state.packs.find((p) => p.id === packId);
    return sum + (pack ? pack.price * qty : 0);
  }, 0);

  if (!costPerPlayer) {
    openModal('Add packs', 'Select at least one pack to start a battle.');
    return;
  }

  if (state.balance < costPerPlayer) {
    openModal('Insufficient balance', 'You need more coins to start this battle.');
    return;
  }

  const id = `battle-${Date.now()}`;
  const code = `PB-${Math.floor(Math.random() * 9000 + 1000)}`;
  const newBattle = {
    id,
    name: state.createBattleForm.name,
    players: state.createBattleForm.players,
    joined: 1,
    packs: Object.values(state.selectedPacks).reduce((a, b) => a + b, 0),
    mode: state.createBattleForm.mode,
    costPerPlayer,
    userJoined: true,
  };

  state.myBattles = [newBattle, ...state.myBattles];
  if (privacy === 'public') {
    state.publicBattles = [newBattle, ...state.publicBattles];
  }

  renderLobbyList('my');
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.tab === 'my');
    tab.setAttribute('aria-selected', tab.dataset.tab === 'my');
  });

  openModal('Battle created (mock)', privacy === 'private' ? `Share code: ${code}` : 'Added to public lobby.');
}

function joinBattle(battleId, tab) {
  const list = tab === 'public' ? state.publicBattles : state.myBattles;
  const battle = list.find((b) => b.id === battleId);
  if (!battle) {
    openModal('Not found', 'Battle is no longer available.');
    return;
  }
  if (battle.joined >= battle.players) {
    openModal('Full', 'This battle is already full.');
    return;
  }
  battle.joined += 1;
  battle.userJoined = true;

  if (tab === 'public' && !state.myBattles.find((b) => b.id === battleId)) {
    state.myBattles = [battle, ...state.myBattles];
  }

  renderLobbyList(tab);
  openModal('Joined battle (mock)', 'Routing to battle room soon...');
}

function enterBattle(battleId) {
  openModal('Entering battle room (mock)', `Battle ID: ${battleId}`);
}

document.addEventListener('DOMContentLoaded', initBattlePage);
