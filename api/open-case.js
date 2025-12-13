const crypto = require('crypto');
const admin = require('firebase-admin');

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

function ensurePrizes(caseData) {
  const prizes = Object.values(caseData.prizes || {})
    .map((prize) => ({
      ...prize,
      odds: Number(prize.odds) || 0,
      value: Number(prize.value) || 0,
    }))
    .filter((prize) => prize.odds > 0);

  const totalOdds = prizes.reduce((sum, prize) => sum + prize.odds, 0);
  if (!prizes.length || totalOdds <= 0) {
    throw new Error('Invalid prize configuration');
  }

  return { prizes, totalOdds };
}

function createServerSeed() {
  const seed = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(seed).digest('hex');
  return { seed, hash };
}

function hashRoll(serverSeed, clientSeed, nonce) {
  const rollHash = crypto
    .createHash('sha256')
    .update(`${serverSeed}:${clientSeed}:${nonce}`)
    .digest('hex');

  const rollInt = BigInt('0x' + rollHash.slice(0, 13));
  const maxInt = BigInt('0x' + 'f'.repeat(13));
  const rollFraction = Number(rollInt) / Number(maxInt);

  return { rollHash, rollFraction };
}

function pickPrize(prizes, totalOdds, rollFraction) {
  const target = rollFraction * totalOdds;
  let cumulative = 0;
  let winningPrize = prizes[prizes.length - 1];

  for (const prize of prizes) {
    cumulative += prize.odds;
    if (target < cumulative) {
      winningPrize = prize;
      break;
    }
  }

  return winningPrize;
}

async function getSeeds(db, uid) {
  const seedsSnap = await db.ref(`serverSeeds/${uid}`).once('value');
  let seeds = seedsSnap.val();

  if (!seeds || !seeds.current || !seeds.next) {
    const current = createServerSeed();
    const next = createServerSeed();
    seeds = { current, next };
    await db.ref(`serverSeeds/${uid}`).set(seeds);
  }

  return seeds;
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

    const [caseSnap, userSnap, provablyFairSnap, seeds] = await Promise.all([
      db.ref(`cases/${caseId}`).once('value'),
      db.ref(`users/${uid}`).once('value'),
      db.ref(`users/${uid}/provablyFair`).once('value'),
      getSeeds(db, uid),
    ]);

    if (!caseSnap.exists()) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }

    const caseData = caseSnap.val();
    const { prizes, totalOdds } = ensurePrizes(caseData);

    const provablyFair = provablyFairSnap.val() || {};
    const clientSeed = provablyFair.clientSeed || 'default';
    const nonce = Number.isFinite(provablyFair.nonce) ? provablyFair.nonce : 0;

    const { rollHash, rollFraction } = hashRoll(seeds.current.seed, clientSeed, nonce);
    const winningPrize = pickPrize(prizes, totalOdds, rollFraction);

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
      timestamp: now,
      sold: false,
    };

    const updatedBalance = isFreeCase ? balance : balance - price;

    const nextSeeds = {
      current: seeds.next,
      next: createServerSeed(),
    };

    const updates = {
      [`users/${uid}/inventory/${unboxKey}`]: unboxData,
      [`users/${uid}/unboxHistory/${unboxKey}`]: unboxData,
      [`users/${uid}/provablyFair/nonce`]: nonce + 1,
      [`users/${uid}/provablyFair/clientSeed`]: clientSeed,
      [`users/${uid}/provablyFair/serverSeedHash`]: nextSeeds.current.hash,
      [`serverSeeds/${uid}`]: nextSeeds,
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
        serverSeedHashUsed: seeds.current.hash,
        serverSeedRevealed: seeds.current.seed,
        clientSeed,
        nonceUsed: nonce,
        rollHash,
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
