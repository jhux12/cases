(function() {
  const themeToggle = document.getElementById('theme-toggle');
  const main = document.querySelector('main');
  const playerAEl = document.getElementById('player-a');
  const playerBEl = document.getElementById('player-b');
  const roundsEl = document.getElementById('rounds');
  const battleIdLabel = document.getElementById('battle-id');
  const statusLabel = document.getElementById('battle-status');
  const potDisplay = document.getElementById('pot-display');
  const startButton = document.getElementById('start-battle');
  const rollButton = document.getElementById('roll-round');
  const ctaRollButton = document.getElementById('cta-roll');
  const completionSection = document.getElementById('completion');
  const winnerBlock = document.getElementById('winner-block');
  const loserBlock = document.getElementById('loser-block');

  let currentUser = null;
  let battleId = new URLSearchParams(window.location.search).get('battleId');
  let currentBattle = null;
  let rolling = false;

  function getTheme() {
    return localStorage.getItem('battle-theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  }
  function applyTheme(theme) {
    main.setAttribute('data-theme', theme);
    themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';
    localStorage.setItem('battle-theme', theme);
  }
  themeToggle?.addEventListener('click', () => applyTheme(getTheme() === 'dark' ? 'light' : 'dark'));
  applyTheme(getTheme());

  function renderPlayer(el, player, label, staked) {
    el.innerHTML = `
      <div class="flex-between">
        <div class="flex">
          <img src="${player?.photoURL || '/pack-opener.png'}" style="width:56px;height:56px;border-radius:14px;object-fit:cover;" alt="${player?.displayName || label}" />
          <div>
            <p class="muted">${label}</p>
            <strong>${player?.displayName || 'Waiting...'}</strong>
            ${player?.isAI ? '<div class="tag-pill">AI Opponent</div>' : ''}
          </div>
        </div>
        <div class="tag-pill">Staked: 💎 ${staked}</div>
      </div>
    `;
  }

  function renderRounds(battle) {
    roundsEl.innerHTML = '';
    (battle.rounds || []).forEach((round, idx) => {
      const card = document.createElement('div');
      card.className = 'round-card';
      card.innerHTML = `
        <div class="flex-between">
          <strong>Round ${idx + 1}</strong>
          <span class="tag-pill">Pack ${round.packId}</span>
        </div>
        <div class="round-grid">
          <div class="player-column">
            <p class="muted">${battle.player1?.displayName || 'Player 1'}</p>
            <strong>${round.player1Result?.name || ''}</strong>
            <p class="muted">💎 ${round.player1Result?.value || 0}</p>
          </div>
          <div class="player-column">
            <p class="muted">${battle.player2?.displayName || 'Player 2'}</p>
            <strong>${round.player2Result?.name || ''}</strong>
            <p class="muted">💎 ${round.player2Result?.value || 0}</p>
          </div>
        </div>
      `;
      roundsEl.appendChild(card);
    });
  }

  async function rollRound() {
    if (rolling) return;
    rolling = true;
    startButton.disabled = true;
    rollButton.disabled = true;
    ctaRollButton.disabled = true;
    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch('/api/battles/rollRound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, battleId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Unable to roll round');
      }
    } finally {
      rolling = false;
      startButton.disabled = false;
      rollButton.disabled = false;
      ctaRollButton.disabled = false;
    }
  }

  function updateActions(battle) {
    const canRoll = battle.status === 'in_progress' && battle.player1 && battle.player2 && (battle.currentRound < battle.packs.length);
    startButton.style.display = battle.status === 'waiting' ? 'inline-flex' : 'none';
    rollButton.style.display = canRoll ? 'inline-flex' : 'none';
    ctaRollButton.style.display = canRoll ? 'inline-flex' : 'none';
  }

  function showCompletion(battle) {
    completionSection.style.display = 'block';
    const winner = battle.winnerUid === battle.player1?.uid ? battle.player1 : battle.player2;
    const loser = battle.winnerUid === battle.player1?.uid ? battle.player2 : battle.player1;
    winnerBlock.innerHTML = `<h3>${winner?.displayName || 'Winner'}</h3><p>Won 💎 ${battle.potGems}</p>`;
    loserBlock.innerHTML = battle.loserPrize ? `<h3>${loser?.displayName || 'Loser'}</h3><p>Loser prize: ${battle.loserPrize.name}</p>` : '';
  }

  function hydrate(battle) {
    currentBattle = battle;
    battleIdLabel.textContent = `Battle #${battleId}`;
    statusLabel.textContent = `${battle.status} • ${battle.mode || 'WTA'}`;
    potDisplay.textContent = `Pot: 💎 ${battle.potGems}`;
    renderPlayer(playerAEl, battle.player1, 'Player A', battle.entryCostGems);
    renderPlayer(playerBEl, battle.player2, 'Player B', battle.entryCostGems);
    renderRounds(battle);
    updateActions(battle);
    if (battle.status === 'complete') {
      showCompletion(battle);
    }
  }

  function subscribeBattle() {
    firebase.database().ref(`battles/${battleId}`).on('value', (snap) => {
      if (!snap.exists()) {
        statusLabel.textContent = 'Battle not found';
        return;
      }
      hydrate(snap.val());
    });
  }

  startButton?.addEventListener('click', rollRound);
  rollButton?.addEventListener('click', rollRound);
  ctaRollButton?.addEventListener('click', rollRound);

  firebase.auth().onAuthStateChanged((user) => {
    currentUser = user;
    if (!user) {
      alert('Please login to view battles');
      window.location.href = '/auth.html';
      return;
    }
    subscribeBattle();
  });
})();
