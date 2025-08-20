const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

module.exports = async (req, res) => {
  const battleId = req.query.battleId;
  if (!battleId) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'battleId required' }));
    return;
  }

  // Progress the battle to completion in the background. We don't await the
  // runner so the HTTP request can return immediately; the event loop stays
  // alive via the pending async work.
  processBattle(battleId).catch(err => console.error('run-battle error', err));

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ ok: true }));
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Progress a battle until it finishes, waiting out lobby/countdown timers and
// spinning all rounds without requiring additional HTTP pings.
async function processBattle(id) {
  const ref = db.collection('battles').doc(id);

  for (;;) {
    const snap = await ref.get();
    if (!snap.exists) return;
    const b = snap.data();
    const now = new Date();

    if (b.status === 'lobby') {
      const wait = b.botFillAt ? b.botFillAt.toDate() - now : 0;
      if (wait > 0) await sleep(wait);
      const players = b.players || [];
      while (players.length < b.maxPlayers) {
        players.push({ uid: 'bot-' + Math.random().toString(36).slice(2,8), displayName: 'Bot', isBot: true, total: 0, pulls: [] });
      }
      const countdownEndsAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 5000));
      await ref.set({ players, status: 'countdown', countdownEndsAt }, { merge: true });
      continue;
    }

    if (b.status === 'countdown') {
      const wait = b.countdownEndsAt ? b.countdownEndsAt.toDate() - now : 0;
      if (wait > 0) await sleep(wait);
      const players = b.players || [];
      while (players.length < b.maxPlayers) {
        players.push({ uid: 'bot-' + Math.random().toString(36).slice(2,8), displayName: 'Bot', isBot: true, total: 0, pulls: [] });
      }
      await ref.set({ players, status: 'spinning', roundIndex: 0, turnIndex: 0 }, { merge: true });
      continue;
    }

    if (b.status === 'spinning') {
      await runLoop(ref);
      return;
    }

    // Finished or unknown state
    return;
  }
}

async function runLoop(ref) {
  const packCache = new Map();
  for (;;) {
    const snap = await ref.get();
    const data = snap.data();
    if (!data || data.status !== 'spinning') return;

    const round = data.roundIndex || 0;
    const turn = data.turnIndex || 0;
    const players = data.players || [];
    const packs = data.packs || [];
    const player = players[turn];
    const packMeta = packs[round % packs.length];

    let full = packCache.get(packMeta.id);
    if (!full) {
      const packDoc = await db.collection('packs').doc(packMeta.id).get();
      full = { id: packMeta.id, prizes: packDoc.get('prizes') || [] };
      packCache.set(packMeta.id, full);
    }

    const index = getWinningIndex(full, 'serverSeed', player.uid, `${round}-${turn}`);

    let grantUid = null;
    let allPulls = [];
    await db.runTransaction(async tx => {
      const s = await tx.get(ref);
      const d = s.data();
      if (!d || d.status !== 'spinning') return;

      const P = d.players[turn];
      const prize = full.prizes[index];
      const pull = { round, packId: full.id, prizeId: prize.id, value: prize.value, index, at: admin.firestore.Timestamp.now() };
      P.pulls = (P.pulls || []).concat([pull]);
      P.total = (P.total || 0) + (prize.value || 0);
      d.players[turn] = P;

      let nextTurn = (turn + 1) % d.players.length;
      let nextRound = round;
      if (nextTurn === 0) nextRound++;

      if (nextRound >= d.spinCount) {
        const ranked = d.players.map((p, i) => ({
          ...p,
          highestPull: Math.max(0, ...(p.pulls || []).map(x => x.value || 0)),
          joinOrder: i
        })).sort((a, b) =>
          (b.total || 0) - (a.total || 0) ||
          (b.highestPull || 0) - (a.highestPull || 0) ||
          (a.joinOrder || 0) - (b.joinOrder || 0)
        );
        const top = ranked[0];
        d.winner = { uid: top.uid, displayName: top.displayName, total: top.total };
        d.status = 'finished';
        d.finishedAt = admin.firestore.FieldValue.serverTimestamp();
        if (!top.isBot && !d.inventoryGranted) {
          d.inventoryGranted = true;
          grantUid = top.uid;
          allPulls = (d.players || []).flatMap(pl => pl.pulls || []);
        }
      } else {
        d.turnIndex = nextTurn;
        d.roundIndex = nextRound;
      }

      tx.set(ref, d, { merge: true });
    });

    if (grantUid && allPulls.length) {
      for (const pl of allPulls) {
        let pack = packCache.get(pl.packId);
        if (!pack) {
          const doc = await db.collection('packs').doc(pl.packId).get();
          pack = { id: pl.packId, prizes: doc.get('prizes') || [] };
          packCache.set(pl.packId, pack);
        }
        const prize = pack.prizes.find(pr => pr.id === pl.prizeId);
        if (prize) {
          await admin.database().ref(`users/${grantUid}/inventory`).push({
            name: prize.name,
            image: prize.image,
            rarity: prize.rarity,
            value: prize.value,
            timestamp: Date.now(),
            sold: false
          });
        }
      }
    }
  }
}

function getWinningIndex(pack, serverSeed, clientSeed, nonce) {
  const str = [serverSeed, clientSeed, nonce, pack.id].join('|');
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const x = (h >>> 0) / 2 ** 32;
  return Math.floor(x * pack.prizes.length);
}
