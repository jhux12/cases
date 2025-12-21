const crypto = require('crypto');
const admin = require('firebase-admin');
const { openPackWithOdds } = require('../lib/openPackLogic');

function sendCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function initFirebase() {
  if (admin.apps.length) return admin.app();

  console.log('OPEN-CASE ENV present?', !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

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
    const db = app.database();

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (error) {
        body = {};
      }
    }

    const { idToken, caseId } = body || {};
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

    const [userSnap] = await Promise.all([
      db.ref(`users/${uid}`).once('value'),
    ]);

    const { caseData, winningPrize, rollData, provablyFairUpdates } = await openPackWithOdds({
      db,
      caseId,
      uid,
    });

    const userData = userSnap.val() || {};
    const price = Number(caseData.price) || 0;
    const isFreeCase = !!caseData.isFree;
    const balance = Number(userData.balance) || 0;

    if (!isFreeCase && balance < price) {
      res.status(400).json({ error: 'Insufficient balance' });
      return;
    }

    const now = Date.now();
    const inventoryRef = db.ref(`users/${uid}/inventory`).push();
    const unboxKey = inventoryRef.key;

    const unboxData = {
      name: winningPrize.name,
      image: winningPrize.image,
      rarity: winningPrize.rarity,
      value: Number.isFinite(winningPrize.value) ? winningPrize.value : 0,
      odds: winningPrize.odds,
      prizeId: winningPrize.prizeId,
      timestamp: now,
      sold: false,
    };

    const updatedBalance = isFreeCase ? balance : balance - price;

    const updates = {
      [`users/${uid}/inventory/${unboxKey}`]: unboxData,
      [`users/${uid}/unboxHistory/${unboxKey}`]: unboxData,
      ...provablyFairUpdates,
    };

    const spinRef = db.ref(`spins/${uid}`).push();
    const spinId = spinRef.key;
    updates[`spins/${uid}/${spinId}`] = {
      createdAt: now,
      caseId,
      nonceUsed: rollData.nonceUsed,
      clientSeed: rollData.clientSeed,
      serverSeedRevealed: rollData.serverSeedRevealed,
      serverSeedHashUsed: rollData.serverSeedHashUsed,
      rollHash: rollData.rollHash,
      prize: { ...unboxData },
    };

    if (!isFreeCase) {
      updates[`users/${uid}/balance`] = updatedBalance;
    }

    if (isFreeCase) {
      updates[`users/${uid}/freeCaseOpened`] = true;
    }

    await db.ref().update(updates);

    res.status(200).json({
      prize: winningPrize,
      unboxData: { ...unboxData, key: unboxKey },
      balance: updatedBalance,
      provablyFair: {
        serverSeedHashUsed: rollData.serverSeedHashUsed,
        serverSeedRevealed: rollData.serverSeedRevealed,
        clientSeed: rollData.clientSeed,
        nonceUsed: rollData.nonceUsed,
        rollHash: rollData.rollHash,
        formula: 'SHA256(serverSeed:clientSeed:nonce)',
      },
    });
  } catch (error) {
    console.error('OPEN-CASE ERROR:', error?.message || error);
    res.status(500).json({
      error: 'Server error',
      message: error?.message || String(error),
    });
  }
};
