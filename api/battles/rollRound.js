const admin = require('firebase-admin');
const { openPackWithOdds } = require('../../lib/openPackLogic');

function sendCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function initFirebase() {
  if (admin.apps.length) return admin.app();
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_JSON environment variable');
  }
  const decodedJson = Buffer.from(serviceAccountJson, 'base64').toString('utf8');
  const serviceAccount = JSON.parse(decodedJson);
  const databaseURL = process.env.FIREBASE_DATABASE_URL || 'https://cases-e5b4e-default-rtdb.firebaseio.com';
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL,
  });
  return admin.app();
}

function parseBody(req) {
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (error) {
      body = {};
    }
  }
  return body || {};
}

async function ensureAiFill(db, battleRef) {
  const battleSnap = await battleRef.once('value');
  if (!battleSnap.exists()) return null;
  const battle = battleSnap.val();
  const now = Date.now();
  if (battle.player2 || battle.status !== 'waiting' || now <= battle.expiresAt) return battle;

  const aiProfile = {
    uid: `ai_${battleRef.key}`,
    displayName: 'AI Opponent',
    photoURL: '',
    isAI: true,
  };

  const updates = {
    player2: aiProfile,
    status: 'in_progress',
    startedAt: now,
  };
  await battleRef.update(updates);
  return { ...battle, ...updates };
}

function buildPrizePayload(prize, now) {
  return {
    name: prize.name,
    image: prize.image,
    rarity: prize.rarity,
    value: Number.isFinite(prize.value) ? Number(prize.value) : 0,
    odds: prize.odds,
    prizeId: prize.prizeId,
    timestamp: now,
    sold: false,
  };
}

function totalValue(rounds, key) {
  return rounds.reduce((sum, round) => sum + Number(round[key]?.value || 0), 0);
}

module.exports = async (req, res) => {
  sendCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let lockSet = false;
  try {
    const app = initFirebase();
    const db = app.database();
    const { idToken, battleId } = parseBody(req);

    if (!idToken || !battleId) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const decoded = await admin.auth().verifyIdToken(idToken).catch(() => null);
    if (!decoded) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const uid = decoded.uid;
    const battleRef = db.ref(`battles/${battleId}`);

    const lockResult = await battleRef.child('rollingLock').transaction((current) => {
      if (current) return;
      return true;
    });

    if (!lockResult.committed) {
      res.status(409).json({ error: 'Round already rolling' });
      return;
    }
    lockSet = true;
    await battleRef.update({ rollingByUid: uid, rollingAt: Date.now() });

    let battle = await ensureAiFill(db, battleRef);
    if (!battle) {
      res.status(404).json({ error: 'Battle not found' });
      return;
    }

    const playerUids = [battle.player1?.uid, battle.player2?.uid].filter(Boolean);
    if (!playerUids.includes(uid)) {
      res.status(403).json({ error: 'Not part of this battle' });
      return;
    }

    if (battle.status !== 'in_progress') {
      res.status(400).json({ error: 'Battle not in progress' });
      return;
    }

    if (battle.currentRound >= (battle.packs || []).length) {
      res.status(400).json({ error: 'All rounds complete' });
      return;
    }

    const pack = battle.packs[battle.currentRound];
    const now = Date.now();

    const [p1Roll, p2Roll] = await Promise.all([
      openPackWithOdds({ db, caseId: pack.packId, uid: battle.player1.uid }),
      openPackWithOdds({ db, caseId: pack.packId, uid: battle.player2.uid }),
    ]);

    const p1Prize = p1Roll.winningPrize;
    const p2Prize = p2Roll.winningPrize;

    const roundResult = {
      roundIndex: battle.currentRound,
      packId: pack.packId,
      player1Result: { ...p1Prize, value: Number(p1Prize.value) || 0 },
      player2Result: { ...p2Prize, value: Number(p2Prize.value) || 0 },
    };

    const rounds = battle.rounds ? [...battle.rounds, roundResult] : [roundResult];
    const currentRound = battle.currentRound + 1;

    const updates = {
      [`battles/${battleId}/rounds`]: rounds,
      [`battles/${battleId}/currentRound`]: currentRound,
      [`battles/${battleId}/rollingLock`]: false,
      [`battles/${battleId}/rollingByUid`]: null,
      [`battles/${battleId}/rollingAt`]: null,
      ...p1Roll.provablyFairUpdates,
      ...p2Roll.provablyFairUpdates,
    };

    const p1InventoryRef = db.ref(`users/${battle.player1.uid}/inventory`).push();
    const p2InventoryRef = db.ref(`users/${battle.player2.uid}/inventory`).push();
    const p1Payload = buildPrizePayload(p1Prize, now);
    const p2Payload = buildPrizePayload(p2Prize, now);

    updates[`users/${battle.player1.uid}/inventory/${p1InventoryRef.key}`] = p1Payload;
    updates[`users/${battle.player1.uid}/unboxHistory/${p1InventoryRef.key}`] = p1Payload;
    updates[`users/${battle.player2.uid}/inventory/${p2InventoryRef.key}`] = p2Payload;
    updates[`users/${battle.player2.uid}/unboxHistory/${p2InventoryRef.key}`] = p2Payload;

    let winnerUid = null;
    let loserUid = null;

    if (currentRound >= battle.packs.length) {
      const p1Total = totalValue(rounds, 'player1Result');
      const p2Total = totalValue(rounds, 'player2Result');
      if (p1Total >= p2Total) {
        winnerUid = battle.player1.uid;
        loserUid = battle.player2.uid;
      } else {
        winnerUid = battle.player2.uid;
        loserUid = battle.player1.uid;
      }

      const [winnerSnap, loserSnap] = await Promise.all([
        db.ref(`users/${winnerUid}`).once('value'),
        db.ref(`users/${loserUid}`).once('value'),
      ]);

      const winnerBalance = Number(winnerSnap.val()?.balance || 0) + Number(battle.potGems || 0);
      updates[`users/${winnerUid}/balance`] = winnerBalance;

      if (battle.loserPrize) {
        const loserInventoryRef = db.ref(`users/${loserUid}/inventory`).push();
        const loserPrizePayload = {
          name: battle.loserPrize.name,
          image: battle.loserPrize.image,
          rarity: battle.loserPrize.rarity || 'bonus',
          value: Number(battle.loserPrize.costGems) || 0,
          odds: 0,
          prizeId: battle.loserPrize.prizeId,
          timestamp: now,
          sold: false,
        };
        updates[`users/${loserUid}/inventory/${loserInventoryRef.key}`] = loserPrizePayload;
        updates[`users/${loserUid}/unboxHistory/${loserInventoryRef.key}`] = loserPrizePayload;
      }

      updates[`battles/${battleId}/status`] = 'complete';
      updates[`battles/${battleId}/completedAt`] = now;
      updates[`battles/${battleId}/winnerUid`] = winnerUid;
      updates[`battles/${battleId}/totals`] = { player1Value: p1Total, player2Value: p2Total };
    }

    await db.ref().update(updates);

    res.status(200).json({
      battleId,
      round: roundResult,
      complete: currentRound >= battle.packs.length,
      winnerUid,
    });
  } catch (error) {
    console.error('BATTLE ROLL ERROR', error);
    res.status(500).json({ error: 'Server error', message: error?.message || String(error) });
  } finally {
    if (lockSet) {
      const app = admin.apps.length ? admin.app() : null;
      if (app) {
        const db = app.database();
        const { battleId } = parseBody(req);
        if (battleId) {
          db.ref(`battles/${battleId}`).update({ rollingLock: false, rollingByUid: null }).catch(() => {});
        }
      }
    }
  }
};
