const admin = require('firebase-admin');
const { rollPrizeForPack } = require('../lib/openingEngine');

function sendCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function initFirebase() {
  if (admin.apps.length) return admin.app();

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_JSON environment variable');
  }

  const decodedJson = Buffer.from(serviceAccountJson, 'base64').toString('utf8');
  const serviceAccount = JSON.parse(decodedJson);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  return admin.app();
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

  try {
    const app = initFirebase();
    const firestore = app.firestore();

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (error) {
        body = {};
      }
    }

    const authHeader = req.headers.authorization || '';
    const bearerToken = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    const idToken = body.idToken || bearerToken;
    const caseId = body.caseId;
    if (!idToken || !caseId) {
      res.status(400).json({ error: 'idToken and caseId are required' });
      return;
    }

    const decoded = await admin.auth().verifyIdToken(idToken).catch(() => null);
    if (!decoded) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const uid = decoded.uid;
    const packRef = firestore.collection('packs').doc(caseId);
    const packSnap = await packRef.get();
    if (!packSnap.exists) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }

    const packData = packSnap.data();
    const priceGems = Number(packData.priceGems ?? packData.price ?? 0);
    const isFreeCase = !!packData.isFree;

    const { prize, rollMeta, packSnapshot } = await rollPrizeForPack({
      firestore,
      packId: caseId,
      userId: uid,
      clientSeed: body.clientSeed
    });

    const userRef = firestore.collection('users').doc(uid);
    const inventoryRef = userRef.collection('inventory').doc();
    const historyRef = userRef.collection('unboxHistory').doc(inventoryRef.id);
    const spinRef = firestore.collection('spins').doc();

    const now = Date.now();

    await firestore.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      const userData = userSnap.exists ? userSnap.data() : {};
      const balance = Number(userData.gems ?? userData.balance ?? 0);

      if (!isFreeCase && balance < priceGems) {
        throw new Error('Insufficient balance');
      }

      const unboxData = {
        name: prize.name,
        image: prize.image || prize.imageUrl,
        rarity: prize.rarity,
        valueGems: Number.isFinite(prize.valueGems) ? prize.valueGems : Number(prize.value || 0),
        odds: prize.odds,
        prizeId: prize.prizeId,
        timestamp: now,
        sold: false,
        packId: caseId,
      };

      const updatedBalance = isFreeCase ? balance : balance - priceGems;

      tx.set(inventoryRef, unboxData);
      tx.set(historyRef, unboxData);
      tx.set(spinRef, {
        createdAt: now,
        caseId,
        packSnapshot,
        rollMeta,
        prize: unboxData,
        userId: uid,
      });

      if (!isFreeCase) {
        tx.set(userRef, { gems: updatedBalance }, { merge: true });
      }
      if (isFreeCase) {
        tx.set(userRef, { freeCaseOpened: true }, { merge: true });
      }
    });

    const userSnapFinal = await userRef.get();
    const finalBalance = Number(userSnapFinal.data()?.gems ?? userSnapFinal.data()?.balance ?? 0);

    res.status(200).json({
      prize,
      balance: finalBalance,
      provablyFair: {
        serverSeedHashUsed: rollMeta.serverSeedHashUsed,
        serverSeedRevealed: rollMeta.serverSeedRevealed,
        clientSeed: rollMeta.clientSeed,
        nonceUsed: rollMeta.nonceUsed,
        rollHash: rollMeta.rollHash,
        formula: 'SHA256(serverSeed:clientSeed:nonce)',
      },
    });
  } catch (error) {
    console.error('OPEN-CASE ERROR:', error?.message || error);
    res.status(error.message === 'Insufficient balance' ? 400 : 500).json({
      error: error.message || 'Server error',
    });
  }
};
