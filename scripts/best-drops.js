import { getAllPacks, packsReady } from './packs.js';

document.addEventListener('DOMContentLoaded', async () => {
  const ULTRA_RARITIES = ['ultra rare', 'secret rare', 'rainbow rare', 'legendary'];
  const fs = firebase.firestore();

  await packsReady;
  let drops = [];

  const container = document.getElementById('drops-container');
  const prevBtn = document.getElementById('drops-prev');
  const nextBtn = document.getElementById('drops-next');

  function render() {
    const display = drops.slice(0, 10);
    if (!display.length) {
      useFallback();
      return;
    }
    container.innerHTML = display
      .map(
        (item) => `
      <div class="drop-card bg-white rounded-lg overflow-hidden shadow-lg min-w-full sm:min-w-[300px]">
        <div class="flex p-4 items-center">
          <img class="w-24 h-32 object-contain" src="${item.cardImg}" alt="${item.title}">
          <img class="w-32 h-44 object-contain ml-2" src="${item.packImg}" alt="${item.pack}">
        </div>
        <div class="p-4 border-t border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">${item.title}</h3>
          <p class="mt-1 text-sm text-gray-500">From: ${item.pack}</p>
          <a href="${item.packLink}" class="mt-3 inline-block text-indigo-600 font-semibold hover:underline">Open Now</a>
        </div>
      </div>
    `
      )
      .join('');
    container.scrollLeft = 0;
  }

  function useFallback() {
    const packs = getAllPacks();
    if (!packs.length) {
      return;
    }
    const sample = [...packs].sort(() => Math.random() - 0.5).slice(0, 10);
    drops = sample.map((p) => {
      const prizes = Object.values(p.prizes || {});
      const topPrize = prizes.sort((a, b) => (b.value || 0) - (a.value || 0))[0] || {};
      return {
        title: topPrize.name || topPrize.title || p.name,
        pack: p.name,
        cardImg: topPrize.image || p.image,
        packImg: p.image,
        packLink: `case.html?id=${p.id}`,
      };
    });
    render();
  }

  function shift(dir) {
    const width = container.clientWidth;
    container.scrollBy({ left: dir * width, behavior: 'smooth' });
  }

  prevBtn.addEventListener('click', () => shift(-1));
  nextBtn.addEventListener('click', () => shift(1));

  function subscribe() {
    fs.collection('pulls')
      .orderBy('timestamp', 'desc')
      .limit(50)
      .onSnapshot(
        (snap) => {
          const items = [];
          const packs = getAllPacks();
          snap.forEach((doc) => {
            const data = doc.data() || {};
            const rarity = (data.rarity || data.rarityLabel || '').toLowerCase();
            if (!ULTRA_RARITIES.includes(rarity)) return;
            const packName = data.pack || data.packName || '';
            const packInfo = packs.find((p) => p.name === packName);
            items.push({
              title: data.title || data.cardName || '',
              pack: packName,
              cardImg: data.cardImg || data.cardImage || data.image || '',
              packImg: packInfo?.image || data.packImg || data.packImage || data.caseImage || '',
              packLink: packInfo ? `case.html?id=${packInfo.id}` : `pack-opener/?pack=${encodeURIComponent(packName)}`,
            });
          });
          if (items.length) {
            drops = items;
            render();
          } else {
            useFallback();
          }
        },
        (err) => {
          console.error('Best drops listener failed', err);
          useFallback();
        }
      );
  }

  useFallback();
  subscribe();
});
