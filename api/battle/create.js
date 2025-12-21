const admin = require('firebase-admin');

function sendCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function initFirebase() {
  if (admin.apps.length) return admin.app();
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_JSON');
  }
  const serviceAccount = JSON.parse(Buffer.from(serviceAccountJson, 'base64').toString('utf8'));
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  return admin.app();
}

async function fetchPackSnapshots(firestore, packs = []) {
  const snapshots = [];
  for (const selection of packs) {
    const packSnap = await firestore.collection('packs').doc(selection.packId).get();
    if (!packSnap.exists) {
      throw new Error(`Pack not found: ${selection.packId}`);
    }
    const packData = packSnap.data();
    snapshots.push({
      packId: selection.packId,
      qty: Number(selection.qty || 1),
      nameSnapshot: packData.name,
      imageSnapshot: packData.imageUrl,
      priceGemsAtCreate: Number(packData.priceGems ?? packData.price ?? 0),
      difficulty: packData.difficulty || packData.peppers || null,
    });
  }
  return snapshots;
}

function expandRounds(packs = []) {
  const rounds = [];
  let index = 0;
  packs.forEach((p) => {
    const qty = Number(p.qty || 1);
    for (let i = 0; i < qty; i++) {
      rounds.push({ packId: p.packId, roundIndex: index, displayNameSnapshot: p.nameSnapshot });
      index += 1;
    }
  });
  return rounds;
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
    if (!idToken) return res.status(401).json({ error: 'Missing token' });

    const decoded = await admin.auth().verifyIdToken(idToken).catch(() => null);
    if (!decoded) return res.status(401).json({ error: 'Unauthorized' });

    const { packs = [], mode = 'total' } = body || {};
    if (!Array.isArray(packs) || !packs.length) {
      return res.status(400).json({ error: 'Packs selection required' });
    }

    const packSnapshots = await fetchPackSnapshots(firestore, packs);
    const costPerPlayer = packSnapshots.reduce(
      (sum, p) => sum + Number(p.priceGemsAtCreate || 0) * Number(p.qty || 1),
      0
    );

    const battleRef = firestore.collection('battles').doc();
    const now = admin.firestore.FieldValue.serverTimestamp();

    await firestore.runTransaction(async (tx) => {
      const userRef = firestore.collection('users').doc(decoded.uid);
      const userSnap = await tx.get(userRef);
      const userData = userSnap.data() || {};
      const gems = Number(userData.gems ?? userData.balance ?? 0);
      if (gems < costPerPlayer) {
        throw new Error('INSUFFICIENT_FUNDS');
      }

      const playersMap = {
        [decoded.uid]: {
          uid: decoded.uid,
          displayName: userData.displayName || 'Host',
          joinedAt: admin.firestore.FieldValue.serverTimestamp(),
          totalValue: 0,
          bestSingleValue: 0,
          bestRarityScore: 0,
          openedRoundsCount: 0,
        },
      };

      tx.set(battleRef, {
        createdAt: now,
        hostUid: decoded.uid,
        status: 'lobby',
        mode,
        maxPlayers: 2,
        packs: packSnapshots,
        rounds: [],
        currentRoundIndex: 0,
        costPerPlayer,
        playerUids: [decoded.uid],
        players: playersMap,
        battleName: body.battleName || 'Battle Mode',
      });
      tx.set(userRef, { gems: gems - costPerPlayer }, { merge: true });
    });

    res.status(200).json({ battleId: battleRef.id, costPerPlayer });
  } catch (error) {
    if (error.message === 'INSUFFICIENT_FUNDS') {
      return res.status(400).json({ error: 'Not enough gems' });
    }
    console.error('BATTLE CREATE ERROR', error);
    res.status(500).json({ error: 'Server error' });
  }
};
