const crypto = require('crypto');

module.exports = (req, res) => {
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
  if (!body || typeof body !== 'object') {
    body = {};
  }
  const prizes = Array.isArray(body.prizes) ? body.prizes : [];
  if (prizes.length === 0) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'No prizes provided' }));
    return;
  }

  const numericPrizes = prizes.map(prize => ({
    ...prize,
    odds: Number(prize.odds) || 0
  }));

  const totalOdds = numericPrizes.reduce((sum, p) => sum + p.odds, 0);
  if (!totalOdds) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Invalid prize odds' }));
    return;
  }

  const randFraction = (() => {
    const buf = crypto.randomBytes(6); // 48 bits of entropy
    const max = 0x1000000000000; // 2^48
    return buf.readUIntBE(0, 6) / max;
  })();
  const rand = randFraction * totalOdds;
  let cumulative = 0;
  let winningPrize = numericPrizes[numericPrizes.length - 1];
  for (const prize of numericPrizes) {
    cumulative += prize.odds;
    if (rand < cumulative) {
      winningPrize = prize;
      break;
    }
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ prize: winningPrize }));
};
