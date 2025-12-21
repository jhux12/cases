const roomState = {
  battleId: null,
  battle: null,
  currentRound: null,
};

function qs(key) {
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

async function getIdToken() {
  if (window.firebase?.auth) {
    const user = window.firebase.auth().currentUser;
    if (user) return user.getIdToken();
  }
  return localStorage.getItem('mockIdToken') || 'mock-token';
}

function renderBattle(battle) {
  document.getElementById('room-title').textContent = battle.battleName || 'Battle Room';
  document.getElementById('room-status').textContent = `${battle.status} · Mode: ${battle.mode}`;
  const [aUid, bUid] = battle.playerUids || [];
  const a = battle.players?.[aUid] || {};
  const b = battle.players?.[bUid] || {};
  document.getElementById('player-a-name').textContent = a.displayName || 'Player A';
  document.getElementById('player-b-name').textContent = b.displayName || 'Player B';
  document.getElementById('player-a-total').textContent = `Total: ${Number(a.totalValue || 0)} 💎`;
  document.getElementById('player-b-total').textContent = `Total: ${Number(b.totalValue || 0)} 💎`;

  if (battle.status === 'finished') {
    const winner = battle.winnerUid === aUid ? a.displayName || 'Player A' : b.displayName || 'Player B';
    const banner = document.getElementById('winner-banner');
    banner.textContent = `${winner} wins!`;
    banner.hidden = false;
  }
}

function renderRound(round) {
  if (!round) return;
  document.getElementById('round-label').textContent = round.sequenceLabel || `Round ${round.roundIndex + 1}`;
  document.getElementById('round-pack').textContent = round.displayNameSnapshot || round.packId;
  if (round.status === 'rolled') {
    const [aUid, bUid] = roomState.battle?.playerUids || [];
    updateReveal('a', round.results?.[aUid]);
    updateReveal('b', round.results?.[bUid]);
  }
}

function updateReveal(slot, result) {
  const reveal = document.getElementById(`player-${slot}-reveal`);
  if (!result) {
    reveal.textContent = 'Waiting for roll...';
    return;
  }
  reveal.innerHTML = `
    <div class="item-row">
      <div class="thumb"></div>
      <div>
        <p class="eyebrow">${result.rarity}</p>
        <p class="subtitle">${result.itemName}</p>
        <p class="label">Value: 💎 ${Number(result.valueGems || 0)}</p>
      </div>
    </div>
  `;
  const history = document.getElementById(`player-${slot}-history`);
  const entry = document.createElement('li');
  entry.textContent = `${result.itemName} · ${result.rarity} · 💎 ${Number(result.valueGems || 0)}`;
  history.prepend(entry);
}

async function startBattle() {
  if (!roomState.battleId) return;
  try {
    const idToken = await getIdToken();
    const response = await fetch('/api/battle/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ battleId: roomState.battleId }),
    });
    if (!response.ok) throw new Error('Unable to start battle');
  } catch (error) {
    alert(error.message);
  }
}

async function rollNextRound() {
  if (!roomState.battleId) return;
  try {
    const idToken = await getIdToken();
    const response = await fetch('/api/battle/nextRound', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ battleId: roomState.battleId }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Unable to roll round');
    }
  } catch (error) {
    alert(error.message);
  }
}

function subscribeRealtime() {
  if (!window.firebase?.firestore) {
    document.getElementById('room-status').textContent = 'Realtime updates unavailable (Firebase not loaded)';
    return;
  }
  const battleRef = window.firebase.firestore().collection('battles').doc(roomState.battleId);
  battleRef.onSnapshot((snap) => {
    if (!snap.exists) return;
    roomState.battle = snap.data();
    renderBattle(roomState.battle);
    const idx = roomState.battle.currentRoundIndex || 0;
    battleRef.collection('rounds').doc(String(idx)).onSnapshot((roundSnap) => {
      roomState.currentRound = roundSnap.data();
      renderRound(roomState.currentRound);
    });
  });
}

function initBattleRoom() {
  roomState.battleId = qs('battleId');
  if (!roomState.battleId) {
    document.getElementById('room-title').textContent = 'Battle not found';
    return;
  }
  document.getElementById('start-battle').addEventListener('click', startBattle);
  document.getElementById('next-round').addEventListener('click', rollNextRound);
  subscribeRealtime();
}

document.addEventListener('DOMContentLoaded', initBattleRoom);
