const crypto = require('crypto');

function sendCorsHeaders(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
}

function coerceNumber(value, { preferDecimal = false } = {}) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value !== 'string') {
    return 0;
  }

  const cleaned = value
    .replace(/\s+/g, '')
    .replace(/[^0-9,\.\-]/g, '');

  if (!cleaned || cleaned === '-' || cleaned === '+') {
    return 0;
  }

  const separators = cleaned.match(/[.,]/g) || [];
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  const separatorIndex = Math.max(lastComma, lastDot);
  const fractionalLength = separatorIndex === -1 ? 0 : cleaned.length - separatorIndex - 1;
  const integerPartRaw = separatorIndex === -1 ? cleaned : cleaned.slice(0, separatorIndex);
  const integerDigitsStr = integerPartRaw.replace(/[^0-9\-]/g, '');
  const integerDigitsAbs = integerDigitsStr.replace(/^-/, '');
  const isZeroInteger = integerDigitsAbs.length === 0 || /^0+$/.test(integerDigitsAbs);

  let effectivePreferDecimal = preferDecimal;
  if (!effectivePreferDecimal) {
    if (value.includes('%') || separators.length > 1) {
      effectivePreferDecimal = true;
    } else if (separators.length === 1 && fractionalLength > 0) {
      if (fractionalLength <= 2 || isZeroInteger) {
        effectivePreferDecimal = true;
      }
    }
  }

  const parseWithDecimalSeparator = () => {
    if (separatorIndex === -1) {
      return Number.parseFloat(cleaned);
    }

    const integerPart = cleaned.slice(0, separatorIndex).replace(/[.,]/g, '');
    const fractionalPart = cleaned.slice(separatorIndex + 1).replace(/[.,]/g, '');
    const normalized = fractionalPart ? `${integerPart}.${fractionalPart}` : integerPart;
    return Number.parseFloat(normalized);
  };

  const parseAsInteger = () => Number.parseFloat(cleaned.replace(/[.,]/g, ''));

  const decimalCandidate = parseWithDecimalSeparator();
  const integerCandidate = parseAsInteger();

  const primary = effectivePreferDecimal ? decimalCandidate : integerCandidate;
  const secondary = effectivePreferDecimal ? integerCandidate : decimalCandidate;

  if (Number.isFinite(primary)) {
    return primary;
  }
  if (Number.isFinite(secondary)) {
    return secondary;
  }

  return 0;
}

function resolveOdds(prize) {
  const parsedOdds = coerceNumber(prize?.odds, { preferDecimal: true });
  if (parsedOdds > 0) {
    return parsedOdds;
  }
  const weight = coerceNumber(prize?.weight, { preferDecimal: true });
  return weight > 0 ? weight : 0;
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

  let numericPrizes = prizes.map(prize => ({
    ...prize,
    odds: resolveOdds(prize)
  }));

  let totalOdds = numericPrizes.reduce((sum, prize) => sum + prize.odds, 0);
  if (!totalOdds) {
    numericPrizes = prizes.map(prize => ({
      ...prize,
      odds: 1
    }));
    totalOdds = numericPrizes.length;
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
