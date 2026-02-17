const admin = require('firebase-admin');

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

async function loadPackDetails(db, packIds = []) {
  const packSnaps = await Promise.all(packIds.map((id) => db.ref(`cases/${id}`).once('value')));
  return packSnaps.map((snap, idx) => {
    const val = snap.val() || {};
    return {
      packId: packIds[idx],
      name: val.name || `Pack ${packIds[idx]}`,
      priceGems: Number(val.price) || 0,
      image: val.image || val.cover || '',
    };
  });
}

async function loadLoserPrize(db, loserPrizeId) {
  if (!loserPrizeId) return null;
  const snap = await db.ref(`loserPrizes/${loserPrizeId}`).once('value');
  if (!snap.exists()) return null;
  const val = snap.val();
  return {
    prizeId: loserPrizeId,
    name: val.name || 'Loser Prize',
    costGems: Number(val.costGems || val.price || 0),
    image: val.image || '',
  };
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
    const { idToken, packs, loserPrizeId, mode } = parseBody(req);

    if (!idToken || !Array.isArray(packs) || !packs.length) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const decoded = await admin.auth().verifyIdToken(idToken).catch(() => null);
    if (!decoded) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const uid = decoded.uid;
    const userSnap = await db.ref(`users/${uid}`).once('value');
    const userData = userSnap.val() || {};

    const packDetails = await loadPackDetails(db, packs);
    const loserPrize = await loadLoserPrize(db, loserPrizeId);

    const entryCostGems = packDetails.reduce((sum, p) => sum + p.priceGems, 0) + (loserPrize ? loserPrize.costGems : 0);
    const potGems = entryCostGems * 2;

    const balance = Number(userData.balance) || 0;
    if (balance < entryCostGems) {
      res.status(400).json({ error: 'Insufficient gems to create battle' });
      return;
    }

    const now = Date.now();
    const battleRef = db.ref('battles').push();
    const battleId = battleRef.key;

    const creatorProfile = {
      uid,
      displayName: userData.displayName || decoded.name || 'Player',
      photoURL: userData.photoURL || decoded.picture || '',
    };

    const battleData = {
      creatorUid: uid,
      player1: creatorProfile,
      player2: null,
      packs: packDetails,
      loserPrize: loserPrize || null,
      entryCostGems,
      potGems,
      mode: mode || 'WTA',
      status: 'waiting',
      createdAt: now,
      expiresAt: now + 60000,
      startedAt: null,
      completedAt: null,
      currentRound: 0,
      rounds: [],
      winnerUid: null,
      rollingLock: false,
      rollingByUid: null,
      rollingAt: null,
    };

    await db.ref().update({
      [`users/${uid}/balance`]: balance - entryCostGems,
      [`battles/${battleId}`]: battleData,
    });

    res.status(200).json({ battleId, battle: battleData });
  } catch (error) {
    console.error('BATTLE CREATE ERROR', error);
    res.status(500).json({ error: 'Server error', message: error?.message || String(error) });
  }
};
