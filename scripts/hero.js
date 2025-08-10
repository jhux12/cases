/**
 * Fetch legendary prizes from Firebase and cycle through them
 * in the hero card rotator.
 */
document.addEventListener('DOMContentLoaded', async () => {
  const imgEl = document.getElementById('legendaryCard');
  if (!imgEl) return;

  async function fetchPrizes() {
    const snap = await firebase.database().ref('cases').once('value');
    const data = snap.val() || {};
    const prizes = [];
    Object.values(data).forEach(caseInfo => {
      (caseInfo.prizes || []).forEach(p => {
        prizes.push({ id: p.id || '', name: p.name, imageUrl: p.image, rarity: p.rarity });
      });
    });
    return prizes;
  }

  const allPrizes = await fetchPrizes();
  const legendary = allPrizes.filter(p => p.rarity === 'legendary');
  const cards = legendary.length ? legendary : allPrizes;

  // Preload images to avoid layout jumps
  await Promise.all(cards.map(p => {
    const img = new Image();
    img.src = p.imageUrl;
    return img.decode ? img.decode().catch(() => {}) : new Promise(res => { img.onload = res; });
  }));

  let idx = 0;

  function showCard(i) {
    const card = cards[i % cards.length];
    imgEl.classList.add('opacity-0');
    setTimeout(() => {
      imgEl.src = card.imageUrl;
      imgEl.classList.remove('opacity-0');
    }, 250);
  }

  // start rotation
  showCard(0);
  idx = 1;
  setInterval(() => {
    showCard(idx);
    idx = (idx + 1) % cards.length;
  }, 3000);
});
