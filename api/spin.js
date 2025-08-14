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
  const prizes = Array.isArray(body.prizes) ? body.prizes : [];
  if (prizes.length === 0) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'No prizes provided' }));
    return;
  }

  const totalOdds = prizes.reduce((sum, p) => sum + (p.odds || 0), 0);
  if (!totalOdds) {
    res.statusCode = 400;
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
