const crypto = require('crypto');
const admin = require('firebase-admin');

try {
  admin.initializeApp();
} catch (e) {
  // ignore if already initialized
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const uid = body.uid;
  if (!uid) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Missing uid' }));
    return;
  }

  const serverSeed = crypto.randomBytes(32).toString('hex');
  const serverSeedHash = crypto.createHash('sha256').update(serverSeed).digest('hex');

  const db = admin.database();
  await db.ref(`serverSeeds/${uid}`).set({ serverSeed, serverSeedHash });
  await db.ref(`users/${uid}/provablyFair/serverSeedHash`).set(serverSeedHash);

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ serverSeedHash }));
};
