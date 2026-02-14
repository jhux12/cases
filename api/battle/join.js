const admin = require('firebase-admin');

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
    await firestore.runTransaction(async (tx) => {
      const battleSnap = await tx.get(battleRef);
      if (!battleSnap.exists) throw new Error('NOT_FOUND');
      const battle = battleSnap.data();
      if (battle.status !== 'lobby') throw new Error('NOT_LOBBY');
      if ((battle.playerUids || []).includes(decoded.uid)) throw new Error('ALREADY_JOINED');
      if ((battle.playerUids || []).length >= 2) throw new Error('FULL');

      const userRef = firestore.collection('users').doc(decoded.uid);
      const userSnap = await tx.get(userRef);
      const userData = userSnap.data() || {};
      const gems = Number(userData.gems ?? userData.balance ?? 0);
      if (gems < Number(battle.costPerPlayer || 0)) throw new Error('INSUFFICIENT');

      const updatedPlayers = { ...(battle.players || {}) };
      updatedPlayers[decoded.uid] = {
        uid: decoded.uid,
        displayName: userData.displayName || 'Player',
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
        totalValue: 0,
        bestSingleValue: 0,
        bestRarityScore: 0,
        openedRoundsCount: 0,
      };

      tx.update(battleRef, {
        playerUids: [...(battle.playerUids || []), decoded.uid],
        players: updatedPlayers,
      });
      tx.set(userRef, { gems: gems - Number(battle.costPerPlayer || 0) }, { merge: true });
    });

    res.status(200).json({ battleId });
  } catch (error) {
    const map = {
      NOT_FOUND: 404,
      NOT_LOBBY: 400,
      ALREADY_JOINED: 400,
      FULL: 400,
      INSUFFICIENT: 400,
    };
    const status = map[error.message] || 500;
    res.status(status).json({ error: error.message || 'Server error' });
  }
};
