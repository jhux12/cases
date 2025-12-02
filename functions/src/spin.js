const crypto = require('crypto');

function sendCorsHeaders(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
}

function normalizeNumberToken(token) {
  if (!token) return null;

  const trimmed = token.trim();
  const negative = trimmed.startsWith('-');
  let sanitized = trimmed.replace(/[^0-9.,-]/g, '');
  if (!sanitized) return null;

  sanitized = (negative ? '-' : '') + sanitized.replace(/-/g, '');

  const lastComma = sanitized.lastIndexOf(',');
  const lastDot = sanitized.lastIndexOf('.');

  if (lastComma !== -1 && lastDot !== -1) {
    if (lastComma > lastDot) {
      sanitized = sanitized.replace(/\./g, '').replace(',', '.');
    } else {
      sanitized = sanitized.replace(/,/g, '');
    }
  } else if (lastComma !== -1) {
    if (/^-?\d{1,3}(?:,\d{3})+$/.test(sanitized)) {
      sanitized = sanitized.replace(/,/g, '');
    } else {
      sanitized = sanitized.replace(/,/g, '.');
    }
  } else if (lastDot !== -1) {
    if (/^-?\d{1,3}(?:\.\d{3})+$/.test(sanitized)) {
      sanitized = sanitized.replace(/\./g, '');
    }
  }

  return sanitized;
}

function parseOdds(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : 0;
  }
  if (typeof value === 'string') {
    const match = value.match(/-?\d[\d.,-]*/);
    const normalized = normalizeNumberToken(match?.[0]);
    if (normalized) {
      const parsed = Number.parseFloat(normalized);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    }
  }
  return 0;
}

module.exports = (req, res) => {
  sendCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
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

  const prizes = Array.isArray(body.prizes) ? body.prizes : [];
  if (prizes.length === 0) {
    res.status(400).json({ error: 'No prizes provided' });
    return;
  }

  const numericPrizes = prizes.map(prize => ({
    ...prize,
    odds: parseOdds(prize.odds)
  }));

  const totalOdds = numericPrizes.reduce((sum, prize) => sum + prize.odds, 0);
  if (!totalOdds) {
    res.status(400).json({ error: 'Invalid prize odds' });
    return;
  }

  const randFraction = (() => {
    const buf = crypto.randomBytes(6);
    const max = 0x1000000000000;
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

  res.status(200).json({ prize: winningPrize });
};
