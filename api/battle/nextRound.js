const admin = require('firebase-admin');
const { rollPrizeForPack } = require('../../lib/openingEngine');

function sendCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function initFirebase() {
  if (admin.apps.length) return admin.app();
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_JSON');
  const serviceAccount = JSON.parse(Buffer.from(serviceAccountJson, 'base64').toString('utf8'));
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  return admin.app();
}

function applyResultToPlayer(player, prize) {
  const value = Number(prize.valueGems ?? prize.value ?? 0);
  const rarityScore = Number(prize.rarityScore ?? prize.rarity_value ?? 0);
  const updated = { ...player };
  updated.totalValue = Number(player.totalValue || 0) + value;
  updated.bestSingleValue = Math.max(Number(player.bestSingleValue || 0), value);
  updated.bestRarityScore = Math.max(Number(player.bestRarityScore || 0), rarityScore);
  updated.openedRoundsCount = Number(player.openedRoundsCount || 0) + 1;
  return updated;
}

function determineWinner(battle) {
  const [aUid, bUid] = battle.playerUids || [];
  const a = battle.players[aUid];
  const b = battle.players[bUid];
  if (!a || !b) return null;
  if (battle.mode === 'bestSingle') {
    if (a.bestSingleValue === b.bestSingleValue) {
      if (a.totalValue === b.totalValue) return a.bestRarityScore >= b.bestRarityScore ? aUid : bUid;
      return a.totalValue >= b.totalValue ? aUid : bUid;
    }
    return a.bestSingleValue >= b.bestSingleValue ? aUid : bUid;
  }
  if (battle.mode === 'mostRare') {
    if (a.bestRarityScore === b.bestRarityScore) {
      if (a.totalValue === b.totalValue) return a.bestSingleValue >= b.bestSingleValue ? aUid : bUid;
      return a.totalValue >= b.totalValue ? aUid : bUid;
    }
    return a.bestRarityScore >= b.bestRarityScore ? aUid : bUid;
  }
  return a.totalValue >= b.totalValue ? aUid : bUid;
}

module.exports = async (req, res) => {
  sendCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const app = initFirebase();
    const firestore = app.firestore();

    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (error) { body = {}; }
    }

    const authHeader = req.headers.authorization || '';
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const idToken = body.idToken || bearer;
    const { battleId } = body || {};

    if (!idToken || !battleId) return res.status(400).json({ error: 'Missing fields' });
    const decoded = await admin.auth().verifyIdToken(idToken).catch(() => null);
    if (!decoded) return res.status(401).json({ error: 'Unauthorized' });

    const battleRef = firestore.collection('battles').doc(battleId);

    // Lock round
    const lockResult = await firestore.runTransaction(async (tx) => {
      const battleSnap = await tx.get(battleRef);
      if (!battleSnap.exists) throw new Error('NOT_FOUND');
      const battle = battleSnap.data();
      if (battle.status !== 'started') throw new Error('NOT_STARTED');
      if (battle.rollingRound) throw new Error('IN_PROGRESS');
      const roundIndex = battle.currentRoundIndex || 0;
      if (!battle.rounds || !battle.rounds[roundIndex]) throw new Error('NO_ROUND');

      const roundRef = battleRef.collection('rounds').doc(String(roundIndex));
      const roundSnap = await tx.get(roundRef);
      if (!roundSnap.exists || roundSnap.data().status !== 'pending') throw new Error('ROLLED');

      tx.update(battleRef, { rollingRound: true });
      return { battle, roundIndex, roundData: roundSnap.data() };
    });

    const { battle, roundIndex, roundData } = lockResult;
    const packId = roundData.packId;
    const playerUids = battle.playerUids || [];

    const results = {};
    for (const uid of playerUids) {
      const { prize, rollMeta } = await rollPrizeForPack({ firestore, packId, userId: uid });
      results[uid] = {
        itemId: prize.prizeId,
        itemName: prize.name,
        rarity: prize.rarity,
        rarityScore: prize.rarityScore ?? prize.rarity_value ?? 0,
        valueGems: prize.valueGems ?? prize.value ?? 0,
        imageUrl: prize.image || prize.imageUrl,
        rollMeta,
      };
    }

    await firestore.runTransaction(async (tx) => {
      const freshSnap = await tx.get(battleRef);
      const current = freshSnap.data();
      if (current.currentRoundIndex !== roundIndex) throw new Error('ROUND_MOVED');

      const roundRef = battleRef.collection('rounds').doc(String(roundIndex));
      tx.update(roundRef, {
        status: 'rolled',
        rolledAt: admin.firestore.FieldValue.serverTimestamp(),
        results,
      });

      const updatedPlayers = { ...(current.players || {}) };
      playerUids.forEach((uid) => {
        updatedPlayers[uid] = applyResultToPlayer(updatedPlayers[uid] || {}, results[uid]);
      });

      const isLast = roundIndex >= (current.rounds || []).length - 1;
      const winnerUid = isLast ? determineWinner({ ...current, players: updatedPlayers, playerUids }) : null;

      tx.update(battleRef, {
        players: updatedPlayers,
        currentRoundIndex: roundIndex + 1,
        rollingRound: false,
        ...(isLast
          ? {
              status: 'finished',
              finishedAt: admin.firestore.FieldValue.serverTimestamp(),
              winnerUid,
            }
          : {}),
      });
    });

    res.status(200).json({ battleId, roundIndex, results });
  } catch (error) {
    const map = {
      NOT_FOUND: 404,
      NOT_STARTED: 400,
      IN_PROGRESS: 409,
      NO_ROUND: 400,
      ROLLED: 409,
      ROUND_MOVED: 409,
    };
    console.error('BATTLE NEXT ROUND ERROR', error);
    res.status(map[error.message] || 500).json({ error: error.message || 'Server error' });
  }
};
