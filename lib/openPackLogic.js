const crypto = require('crypto');

function ensurePrizes(caseData) {
  const prizes = Object.entries(caseData.prizes || {})
    .map(([prizeId, prize]) => ({
      ...prize,
      prizeId: prize.prizeId || prize.id || prizeId,
      odds: Number(prize.odds) || 0,
      value: Number(prize.value) || 0,
    }))
    .filter((prize) => prize.odds > 0);

  const totalOdds = prizes.reduce((sum, prize) => sum + prize.odds, 0);
  if (!prizes.length || totalOdds <= 0) {
    throw new Error('Invalid prize configuration');
  }

  return { prizes, totalOdds };
}

function createServerSeed() {
  const seed = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(seed).digest('hex');
  return { seed, hash };
}

function hashRoll(serverSeed, clientSeed, nonce) {
  const rollHash = crypto
    .createHash('sha256')
    .update(`${serverSeed}:${clientSeed}:${nonce}`)
    .digest('hex');

  const rollInt = BigInt('0x' + rollHash.slice(0, 13));
  const rollFraction = Number(rollInt) / Number(1n << 52n);

  return { rollHash, rollFraction };
}

function pickPrize(prizes, totalOdds, rollFraction) {
  const target = rollFraction * totalOdds;
  let cumulative = 0;
  let winningPrize = prizes[prizes.length - 1];

  for (const prize of prizes) {
    cumulative += prize.odds;
    if (target < cumulative) {
      winningPrize = prize;
      break;
    }
  }

  return winningPrize;
}

async function getSeeds(db, uid) {
  const seedsSnap = await db.ref(`serverSeeds/${uid}`).once('value');
  let seeds = seedsSnap.val();

  if (!seeds || !seeds.current || !seeds.next) {
    const current = createServerSeed();
    const next = createServerSeed();
    seeds = { current, next };
    await db.ref(`serverSeeds/${uid}`).set(seeds);
  }

  return seeds;
}

async function openPackWithOdds({ db, caseId, uid }) {
  if (!db || !caseId || !uid) throw new Error('Missing required openPackWithOdds params');
  const [caseSnap, provablyFairSnap, seeds] = await Promise.all([
    db.ref(`cases/${caseId}`).once('value'),
    db.ref(`users/${uid}/provablyFair`).once('value'),
    getSeeds(db, uid),
  ]);

  if (!caseSnap.exists()) {
    throw new Error('Case not found');
  }

  const caseData = caseSnap.val();
  const { prizes, totalOdds } = ensurePrizes(caseData);

  const provablyFair = provablyFairSnap.val() || {};
  const clientSeed = provablyFair.clientSeed || 'default';
  const nonce = Number.isFinite(provablyFair.nonce) ? provablyFair.nonce : 0;

  const { rollHash, rollFraction } = hashRoll(seeds.current.seed, clientSeed, nonce);
  const winningPrize = pickPrize(prizes, totalOdds, rollFraction);

  const nextSeeds = {
    current: seeds.next,
    next: createServerSeed(),
  };

  const provablyFairUpdates = {
    [`users/${uid}/provablyFair/nonce`]: nonce + 1,
    [`users/${uid}/provablyFair/clientSeed`]: clientSeed,
    [`users/${uid}/provablyFair/serverSeedHash`]: nextSeeds.current.hash,
    [`serverSeeds/${uid}`]: nextSeeds,
  };

  return {
    caseData,
    winningPrize,
    rollData: {
      rollHash,
      clientSeed,
      nonceUsed: nonce,
      serverSeedHashUsed: seeds.current.hash,
      serverSeedRevealed: seeds.current.seed,
    },
    provablyFairUpdates,
  };
}

module.exports = {
  ensurePrizes,
  createServerSeed,
  hashRoll,
  pickPrize,
  getSeeds,
  openPackWithOdds,
};
