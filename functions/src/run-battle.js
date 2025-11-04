const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

function sendCorsHeaders(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async (req, res) => {
  sendCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const battleId = req.query.battleId;
  if (!battleId) {
    res.status(400).json({ error: 'battleId required' });
    return;
  }

  processBattle(battleId).catch(error => {
    console.error('run-battle error', error);
  });

  res.status(200).json({ ok: true });
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function processBattle(id) {
  const ref = db.collection('battles').doc(id);

  for (;;) {
    const snap = await ref.get();
    if (!snap.exists) {
      return;
    }

    const battle = snap.data();
    const now = new Date();

    if (battle.status === 'lobby') {
      const wait = battle.botFillAt ? battle.botFillAt.toDate() - now : 0;
      if (wait > 0) {
        await sleep(wait);
      }

      const players = battle.players ? [...battle.players] : [];
      while (players.length < battle.maxPlayers) {
        players.push({
          uid: 'bot-' + Math.random().toString(36).slice(2, 8),
          displayName: 'Bot',
          isBot: true,
          total: 0,
          pulls: []
        });
      }

      const countdownEndsAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 5000));
      await ref.set({ players, status: 'countdown', countdownEndsAt }, { merge: true });
      continue;
    }

    if (battle.status === 'countdown') {
      const wait = battle.countdownEndsAt ? battle.countdownEndsAt.toDate() - now : 0;
      if (wait > 0) {
        await sleep(wait);
      }

      const players = battle.players ? [...battle.players] : [];
      while (players.length < battle.maxPlayers) {
        players.push({
          uid: 'bot-' + Math.random().toString(36).slice(2, 8),
          displayName: 'Bot',
          isBot: true,
          total: 0,
          pulls: []
        });
      }

      await ref.set({ players, status: 'spinning', roundIndex: 0 }, { merge: true });
      continue;
    }

    if (battle.status === 'spinning') {
      await runLoop(ref);
      return;
    }

    return;
  }
}

async function runLoop(ref) {
  const packCache = new Map();

  for (;;) {
    const snap = await ref.get();
    const data = snap.data();
    if (!data || data.status !== 'spinning') {
      return;
    }

    const round = data.roundIndex || 0;
    const players = data.players || [];
    const packs = data.packs || [];
    const packMeta = packs[round % packs.length];

    if (!packMeta) {
      await ref.set({ status: 'completed' }, { merge: true });
      return;
    }

    const pack = await getPack(packMeta.id, packCache);
    const prizes = Array.isArray(pack?.prizes) ? pack.prizes : [];

    const pulls = players.map(player => ({
      uid: player.uid,
      prize: pickPrize(prizes)
    }));

    const totals = pulls.map(pull => Number(pull.prize?.value || 0));
    const highest = Math.max(...totals, 0);
    const winners = pulls
      .filter(pull => Number(pull.prize?.value || 0) === highest)
      .map(pull => pull.uid);

    const nextRound = round + 1;
    const newStatus = nextRound >= packs.length ? 'completed' : 'spinning';

    await ref.set({
      players: players.map((player, index) => ({
        ...player,
        total: Number(player.total || 0) + totals[index],
        pulls: [...(player.pulls || []), pulls[index].prize]
      })),
      roundIndex: nextRound,
      status: newStatus,
      winners
    }, { merge: true });

    if (newStatus !== 'spinning') {
      return;
    }

    await sleep(2000);
  }
}

async function getPack(id, cache) {
  if (!id) {
    return null;
  }

  if (cache.has(id)) {
    return cache.get(id);
  }

  const doc = await db.collection('packs').doc(id).get();
  if (!doc.exists) {
    cache.set(id, null);
    return null;
  }

  const pack = doc.data();
  cache.set(id, pack);
  return pack;
}

function pickPrize(prizes) {
  if (!Array.isArray(prizes) || prizes.length === 0) {
    return null;
  }

  const numericPrizes = prizes.map(prize => ({
    ...prize,
    odds: Number(prize.odds) || 0
  }));

  const totalOdds = numericPrizes.reduce((sum, prize) => sum + prize.odds, 0);
  if (!totalOdds) {
    return numericPrizes[numericPrizes.length - 1] || null;
  }

  const rand = Math.random() * totalOdds;
  let cumulative = 0;

  for (const prize of numericPrizes) {
    cumulative += prize.odds;
    if (rand < cumulative) {
      return prize;
    }
  }

  return numericPrizes[numericPrizes.length - 1] || null;
}
