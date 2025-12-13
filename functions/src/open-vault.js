const crypto = require('crypto');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.database();

function sendCorsHeaders(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function pickPrize(prizes) {
  const numericPrizes = prizes.map(prize => ({
    ...prize,
    odds: Number(prize.odds) || 0
  }));

  const totalOdds = numericPrizes.reduce((sum, prize) => sum + prize.odds, 0);
  if (!totalOdds) {
    return numericPrizes[numericPrizes.length - 1] || null;
  }

  const randFraction = (() => {
    const buf = crypto.randomBytes(6);
    const max = 0x1000000000000;
    return buf.readUIntBE(0, 6) / max;
  })();

  let cumulative = 0;
  const target = randFraction * totalOdds;

  for (const prize of numericPrizes) {
    cumulative += prize.odds;
    if (target < cumulative) {
      return prize;
    }
  }

  return numericPrizes[numericPrizes.length - 1] || null;
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

  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!idToken) {
    res.status(401).json({ error: 'Missing authorization token' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (error) {
      body = {};
    }
  }

  if (!body || typeof body !== 'object') {
    body = {};
  }

  const packId = body.packId;
  if (!packId) {
    res.status(400).json({ error: 'packId required' });
    return;
  }

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(idToken);
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  const packSnap = await db.ref(`vaults/${packId}`).once('value');
  if (!packSnap.exists()) {
    res.status(404).json({ error: 'Pack not found' });
    return;
  }

  const pack = packSnap.val();
  const price = Number(pack.price || 0);
  const prizes = Object.values(pack.prizes || {});
  if (!price || !Array.isArray(prizes) || prizes.length === 0) {
    res.status(400).json({ error: 'Invalid pack configuration' });
    return;
  }

  const winningPrize = pickPrize(prizes);
  if (!winningPrize) {
    res.status(400).json({ error: 'Unable to determine prize' });
    return;
  }

  const userRef = db.ref(`users/${decoded.uid}`);
  const inventoryKey = userRef.child('inventory').push().key;
  const now = Date.now();
  const unboxData = {
    name: winningPrize.name,
    image: winningPrize.image,
    rarity: winningPrize.rarity,
    value: winningPrize.value,
    timestamp: now,
    sold: false
  };

  let failureReason = null;

  const result = await userRef.transaction(current => {
    if (!current) {
      failureReason = 'user-not-found';
      return;
    }

    const balance = Number(current.balance || 0);
    if (balance < price) {
      failureReason = 'insufficient-balance';
      return;
    }

    if (!current.provablyFair) {
      failureReason = 'provably-fair-missing';
      return;
    }

    const updated = { ...current };
    updated.balance = balance - price;
    updated.provablyFair = {
      ...current.provablyFair,
      nonce: Number(current.provablyFair.nonce || 0) + 1
    };
    updated.inventory = { ...(current.inventory || {}), [inventoryKey]: unboxData };
    updated.unboxHistory = { ...(current.unboxHistory || {}), [inventoryKey]: unboxData };
    return updated;
  }, { applyLocally: false });

  if (!result.committed) {
    if (failureReason === 'insufficient-balance') {
      res.status(400).json({ error: 'Not enough gems' });
      return;
    }
    if (failureReason === 'provably-fair-missing') {
      res.status(400).json({ error: 'Provably fair data missing' });
      return;
    }
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.status(200).json({
    prize: {
      ...winningPrize,
      odds: Number(winningPrize.odds) || 0
    },
    inventoryKey,
    balance: Number(result.snapshot.val()?.balance || 0)
  });
};
