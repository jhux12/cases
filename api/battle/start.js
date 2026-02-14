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
      if (battle.hostUid !== decoded.uid) throw new Error('NOT_HOST');
      if ((battle.playerUids || []).length !== 2) throw new Error('NOT_READY');

      const rounds = expandRounds(battle.packs || []);
      const updates = {
        status: 'started',
        rounds,
        currentRoundIndex: 0,
        startedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      tx.update(battleRef, updates);

      rounds.forEach((round) => {
        const roundRef = battleRef.collection('rounds').doc(String(round.roundIndex));
        tx.set(roundRef, {
          packId: round.packId,
          status: 'pending',
          roundIndex: round.roundIndex,
          displayNameSnapshot: round.displayNameSnapshot,
          sequenceLabel: `Round ${round.roundIndex + 1} of ${rounds.length}`,
        });
      });
    });

    res.status(200).json({ battleId });
  } catch (error) {
    const map = {
      NOT_FOUND: 404,
      NOT_LOBBY: 400,
      NOT_HOST: 403,
      NOT_READY: 400,
    };
    res.status(map[error.message] || 500).json({ error: error.message || 'Server error' });
  }
};
