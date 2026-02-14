const crypto = require('crypto');

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

function normalizePrizePool(packDoc) {
  const pool = Array.isArray(packDoc.prizePool)
    ? packDoc.prizePool
    : Array.isArray(packDoc.prizes)
      ? packDoc.prizes
      : Object.values(packDoc.prizePool || packDoc.prizes || {});

  const prizes = (pool || [])
    .map((prize, index) => ({
      ...prize,
      odds: Number(prize.odds || prize.weight || prize.probability || 0),
      prizeId: prize.prizeId || prize.id || String(prize.key || index),
      valueGems: Number(prize.valueGems ?? prize.value ?? 0),
      rarityScore: Number(prize.rarityScore ?? prize.rarity_value ?? prize.rarityLevel ?? 0),
      rarity: prize.rarity || prize.tier || 'Common'
    }))
    .filter(prize => prize.odds > 0);

  const totalOdds = prizes.reduce((sum, prize) => sum + prize.odds, 0);
  return { prizes, totalOdds };
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

async function ensureSeeds(firestore, uid) {
  const seedsRef = firestore.collection('serverSeeds').doc(uid);
  const snap = await seedsRef.get();
  if (snap.exists) {
    return snap.data();
  }
  const seeds = { current: createServerSeed(), next: createServerSeed() };
  await seedsRef.set(seeds);
  return seeds;
}

async function rollPrizeForPack({ firestore, packId, userId, clientSeed }) {
  if (!firestore) throw new Error('firestore instance required');
  const packSnap = await firestore.collection('packs').doc(packId).get();
  if (!packSnap.exists) {
    throw new Error('Pack not found');
  }

  const packData = packSnap.data();
  const { prizes, totalOdds } = normalizePrizePool(packData);
  if (!prizes.length || totalOdds <= 0) {
    throw new Error('Invalid prize configuration');
  }

  const provablyFairRef = firestore.collection('users').doc(userId);
  const [provablyFairSnap, seeds] = await Promise.all([
    provablyFairRef.get(),
    ensureSeeds(firestore, userId)
  ]);

  const userData = provablyFairSnap.exists ? provablyFairSnap.data() : {};
  const pf = userData.provablyFair || {};
  const effectiveClientSeed = clientSeed || pf.clientSeed || 'default';
  const nonce = Number.isFinite(pf.nonce) ? pf.nonce : 0;

  const { rollHash, rollFraction } = hashRoll(seeds.current.seed, effectiveClientSeed, nonce);
  const winningPrize = pickPrize(prizes, totalOdds, rollFraction);

  const nextSeeds = { current: seeds.next, next: createServerSeed() };

  const provablyFairUpdates = {
    provablyFair: {
      ...pf,
      nonce: nonce + 1,
      clientSeed: effectiveClientSeed,
      serverSeedHash: nextSeeds.current.hash
    }
  };

  await Promise.all([
    firestore.collection('serverSeeds').doc(userId).set(nextSeeds),
    provablyFairRef.set(provablyFairUpdates, { merge: true })
  ]);

  return {
    prize: winningPrize,
    rollMeta: {
      rollHash,
      serverSeedHashUsed: seeds.current.hash,
      serverSeedRevealed: seeds.current.seed,
      clientSeed: effectiveClientSeed,
      nonceUsed: nonce
    },
    packSnapshot: {
      name: packData.name,
      imageUrl: packData.imageUrl,
      priceGems: packData.priceGems || packData.price || 0,
      difficulty: packData.difficulty
    }
  };
}

module.exports = {
  rollPrizeForPack,
  createServerSeed,
  hashRoll,
  normalizePrizePool
};
