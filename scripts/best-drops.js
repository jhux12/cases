document.addEventListener('DOMContentLoaded', () => {
  const ULTRA_RARITIES = ['ultra rare', 'secret rare', 'rainbow rare', 'legendary'];
  const fs = firebase.firestore();

  const dropsData = { liked: [], new: [], rare: [] };
  const container = document.getElementById('drops-container');
  const prevBtn = document.getElementById('drops-prev');
  const nextBtn = document.getElementById('drops-next');
  const tabs = document.querySelectorAll('.filter-tab');

  let currentFilter = 'liked';

  function render() {
    const items = dropsData[currentFilter] || [];
    const display = items.slice(0, 10);
    if (!display.length) {
      container.innerHTML =
        '<p class="text-white text-center w-full">No drops to display.</p>';
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

  function shift(dir) {
    const width = container.clientWidth;
    container.scrollBy({ left: dir * width, behavior: 'smooth' });
  }

  prevBtn.addEventListener('click', () => shift(-1));
  nextBtn.addEventListener('click', () => shift(1));

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      render();
    });
  });

  function subscribe() {
    fs.collection('pulls')
      .orderBy('timestamp', 'desc')
      .limit(50)
      .onSnapshot(
        (snap) => {
          const items = [];
          snap.forEach((doc) => {
            const data = doc.data() || {};
            const rarity = (data.rarity || data.rarityLabel || '').toLowerCase();
            if (!ULTRA_RARITIES.includes(rarity)) return;
            const packName = data.pack || data.packName || '';
            items.push({
              title: data.title || data.cardName || '',
              pack: packName,
              cardImg: data.cardImg || data.cardImage || data.image || '',
              packImg: data.packImg || data.packImage || data.caseImage || '',
              packLink:
                data.packLink || `pack-opener/?pack=${encodeURIComponent(packName)}`,
            });
          });
          dropsData.liked = items;
          dropsData.new = items;
          dropsData.rare = items;
          render();
        },
        (err) => {
          console.error('Best drops listener failed', err);
          container.innerHTML =
            '<p class="text-white text-center w-full">No drops to display.</p>';
        }
      );
  }

  render();
  subscribe();
});

