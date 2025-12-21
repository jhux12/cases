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

    const battleSnap = await db.ref(`battles/${battleId}`).once('value');
    if (!battleSnap.exists()) {
      res.status(404).json({ error: 'Battle not found' });
      return;
    }

    res.status(200).json({ battleId, battle: battleSnap.val() });
  } catch (error) {
    console.error('BATTLE FINALIZE ERROR', error);
    res.status(500).json({ error: 'Server error', message: error?.message || String(error) });
  }
};
