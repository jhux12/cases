const crypto = require('crypto');

// firebase-admin may not be installed in local environments; load lazily
let admin = null;
try {
  admin = require('firebase-admin');
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  }
} catch (err) {
  // When firebase-admin isn't available we fall back to static case data
  admin = null;
}

// Load static case data as a fallback when Firebase isn't configured
let staticCases = {};
try {
  staticCases = require('./cases.json');
} catch (e) {
  staticCases = {};
}

async function verifyUser(req) {
  const auth = req.headers['authorization'] || '';
  const match = auth.match(/^Bearer (.+)$/);
  if (!match) return null;
  // If Firebase is available use it to validate the token
  if (admin) {
    try {
      return await admin.auth().verifyIdToken(match[1]);
    } catch (e) {
      return null;
    }
  }
  // Without Firebase we simply treat the provided token as the user id
  return { uid: match[1] };
}

async function fetchPrizes(caseId) {
  if (admin) {
    try {
      const snap = await admin
        .database()
        .ref('cases/' + caseId + '/prizes')
        .once('value');
      const data = snap.val() || {};
      return Object.values(data);
    } catch (e) {
      return [];
    }
  }
  return staticCases[caseId] || [];
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const user = await verifyUser(req);
  if (!user) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const caseId = body.caseId;
  if (!caseId) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'No case ID provided' }));
    return;
  }

  const prizes = await fetchPrizes(caseId);
  if (!Array.isArray(prizes) || prizes.length === 0) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Invalid case ID or no prizes found' }));
    return;
  }

  const totalOdds = prizes.reduce((sum, p) => sum + (p.odds || 0), 0);
  if (!totalOdds) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Invalid prize odds' }));
    return;
  }

  const rand = crypto.randomInt(totalOdds);
  let cumulative = 0;
  let winningPrize = prizes[prizes.length - 1];
  for (const prize of prizes) {
    cumulative += prize.odds || 0;
    if (rand < cumulative) {
      winningPrize = prize;
      break;
    }
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ prize: winningPrize }));
};
