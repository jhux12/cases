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

async function ensureAiFill(db, battle, battleRef) {
  const now = Date.now();
  if (battle.player2 || battle.status !== 'waiting') return battle;
  if (now <= battle.expiresAt) return battle;

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
    const battleSnap = await battleRef.once('value');
    if (!battleSnap.exists()) {
      res.status(404).json({ error: 'Battle not found' });
      return;
    }
    let battle = battleSnap.val();

    battle = await ensureAiFill(db, battle, battleRef);

    if (battle.player2 && battle.player2.uid && battle.player2.uid !== uid && !battle.player2.isAI) {
      res.status(400).json({ error: 'Battle already joined' });
      return;
    }
    if (battle.status === 'complete') {
      res.status(400).json({ error: 'Battle already complete' });
      return;
    }

    const userSnap = await db.ref(`users/${uid}`).once('value');
    const userData = userSnap.val() || {};
    const balance = Number(userData.balance) || 0;

    if (!battle.player2 || battle.player2.isAI) {
      if (balance < battle.entryCostGems) {
        res.status(400).json({ error: 'Insufficient gems to join battle' });
        return;
      }

      const joinProfile = {
        uid,
        displayName: userData.displayName || decoded.name || 'Challenger',
        photoURL: userData.photoURL || decoded.picture || '',
        isAI: false,
      };

      await db.ref().update({
        [`users/${uid}/balance`]: balance - battle.entryCostGems,
        [`battles/${battleId}/player2`]: joinProfile,
        [`battles/${battleId}/status`]: 'in_progress',
        [`battles/${battleId}/startedAt`]: Date.now(),
      });

      battle = { ...battle, player2: joinProfile, status: 'in_progress', startedAt: Date.now() };
    }

    res.status(200).json({ battleId, battle });
  } catch (error) {
    console.error('BATTLE JOIN ERROR', error);
    res.status(500).json({ error: 'Server error', message: error?.message || String(error) });
  }
};
